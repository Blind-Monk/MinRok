import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { generateApiKey, hashApiKey } from '../services/crypto.js';
import { authenticateRequest } from '../middleware/auth.js';
import { config } from '../config.js';

export async function authRoutes(app: FastifyInstance) {
  // Public route to expose active auth mode & provider metadata
  app.get('/v1/auth/config', async (_req, reply) => {
    const activeProvider = config.auth.activeProvider || 'form';
    return reply.send({
      activeProvider,
      providers: {
        form: { enabled: activeProvider === 'form', allowSignup: config.auth.form?.allowSignup ?? true },
        windows: { enabled: activeProvider === 'windows' },
        azure: { enabled: activeProvider === 'azure', clientId: config.auth.azure?.clientId },
        amazon: { enabled: activeProvider === 'amazon', clientId: config.auth.amazon?.clientId },
        auth0: { enabled: activeProvider === 'auth0', domain: config.auth.auth0?.domain, clientId: config.auth.auth0?.clientId },
        google: { enabled: activeProvider === 'google', clientId: config.auth.google?.clientId },
        microsoft: { enabled: activeProvider === 'microsoft', clientId: config.auth.microsoft?.clientId },
        github: { enabled: activeProvider === 'github', clientId: config.auth.github?.clientId },
        apple: { enabled: activeProvider === 'apple', clientId: config.auth.apple?.clientId },
      },
    });
  });

  // Form-based signup
  app.post('/v1/auth/signup', async (req, reply) => {
    const activeProvider = config.auth.activeProvider || 'form';
    if (activeProvider !== 'form') {
      return reply.code(400).send({ error: `Form authentication is currently disabled. Active provider: ${activeProvider}` });
    }

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
      `INSERT INTO merchants (email, password_hash, api_key_hash, api_key_prefix, credits_balance, auth_provider)
       VALUES ($1, $2, $3, $4, 5000000, 'form')
       RETURNING id, email, credits_balance, created_at, auth_provider`,
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

  // Form-based login
  app.post('/v1/auth/login', async (req, reply) => {
    const activeProvider = config.auth.activeProvider || 'form';
    if (activeProvider !== 'form') {
      return reply.code(400).send({ error: `Form authentication is currently disabled. Active provider: ${activeProvider}` });
    }

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
        auth_provider: merchant.auth_provider,
      },
      token,
    });
  });

  // Windows Local System Auth endpoint
  app.post('/v1/auth/windows', async (req, reply) => {
    const activeProvider = config.auth.activeProvider || 'form';
    if (activeProvider !== 'windows') {
      return reply.code(400).send({ error: `Windows authentication is currently disabled. Active provider: ${activeProvider}` });
    }

    const username = (req.body as any)?.username || req.headers['x-windows-user'] || 'WIN_LOCAL_USER';
    const allowedUsers = config.auth.windows?.allowedUsers || [];

    if (allowedUsers.length > 0 && !allowedUsers.includes(String(username))) {
      return reply.code(403).send({ error: 'windows_user_not_allowed', username });
    }

    const winEmail = `${String(username).toLowerCase()}@windows.local`;

    let merchant;
    const existing = await db.query('SELECT * FROM merchants WHERE email=$1', [winEmail]);
    if (existing.rows[0]) {
      merchant = existing.rows[0];
    } else {
      const apiKeyData = generateApiKey();
      const result = await db.query(
        `INSERT INTO merchants (email, password_hash, api_key_hash, api_key_prefix, credits_balance, auth_provider)
         VALUES ($1, $2, $3, $4, 5000000, 'windows')
         RETURNING id, email, credits_balance, daily_requests_count, auth_provider`,
        [winEmail, 'WINDOWS_SYSTEM_AUTH', apiKeyData.hash, apiKeyData.prefix]
      );
      merchant = result.rows[0];
    }

    const token = jwt.sign({ merchantId: merchant.id, email: merchant.email }, config.jwtSecret || 'dev_jwt_secret', { expiresIn: '7d' });

    return reply.send({
      merchant: {
        id: merchant.id,
        email: merchant.email,
        credits_balance: merchant.credits_balance,
        daily_requests_count: merchant.daily_requests_count,
        auth_provider: merchant.auth_provider,
      },
      token,
    });
  });

  // OAuth / SSO Login endpoint (Azure, Amazon, Auth0, Google, Microsoft, GitHub, Apple)
  app.post('/v1/auth/sso', async (req, reply) => {
    const activeProvider = config.auth.activeProvider || 'form';
    const { provider, email, ssoToken } = req.body as any;

    if (!provider || provider !== activeProvider) {
      return reply.code(400).send({ error: `Provider '${provider}' is not the currently active auth provider ('${activeProvider}').` });
    }

    const allowedProviders = ['azure', 'amazon', 'auth0', 'google', 'microsoft', 'github', 'apple'];
    if (!allowedProviders.includes(provider)) {
      return reply.code(400).send({ error: `Invalid SSO provider '${provider}'` });
    }

    if (!email) {
      return reply.code(400).send({ error: 'missing_email_from_sso_provider' });
    }

    let merchant;
    const existing = await db.query('SELECT * FROM merchants WHERE email=$1', [email]);
    if (existing.rows[0]) {
      merchant = existing.rows[0];
    } else {
      const apiKeyData = generateApiKey();
      const result = await db.query(
        `INSERT INTO merchants (email, password_hash, api_key_hash, api_key_prefix, credits_balance, auth_provider)
         VALUES ($1, $2, $3, $4, 5000000, $5)
         RETURNING id, email, credits_balance, daily_requests_count, auth_provider`,
        [email, `SSO_${provider.toUpperCase()}_AUTH`, apiKeyData.hash, apiKeyData.prefix, provider]
      );
      merchant = result.rows[0];
    }

    const token = jwt.sign({ merchantId: merchant.id, email: merchant.email }, config.jwtSecret || 'dev_jwt_secret', { expiresIn: '7d' });

    return reply.send({
      merchant: {
        id: merchant.id,
        email: merchant.email,
        credits_balance: merchant.credits_balance,
        daily_requests_count: merchant.daily_requests_count,
        auth_provider: merchant.auth_provider,
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
