# Payment Proxy Platform (MinRok)

An open-source, non-custodial payment orchestration proxy platform built with Node.js/Bun microservices and an Angular dashboard.

---

## Architecture & Microservices Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Angular Dashboard (merchant onboarding, billing, docs)         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────┐
│  Azure Front Door (WAF + TLS + rate limit)                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Gateway  │  │  MCP Server  │  │  Webhook Rx  │
│  (Fastify)    │  │  (Node/Bun)  │  │  (Fastify)   │
└───────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │                 │                 │
        └────────┬────────┴────────┬────────┘
                 ▼                 ▼
        ┌────────────────┐  ┌───────────────┐
        │  PostgreSQL    │  │  Redis        │
        │  + pgvector    │  │  (rate limit) │
        └────────────────┘  └───────────────┘
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │  Adapters: Stripe / PayPal / Razorpay  │
        │  Binance Pay / Coinbase / MoonPay      │
        └────────────────────────────────────────┘
```

---

## Service Documentation Links

- 🚀 [API Gateway Microservice (`backend/api`)](docs/services/api-gateway.md)
- 🔔 [Webhook Receiver & Forwarder (`backend/webhook`)](docs/services/webhook-receiver.md)
- ⏱️ [Status Polling & RAG Ingestion Worker (`backend/worker`)](docs/services/status-rag-worker.md)
- 🤖 [Model Context Protocol AI Server (`backend/mcp`)](docs/services/mcp-server.md)
- 💻 [Angular Frontend Dashboard (`frontend`)](docs/services/angular-dashboard.md)
- 🛠️ [Database Setup Tool (`tools/db-setup`)](docs/services/db-setup-tool.md)

---

## Directory & File Paths

- **Centralized Configuration**: `/app/config.json` (Template: `/app/config.example.json`)
- **Database Schema & Migrations**: `/app/infra/db/migrations/001_init.sql`
- **Database Setup Tool**: `/app/tools/db-setup/index.js`
- **API Gateway Microservice**: `/app/backend/api/src/server.ts`
- **Webhook Microservice**: `/app/backend/webhook/src/server.ts`
- **Status & RAG Worker**: `/app/backend/worker/src/index.ts`
- **MCP AI Server**: `/app/backend/mcp/src/server.ts`
- **Angular Dashboard UI**: `/app/frontend/`
- **Infrastructure Configurations**: `/app/infra/docker-compose.yml`, `/app/infra/docker-compose.prod.yml`, `/app/infra/azure/deploy.sh`
- **Test Suite**: `/app/tests/unit/core.test.ts`, `/app/tests/integration/services.test.ts`, `/app/tests/e2e/dashboard.spec.ts`

---

## Quickstart & Launch in Development

### Using Bun ⚡
```bash
# Install dependencies
bun install

# Run Database Setup Tool
bun run tools/db-setup/index.js

# Start Microservices
bun run --cwd backend/api start       # API Gateway (http://localhost:8080)
bun run --cwd backend/webhook start   # Webhook Rx (http://localhost:8081)
bun run --cwd backend/worker start    # Status & RAG Worker
bun run --cwd backend/mcp start       # MCP Server (http://localhost:8082)
bun run --cwd frontend start          # Angular Dashboard (http://localhost:4200)
```

### Using Node.js & npm 💚
```bash
npm install
npm run db:setup
npm run start:api
npm run start:webhook
npm run start:worker
npm run start:mcp
npm run start:frontend
```

---

## Docker & Production Azure Deployment

- **Development Docker Compose**: `docker compose -f infra/docker-compose.yml up --build`
- **Production Docker Compose**: `docker compose -f infra/docker-compose.prod.yml up -d --build`
- **Azure Production IaC Script**: `bash infra/azure/deploy.sh rg-payment-proxy centralindia`
- **GitHub Pages Hosting**: `bun run --cwd frontend build -- --base-href="https://<username>.github.io/<repo-name>/" && npx angular-cli-ghpages --dir=frontend/dist/dashboard/browser`

---

## Testing

```bash
# Unit & Integration Tests
bun test
# or:
npm run test:unit
npm run test:integration

# Playwright E2E Tests
npm run test:e2e
```
