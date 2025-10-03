import Fastify from 'fastify';
import { config } from './config/index.js';

const fastify = Fastify({
  logger: true,
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
