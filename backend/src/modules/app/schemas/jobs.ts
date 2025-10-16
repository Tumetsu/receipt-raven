import { FastifyInstance } from 'fastify';

const jobDtoSchema = {
  $id: 'job',
  type: 'object',
  properties: {
    id: { type: 'number' },
    filename: { type: 'string' },
    retryCount: { type: 'number' },
    processedAt: { type: 'string' },
    createdAt: { type: 'string' },
    status: { type: 'string' },
  },
  required: [
    'id',
    'filename',
    'retryCount',
    'processedAt',
    'createdAt',
    'status',
  ],
};

export function addSchemas(fastify: FastifyInstance): void {
  fastify.addSchema(jobDtoSchema);
}
