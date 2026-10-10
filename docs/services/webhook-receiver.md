# Webhook Receiver Service Documentation (`backend/webhook`)

The **Webhook Receiver & Forwarder** is a Fastify microservice listening at `/webhooks/:provider/:merchantId`. It verifies incoming payment gateway signatures, logs event payloads to PostgreSQL, and forwards normalized events to merchant endpoints signed with an HMAC SHA-256 signature header (`X-Proxy-Signature`).

---

## Directory & File Paths

- **Root Directory**: `/app/backend/webhook`
- **Package Config**: `/app/backend/webhook/package.json`
- **TypeScript Config**: `/app/backend/webhook/tsconfig.json`
- **Server Entrypoint**: `/app/backend/webhook/src/server.ts`
- **Dockerfile**: `/app/backend/webhook/Dockerfile`

---

## How to Launch in Development Mode

### Using Bun ⚡
```bash
bun run --cwd backend/webhook start
```

### Using Node.js & npm 💚
```bash
npm --prefix backend/webhook run build
npm --prefix backend/webhook start
```

Default Port: `8081`
- **Webhook Endpoint**: `POST http://localhost:8081/webhooks/:provider/:merchantId`
- **Health Check**: `GET http://localhost:8081/health`

---

## How to Test

Send a simulated webhook request:
```bash
curl -X POST http://localhost:8081/webhooks/stripe/mock_merchant_id \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=123,v1=mock_signature" \
  -d '{"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_123"}}}'
```

---

## How to Deploy

### Docker
```bash
docker build -f backend/webhook/Dockerfile -t payment-proxy-webhook .
docker run -p 8081:8081 -e DATABASE_URL="postgres://proxy:proxy@postgres:5432/proxy" payment-proxy-webhook
```

### Docker Compose & Cloud Deployment
Integrated into `/app/infra/docker-compose.yml` and Azure Container Apps.
