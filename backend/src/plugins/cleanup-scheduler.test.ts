import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cleanupSchedulerPlugin from './cleanup-scheduler.js';

// Mock the config module with a valid configuration
vi.mock('../config/index.js', () => ({
  config: {
    storage: {
      maxUploadsDiskSize: '1MB',
      uploadsDir: '/tmp/test-uploads',
      cleanupIntervalHours: 24,
    },
  },
}));

describe('cleanup-scheduler plugin', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    // Create fresh Fastify instance
    fastify = Fastify({
      logger: false, // Disable logging for tests
    });
  });

  afterEach(async () => {
    // Close Fastify
    await fastify.close();

    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should register plugin successfully', async () => {
    await expect(
      fastify.register(cleanupSchedulerPlugin)
    ).resolves.not.toThrow();
  });

  it('should log when cleanup scheduler is enabled', async () => {
    const infoSpy = vi.spyOn(fastify.log, 'info');

    await fastify.register(cleanupSchedulerPlugin);
    await fastify.ready();

    // Should log that cleanup scheduler is enabled
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cleanup scheduler enabled')
    );
  });

  it('should run initial cleanup on startup', async () => {
    const infoSpy = vi.spyOn(fastify.log, 'info');

    await fastify.register(cleanupSchedulerPlugin);
    await fastify.ready();

    // Should log running initial cleanup
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Running initial cleanup')
    );
  });

  it('should clean up interval on server close', async () => {
    const infoSpy = vi.spyOn(fastify.log, 'info');

    await fastify.register(cleanupSchedulerPlugin);
    await fastify.ready();
    await fastify.close();

    // Should log that scheduler stopped
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cleanup scheduler stopped')
    );
  });
});
