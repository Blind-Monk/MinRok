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

## Service Guides & Documentation Links

- 🚀 [API Gateway Microservice (`backend/api`)](docs/services/api-gateway.md)
- 🔔 [Webhook Receiver & Forwarder (`backend/webhook`)](docs/services/webhook-receiver.md)
- ⏱️ [Status Polling & RAG Ingestion Worker (`backend/worker`)](docs/services/status-rag-worker.md)
- 🤖 [Model Context Protocol AI Server (`backend/mcp`)](docs/services/mcp-server.md)
- 💻 [Angular Frontend Dashboard (`frontend`)](docs/services/angular-dashboard.md)
- 🛠️ [Database Setup Tool (`tools/db-setup`)](docs/services/db-setup-tool.md)
- 📖 [Sequential Deployment & Testing Guide](docs/deployment-and-testing.md)

---

## Step-by-Step Sequential Launch (`bun i` / Bun & Node.js)

Start the microservices one by one in separate terminal windows:

### 1. Database Setup Tool
```bash
# Bun ⚡
bun i --cwd tools/db-setup && bun run tools/db-setup/index.js
# Node 💚
npm --prefix tools/db-setup install && npm run db:setup
```

### 2. API Gateway Microservice (`backend/api`) - Port `8080`
```bash
# Bun ⚡
bun i --cwd backend/api && bun run --cwd backend/api start
# Node 💚
npm --prefix backend/api install && npm run start:api
```
Verify: `GET http://localhost:8080/health` or open Fastify Swagger UI at `http://localhost:8080/docs`.

### 3. Webhook Receiver Microservice (`backend/webhook`) - Port `8081`
```bash
# Bun ⚡
bun i --cwd backend/webhook && bun run --cwd backend/webhook start
# Node 💚
npm --prefix backend/webhook install && npm run start:webhook
```
Verify: `GET http://localhost:8081/health`.

### 4. Status Polling & RAG Ingestion Worker (`backend/worker`)
```bash
# Bun ⚡
bun i --cwd backend/worker && bun run --cwd backend/worker start
# Node 💚
npm --prefix backend/worker install && npm run start:worker
```

### 5. MCP AI Tool Server (`backend/mcp`) - Port `8082`
```bash
# Bun ⚡
bun i --cwd backend/mcp && bun run --cwd backend/mcp start
# Node 💚
npm --prefix backend/mcp install && npm run start:mcp
```

### 6. Angular Frontend Dashboard (`frontend`) - Port `4200`
```bash
# Bun ⚡
bun i --cwd frontend && bun run --cwd frontend start
# Node 💚
npm --prefix frontend install && npm run start:frontend
```
Open browser at `http://localhost:4200`.

---

## Docker & Azure Deployment

- **Development Docker Compose**: `docker compose -f infra/docker-compose.yml up --build`
- **Production Docker Compose**: `docker compose -f infra/docker-compose.prod.yml up -d --build`
- **Azure Production Deployment**: `bash infra/azure/deploy.sh rg-payment-proxy centralindia`
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
