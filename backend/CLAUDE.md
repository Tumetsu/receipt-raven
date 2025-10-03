# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based REST API built with Fastify that processes receipt images using OpenAI's Vision API. The application accepts image uploads, extracts structured receipt data (shop, date, products, prices), and stores the results in a SQLite database.

## Development Commands

```bash
# Install dependencies
npm install

# Development with hot-reload
npm run dev

# Build TypeScript to dist/
npm run build

# Production (requires build first)
npm start

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Architecture

### Layered Structure

1. **HTTP Layer** (`routes/`) - Request handling and response formatting
2. **Service Layer** (`services/`) - Business logic and external integrations
3. **Data Layer** (`services/database.ts`) - SQLite data persistence
4. **Configuration** (`config/`) - Environment and settings management
5. **Types** (`types/`) - Shared TypeScript interfaces

### Core Services

**Receipt Analysis** (`services/receipt-extraction.ts`):
- Orchestrates the receipt analysis flow
- Uses Zod schema validation to ensure OpenAI responses match expected structure
- Main entry point: `analyzeReceipt(imageBuffer: Buffer)`

**OpenAI Client** (`services/openai-client.ts`):
- Factory pattern with `RealOpenAIClient` and `MockOpenAIClient` implementations
- Toggle via `USE_MOCK_OPENAI` environment variable
- Currently uses `gpt-5-mini` model

**Database** (`services/database.ts`):
- SQLite with better-sqlite3 (synchronous, no ORM)
- Two tables: `receipts` (parent) and `receipt_items` (child with FK)
- Uses transactions for atomic saves of receipt + all items
- Singleton instance exported as `receiptDatabase`

### Data Flow

1. POST /api/upload receives multipart file
2. File streamed to disk in `uploads/` directory
3. File buffer sent to OpenAI Vision API with structured prompt
4. JSON response validated against Zod schema
5. Receipt and items saved to SQLite in transaction
6. Response includes file metadata, analysis results, and database ID

### Module System

This project uses **ES Modules** (ES2022):
- All imports must use `.js` extensions (TypeScript convention)
- Example: `import { config } from './config/index.js'`
- `package.json` has `"type": "module"`

### Database Schema

**receipts table**:
- id, objectKey, filepath, shop, receiptDate, totalSum, parsedBy, createdAt, updatedAt

**receipt_items table**:
- id, receiptId (FK), name, category, price, parsedBy, createdAt

### Configuration

Environment variables (see `.env.example`):
- `PORT` - Server port (default: 3001)
- `OPENAI_API_KEY` - Required for real OpenAI API calls
- `USE_MOCK_OPENAI` - Set to 'true' to use mock client for development
- `UPLOADS_DIR` - File upload directory (default: ./uploads)
- `DATABASE_PATH` - SQLite database location (default: ./data/receipts.db)

### Key Patterns

**Error Handling**:
- Zod validation errors provide structured feedback on schema mismatches
- Service layer distinguishes between validation, parsing, and API errors
- Application-level errors cause process exit (see `index.ts`)

**File Uploads**:
- Stream-based processing with `pipeline()` to avoid memory issues
- Max file size: 10MB (configured in `plugins/index.ts`)
- Files saved with timestamp prefix for uniqueness

**Dependency Injection**:
- Services exported as singletons (e.g., `receiptDatabase`, `openAIClient`)
- Factory pattern for OpenAI client to support mock/real implementations

### Code Conventions

- **Files**: kebab-case (`receipt-extraction.ts`)
- **Interfaces**: PascalCase with `I` prefix (`IReceiptDatabase`)
- **Classes**: PascalCase (`SQLiteReceiptDatabase`)
- **Functions/Variables**: camelCase (`analyzeReceipt`)
- **Constants**: UPPER_SNAKE_CASE (`RECEIPT_PROMPT`)

### Important Implementation Notes

1. The OpenAI prompt (`services/receipt-extraction.ts:18-54`) defines the exact JSON structure expected. Modify this if changing the receipt schema.

2. Database migrations are manual - schema changes in `database.ts:71-92`. No migration framework is used.

3. All imports use `.js` extension due to ES modules. This is correct TypeScript behavior, not an error.

4. The `gpt-5-mini` model is currently configured (`openai-client.ts:40`). Update here if switching models.

5. Transaction usage in `database.ts:108-159` ensures atomicity of receipt + items saves.
