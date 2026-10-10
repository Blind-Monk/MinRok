# MCP Server Documentation (`backend/mcp`)

The **Model Context Protocol (MCP) Server** connects AI Agents (Claude Desktop, Cursor, VS Code) to the Payment Proxy Platform, exposing structured AI tools: `create_payment_link`, `check_payment_status`, `get_balance`, and `search_docs`.

---

## Directory & File Paths

- **Root Directory**: `/app/backend/mcp`
- **Package Config**: `/app/backend/mcp/package.json`
- **TypeScript Config**: `/app/backend/mcp/tsconfig.json`
- **Server Entrypoint**: `/app/backend/mcp/src/server.ts`
- **Dockerfile**: `/app/backend/mcp/Dockerfile`

---

## How to Launch in Development Mode

### Using Bun ⚡
```bash
bun run --cwd backend/mcp start
```

### Using Node.js & npm 💚
```bash
npm --prefix backend/mcp run build
npm --prefix backend/mcp start
```

---

## How to Connect to AI Clients (Claude Desktop / Cursor)

Add to `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "payment-proxy": {
      "command": "node",
      "args": ["/app/backend/mcp/dist/server.js"],
      "env": {
        "PROXY_URL": "http://localhost:8080",
        "MERCHANT_API_KEY": "mk_live_your_merchant_key"
      }
    }
  }
}
```

---

## How to Deploy

### Docker
```bash
docker build -f backend/mcp/Dockerfile -t payment-proxy-mcp .
docker run -e PROXY_URL="http://api:8080" -e MERCHANT_API_KEY="mk_live_xxx" payment-proxy-mcp
```
