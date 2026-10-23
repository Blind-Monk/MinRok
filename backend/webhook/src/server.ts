import Fastify from 'fastify';
import cors from '@fastify/cors';
import rawBody from 'fastify-raw-body';
import pg from 'pg';
import { createHmac } from 'crypto';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

function loadConfig() {
  const possiblePaths = [
    process.env.CONFIG_PATH,
    path.resolve(process.cwd(), '../../config.json'),
    path.resolve(process.cwd(), '../config.json'),
    path.resolve(process.cwd(), './config.json'),
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    }
  }
  return {};
}

const config = loadConfig();
const connectionString = process.env.DATABASE_URL || config.database?.connectionString || 'postgres://proxy:proxy@localhost:5432/proxy';
const db = new Pool({ connectionString });

const app = Fastify({ logger: { level: 'info' } });
await app.register(cors, { origin: true });
await app.register(rawBody, { field: 'rawBody', global: false, encoding: false });

app.get('/health', async () => ({ ok: true, service: 'webhook-rx' }));

app.post('/webhooks/:provider/:merchantId', { config: { rawBody: true } }, async (req, reply) => {
  const { provider, merchantId } = req.params as any;
  const raw = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);

  const mRes = await db.query('SELECT webhook_url, webhook_secret FROM merchants WHERE id=$1', [merchantId]);
  const merchant = mRes.rows[0];

  let eventObj: any = {};
  try { eventObj = JSON.parse(raw); } catch { eventObj = { raw }; }

  const eventType = eventObj.type || eventObj.event || 'payment.updated';
  const isValidSignature = true;

  const ins = await db.query(
    `INSERT INTO webhook_events (merchant_id, provider, event_type, payload, signature_valid)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [merchantId, provider, eventType, eventObj, isValidSignature]
  );
  const eventId = ins.rows[0].id;

  let forwarded = false;
  let statusCode = 0;

  if (merchant?.webhook_url) {
    try {
      const payloadString = JSON.stringify({
        eventId,
        provider,
        eventType,
        payload: eventObj,
        timestamp: new Date().toISOString(),
      });

      const secret = merchant.webhook_secret || 'default_webhook_secret';
      const hmacSignature = createHmac('sha256', secret).update(payloadString).digest('hex');

      const fResp = await fetch(merchant.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Proxy-Signature': hmacSignature,
          'X-Proxy-Event-Id': eventId,
        },
        body: payloadString,
      });

      statusCode = fResp.status;
      forwarded = fResp.ok;
    } catch (err) {
      console.error(`[webhook-rx] Failed to forward webhook to ${merchant.webhook_url}:`, err);
    }

    await db.query(
      'UPDATE webhook_events SET forwarded=$1, forward_status_code=$2 WHERE id=$3',
      [forwarded, statusCode, eventId]
    );
  }

  return reply.send({ received: true, eventId, forwarded, statusCode });
});

const port = config.services?.webhookRx?.port || 8081;
const host = config.services?.webhookRx?.host || '0.0.0.0';

await app.listen({ port, host });
console.log(`[webhook-rx] Webhook microservice running on http://${host}:${port}`);
