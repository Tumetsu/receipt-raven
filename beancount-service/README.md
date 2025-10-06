# Beancount Ledger Service

FastAPI microservice that provides REST API access to a Beancount ledger.

## Features

- Read master data (accounts, categories, payees) from Beancount ledger
- Submit transactions to the ledger
- Convert receipt data to Beancount transactions
- Type-safe with Pydantic models
- CORS support for frontend integration

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure the `.env` file with your beancount ledger path:
```env
BEANCOUNT_LEDGER_PATH=/path/to/your/ledger.beancount
```

## Running the Service

### Development
```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using the script
python main.py
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
- `GET /health` - Check if service is running and ledger file is accessible

### Master Data
- `GET /accounts?type={AccountType}` - Get all accounts (optionally filtered by type)
- `GET /categories` - Get expense categories
- `GET /payees` - Get list of payees/shops

### Transactions
- `POST /transactions` - Submit a transaction to the ledger
- `POST /transactions/receipt` - Convert receipt data to transaction and submit

### API Documentation
- `GET /docs` - Interactive Swagger UI documentation
- `GET /redoc` - ReDoc documentation

## Data Models

See `models.py` for complete model definitions.

### Account
```json
{
  "name": "Expenses:Food:Groceries",
  "type": "Expenses",
  "display_name": "Groceries"
}
```

### Transaction
```json
{
  "date": "2025-10-06",
  "payee": "K-Market",
  "narration": "Weekly groceries",
  "postings": [
    {
      "account": "Expenses:Food:Groceries",
      "amount": 45.50,
      "currency": "EUR"
    },
    {
      "account": "Assets:Bank:Checking",
      "amount": -45.50,
      "currency": "EUR"
    }
  ],
  "tags": ["groceries"],
  "metadata": {"store_location": "Downtown"}
}
```

## Integration with Receipt Raven

This service is designed to work with the Receipt Raven backend. The Node.js backend communicates with this Python service via HTTP to:

1. Fetch master data (accounts, categories) for the frontend UI
2. Submit analyzed receipts as Beancount transactions

Configuration in Receipt Raven backend:
```env
BEANCOUNT_SERVICE_URL=http://localhost:8000
```

## Development

### Project Structure
```
beancount-service/
├── main.py                 # FastAPI application
├── models.py              # Pydantic models
├── requirements.txt       # Python dependencies
├── services/
│   ├── accounts.py       # Account extraction logic
│   ├── categories.py     # Category extraction logic
│   ├── payees.py         # Payee extraction logic
│   └── transactions.py   # Transaction creation and submission
└── .env                   # Environment configuration
```

### Testing

Test the endpoints using curl:

```bash
# Health check
curl http://localhost:8000/health

# Get accounts
curl http://localhost:8000/accounts

# Get expense accounts only
curl http://localhost:8000/accounts?type=Expenses

# Submit a transaction (dry run)
curl -X POST http://localhost:8000/transactions?dry_run=true \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-06",
    "payee": "Test Shop",
    "narration": "Test purchase",
    "postings": [
      {"account": "Expenses:Test", "amount": 10.0},
      {"account": "Assets:Cash", "amount": -10.0}
    ]
  }'
```

## Notes

- Transactions are appended to the ledger file specified in `BEANCOUNT_LEDGER_PATH`
- The service does not validate account balance or enforce beancount's validation rules
- It's recommended to run `bean-check` on your ledger file after adding transactions
- For production, consider using a process manager like systemd or supervisord
