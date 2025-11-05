import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { FastifyBaseLogger } from 'fastify';
import {
  parseDiskSize,
  formatBytes,
  cleanupUploadsDirectory,
  cleanupUploadsDirectoryAsync,
} from './cleanup-service.js';

describe('parseDiskSize', () => {
  it('should parse GB correctly', () => {
    expect(parseDiskSize('1GB')).toBe(1073741824);
    expect(parseDiskSize('2GB')).toBe(2147483648);
    expect(parseDiskSize('0.5GB')).toBe(536870912);
    expect(parseDiskSize('1.5GB')).toBe(1610612736);
  });

  it('should parse MB correctly', () => {
    expect(parseDiskSize('1MB')).toBe(1048576);
    expect(parseDiskSize('500MB')).toBe(524288000);
    expect(parseDiskSize('100MB')).toBe(104857600);
    expect(parseDiskSize('1.5MB')).toBe(1572864);
  });

  it('should parse KB correctly', () => {
    expect(parseDiskSize('1KB')).toBe(1024);
    expect(parseDiskSize('500KB')).toBe(512000);
    expect(parseDiskSize('100KB')).toBe(102400);
  });

  it('should parse B correctly', () => {
    expect(parseDiskSize('1B')).toBe(1);
    expect(parseDiskSize('1024B')).toBe(1024);
  });

  it('should be case-insensitive for units', () => {
    expect(parseDiskSize('1gb')).toBe(1073741824);
    expect(parseDiskSize('1Gb')).toBe(1073741824);
    expect(parseDiskSize('500mb')).toBe(524288000);
    expect(parseDiskSize('500Mb')).toBe(524288000);
  });

  it('should handle decimals', () => {
    expect(parseDiskSize('1.5GB')).toBe(1610612736);
    expect(parseDiskSize('0.5GB')).toBe(536870912);
    expect(parseDiskSize('2.25GB')).toBe(2415919104);
  });

  it('should return null for invalid formats', () => {
    expect(parseDiskSize('')).toBe(null);
    expect(parseDiskSize('invalid')).toBe(null);
    expect(parseDiskSize('1G')).toBe(null);
    expect(parseDiskSize('1 GB')).toBe(null); // space not allowed
    expect(parseDiskSize('GB')).toBe(null);
    expect(parseDiskSize('1TB')).toBe(null); // TB not supported
    expect(parseDiskSize('-1GB')).toBe(null); // negative not allowed
    expect(parseDiskSize('abc123GB')).toBe(null);
  });
});

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1)).toBe('1.00 B');
    expect(formatBytes(500)).toBe('500.00 B');
    expect(formatBytes(1023)).toBe('1023.00 B');
  });

  it('should format KB correctly', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(102400)).toBe('100.00 KB');
  });

  it('should format MB correctly', () => {
    expect(formatBytes(1048576)).toBe('1.00 MB');
    expect(formatBytes(1572864)).toBe('1.50 MB');
    expect(formatBytes(524288000)).toBe('500.00 MB');
  });

  it('should format GB correctly', () => {
    expect(formatBytes(1073741824)).toBe('1.00 GB');
    expect(formatBytes(1610612736)).toBe('1.50 GB');
    expect(formatBytes(2147483648)).toBe('2.00 GB');
  });

  it('should round to 2 decimal places', () => {
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(1234567)).toBe('1.18 MB');
    expect(formatBytes(123456789)).toBe('117.74 MB');
  });
});

describe('cleanupUploadsDirectory', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore errors during cleanup
    }
  });

  const createTestFile = async (
    filename: string,
    sizeBytes: number,
    mtimeOffset: number = 0
  ): Promise<void> => {
    const filepath = path.join(testDir, filename);
    const content = Buffer.alloc(sizeBytes, 'x');
    await fs.writeFile(filepath, content);

    // Set modification time
    if (mtimeOffset !== 0) {
      const mtime = new Date(Date.now() + mtimeOffset);
      await fs.utimes(filepath, mtime, mtime);
    }
  };

  const getFileCount = async (): Promise<number> => {
    const files = await fs.readdir(testDir);
    return files.length;
  };

  it('should do nothing if directory does not exist', async () => {
    const result = await cleanupUploadsDirectory({
      uploadsDir: '/nonexistent/directory',
      maxSizeBytes: 1000,
    });

    expect(result.deletedFiles).toBe(0);
    expect(result.freedBytes).toBe(0);
    expect(result.totalSizeBefore).toBe(0);
    expect(result.totalSizeAfter).toBe(0);
  });

  it('should do nothing if directory is empty', async () => {
    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 1000,
    });

    expect(result.deletedFiles).toBe(0);
    expect(result.freedBytes).toBe(0);
    expect(result.totalSizeBefore).toBe(0);
    expect(result.totalSizeAfter).toBe(0);
  });

  it('should do nothing if total size is under limit', async () => {
    // Create files totaling 500 bytes
    await createTestFile('file1.txt', 200);
    await createTestFile('file2.txt', 300);

    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 1000, // Limit is 1000 bytes
    });

    expect(result.deletedFiles).toBe(0);
    expect(result.freedBytes).toBe(0);
    expect(result.totalSizeBefore).toBe(500);
    expect(result.totalSizeAfter).toBe(500);
    expect(await getFileCount()).toBe(2);
  });

  it('should delete oldest files when over limit', async () => {
    // Create files with different ages
    await createTestFile('old.txt', 300, -3000); // Oldest
    await createTestFile('medium.txt', 300, -2000);
    await createTestFile('new.txt', 300, -1000); // Newest

    // Total: 900 bytes, limit: 500 bytes
    // Should delete old.txt and medium.txt
    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 500,
    });

    expect(result.deletedFiles).toBe(2);
    expect(result.freedBytes).toBe(600);
    expect(result.totalSizeBefore).toBe(900);
    expect(result.totalSizeAfter).toBe(300);
    expect(await getFileCount()).toBe(1);

    // Verify newest file still exists
    const remainingFiles = await fs.readdir(testDir);
    expect(remainingFiles).toContain('new.txt');
    expect(remainingFiles).not.toContain('old.txt');
    expect(remainingFiles).not.toContain('medium.txt');
  });

  it('should delete only as many files as needed', async () => {
    // Create files
    await createTestFile('file1.txt', 100, -4000);
    await createTestFile('file2.txt', 100, -3000);
    await createTestFile('file3.txt', 100, -2000);
    await createTestFile('file4.txt', 100, -1000);

    // Total: 400 bytes, limit: 250 bytes
    // Should delete file1 and file2 (200 bytes), leaving 200 bytes
    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 250,
    });

    expect(result.deletedFiles).toBe(2);
    expect(result.freedBytes).toBe(200);
    expect(result.totalSizeBefore).toBe(400);
    expect(result.totalSizeAfter).toBe(200);
    expect(await getFileCount()).toBe(2);

    const remainingFiles = await fs.readdir(testDir);
    expect(remainingFiles).toContain('file3.txt');
    expect(remainingFiles).toContain('file4.txt');
  });

  it('should handle files of different sizes', async () => {
    await createTestFile('large.txt', 1000, -3000);
    await createTestFile('small.txt', 10, -2000);
    await createTestFile('medium.txt', 100, -1000);

    // Total: 1110 bytes, limit: 200 bytes
    // Should delete large.txt (1000 bytes), leaving 110 bytes which is under 200
    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 200,
    });

    expect(result.deletedFiles).toBe(1);
    expect(result.freedBytes).toBe(1000);
    expect(result.totalSizeBefore).toBe(1110);
    expect(result.totalSizeAfter).toBe(110);
    expect(await getFileCount()).toBe(2);

    const remainingFiles = await fs.readdir(testDir);
    expect(remainingFiles).toContain('medium.txt');
    expect(remainingFiles).toContain('small.txt');
  });

  it('should ignore subdirectories', async () => {
    // Create files and a subdirectory
    await createTestFile('file1.txt', 500, -2000);
    await createTestFile('file2.txt', 500, -1000);

    const subDir = path.join(testDir, 'subdir');
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, 'nested.txt'), 'content');

    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 600,
    });

    // Should only consider file1.txt and file2.txt (1000 bytes total)
    // Should delete file1.txt to get under 600
    expect(result.deletedFiles).toBe(1);
    expect(result.totalSizeBefore).toBe(1000);
    expect(result.totalSizeAfter).toBe(500);

    // Subdirectory should still exist
    const subdirExists = await fs
      .access(subDir)
      .then(() => true)
      .catch(() => false);
    expect(subdirExists).toBe(true);
  });

  it('should log operations when logger provided', async () => {
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    await createTestFile('file1.txt', 600, -2000);
    await createTestFile('file2.txt', 600, -1000);

    await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 700,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    // Check that info was called (cleanup started and completed)
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should handle very small limits', async () => {
    await createTestFile('file1.txt', 50, -3000);
    await createTestFile('file2.txt', 50, -2000);
    await createTestFile('file3.txt', 50, -1000);

    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 10, // Very small limit
    });

    // Should delete all files to try to get under 10 bytes
    expect(result.deletedFiles).toBe(3);
    expect(result.totalSizeBefore).toBe(150);
    expect(result.totalSizeAfter).toBe(0);
  });

  it('should handle exact limit match', async () => {
    await createTestFile('file1.txt', 300, -2000);
    await createTestFile('file2.txt', 200, -1000);

    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 500, // Exact match
    });

    // Total is exactly at limit, no deletion needed
    expect(result.deletedFiles).toBe(0);
    expect(result.freedBytes).toBe(0);
  });

  it('should continue if one file deletion fails', async () => {
    await createTestFile('file1.txt', 300, -3000);
    await createTestFile('file2.txt', 300, -2000);
    await createTestFile('file3.txt', 300, -1000);

    // Make file2 read-only to simulate deletion failure (on systems that support it)
    const file2Path = path.join(testDir, 'file2.txt');
    try {
      await fs.chmod(file2Path, 0o444);
    } catch {
      // chmod might not work in all environments, skip this test
      return;
    }

    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const result = await cleanupUploadsDirectory({
      uploadsDir: testDir,
      maxSizeBytes: 400,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    // Should delete file1, attempt file2 (might fail), and potentially file3
    // The actual behavior might vary based on permissions and OS
    expect(result.deletedFiles).toBeGreaterThanOrEqual(1);

    // Clean up - restore permissions if file still exists
    try {
      await fs.chmod(file2Path, 0o644);
    } catch {
      // File might have been deleted despite read-only, or other error
    }
  });
});

describe('cleanupUploadsDirectoryAsync', () => {
  it('should return immediately without waiting for cleanup', async () => {
    const startTime = Date.now();

    // This should return immediately even though cleanup would take time
    await cleanupUploadsDirectoryAsync({
      uploadsDir: '/some/path',
      maxSizeBytes: 1000,
    });

    const duration = Date.now() - startTime;

    // Should return almost instantly (under 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('should not throw errors even if cleanup fails', async () => {
    // Should not throw even with invalid path
    await expect(
      cleanupUploadsDirectoryAsync({
        uploadsDir: '/invalid/path',
        maxSizeBytes: 1000,
      })
    ).resolves.toBeUndefined();
  });
});
