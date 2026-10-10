# API Gateway Service Documentation (`backend/api`)

The **API Gateway** is the core Fastify-based microservice that handles merchant authentication, payment link creation, gateway auto-routing rules, CPU/memory metering, credit deductions, and interactive Fastify Swagger OpenAPI documentation.

---

## Directory & File Paths

- **Root Directory**: `/app/backend/api`
- **Package Config**: `/app/backend/api/package.json`
- **TypeScript Config**: `/app/backend/api/tsconfig.json`
- **Server Entrypoint**: `/app/backend/api/src/server.ts`
- **Configuration Module**: `/app/backend/api/src/config.ts` (Reads `/app/config.json`)
- **Adapters Directory**: `/app/backend/api/src/adapters/` (`base.ts`, `stripe.ts`, `paypal.ts`, `razorpay.ts`, `binance.ts`, `coinbase.ts`, `moonpay.ts`, `index.ts`)
- **Routes Directory**: `/app/backend/api/src/routes/` (`auth.ts`, `payment.ts`, `billing.ts`, `docs.ts`)
- **Middleware Directory**: `/app/backend/api/src/middleware/` (`auth.ts`, `meter.ts`)
- **Services Directory**: `/app/backend/api/src/services/` (`crypto.ts`, `billing.ts`, `db.ts`)
- **Dockerfile**: `/app/backend/api/Dockerfile`

---

## How to Launch in Development Mode

### Using Bun ⚡
```bash
# Install workspace dependencies from repo root or service directory
bun install

# Run the API Gateway service (Default port: 8080)
bun run --cwd backend/api start
```

### Using Node.js & npm 💚
```bash
npm --prefix backend/api run build
npm --prefix backend/api start
```

Once running:
- **API Base URL**: `http://localhost:8080`
- **Interactive Swagger UI**: `http://localhost:8080/docs`
- **Health Check**: `http://localhost:8080/health`

---

## How to Test

```bash
# Run unit tests covering AES-256-GCM crypto, API key hashing, billing math, and adapters:
bun test tests/unit/core.test.ts
# or with npm:
npm run test:unit
```

---

## How to Deploy

### Local Docker & Docker Compose
```bash
docker build -f backend/api/Dockerfile -t payment-proxy-api .
docker run -p 8080:8080 --env-file .env payment-proxy-api
```

### Production Deployment (Azure Container Apps)
Deployed as part of the main Azure deployment script:
```bash
bash infra/azure/deploy.sh rg-payment-proxy centralindia
```
In Azure Container Apps, it scales from 1 to 10 replicas with 0.5 vCPU and 1.0 GiB RAM allocation.
