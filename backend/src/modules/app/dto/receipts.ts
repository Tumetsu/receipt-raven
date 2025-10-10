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
    filepath: { type: 'string' },
  },
  required: [
    'id',
    'jobId',
    'payeeName',
    'date',
    'totalSum',
    'status',
    'filepath',
  ],
};

export const receiptItemDtoSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    receiptId: { type: 'number' },
    name: { type: 'string' },
    category: { type: 'string' },
    price: { type: 'number' },
  },
  required: ['id', 'receiptId', 'name', 'price', 'category'],
};
