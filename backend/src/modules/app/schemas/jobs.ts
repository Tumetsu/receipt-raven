import { FastifyInstance } from 'fastify';

const jobDtoSchema = {
  $id: 'job',
  type: 'object',
  properties: {
    id: { type: 'number' },
    filename: { type: 'string' },
    fileUrl: { type: 'string' },
    retryCount: { type: 'number' },
    processedAt: { type: 'string' },
    createdAt: { type: 'string' },
    status: { type: 'string' },
    analysisError: { type: 'string' },
  },
  required: [
    'id',
    'filename',
    'fileUrl',
    'retryCount',
    'processedAt',
    'createdAt',
    'status',
  ],
};

export function addSchemas(fastify: FastifyInstance): void {
  fastify.addSchema(jobDtoSchema);
}
