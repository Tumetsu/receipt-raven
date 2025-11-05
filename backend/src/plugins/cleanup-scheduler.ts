import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config/index.js';
import {
  cleanupUploadsDirectory,
  parseDiskSize,
} from '../services/cleanup-service.js';

/**
 * Cleanup scheduler plugin
 * - Runs cleanup on server startup
 * - Runs cleanup periodically based on configured interval
 */
const cleanupSchedulerPlugin: FastifyPluginAsync = async fastify => {
  const { maxUploadsDiskSize, uploadsDir, cleanupIntervalHours } =
    config.storage;

  // Only setup scheduler if disk limit is configured
  if (!maxUploadsDiskSize) {
    fastify.log.info(
      'MAX_UPLOADS_DISK_SIZE not configured, cleanup scheduler disabled'
    );
    return;
  }

  const maxSizeBytes = parseDiskSize(maxUploadsDiskSize);
  if (!maxSizeBytes) {
    fastify.log.warn(
      `Invalid MAX_UPLOADS_DISK_SIZE format: ${maxUploadsDiskSize}. Expected format: "1GB", "500MB", etc.`
    );
    return;
  }

  fastify.log.info(
    `Cleanup scheduler enabled: max size ${maxUploadsDiskSize}, checking every ${cleanupIntervalHours}h`
  );

  // Function to run cleanup
  const runCleanup = async () => {
    try {
      const result = await cleanupUploadsDirectory({
        uploadsDir,
        maxSizeBytes,
        logger: fastify.log,
      });

      if (result.deletedFiles > 0) {
        fastify.log.info(
          `Scheduled cleanup: deleted ${result.deletedFiles} files`
        );
      }
    } catch (err) {
      fastify.log.error(`Scheduled cleanup error: ${err}`);
    }
  };

  // Run cleanup on startup
  fastify.log.info('Running initial cleanup on startup...');
  await runCleanup();

  // Setup periodic cleanup
  const intervalMs = cleanupIntervalHours * 60 * 60 * 1000;
  const intervalId = setInterval(runCleanup, intervalMs);

  // Clear interval on server close
  fastify.addHook('onClose', async () => {
    clearInterval(intervalId);
    fastify.log.info('Cleanup scheduler stopped');
  });
};

export default fp(cleanupSchedulerPlugin, {
  name: 'cleanup-scheduler',
});
