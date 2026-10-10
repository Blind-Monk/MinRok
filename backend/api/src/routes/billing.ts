import { FastifyInstance } from 'fastify';
import { db } from '../services/db.js';
import { addCredits } from '../services/billing.js';
import { authenticateRequest } from '../middleware/auth.js';
import { config } from '../config.js';

export async function billingRoutes(app: FastifyInstance) {
  app.get('/v1/billing/balance', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const m = (req as any).merchant;
    const r = await db.query(
      'SELECT credits_balance, credits_used, daily_requests_count, last_request_date FROM merchants WHERE id=$1',
      [m.id]
    );
    const row = r.rows[0] || {};
    return reply.send({
      balance_microcents: row.credits_balance || 0,
      used_microcents: row.credits_used || 0,
      daily_requests_count: row.daily_requests_count || 0,
      free_tier_daily_limit: 20,
    });
  });

  app.get('/v1/billing/ledger', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const m = (req as any).merchant;
    const r = await db.query(
      'SELECT delta, reason, reference_id, balance_after, created_at FROM credit_ledger WHERE merchant_id=$1 ORDER BY created_at DESC LIMIT 100',
      [m.id]
    );
    return reply.send({ entries: r.rows });
  });

  app.post('/internal/topup', async (req, reply) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== (config.internalSecret || 'dev_internal_secret_key_32chars_long')) {
      return reply.code(403).send({ error: 'forbidden' });
    }
    const { merchantId, amountMicrocents, reference } = req.body as any;
    if (!merchantId || !amountMicrocents) {
      return reply.code(400).send({ error: 'missing_merchant_id_or_amount' });
    }
    const balance = await addCredits(merchantId, amountMicrocents, 'topup', reference);
    return reply.send({ balance });
  });
}
