import { promises as fs } from 'fs';
import path from 'path';
import type { FastifyBaseLogger } from 'fastify';

export interface CleanupOptions {
  uploadsDir: string;
  maxSizeBytes: number;
  logger?: FastifyBaseLogger;
}

export interface CleanupResult {
  deletedFiles: number;
  freedBytes: number;
  totalSizeBefore: number;
  totalSizeAfter: number;
  error?: string;
}

interface FileInfo {
  filename: string;
  filepath: string;
  size: number;
  mtime: Date;
}

/**
 * Parse disk size string (e.g., "1GB", "500MB", "1.5GB") to bytes
 * Returns null if invalid format
 */
export function parseDiskSize(sizeStr: string): number | null {
  if (!sizeStr) return null;

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)(GB|MB|KB|B)$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return value * multipliers[unit];
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Get all files in directory with their stats
 */
async function getFilesWithStats(dirPath: string): Promise<FileInfo[]> {
  try {
    const entries = await fs.readdir(dirPath);
    const fileInfos: FileInfo[] = [];

    for (const filename of entries) {
      const filepath = path.join(dirPath, filename);

      try {
        const stats = await fs.stat(filepath);

        // Only process files, not directories
        if (stats.isFile()) {
          fileInfos.push({
            filename,
            filepath,
            size: stats.size,
            mtime: stats.mtime,
          });
        }
      } catch {
        // Skip files that can't be accessed
        continue;
      }
    }

    return fileInfos;
  } catch (err) {
    throw new Error(`Failed to read directory ${dirPath}: ${err}`);
  }
}

/**
 * Calculate total size of all files
 */
function calculateTotalSize(files: FileInfo[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Main cleanup function - deletes oldest files until size is under limit
 */
export async function cleanupUploadsDirectory(
  options: CleanupOptions
): Promise<CleanupResult> {
  const { uploadsDir, maxSizeBytes, logger } = options;

  const result: CleanupResult = {
    deletedFiles: 0,
    freedBytes: 0,
    totalSizeBefore: 0,
    totalSizeAfter: 0,
  };

  try {
    // Ensure directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      logger?.debug(
        `Uploads directory ${uploadsDir} does not exist, skipping cleanup`
      );
      return result;
    }

    // Get all files with their stats
    const files = await getFilesWithStats(uploadsDir);

    if (files.length === 0) {
      logger?.debug('No files in uploads directory');
      return result;
    }

    // Calculate total size
    const totalSize = calculateTotalSize(files);
    result.totalSizeBefore = totalSize;
    result.totalSizeAfter = totalSize;

    // Check if cleanup is needed
    if (totalSize <= maxSizeBytes) {
      logger?.debug(
        `Total size ${formatBytes(totalSize)} is under limit ${formatBytes(maxSizeBytes)}, no cleanup needed`
      );
      return result;
    }

    logger?.info(
      `Total size ${formatBytes(totalSize)} exceeds limit ${formatBytes(maxSizeBytes)}, starting cleanup`
    );

    // Sort files by modification time (oldest first)
    files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    // Delete files until we're under the limit
    let currentSize = totalSize;

    for (const file of files) {
      if (currentSize <= maxSizeBytes) {
        break;
      }

      try {
        await fs.unlink(file.filepath);
        currentSize -= file.size;
        result.deletedFiles++;
        result.freedBytes += file.size;

        logger?.info(
          `Deleted old file: ${file.filename} (${formatBytes(file.size)})`
        );
      } catch (err) {
        logger?.warn(`Failed to delete file ${file.filename}: ${err}`);
      }
    }

    result.totalSizeAfter = currentSize;

    logger?.info(
      `Cleanup complete: deleted ${result.deletedFiles} files, freed ${formatBytes(result.freedBytes)}, ` +
        `size reduced from ${formatBytes(result.totalSizeBefore)} to ${formatBytes(result.totalSizeAfter)}`
    );

    return result;
  } catch (err) {
    const error = `Cleanup failed: ${err}`;
    logger?.error(error);
    result.error = error;
    return result;
  }
}

/**
 * Async cleanup that doesn't block the calling code
 * Returns immediately, cleanup runs in background
 */
export function cleanupUploadsDirectoryAsync(
  options: CleanupOptions
): Promise<void> {
  // Start cleanup in background, don't await
  cleanupUploadsDirectory(options)
    .then(result => {
      if (result.deletedFiles > 0) {
        options.logger?.info(
          `Background cleanup completed: ${result.deletedFiles} files deleted`
        );
      }
    })
    .catch(err => {
      options.logger?.error(`Background cleanup error: ${err}`);
    });

  // Return immediately
  return Promise.resolve();
}
