# Payment Proxy Platform (MinRok)

An open-source, non-custodial payment orchestration proxy platform built with Node.js/Bun microservices and an Angular dashboard.

---

## Architecture & Microservices Structure

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

## Directory & File Paths Guide

- **Centralized Configuration**: `/app/config.json` (Template at `/app/config.example.json`)
- **Root Configuration**: `/app/package.json`
- **Database Migrations & Setup Tool**:
  - Migration Script: `/app/infra/db/migrations/001_init.sql`
  - Setup Tool Script: `/app/tools/db-setup/index.js`
- **API Gateway Microservice**: `/app/backend/api/`
  - Entrypoint: `/app/backend/api/src/server.ts`
  - Adapters: `/app/backend/api/src/adapters/` (`stripe.ts`, `paypal.ts`, `razorpay.ts`, `binance.ts`, `coinbase.ts`, `moonpay.ts`)
  - Routes: `/app/backend/api/src/routes/` (`auth.ts`, `payment.ts`, `billing.ts`, `docs.ts`)
- **Webhook Microservice**: `/app/backend/webhook/src/server.ts`
- **Status & RAG Worker**: `/app/backend/worker/src/index.ts`
- **MCP AI Server**: `/app/backend/mcp/src/server.ts`
- **Angular Frontend Dashboard**: `/app/frontend/`
- **Infrastructure & Deployment**:
  - Docker Compose: `/app/infra/docker-compose.yml` & `/app/infra/docker-compose.prod.yml`
  - Azure Bicep IaC: `/app/infra/azure/main.bicep` & `/app/infra/azure/deploy.sh`
- **Tests**:
  - Unit Tests: `/app/tests/unit/core.test.ts`
  - Integration Tests: `/app/tests/integration/services.test.ts`
  - Playwright E2E Tests: `/app/tests/e2e/dashboard.spec.ts`

---

## Launching in Development (Bun & Node.js)

### Using Bun ⚡
```bash
# 1. Install workspace dependencies
bun install

# 2. Run Database Setup Tool
bun run tools/db-setup/index.js

# 3. Launch Services
bun run --cwd backend/api start       # API Gateway (http://localhost:8080)
bun run --cwd backend/webhook start   # Webhook Rx (http://localhost:8081)
bun run --cwd backend/worker start    # Status/RAG Worker
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

## Docker Deployment

### Development Environment
```bash
docker compose -f infra/docker-compose.yml up --build
```

### Production Stack
```bash
docker compose -f infra/docker-compose.prod.yml up -d --build
```

---

## Production Deployment on Azure

Deploy with Azure Bicep and Azure CLI:
```bash
bash infra/azure/deploy.sh rg-payment-proxy centralindia
```

---

## Hosting Angular Dashboard on GitHub Pages

```bash
# Build with GitHub Pages base href
bun run --cwd frontend build -- --base-href="https://<username>.github.io/<repo-name>/"

# Deploy
npx angular-cli-ghpages --dir=frontend/dist/dashboard/browser
```

---

## Running Test Suite

```bash
# Unit & Integration Tests
bun test
# or with npm:
npm run test:unit
npm run test:integration

# E2E Playwright Tests
npm run test:e2e
```

---

## Documentation Links

- [`docs/deployment-and-testing.md`](docs/deployment-and-testing.md) - Detailed Bun, Node, Azure, Docker, GitHub Pages & Testing Guide
- [`docs/architecture.md`](docs/architecture.md) - Architecture & Design Invariants
- [`docs/getting-started.md`](docs/getting-started.md) - Quickstart Guide
- [`docs/api-reference.md`](docs/api-reference.md) - API Endpoints Reference
- [`docs/mcp-integration.md`](docs/mcp-integration.md) - MCP AI Tools Integration
- [`docs/tools.md`](docs/tools.md) - Database Setup Tool & Centralized Config
- [`docs/billing.md`](docs/billing.md) - Microcent Metering & 20 Req/Day Free Quota
- [`docs/self-hosting.md`](docs/self-hosting.md) - Docker Compose Self-Hosting
