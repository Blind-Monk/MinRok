# Angular Dashboard Frontend Documentation (`frontend`)

The **Angular Dashboard** is the web frontend allowing merchants to sign up/login, manage AES-256-GCM encrypted gateway credentials, monitor daily free tier quotas (20 req/day), view credit balance and transaction history, generate API keys, and perform AI RAG documentation search.

---

## Directory & File Paths

- **Root Directory**: `/app/frontend`
- **Package Config**: `/app/frontend/package.json`
- **Angular Config**: `/app/frontend/angular.json`
- **TypeScript Configs**: `/app/frontend/tsconfig.json`, `/app/frontend/tsconfig.app.json`
- **App Root**: `/app/frontend/src/app/`
- **Components Path**: `/app/frontend/src/app/components/` (`auth.component.ts`, `dashboard-overview.component.ts`, `gateways.component.ts`, `docs-search.component.ts`)
- **Services Path**: `/app/frontend/src/app/services/api.service.ts`
- **Routes**: `/app/frontend/src/app/app.routes.ts`
- **Nginx Reverse Proxy Config**: `/app/frontend/nginx.conf`
- **Dockerfile**: `/app/frontend/Dockerfile`

---

## How to Launch in Development Mode

### Using Bun ⚡
```bash
bun run --cwd frontend start
```

### Using Angular CLI / npm 💚
```bash
npm --prefix frontend start
# or:
cd frontend && ng serve --host 0.0.0.0 --port 4200
```

Access the dashboard in your browser at `http://localhost:4200`.

---

## How to Test

### Build Check
```bash
bun run --cwd frontend build
# or:
npm --prefix frontend run build
```

### Playwright E2E UI Tests
```bash
npm run test:e2e
```

---

## How to Deploy

### Nginx Docker Container
```bash
docker build -t payment-proxy-frontend ./frontend
docker run -p 4200:80 payment-proxy-frontend
```

### Hosting on GitHub Pages
```bash
# 1. Build Angular app with repository base href:
bun run --cwd frontend build -- --base-href="https://<username>.github.io/<repo-name>/"

# 2. Deploy to gh-pages branch:
npx angular-cli-ghpages --dir=frontend/dist/dashboard/browser
```
