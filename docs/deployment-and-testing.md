# Sequential Development Launch & Service Guide (Bun & Node.js)

This guide provides step-by-step instructions for initializing configuration files, setting environment variables, installing dependencies, and starting the Payment Proxy Platform microservices **one by one** in local development mode.

---

## Workspace Directory & Execution Paths Summary

All initialization and environment export commands must be executed from the **Repository Root Directory** (`/app` or root of the cloned repo):

- **Repository Root Path**: `/app` (or your local `payment-proxy` repository root)
- **Centralized Config File Path**: `/app/config.json` (Template: `/app/config.example.json`)
- **Database Migrations Script**: `/app/infra/db/migrations/001_init.sql`
- **Database Setup Tool**: `/app/tools/db-setup/index.js`
- **API Gateway Service**: `/app/backend/api/src/server.ts` (Port `8080`)
- **Webhook Receiver Service**: `/app/backend/webhook/src/server.ts` (Port `8081`)
- **Status & RAG Worker Service**: `/app/backend/worker/src/index.ts`
- **MCP AI Tool Server**: `/app/backend/mcp/src/server.ts` (Port `8082`)
- **Angular Frontend Dashboard**: `/app/frontend/` (Port `4200`)

---

## Initial Setup & Environment Configuration Commands

**Execution Path**: Execute these commands from the **Repository Root Directory** (`/app` or `./`):

```bash
# 1. Navigate to the repository root directory
cd /app

# 2. Copy the example configuration to config.json
cp config.example.json config.json

# 3. Export required environment variables
export WISE_WORDS_CONFIG="$(pwd)/config.json"
export GROQ_API_KEY="your-groq-key"
export GOOGLE_AI_STUDIO_API_KEY="your-google-key"
```

---

## Step-by-Step Sequential Service Launch

Follow these steps in numerical order to install dependencies and bring up the platform service by service:

### Step 1: Initialize Database & Run Setup Tool

Before starting any microservice, ensure PostgreSQL (with `pgvector` extension) and Redis are running.

**Execution Path**: Repository Root (`/app`)
```bash
# Using Bun ⚡
bun i --cwd tools/db-setup
bun run tools/db-setup/index.js

# Using Node.js & npm 💚
npm --prefix tools/db-setup install
npm run db:setup
```

**Verification Command** (Run from any path):
```bash
psql "postgres://proxy:proxy@localhost:5432/proxy" -c "\dt"
```
Expect tables: `merchants`, `allowed_system_users`, `merchant_gateways`, `payment_requests`, `credit_ledger`, `webhook_events`, `routing_rules`, `doc_chunks`, `audit_log`.

---

### Step 2: Start API Gateway Microservice (`backend/api`)

Open **Terminal 1**, navigate to repository root (`/app`), install service dependencies with `bun i`, and start the core Fastify API Gateway.

**Execution Path**: Repository Root (`/app`)
```bash
# Using Bun ⚡
bun i --cwd backend/api
bun run --cwd backend/api start

# Using Node.js & npm 💚
npm --prefix backend/api install
npm --prefix backend/api run build
npm --prefix backend/api start
```

**Verification**:
```bash
curl http://localhost:8080/health
# Response: {"ok":true,"version":"1.0.0","service":"api-gateway"}
```
Access interactive Fastify Swagger API documentation at: `http://localhost:8080/docs`.

---

### Step 3: Start Webhook Receiver Microservice (`backend/webhook`)

Open **Terminal 2**, navigate to repository root (`/app`), install service dependencies with `bun i`, and start the Webhook Receiver and HMAC forwarder service.

**Execution Path**: Repository Root (`/app`)
```bash
# Using Bun ⚡
bun i --cwd backend/webhook
bun run --cwd backend/webhook start

# Using Node.js & npm 💚
npm --prefix backend/webhook install
npm --prefix backend/webhook run build
npm --prefix backend/webhook start
```

**Verification**:
```bash
curl http://localhost:8081/health
# Response: {"ok":true,"service":"webhook-rx"}
```

---

### Step 4: Start Status Polling & RAG Ingestion Worker (`backend/worker`)

Open **Terminal 3**, navigate to repository root (`/app`), install service dependencies with `bun i`, and start the background cron worker.

**Execution Path**: Repository Root (`/app`)
```bash
# Using Bun ⚡
bun i --cwd backend/worker
bun run --cwd backend/worker start

# Using Node.js & npm 💚
npm --prefix backend/worker install
npm --prefix backend/worker run build
npm --prefix backend/worker start
```

**Verification Check**: Observe terminal logs confirming doc ingestion:
```
[worker] Payment Proxy Worker started.
[worker] Starting RAG documentation ingestion...
[worker] Ingested 7 documentation files into doc_chunks.
```

---

### Step 5: Start Model Context Protocol (MCP) Server (`backend/mcp`)

Open **Terminal 4**, navigate to repository root (`/app`), install service dependencies with `bun i`, and start the MCP AI Server.

**Execution Path**: Repository Root (`/app`)
```bash
# Using Bun ⚡
bun i --cwd backend/mcp
bun run --cwd backend/mcp start

# Using Node.js & npm 💚
npm --prefix backend/mcp install
npm --prefix backend/mcp run build
npm --prefix backend/mcp start
```

---

### Step 6: Start Angular Frontend Dashboard (`frontend`)

Open **Terminal 5**, navigate to repository root (`/app`), install service dependencies with `bun i`, and start the Angular UI application.

**Execution Path**: Repository Root (`/app`)
```bash
# Using Bun ⚡
bun i --cwd frontend
bun run --cwd frontend start

# Using Angular CLI / npm 💚
npm --prefix frontend install
npm --prefix frontend start
```

**Verification**: Open your browser and navigate to `http://localhost:4200`. Sign up a new merchant to test the end-to-end payment creation flow.

---

## Summary Table of Services & Command Working Directories

| Step | Service Name | Directory Path | Execution Path | Install Command (Bun) | Port | Health / Verification Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | Initial Config | `/app` | Repository Root (`/app`) | `cp config.example.json config.json` | N/A | File `config.json` exists |
| **1** | Database Setup Tool | `tools/db-setup` | Repository Root (`/app`) | `bun i --cwd tools/db-setup` | 5432 (Postgres) | `npm run db:setup` |
| **2** | API Gateway | `backend/api` | Repository Root (`/app`) | `bun i --cwd backend/api` | 8080 | `GET http://localhost:8080/health` |
| **3** | Webhook Receiver | `backend/webhook` | Repository Root (`/app`) | `bun i --cwd backend/webhook` | 8081 | `GET http://localhost:8081/health` |
| **4** | Status & RAG Worker | `backend/worker` | Repository Root (`/app`) | `bun i --cwd backend/worker` | N/A | Terminal Log Verification |
| **5** | MCP AI Tool Server | `backend/mcp` | Repository Root (`/app`) | `bun i --cwd backend/mcp` | 8082 | Stdio / HTTP Connection |
| **6** | Angular Dashboard | `frontend` | Repository Root (`/app`) | `bun i --cwd frontend` | 4200 | `http://localhost:4200` |
