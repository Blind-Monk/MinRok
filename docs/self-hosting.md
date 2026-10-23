# Self-Hosting Guide (Docker, Bun & Node.js)

## Quick Self-Host with Docker Compose (5 minutes)

```bash
git clone <repo-url>
cd payment-proxy
cp config.example.json config.json
docker compose -f infra/docker-compose.yml up --build
```

Endpoints:
- **Angular Dashboard**: `http://localhost:4200`
- **API Gateway & Fastify Swagger UI**: `http://localhost:8080` / `http://localhost:8080/docs`
- **Webhook Microservice**: `http://localhost:8081`
- **MCP Server**: `http://localhost:8082`

## Self-Host with Bun ⚡

```bash
bun install
bun run tools/db-setup/index.js
bun run --cwd backend/api start
```

## Production Azure / Kubernetes

For Azure Container Apps and PostgreSQL Flexible Server deployment, see `infra/azure/main.bicep` and run `bash infra/azure/deploy.sh`.
