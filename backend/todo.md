# Migration from JSON Schema to Zod

## Overview
Migrate from Fastify's JSON Schema validation to Zod schemas for better TypeScript integration and single source of truth for types.

## Current State
- JSON schemas defined in `src/modules/app/schemas/receipts.ts` and `schemas/jobs.ts`
- Schemas registered with `fastify.addSchema()`
- Routes reference schemas via `$ref` or inline JSON Schema
- TypeScript types are duplicated in route handlers
- Duplication between JSON Schema definitions and TypeScript types

## Benefits of Zod Migration
- **Single source of truth**: Define schema once, infer TypeScript types automatically
- **Better DX**: More intuitive TypeScript-first API
- **Type safety**: Automatic type inference eliminates duplication
- **Better error messages**: More developer-friendly validation errors
- **Runtime validation**: Same schema for compile-time types and runtime validation
- **Composability**: Easier to extend and compose schemas

## Migration Tasks

### 1. Install Dependencies
- [x] Install `zod` package
- [x] Install `@fastify/type-provider-zod` package
- [x] Verify dependencies in `package.json`

### 2. Setup Zod Type Provider
- [x] Update `src/modules/app/index.ts` to use Zod type provider
- [x] Configure Fastify instance to use `ZodTypeProvider`
- [x] Remove `addSchemas` calls for JSON Schema registration

### 3. Convert Receipt Schemas to Zod
**File**: `src/modules/app/schemas/receipts.ts`

Convert the following schemas:
- [x] `receiptDtoSchema` → `receiptSchema` (Zod)
  - Properties: id, payee, sourceAccount, date, totalSum, status, filename, fileUrl
  - Note: sourceAccount is optional in response but required in submission

- [x] `receiptItemDtoSchema` → `receiptItemSchema` (Zod)
  - Properties: id, receiptId, name, expenseAccount, price

- [x] `receiptSubmissionDtoSchema` → `receiptSubmissionSchema` (Zod)
  - Properties: sourceAccount, payee, date, totalSum, items array
  - Note: items.id is optional (missing from new items created on frontend)
  - Constraint: items array must have minItems: 1

Export inferred TypeScript types:
- [x] Export `type Receipt = z.infer<typeof receiptSchema>`
- [x] Export `type ReceiptItem = z.infer<typeof receiptItemSchema>`
- [x] Export `type ReceiptSubmission = z.infer<typeof receiptSubmissionSchema>`

### 4. Convert Job Schemas to Zod
**File**: `src/modules/app/schemas/jobs.ts`

- [ ] `jobDtoSchema` → `jobSchema` (Zod)
  - Properties: id, filename, fileUrl, retryCount, processedAt, createdAt, status, analysisError
  - Note: analysisError is optional

Export inferred TypeScript types:
- [ ] Export `type Job = z.infer<typeof jobSchema>`

### 5. Update Receipt Routes
**File**: `src/modules/app/routes/receipts.ts`

For each route, update schema definition:

**GET /receipts** (line 6-38):
- [x] Replace JSON Schema with Zod schema for response
- [x] Use `schema: { response: { 200: z.array(receiptSchema) } }`
- [x] Remove manual TypeScript type annotations from handler
- [x] Verify response transformation matches schema

**POST /receipts/:receiptId** (line 40-140):
- [x] Replace `params` JSON Schema with Zod schema
- [x] Replace `body` JSON Schema reference with `receiptSubmissionSchema`
- [x] Replace `response` JSON Schemas (200, 400, 404, 500) with Zod schemas
- [x] Remove explicit `FastifyRequest<{ Params, Body }>` type annotations
- [x] Rely on Zod type inference for request typing

**GET /receipts/:receiptId/items** (line 142-177):
- [x] Replace JSON Schema with Zod schema for params
- [x] Replace JSON Schema with Zod schema for response
- [x] Remove manual TypeScript type annotations

**DELETE /receipts/:receiptId** (line 179-202):
- [x] Replace JSON Schema with Zod schema for params
- [x] Remove manual TypeScript type annotations

### 6. Update Job Routes
**File**: `src/modules/app/routes/job.ts`

**GET /jobs** (line 5-37):
- [ ] Replace JSON Schema with Zod schema for response
- [ ] Use `schema: { response: { 200: z.array(jobSchema) } }`
- [ ] Verify response transformation matches schema

### 7. Update Swagger/OpenAPI Generation
- [ ] Verify that `@fastify/swagger` supports Zod schemas via `@fastify/type-provider-zod`
- [ ] Test OpenAPI/Swagger doc generation after migration
- [ ] Ensure tags and descriptions are preserved in Zod schemas
- [ ] Update `openapi.json` generation if needed

### 8. Additional Considerations

**Error Response Schemas**:
- [ ] Create reusable Zod schema for error responses (used in 400, 404, 500)
- [ ] Example: `errorResponseSchema = z.object({ error: z.string(), message: z.string() })`
- [ ] Apply to all error responses consistently

**Params Schemas**:
- [ ] Create reusable param schemas (e.g., `receiptIdParamSchema`)
- [ ] Ensure proper type coercion for numeric IDs from string params

**Response Schemas**:
- [ ] Create success response schema: `z.object({ success: z.boolean() })`
- [ ] Reuse across routes

**Route Organization**:
- [ ] Consider consolidating common schemas in a shared location
- [ ] Keep route-specific schemas in route files if they're not reused

### 9. Testing
- [ ] Test all receipt endpoints after migration
- [ ] Test all job endpoints after migration
- [ ] Verify validation errors have improved error messages
- [ ] Test with invalid payloads to ensure validation works
- [ ] Test OpenAPI/Swagger documentation generation
- [ ] Verify TypeScript compilation succeeds
- [ ] Check that type inference works correctly in route handlers

### 10. Cleanup
- [ ] Remove old JSON Schema definitions from `schemas/receipts.ts` if not needed
- [ ] Remove old JSON Schema definitions from `schemas/jobs.ts` if not needed
- [ ] Update imports across the codebase
- [ ] Remove any now-unused utility types
- [ ] Update CLAUDE.md documentation to reflect Zod usage

## Implementation Notes

### Zod Schema Examples

**Basic schema**:
```typescript
import { z } from 'zod';

const receiptSchema = z.object({
  id: z.number(),
  payee: z.string(),
  sourceAccount: z.string().optional(),
  date: z.string(),
  totalSum: z.number(),
  status: z.string(),
  filename: z.string(),
  fileUrl: z.string(),
});
```

**Nested schema with constraints**:
```typescript
const receiptSubmissionSchema = z.object({
  sourceAccount: z.string(),
  payee: z.string(),
  date: z.string(),
  totalSum: z.number(),
  items: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string(),
      price: z.number(),
      expenseAccount: z.string(),
    })
  ).min(1), // minItems: 1
});
```

**Route with Zod**:
```typescript
import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/receipts', {
    schema: {
      tags: ['receipts'],
      description: 'Get receipts',
      response: {
        200: z.array(receiptSchema),
      },
    },
    handler: async (request, reply) => {
      // TypeScript types are automatically inferred!
      // No need for explicit type annotations
    },
  });
};
```

**Type inference**:
```typescript
// Infer TypeScript type from Zod schema
type Receipt = z.infer<typeof receiptSchema>;

// Use in other parts of the codebase
function processReceipt(receipt: Receipt) {
  // ...
}
```

## Files to Modify

1. `src/modules/app/schemas/receipts.ts` - Convert to Zod schemas
2. `src/modules/app/schemas/jobs.ts` - Convert to Zod schemas
3. `src/modules/app/routes/receipts.ts` - Update route definitions
4. `src/modules/app/routes/job.ts` - Update route definitions
5. `src/modules/app/index.ts` - Setup Zod type provider
6. `package.json` - Add dependencies
7. `CLAUDE.md` - Update documentation

## References
- Zod documentation: https://zod.dev/
- @fastify/type-provider-zod: https://github.com/fastify/fastify-type-provider-zod
- Fastify type providers: https://fastify.dev/docs/latest/Reference/Type-Providers/
