# Receipt Raven Backend - Implementation Tasks

## Project Setup
- [x] Set up new Fastify+TypeScript project structure
- [x] Initialize package.json with Fastify dependencies
- [x] Configure TypeScript with tsconfig.json

## Configuration & Environment
- [x] Create config module for environment variables and application settings
- [x] Create .env.example file with all required environment variables

## Core Services
- [ ] Implement filesystem storage service to replace MinIO (save/delete/get file paths)
- [x] Port OpenAI client with real and mock implementations
- [x] Create receipt service with Zod validation for OpenAI responses
- [ ] Set up better-sqlite3 database service with receipts and receipt_items tables

## HTTP Layer & Routing
- [x] Implement Fastify multipart file upload plugin/handler
- [x] Create upload route handler (POST /api/upload) using Fastify patterns
- [ ] Implement global error handler using Fastify error handling hooks
- [x] Set up Fastify plugins: cors, helmet, compression, static file serving

## Application Entry Point
- [x] Create main server entry point (index.ts) with Fastify instance and plugin registration
- [x] Ensure uploads directory is created on server startup

## Type Definitions
- [x] Port shared TypeScript types/interfaces to new project

## File Validation
- [ ] Add file validation middleware for image uploads (file type, size limits)

## Development Tooling
- [x] Set up development scripts (dev with hot reload, build, lint)
