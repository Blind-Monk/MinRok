import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { generateApiKey, hashApiKey } from '../services/crypto.js';
import { authenticateRequest } from '../middleware/auth.js';
import { config } from '../config.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/signup', async (req, reply) => {
    const { email, password } = req.body as any;
    if (!email || !password) {
      return reply.code(400).send({ error: 'missing_fields' });
    }

    const existing = await db.query('SELECT id FROM merchants WHERE email=$1', [email]);
    if (existing.rows[0]) {
      return reply.code(409).send({ error: 'email_already_registered' });
    }

    const passwordHash = hashApiKey(password);
    const apiKeyData = generateApiKey();

    const result = await db.query(
      `INSERT INTO merchants (email, password_hash, api_key_hash, api_key_prefix, credits_balance)
       VALUES ($1, $2, $3, $4, 5000000)
       RETURNING id, email, credits_balance, created_at`,
      [email, passwordHash, apiKeyData.hash, apiKeyData.prefix]
    );

    const merchant = result.rows[0];
    const token = jwt.sign({ merchantId: merchant.id, email: merchant.email }, config.jwtSecret || 'dev_jwt_secret', { expiresIn: '7d' });

    return reply.send({
      merchant,
      apiKey: apiKeyData.key,
      token,
    });
  });

  app.post('/v1/auth/login', async (req, reply) => {
    const { email, password } = req.body as any;
    if (!email || !password) {
      return reply.code(400).send({ error: 'missing_fields' });
    }

    const passwordHash = hashApiKey(password);
    const result = await db.query('SELECT * FROM merchants WHERE email=$1 AND password_hash=$2', [email, passwordHash]);
    if (!result.rows[0]) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const merchant = result.rows[0];
    const token = jwt.sign({ merchantId: merchant.id, email: merchant.email }, config.jwtSecret || 'dev_jwt_secret', { expiresIn: '7d' });

    return reply.send({
      merchant: {
        id: merchant.id,
        email: merchant.email,
        credits_balance: merchant.credits_balance,
        daily_requests_count: merchant.daily_requests_count,
      },
      token,
    });
  });

  app.post('/v1/auth/keys/generate', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    const apiKeyData = generateApiKey();

    await db.query(
      'UPDATE merchants SET api_key_hash=$1, api_key_prefix=$2 WHERE id=$3',
      [apiKeyData.hash, apiKeyData.prefix, merchant.id]
    );

    return reply.send({
      apiKey: apiKeyData.key,
      prefix: apiKeyData.prefix,
    });
  });

  app.get('/v1/auth/me', { preHandler: [authenticateRequest] }, async (req, reply) => {
    const merchant = (req as any).merchant;
    return reply.send({
      merchant: {
        id: merchant.id,
        email: merchant.email,
        credits_balance: merchant.credits_balance,
        credits_used: merchant.credits_used,
        daily_requests_count: merchant.daily_requests_count,
        auth_provider: merchant.auth_provider,
        webhook_url: merchant.webhook_url,
      },
    });
  });
}
