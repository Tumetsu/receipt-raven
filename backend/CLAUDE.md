# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based REST API built with Fastify that processes receipt images using an AI vision model via OpenRouter (or OpenAI directly). The application accepts image uploads, extracts structured receipt data (shop, date, products, prices), and stores the results in a SQLite database.

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
- Uses Zod schema validation to ensure AI responses match expected structure
- Main entry point: `analyzeReceipt(imageBuffer: Buffer)`

**AI Client** (`modules/analyze/services/ai-client.ts`):
- Factory `getAIClient()` with `OpenRouterClient`, `OpenAIClient` and `MockAIClient` implementations
- Select with the `AI_PROVIDER` environment variable: `openrouter`, `openai` or `mock`
- `OpenRouterClient` uses the `openai` SDK against OpenRouter's OpenAI-compatible API; images are sent as `image_url` parts, PDFs as `file` parts
- Model is configured via `OPENROUTER_MODEL` (or `OPENAI_MODEL` for the `openai` provider)

**Database** (`services/database.ts`):
- SQLite with better-sqlite3 (synchronous, no ORM)
- Two tables: `receipts` (parent) and `receipt_items` (child with FK)
- Uses transactions for atomic saves of receipt + all items
- Singleton instance exported as `receiptDatabase`

### Data Flow

1. POST /api/upload receives multipart file
2. File streamed to disk in `uploads/` directory
3. File buffer sent to the configured AI provider with structured prompt
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
- `AI_PROVIDER` - `openrouter`, `openai` or `mock` (mock client for development)
- `OPENROUTER_API_KEY` - Required when `AI_PROVIDER=openrouter`
- `OPENROUTER_MODEL` - OpenRouter model ID (default: `anthropic/claude-haiku-4.5`)
- `OPENROUTER_BASE_URL` - Optional, defaults to `https://openrouter.ai/api/v1`
- `OPENAI_API_KEY` / `OPENAI_MODEL` - Used when `AI_PROVIDER=openai`
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
- Services exported as singletons (e.g., `receiptDatabase`, `aiClient`)
- Factory pattern for AI client to support OpenRouter/OpenAI/mock implementations

### Code Conventions

- **Files**: kebab-case (`receipt-extraction.ts`)
- **Interfaces**: PascalCase with `I` prefix (`IReceiptDatabase`)
- **Classes**: PascalCase (`SQLiteReceiptDatabase`)
- **Functions/Variables**: camelCase (`analyzeReceipt`)
- **Constants**: UPPER_SNAKE_CASE (`RECEIPT_PROMPT`)

### Important Implementation Notes

1. The AI prompt (`services/receipt-extraction.ts:18-54`) defines the exact JSON structure expected. Modify this if changing the receipt schema.

2. Database migrations are manual - schema changes in `database.ts:71-92`. No migration framework is used.

3. All imports use `.js` extension due to ES modules. This is correct TypeScript behavior, not an error.

4. The model is configured via environment variables (`OPENROUTER_MODEL` / `OPENAI_MODEL`), read in `config/index.ts`. Change the env var to switch models.

5. Transaction usage in `database.ts:108-159` ensures atomicity of receipt + items saves.
