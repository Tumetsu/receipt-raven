import { FastifyInstance } from 'fastify';

const receiptDtoSchema = {
  $id: 'receipt',
  type: 'object',
  properties: {
    id: { type: 'number' },
    payee: { type: 'string' },
    sourceAccount: { type: 'string' },
    date: { type: 'string' },
    totalSum: { type: 'number' },
    status: { type: 'string' },
    filename: { type: 'string' },
    fileUrl: { type: 'string' },
  },
  required: [
    'id',
    'payee',
    'date',
    'totalSum',
    'status',
    'filename',
    'fileUrl',
  ],
};

const receiptItemDtoSchema = {
  $id: 'receiptItem',
  type: 'object',
  properties: {
    id: { type: 'number' },
    receiptId: { type: 'number' },
    name: { type: 'string' },
    expenseAccount: { type: 'string' },
    price: { type: 'number' },
  },
  required: ['id', 'receiptId', 'name', 'price', 'expenseAccount'],
};

const receiptSubmissionDtoSchema = {
  $id: 'receiptSubmission',
  type: 'object',
  properties: {
    sourceAccount: { type: 'string' },
    payee: { type: 'string' },
    date: { type: 'string' },
    totalSum: { type: 'number' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' }, // Missing from new items created on frontend
          name: { type: 'string' },
          price: { type: 'number' },
          expenseAccount: { type: 'string' },
        },
        required: ['name', 'price', 'expenseAccount'],
      },
    },
  },
  required: ['sourceAccount', 'payee', 'date', 'totalSum', 'items'],
};

export function addSchemas(fastify: FastifyInstance): void {
  fastify.addSchema(receiptDtoSchema);
  fastify.addSchema(receiptItemDtoSchema);
  fastify.addSchema(receiptSubmissionDtoSchema);
}
