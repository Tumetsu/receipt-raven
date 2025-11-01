[![CI/CD](https://github.com/Tumetsu/receipt-raven/actions/workflows/ci.yml/badge.svg)](https://github.com/Tumetsu/receipt-raven/actions/workflows/ci.yml)

# Receipt Raven
A receipt processing application with OCR and ledger integration. Receipt Raven uses AI-powered image analysis to extract structured data from receipt photos and optionally submit transactions to a Beancount ledger.

## Features

- **Smart Receipt Processing**: Upload receipt images and automatically extract shop names, dates, items, and prices using OpenAI Vision API
- **Ledger Integration**: Submit processed receipts directly to your Beancount ledger with account suggestions and category mapping
- **Modern Web Interface**: Clean, responsive UI built with React and Material-UI
- **Full-Stack TypeScript**: Type-safe codebase with shared schemas and auto-generated API clients

## Quick Start

The easiest way to run Receipt Raven is with Docker Compose:

```bash
# Start all services (frontend, backend, beancount service)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Once running, access the application at **http://localhost:3001**

### Configuration

Create a `.env` file in the project root by using `env.example` as a template:
For Beancount integration, ensure your ledger file path is configured in `docker-compose.yml`.

## Architecture

- **Backend**: Fastify REST API (TypeScript)
- **Frontend**: React SPA with TanStack Router (TypeScript)
- **Beancount Service**: Python FastAPI microservice
- **Database**: SQLite with Kysely query builder

## Development

For detailed development instructions, see [CLAUDE.md](./CLAUDE.md) and readme's in sub directories.

Quick commands:
```bash
# Backend development
cd backend && npm run dev

# Frontend development
cd frontend && npm run dev

# Run with Docker Compose (recommended)
docker-compose up
```

## API Documentation

When running, API documentation is available at **http://localhost:3001/docs**
