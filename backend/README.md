# Receipt Raven Backend

A Fastify-based REST API for processing receipt images using an AI vision model via OpenRouter (or OpenAI directly).

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (copy and edit)
cp .env.example .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Testing the API

### Upload and Analyze a Receipt

Upload a receipt image for analysis:

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@/path/to/receipt.jpg"
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@$HOME/Downloads/kuitti.jpg"
```

### Health Check

```bash
curl http://localhost:3001/health
```

**Response:**

```json
{
  "status": "ok"
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload and analyze receipt image |
| GET | `/health` | Health check endpoint |

## Configuration

Environment variables (`.env`):

```bash
PORT=3001
AI_PROVIDER=openrouter          # openrouter, openai or mock
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5   # any OpenRouter model ID
UPLOADS_DIR=./uploads
DATABASE_PATH=./data/receipts.db
```

## Project Structure

```
backend/src/
├── index.ts              # Application bootstrap
├── config/               # Configuration management
├── plugins/              # Fastify plugins (CORS, security, etc.)
├── types/                # Shared TypeScript types
└── modules/
    └── analyze/          # Receipt analysis module
        ├── index.ts      # Module plugin
        ├── receipts.ts     # HTTP routes
        ├── services/     # Business logic (AI client, extraction)
        └── repositories/ # Data access (SQLite)
```

## Database

SQLite database with two tables:

- **receipts**: Stores receipt metadata (shop, date, total, etc.)
- **receipt_items**: Stores individual products from receipts

Location: `./data/receipts.db` (configurable via `DATABASE_PATH`)

## Development

```bash
# Run with hot-reload
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Limitations

- Max file size: 10MB
- Supported formats: JPG, PNG, and other common image formats
- One file per upload request
