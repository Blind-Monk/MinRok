# Getting Started Guide

Follow this guide to set up the Payment Proxy Platform services sequentially and perform your first merchant transaction.

---

## Service Launch Order

Launch the microservices **one by one** in the following order:

1. **Database Setup Tool (`tools/db-setup`)**:
   ```bash
   bun run tools/db-setup/index.js
   # or with npm:
   npm run db:setup
   ```

2. **API Gateway (`backend/api`)** - Port `8080`:
   ```bash
   bun run --cwd backend/api start
   # or with npm:
   npm run start:api
   ```

3. **Webhook Receiver (`backend/webhook`)** - Port `8081`:
   ```bash
   bun run --cwd backend/webhook start
   # or with npm:
   npm run start:webhook
   ```

4. **Status & RAG Worker (`backend/worker`)**:
   ```bash
   bun run --cwd backend/worker start
   # or with npm:
   npm run start:worker
   ```

5. **MCP AI Server (`backend/mcp`)** - Port `8082`:
   ```bash
   bun run --cwd backend/mcp start
   # or with npm:
   npm run start:mcp
   ```

6. **Angular Dashboard (`frontend`)** - Port `4200`:
   ```bash
   bun run --cwd frontend start
   # or with npm:
   npm run start:frontend
   ```

---

## First Merchant Walkthrough

### 1. Sign Up
Visit `http://localhost:4200/auth` in your browser or make an API call to `POST http://localhost:8080/v1/auth/signup`. New signups automatically receive:
- **Daily Free Quota**: 20 requests per day
- **Prepaid Balance**: 5,000,000 microcents (500 INR credit)

### 2. Generate API Key
In the dashboard **Overview** page, click **Generate New API Key**. Note the API key starting with `mk_live_...` (displayed once).

### 3. Configure Payment Gateway Credentials
In the dashboard **Gateways** page, choose your provider (Stripe, PayPal, Razorpay, Binance Pay, Coinbase Commerce, MoonPay) and enter test credentials. Your keys are immediately encrypted at rest using AES-256-GCM.

### 4. Create Your First Charge Request
Execute a `curl` command using your API key:

```bash
curl -X POST http://localhost:8080/v1/charge \
  -H "X-API-Key: mk_live_YOUR_KEY_HERE" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "currency": "USD",
    "description": "Premium Subscription Plan",
    "returnUrl": "http://localhost:4200/complete"
  }'
```

Response:
```json
{
  "requestId": "e5a312bc-...",
  "providerReference": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "provider": "stripe",
  "cost_microcents": 0,
  "is_free_tier": true
}
```
Redirect your customer to `checkoutUrl` to complete the transaction.
