# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Receipt Raven is a receipt processing application with OCR and ledger integration. It's a full-stack TypeScript monorepo consisting of:
- **Backend**: Fastify REST API with OpenAI Vision API integration for receipt analysis
- **Frontend**: React SPA with TanStack Router and Material-UI
- **Beancount Service**: Python FastAPI microservice for ledger integration

The app processes receipt images, extracts structured data (shop, date, items, prices), and optionally submits transactions to a Beancount ledger.

## Quick Commands

### Backend Development
```bash
cd backend

# Build full application (frontend + backend)
npm run build:full

# Linting & Formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Type checking (no emit)
npx tsc --noEmit

# OpenAPI schema export
npm run openapi:export
```

### Frontend Development
```bash
cd frontend

# Build for production
npm run build

# Linting & Formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Type checking
npm run type-check

# Generate API client from backend OpenAPI spec
npm run api-client:generate
```

### Database Migrations
```bash
cd backend

# Create new migration
npm run migration:create

# Run migrations
npm run migration:run
```

## Architecture

### Module-Based Backend Architecture

The backend uses a **module pattern** where each feature is self-contained:

**Structure:**
```
backend/src/
├── plugins/           # Fastify plugins (database, ledger, repositories)
├── modules/           # Feature modules
│   ├── upload/        # Receipt upload handling
│   ├── analyze/       # Receipt analysis with OpenAI
│   ├── ledger/        # Ledger integration routes
│   └── app/           # Main app routes (receipts, jobs)
├── database/          # Kysely database schema
└── config/            # Configuration management
```

**Module Registration Flow:**
1. `plugins/index.ts` registers core plugins (database, swagger, CORS, etc.)
2. `index.ts` registers modules in order: upload → analyze → ledger → app
3. Each module is a Fastify plugin that registers its routes and dependencies

**Key Plugins:**
- `plugins/database.ts`: Provides singleton Kysely instance via `fastify.db`
- `plugins/ledger/`: Ledger service abstraction and Beancount adapter
- `plugins/repositories/`: Data access layer for receipts and jobs

**Repository Pattern:**
- Repositories are instantiated in modules with injected `fastify.db`
- Example: `SQLiteReceiptRepository(fastify.db)`
- Repositories are decorated onto fastify instance for access across routes

### Frontend Architecture

**Routing:**
- TanStack Router with file-based routing in `src/routes/`
- Routes: `/` (receipts list), `/upload`, `/jobs`
- Generated route tree in `routeTree.gen.ts` (auto-generated, don't edit)

**API Client:**
- Generated from backend OpenAPI spec using Orval
- Located in `src/api/generated/`
- Uses React Query for data fetching and caching
- Custom axios instance in `src/api/axiosInstance.ts`

**State Management:**
- React Query for server state
- React Hook Form with Zod validation for forms
- Material-UI components with emotion styling

**Component Organization:**
```
frontend/src/
├── routes/              # Route components (TanStack Router)
├── views/               # Page-level view components
├── common/              # Shared components and hooks
└── api/                 # API client and axios config
```

### Ledger Integration Architecture

The Beancount integration uses a **microservice architecture** with abstraction layers:

**Flow:**
```
Frontend → Backend (/api/ledger/*) → Ledger Plugin → Beancount Adapter → Python Service → Beancount SDK → ledger.beancount
```

**Key Components:**
- `plugins/ledger/ledger-service.ts`: `ILedgerService` interface (abstraction)
- `plugins/ledger/beancount-adapter.ts`: HTTP client implementation
- `plugins/ledger/schemas.ts`: Zod validation for ledger data
- `modules/ledger/routes.ts`: REST endpoints for frontend

**Ledger Endpoints:**
- `GET /api/ledger/accounts?type=Expenses` - Get accounts by type
- `GET /api/ledger/categories` - Get expense categories
- `GET /api/ledger/payees` - Get shops/vendors
- `POST /api/ledger/submit-receipt/:receiptId` - Submit receipt to ledger
- `GET /api/ledger/health` - Check ledger service connectivity

See `LEDGER_INTEGRATION.md` for detailed architecture documentation.

### Data Flow: Receipt Upload to Analysis

1. **Upload** (`modules/upload/`):
   - Frontend uploads image via multipart form
   - File streamed to `uploads/` directory
   - Job created in `receipt_job_queue` table with status 'pending'
   - Returns job ID to frontend

2. **Analysis** (`modules/analyze/`):
   - Backend polls job queue or triggers analysis
   - `services/ai-client.ts` sends image to OpenAI Vision API
   - Response validated against Zod schema
   - Receipt + items saved to database in transaction
   - Job status updated to 'completed' or 'failed'

3. **Display** (`modules/app/routes/receipts.ts`):
   - Frontend fetches receipts via `GET /api/receipts`
   - Can view, edit, or submit to ledger

### Database Layer

**Technology:** SQLite with Kysely query builder (type-safe, no ORM)

**Schema Location:** `backend/src/database/schema.ts`

**Key Tables:**
- `receipts`: Main receipt data (shop, date, total, etc.)
- `receipt_items`: Individual line items (FK to receipts)
- `receipt_job_queue`: Async job processing queue

**Access Pattern:**
- Database plugin provides `fastify.db` decorator
- Repositories instantiated with `fastify.db` in modules
- Transactions used for atomic operations (receipt + items)

### Type Safety & Validation

**Backend:**
- Zod schemas for request/response validation
- `fastify-type-provider-zod` for type-safe routes
- Kysely for type-safe SQL queries
- OpenAPI schema auto-generated from Zod schemas

**Frontend:**
- API client generated from OpenAPI spec (Orval)
- Zod schemas for form validation
- TypeScript strict mode enabled

**Shared Patterns:**
- All imports use `.js` extension (ES modules)
- `package.json` has `"type": "module"`

## Code Conventions

**Style:**
- Prefer functional programming style utilizing map, filter, reduce and lodash utilities
- Always run `npm run format` before committing

**Naming:**
- Files: kebab-case (`receipt-extraction.ts`)
- Interfaces: PascalCase with `I` prefix (`ILedgerService`)
- Classes: PascalCase (`SQLiteReceiptRepository`)
- Functions/Variables: camelCase (`analyzeReceipt`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

**ES Modules:**
- All imports MUST use `.js` extension (TypeScript convention for ES modules)
- Example: `import { config } from './config/index.js'`
- This is correct behavior, not an error

**Module Pattern:**
- Each module exports a Fastify plugin
- Modules register routes with appropriate prefixes
- Dependencies injected via fastify decorators

## Important Implementation Notes

1. **Module Registration Order Matters**: Database plugin must be registered first (in `plugins/index.ts`), then modules can use `fastify.db`

2. **Repository Instantiation**: Repositories are created in module plugins (not as singletons) and decorated onto fastify instance for route access

3. **API Client Generation**: Run `npm run api-client:generate` in frontend after changing backend routes/schemas to regenerate the API client

4. **OpenAPI Schema**: Backend exports schema via `npm run openapi:export` which frontend uses for client generation

5. **SPA Routing**: Backend has a catch-all handler that serves `index.html` for non-API routes to support client-side routing

6. **Transaction Safety**: Receipt + items are saved in a database transaction to ensure atomicity (see `receipt-repository.ts`)

7. **Job Queue Pattern**: Upload creates a job, analysis processes it asynchronously, frontend polls job status

8. **Ledger Service Optional**: Backend works without Beancount service - ledger endpoints will fail gracefully if service is unavailable

9. **Docker Networking**: In docker-compose, services communicate via service names (e.g., `http://beancount-service:8000`)

10. **Frontend Build**: `npm run build:full` in backend builds frontend and copies to `backend/dist/public/` for production deployment
