# Beancount Ledger Integration

This document describes the Beancount ledger integration architecture for the Receipt Raven application.

## Overview

The Receipt Raven backend integrates with a Beancount ledger to:
1. Retrieve master data (accounts, expense categories, payees) for the UI
2. Submit analyzed receipts as transactions to the ledger

The integration uses a **microservice architecture** with a clean abstraction layer to keep the UI and backend independent of the specific ledger system.

## Architecture

```
┌─────────────┐
│   Frontend  │ (React)
│     UI      │
└──────┬──────┘
       │ REST API
       │
┌──────▼──────────────────────────────────────┐
│        Backend (Node.js/Fastify)            │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │     Ledger Module                  │    │
│  │  ┌──────────────────────────┐      │    │
│  │  │  ILedgerService          │      │    │
│  │  │  (Abstract Interface)    │      │    │
│  │  └────────┬─────────────────┘      │    │
│  │           │                        │    │
│  │  ┌────────▼─────────────────┐      │    │
│  │  │  BeancountAdapter        │      │    │
│  │  │  (HTTP Client)           │      │    │
│  │  └────────┬─────────────────┘      │    │
│  └───────────┼──────────────────────────────┤
│              │ HTTP/REST                    │
└──────────────┼──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│   Beancount Service (Python/FastAPI)       │
│                                             │
│  ┌──────────────┐  ┌───────────────┐       │
│  │  Accounts    │  │  Categories   │       │
│  │  Service     │  │  Service      │       │
│  └──────────────┘  └───────────────┘       │
│                                             │
│  ┌──────────────┐  ┌───────────────┐       │
│  │  Payees      │  │  Transactions │       │
│  │  Service     │  │  Service      │       │
│  └──────────────┘  └───────────────┘       │
│                                             │
│           Beancount Python SDK              │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼────────┐
        │   Beancount   │
        │  Ledger File  │
        │  (.beancount) │
        └───────────────┘
```

## Components

### 1. Backend Ledger Module (`backend/src/modules/ledger/`)

The ledger module provides a clean abstraction for ledger operations:

**Key Files:**
- `types.ts` - Domain types (Account, Category, Transaction, etc.)
- `schemas/index.ts` - Zod validation schemas
- `services/ledger-service.ts` - Abstract `ILedgerService` interface
- `services/beancount-adapter.ts` - HTTP client implementation
- `receipts.ts` - REST API endpoints for frontend
- `index.ts` - Module registration

**API Endpoints (exposed to frontend):**
- `GET /api/ledger/accounts?type=Expenses` - Get accounts
- `GET /api/ledger/categories` - Get expense categories
- `GET /api/ledger/payees` - Get shops/vendors
- `POST /api/ledger/submit-receipt/:receiptId` - Submit receipt to ledger
- `GET /api/ledger/health` - Check ledger service health

### 2. Beancount Service (`beancount-service/`)

Python FastAPI microservice that uses the Beancount SDK:

**Key Files:**
- `main.py` - FastAPI application
- `models.py` - Pydantic models for validation
- `services/accounts.py` - Extract accounts from ledger
- `services/categories.py` - Extract categories from expense accounts
- `services/payees.py` - Extract payees from transactions
- `services/transactions.py` - Create and submit transactions

**API Endpoints:**
- `GET /accounts?type={AccountType}` - Get accounts
- `GET /categories` - Get categories
- `GET /payees` - Get payees
- `POST /transactions` - Submit transaction
- `POST /transactions/receipt` - Submit receipt as transaction
- `GET /health` - Health check

## Data Flow Examples

### 1. Fetching Master Data for UI

When the frontend needs to display a dropdown of expense accounts:

```
Frontend → Backend GET /api/ledger/accounts?type=Expenses
          ↓
Backend → BeancountAdapter.getAccounts("Expenses")
          ↓
Python Service → GET /accounts?type=Expenses
          ↓
Beancount SDK → Parse ledger file
          ↓
Python Service ← Return accounts array
          ↓
Backend ← Validate with Zod schema
          ↓
Frontend ← Return accounts as JSON
```

### 2. Submitting a Receipt to the Ledger

When a user submits a receipt:

```
Frontend → POST /api/ledger/submit-receipt/123
           Body: { sourceAccount: "Assets:Bank:Checking" }
          ↓
Backend → Fetch receipt from database
          → Map items to expense accounts
          → BeancountAdapter.submitReceiptTransaction()
          ↓
Python Service → POST /transactions/receipt
          ↓
Beancount SDK → Format transaction
               → Append to ledger file
          ↓
Python Service ← Return success
          ↓
Backend ← Validate response
          ↓
Frontend ← Return success/failure
```

## Configuration

### Backend Configuration

Add to `backend/.env`:
```env
BEANCOUNT_SERVICE_URL=http://localhost:8000
```

### Python Service Configuration

Create `beancount-service/.env`:
```env
BEANCOUNT_LEDGER_PATH=/path/to/your/ledger.beancount
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Running the Services

### 1. Start the Beancount Service

```bash
cd beancount-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure .env file
cp .env.example .env
# Edit .env to set BEANCOUNT_LEDGER_PATH

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Configure .env file
cp .env.example .env
# Edit .env to set BEANCOUNT_SERVICE_URL

# Run the backend
npm run dev
```

The backend will automatically try to connect to the Beancount service on startup. If the service is unavailable, the backend will still start but ledger endpoints will fail.

## Benefits of This Architecture

### 1. **Abstraction**
- The frontend only knows about generic "accounts" and "categories"
- No knowledge of Beancount-specific concepts
- Easy to swap ledger systems in the future

### 2. **Type Safety**
- Zod schemas validate data between Node.js and Python
- Pydantic models validate data in Python
- TypeScript types ensure type safety in backend and frontend

### 3. **Modularity**
- Ledger module is self-contained
- Can be enabled/disabled independently
- Clear separation of concerns

### 4. **Testability**
- `ILedgerService` interface can be mocked for testing
- Python service can be tested independently
- Can run backend without Python service for development

### 5. **Performance**
- Future: Add caching layer in Node.js for master data
- Python service can be scaled independently
- Async communication with proper error handling

## Alternative Implementation Options

If the microservice approach is too complex for your needs, here are simpler alternatives:

### Option 1: Python CLI Scripts
Instead of a microservice, create Python scripts and call them via `child_process`:

```typescript
// Instead of HTTP calls
const result = execSync('python scripts/get_accounts.py');
```

**Pros:** Simpler, no separate service
**Cons:** Process overhead, harder to debug

### Option 2: Direct File Parsing
Parse beancount files directly in Node.js:

**Pros:** Single codebase
**Cons:** Loses beancount validation, error-prone

The microservice approach is recommended for production use as it provides the best balance of abstraction, type safety, and maintainability.

## Future Enhancements

1. **Caching**: Add Redis cache for master data in backend
2. **Validation**: Run `bean-check` after transaction submission
3. **Transaction Preview**: Show formatted transaction before submission
4. **Batch Operations**: Submit multiple receipts at once
5. **Account Mapping**: Smart mapping of categories to accounts using ML
6. **Reconciliation**: Mark receipts as reconciled in the ledger

## Troubleshooting

### Backend can't connect to Python service

Check:
1. Python service is running: `curl http://localhost:8000/health`
2. `BEANCOUNT_SERVICE_URL` in backend `.env` is correct
3. CORS settings in Python service allow backend origin

### Python service can't read ledger

Check:
1. `BEANCOUNT_LEDGER_PATH` in Python service `.env` is correct
2. File exists and is readable
3. Ledger file has no syntax errors: `bean-check ledger.beancount`

### Transactions not appearing in ledger

Check:
1. Ledger file permissions (writable)
2. Transaction format is valid
3. Check Python service logs for errors
4. Run `bean-check` on the ledger file

## Development Tips

1. **Use dry_run**: Test transactions with `?dry_run=true` query parameter
2. **Check logs**: Both services have detailed logging
3. **Interactive docs**: Visit `http://localhost:8000/docs` for Python service API docs
4. **Type safety**: Update schemas when changing data models
5. **Health checks**: Monitor `/health` endpoints for both services
