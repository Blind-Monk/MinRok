# Getting Started Guide

Follow this guide to set up initial configuration files, export environment variables, install dependencies with Bun (`bun i`) or npm, and launch the Payment Proxy Platform microservices sequentially.

---

## Initial Configuration & Environment Setup

All setup and configuration commands must be executed from the **Repository Root Directory** (`/app` or root of cloned repo):

```bash
# 1. Navigate to repository root directory
cd /app

# 2. Copy config.example.json to config.json
cp config.example.json config.json

# 3. Export environment variables
export WISE_WORDS_CONFIG="$(pwd)/config.json"
export GROQ_API_KEY="your-groq-key"
export GOOGLE_AI_STUDIO_API_KEY="your-google-key"
```

---

## Sequential Service Launch & Installation

Run these commands sequentially from the **Repository Root Directory** (`/app`):

1. **Database Setup Tool (`tools/db-setup`)**:
   ```bash
   bun i --cwd tools/db-setup
   bun run tools/db-setup/index.js
   # or with npm:
   npm --prefix tools/db-setup install
   npm run db:setup
   ```

2. **API Gateway (`backend/api`)** - Port `8080`:
   ```bash
   bun i --cwd backend/api
   bun run --cwd backend/api start
   # or with npm:
   npm --prefix backend/api install
   npm run start:api
   ```

3. **Webhook Receiver (`backend/webhook`)** - Port `8081`:
   ```bash
   bun i --cwd backend/webhook
   bun run --cwd backend/webhook start
   # or with npm:
   npm --prefix backend/webhook install
   npm run start:webhook
   ```

4. **Status & RAG Worker (`backend/worker`)**:
   ```bash
   bun i --cwd backend/worker
   bun run --cwd backend/worker start
   # or with npm:
   npm --prefix backend/worker install
   npm run start:worker
   ```

5. **MCP AI Server (`backend/mcp`)** - Port `8082`:
   ```bash
   bun i --cwd backend/mcp
   bun run --cwd backend/mcp start
   # or with npm:
   npm --prefix backend/mcp install
   npm run start:mcp
   ```

6. **Angular Dashboard (`frontend`)** - Port `4200`:
   ```bash
   bun i --cwd frontend
   bun run --cwd frontend start
   # or with npm:
   npm --prefix frontend install
   npm run start:frontend
   ```
