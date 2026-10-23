# Database Setup Tool Documentation (`tools/db-setup`)

The **Database Setup Tool** automates PostgreSQL initial connection, schema migrations (`/app/infra/db/migrations/001_init.sql`), `pgcrypto` and `pgvector` extension creation, and seeding of allowed local system users from `config.json`.

---

## Directory & File Paths

- **Root Directory**: `/app/tools/db-setup`
- **Package Config**: `/app/tools/db-setup/package.json`
- **Main Tool Script**: `/app/tools/db-setup/index.js`
- **Centralized Configuration**: `/app/config.json`
- **Migration SQL**: `/app/infra/db/migrations/001_init.sql`

---

## How to Launch / Run in Development Mode

### Using Bun ⚡
```bash
bun run tools/db-setup/index.js
```

### Using Node.js & npm 💚
```bash
npm run db:setup
# or directly:
node tools/db-setup/index.js
```

---

## How to Test & Verify

Verify database tables created:
```sql
psql "postgres://proxy:proxy@localhost:5432/proxy" -c "\dt"
```
Output should list: `merchants`, `allowed_system_users`, `merchant_gateways`, `payment_requests`, `credit_ledger`, `webhook_events`, `routing_rules`, `doc_chunks`, `audit_log`.
