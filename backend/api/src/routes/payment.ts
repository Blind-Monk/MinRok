import { FastifyInstance } from 'fastify';
import { getAdapter, SUPPORTED_PROVIDERS } from '../adapters/index.js';
import { db } from '../services/db.js';
import { decryptCredentials, encryptCredentials } from '../services/crypto.js';
import { computeCost, deductCredits, checkQuotaAndCredits, incrementDailyQuota } from '../services/billing.js';
import { meterStart, meterEnd } from '../middleware/meter.js';
import { authenticateRequest } from '../middleware/auth.js';

export async function paymentRoutes(app: FastifyInstance) {
  app.get('/v1/providers', async () => ({ providers: SUPPORTED_PROVIDERS }));

  app.post('/v1/gateways', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const { provider, credentials } = req.body as any;

    if (!provider || !credentials || !SUPPORTED_PROVIDERS.includes(provider)) {
      return reply.code(400).send({ error: 'invalid_provider_or_credentials' });
    }

    const encrypted = encryptCredentials(credentials);

    await db.query(
      `INSERT INTO merchant_gateways (merchant_id, provider, credentials_encrypted)
       VALUES ($1, $2, $3)
       ON CONFLICT (merchant_id, provider)
       DO UPDATE SET credentials_encrypted = EXCLUDED.credentials_encrypted, is_active = TRUE`,
      [merchant.id, provider, encrypted]
    );

    return reply.send({ success: true, provider });
  });

  app.get('/v1/gateways', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const res = await db.query(
      'SELECT id, provider, is_active, created_at FROM merchant_gateways WHERE merchant_id=$1',
      [merchant.id]
    );
    return reply.send({ gateways: res.rows });
  });

  app.post('/v1/routing-rules', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const { currency, provider, priority } = req.body as any;

    if (!currency || !provider || !SUPPORTED_PROVIDERS.includes(provider)) {
      return reply.code(400).send({ error: 'invalid_routing_rule_params' });
    }

    const ins = await db.query(
      `INSERT INTO routing_rules (merchant_id, currency, provider, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [merchant.id, currency.toUpperCase(), provider, priority || 1]
    );

    return reply.send({ rule: ins.rows[0] });
  });

  app.get('/v1/routing-rules', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const res = await db.query(
      'SELECT * FROM routing_rules WHERE merchant_id=$1 ORDER BY priority DESC',
      [merchant.id]
    );
    return reply.send({ rules: res.rows });
  });

  app.post('/v1/charge', { preHandler: [authenticateRequest, meterStart] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const { amount, currency, description, returnUrl, provider: forcedProvider, metadata } = req.body as any;
    const idem = req.headers['idempotency-key'] as string | undefined;

    if (!amount || !currency || !description || !returnUrl) {
      return reply.code(400).send({ error: 'missing_fields' });
    }

    if (idem) {
      const prev = await db.query(
        'SELECT id, provider, provider_reference, provider_response FROM payment_requests WHERE merchant_id=$1 AND idempotency_key=$2',
        [merchant.id, idem]
      );
      if (prev.rows[0]) {
        return reply.send({
          requestId: prev.rows[0].id,
          checkoutUrl: prev.rows[0].provider_response?.checkoutUrl,
          provider: prev.rows[0].provider,
          idempotent: true,
        });
      }
    }

    const { isFree, hasCredits } = await checkQuotaAndCredits(merchant.id, 20);

    if (!hasCredits && !isFree) {
      return reply.code(402).send({
        error: 'insufficient_credits_and_free_quota_exceeded',
        free_tier_daily_limit: 20,
        top_up_url: '/dashboard/billing',
      });
    }

    const gateways = await db.query(
      'SELECT * FROM merchant_gateways WHERE merchant_id=$1 AND is_active=TRUE',
      [merchant.id]
    );
    if (!gateways.rows.length) return reply.code(400).send({ error: 'no_gateways_configured' });

    let selectedProvider = forcedProvider;
    if (!selectedProvider) {
      const rules = await db.query(
        `SELECT provider FROM routing_rules
         WHERE merchant_id=$1 AND (currency=$2 OR currency='*') AND is_active=TRUE
         ORDER BY priority DESC LIMIT 1`,
        [merchant.id, currency.toUpperCase()]
      );
      if (rules.rows[0]) {
        selectedProvider = rules.rows[0].provider;
      } else {
        selectedProvider = gateways.rows[0].provider;
      }
    }

    const gw = gateways.rows.find((g) => g.provider === selectedProvider);
    if (!gw) return reply.code(400).send({ error: `provider_not_configured:${selectedProvider}` });

    const creds = decryptCredentials(gw.credentials_encrypted);
    const adapter = getAdapter(gw.provider);

    try {
      const result = await adapter.createPayment(
        { amount, currency, description, returnUrl, metadata },
        creds
      );

      const meter = meterEnd(req);
      const cost = isFree ? 0 : computeCost(meter.cpuUs, meter.memoryMb, meter.durationUs);

      const ins = await db.query(
        `INSERT INTO payment_requests
         (merchant_id, idempotency_key, provider, amount, currency, status, provider_reference, provider_response, cost_microcents, cpu_us, memory_mb, is_free_tier)
         VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          merchant.id,
          idem,
          gw.provider,
          amount,
          currency,
          result.providerReference,
          JSON.stringify(result),
          cost,
          meter.cpuUs,
          meter.memoryMb,
          isFree,
        ]
      );

      if (isFree) {
        await incrementDailyQuota(merchant.id);
      } else {
        await deductCredits(merchant.id, cost, 'payment_request', ins.rows[0].id);
      }

      return reply.send({
        requestId: ins.rows[0].id,
        providerReference: result.providerReference,
        checkoutUrl: result.checkoutUrl,
        provider: gw.provider,
        cost_microcents: cost,
        is_free_tier: isFree,
      });
    } catch (err: any) {
      req.log.error({ err }, 'adapter_error');
      return reply.code(502).send({ error: 'gateway_error', message: err.message });
    }
  });

  app.get('/v1/charge/:id', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const { id } = req.params as any;
    const r = await db.query(
      'SELECT * FROM payment_requests WHERE id=$1 AND merchant_id=$2',
      [id, merchant.id]
    );
    if (!r.rows[0]) return reply.code(404).send({ error: 'not_found' });
    return reply.send(r.rows[0]);
  });

  app.get('/v1/charges', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const r = await db.query(
      'SELECT * FROM payment_requests WHERE merchant_id=$1 ORDER BY created_at DESC LIMIT 100',
      [merchant.id]
    );
    return reply.send({ charges: r.rows });
  });
}
