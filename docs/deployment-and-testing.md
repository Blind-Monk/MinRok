# Comprehensive Deployment, Hosting & Testing Guide (Bun & Node.js)

This guide provides detailed, step-by-step instructions for launching in development mode, running with Bun or Node.js, executing Docker setups, deploying to production (Azure & Docker Compose Prod), hosting the Angular frontend on GitHub Pages, and running the test suite.

---

## Workspace Directory & File Structure Paths

Below are the exact paths for all components, microservices, configuration files, and tools in the repository:

- **Root Configuration**: `/app/config.json` (Template: `/app/config.example.json`)
- **Root Package Configuration**: `/app/package.json`
- **Database Schema & Migrations**: `/app/infra/db/migrations/001_init.sql`
- **Database Setup Tool**: `/app/tools/db-setup/index.js` (`/app/tools/db-setup/package.json`)
- **API Gateway Microservice**: `/app/backend/api/src/server.ts` (`/app/backend/api/package.json`)
  - Adapters Path: `/app/backend/api/src/adapters/` (`stripe.ts`, `paypal.ts`, `razorpay.ts`, `binance.ts`, `coinbase.ts`, `moonpay.ts`)
  - Routes Path: `/app/backend/api/src/routes/` (`auth.ts`, `payment.ts`, `billing.ts`, `docs.ts`)
- **Webhook Microservice**: `/app/backend/webhook/src/server.ts` (`/app/backend/webhook/package.json`)
- **Status & RAG Worker**: `/app/backend/worker/src/index.ts` (`/app/backend/worker/package.json`)
- **MCP AI Tool Server**: `/app/backend/mcp/src/server.ts` (`/app/backend/mcp/package.json`)
- **Angular Frontend Dashboard**: `/app/frontend/src/` (`/app/frontend/package.json`)
- **Infrastructure Configurations**: `/app/infra/docker-compose.yml`, `/app/infra/docker-compose.prod.yml`, `/app/infra/azure/main.bicep`, `/app/infra/azure/deploy.sh`
- **Test Suite**: `/app/tests/unit/core.test.ts`, `/app/tests/integration/services.test.ts`, `/app/tests/e2e/dashboard.spec.ts`

---

## 1. Launching in Local Development Mode

### Using Bun ⚡

Bun can be used as a ultra-fast package manager and runtime across all microservices and tools:

1. **Install Dependencies**:
   ```bash
   bun install
   ```

2. **Initialize Database Schema**:
   ```bash
   bun run db:setup
   # Or run directly with Bun runtime:
   bun run tools/db-setup/index.js
   ```

3. **Start Microservices**:
   - API Gateway: `bun run --cwd backend/api start` (Runs at `http://localhost:8080`, Swagger UI at `http://localhost:8080/docs`)
   - Webhook Receiver: `bun run --cwd backend/webhook start` (Runs at `http://localhost:8081`)
   - Status Worker: `bun run --cwd backend/worker start`
   - MCP Server: `bun run --cwd backend/mcp start` (Runs at `http://localhost:8082`)
   - Angular Dashboard: `bun run --cwd frontend start` (Runs at `http://localhost:4200`)

---

### Using Node.js & npm

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database Schema**:
   ```bash
   npm run db:setup
   ```

3. **Start Microservices**:
   - API Gateway: `npm run start:api`
   - Webhook Receiver: `npm run start:webhook`
   - Status Worker: `npm run start:worker`
   - MCP Server: `npm run start:mcp`
   - Angular Dashboard: `npm run start:frontend`

---

## 2. Running with Docker & Docker Compose

### Development Environment Stack
To run PostgreSQL (with `pgvector`), Redis, all backend microservices, and the Angular dashboard:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Endpoints:
- **Angular Dashboard**: `http://localhost:4200`
- **API Gateway & Swagger Docs**: `http://localhost:8080` / `http://localhost:8080/docs`
- **Webhook Receiver**: `http://localhost:8081`
- **MCP AI Server**: `http://localhost:8082`

### Production Docker Compose Stack
```bash
docker compose -f infra/docker-compose.prod.yml up -d --build
```

---

## 3. Deploying to Production on Azure

Execute the automated Azure Bicep IaC script:
```bash
bash infra/azure/deploy.sh rg-payment-proxy centralindia
```

Automates:
- Azure Resource Group (`rg-payment-proxy`)
- Azure Container Registry (ACR)
- Azure Key Vault for secrets management
- Azure PostgreSQL Flexible Server with `pgvector`
- Azure Container Apps Environment

---

## 4. Hosting Angular Frontend on GitHub Pages

1. Build Angular dashboard with repository base href:
   ```bash
   bun run --cwd frontend build -- --base-href="https://<username>.github.io/<repo-name>/"
   # or with npm:
   npm --prefix frontend run build -- --base-href="https://<username>.github.io/<repo-name>/"
   ```

2. Deploy using `angular-cli-ghpages`:
   ```bash
   npx angular-cli-ghpages --dir=frontend/dist/dashboard/browser
   ```

---

## 5. Running the Test Suite

### Unit & Integration Tests with Bun or Vitest
```bash
# With Bun:
bun test

# With npm / Vitest:
npm run test:unit
npm run test:integration
```

### End-to-End Tests with Playwright
```bash
npm run test:e2e
```
