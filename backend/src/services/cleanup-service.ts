import { promises as fs } from 'fs';
import path from 'path';
import type { FastifyBaseLogger } from 'fastify';
import _ from 'lodash';
import { config } from '../config/index.js';

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
 * Uses functional approach with map and compact
 */
async function getFilesWithStats(dirPath: string): Promise<FileInfo[]> {
  try {
    const entries = await fs.readdir(dirPath);

    // Map each entry to a promise that returns FileInfo or null
    const fileInfoPromises = entries.map(async filename => {
      const filepath = path.join(dirPath, filename);

      try {
        const stats = await fs.stat(filepath);

        // Only return file info for actual files (not directories)
        return stats.isFile()
          ? { filename, filepath, size: stats.size, mtime: stats.mtime }
          : null;
      } catch {
        // Return null for files that can't be accessed
        return null;
      }
    });

    // Wait for all promises and filter out nulls
    const results = await Promise.all(fileInfoPromises);
    return _.compact(results);
  } catch (err) {
    throw new Error(`Failed to read directory ${dirPath}: ${err}`);
  }
}

/**
 * Calculate total size of all files using lodash sumBy
 */
const calculateTotalSize = (files: FileInfo[]): number =>
  _.sumBy(files, 'size');

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

    // Sort files by modification time (oldest first) using lodash
    const sortedFiles = _.sortBy(files, file => file.mtime.getTime());

    // Delete files until under limit using functional reduce pattern
    const deletionResult = await sortedFiles.reduce(
      async (accPromise, file) => {
        const acc = await accPromise;

        // Stop if already under limit
        if (acc.currentSize <= maxSizeBytes) {
          return acc;
        }

        try {
          await fs.unlink(file.filepath);
          logger?.info(
            `Deleted old file: ${file.filename} (${formatBytes(file.size)})`
          );

          return {
            currentSize: acc.currentSize - file.size,
            deletedFiles: acc.deletedFiles + 1,
            freedBytes: acc.freedBytes + file.size,
          };
        } catch (err) {
          logger?.warn(`Failed to delete file ${file.filename}: ${err}`);
          return acc; // Return unchanged if deletion fails
        }
      },
      Promise.resolve({
        currentSize: totalSize,
        deletedFiles: 0,
        freedBytes: 0,
      })
    );

    result.deletedFiles = deletionResult.deletedFiles;
    result.freedBytes = deletionResult.freedBytes;
    result.totalSizeAfter = deletionResult.currentSize;

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

/**
 * Trigger cleanup after upload if configured
 * Checks config for disk limit and triggers async cleanup if needed
 * This is a convenience function for use in upload routes
 */
export function triggerCleanupAfterUpload(
  logger?: FastifyBaseLogger
): Promise<void> {
  // Check if cleanup is configured
  if (!config.storage.maxUploadsDiskSize) {
    return Promise.resolve();
  }

  // Parse disk size limit
  const maxSizeBytes = parseDiskSize(config.storage.maxUploadsDiskSize);
  if (!maxSizeBytes) {
    logger?.warn(
      `Invalid MAX_UPLOADS_DISK_SIZE format: ${config.storage.maxUploadsDiskSize}`
    );
    return Promise.resolve();
  }

  // Trigger async cleanup
  return cleanupUploadsDirectoryAsync({
    uploadsDir: config.storage.uploadsDir,
    maxSizeBytes,
    logger,
  });
}
