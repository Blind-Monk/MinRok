# Status Polling Cron & RAG Ingestion Worker Documentation (`backend/worker`)

The **Background Worker** microservice executes cron jobs to poll payment provider statuses for pending charges older than 30 seconds and ingests repository markdown documentation files into PostgreSQL `doc_chunks` table for vector search.

---

## Directory & File Paths

- **Root Directory**: `/app/backend/worker`
- **Package Config**: `/app/backend/worker/package.json`
- **TypeScript Config**: `/app/backend/worker/tsconfig.json`
- **Worker Script Entrypoint**: `/app/backend/worker/src/index.ts`
- **Dockerfile**: `/app/backend/worker/Dockerfile`

---

## How to Launch in Development Mode

### Using Bun ⚡
```bash
bun run --cwd backend/worker start
```

### Using Node.js & npm 💚
```bash
npm --prefix backend/worker run build
npm --prefix backend/worker start
```

---

## How to Test

Run the worker in a terminal and observe console output:
```
[worker] Payment Proxy Worker started.
[worker] Starting RAG documentation ingestion...
[worker] Ingested 7 documentation files into doc_chunks.
[worker] Polling status for pending payments...
```

---

## How to Deploy

### Docker
```bash
docker build -f backend/worker/Dockerfile -t payment-proxy-worker .
docker run -e DATABASE_URL="postgres://proxy:proxy@postgres:5432/proxy" payment-proxy-worker
```
