import { FastifyInstance } from 'fastify';

const receiptDtoSchema = {
  $id: 'receipt',
  type: 'object',
  properties: {
    id: { type: 'number' },
    payee: { type: 'string' },
    expenseAccount: { type: 'string' },
    date: { type: 'string' },
    totalSum: { type: 'number' },
    status: { type: 'string' },
    filepath: { type: 'string' },
  },
  required: ['id', 'payee', 'date', 'totalSum', 'status', 'filepath'],
};

const receiptItemDtoSchema = {
  $id: 'receiptItem',
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

const receiptSubmissionDtoSchema = {
  $id: 'receiptSubmission',
  type: 'object',
  properties: {
    expenseAccount: { type: 'string' },
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
          category: { type: 'string' },
        },
        required: ['name', 'price', 'category'],
      },
    },
  },
  required: ['expenseAccount', 'payee', 'date', 'totalSum', 'items'],
};

export function addSchemas(fastify: FastifyInstance): void {
  fastify.addSchema(receiptDtoSchema);
  fastify.addSchema(receiptItemDtoSchema);
  fastify.addSchema(receiptSubmissionDtoSchema);
}
