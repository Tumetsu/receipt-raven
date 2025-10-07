// TODO: add these globally with fastify.addSchema
export const receiptDtoSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    jobId: { type: 'number' },
    payeeName: { type: 'string' },
    date: { type: 'string' },
    totalSum: { type: 'number' },
    status: { type: 'string' },
  },
  required: ['id', 'jobId', 'payeeName', 'date', 'totalSum', 'status'],
};
