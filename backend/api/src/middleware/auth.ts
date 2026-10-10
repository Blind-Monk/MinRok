import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { hashApiKey } from '../services/crypto.js';
import { config } from '../config.js';

export async function authenticateRequest(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (apiKey) {
    if (!apiKey.startsWith('mk_')) {
      return reply.code(401).send({ error: 'invalid_api_key_format' });
    }
    const prefix = apiKey.slice(0, 16);
    const hash = hashApiKey(apiKey);
    const r = await db.query(
      'SELECT * FROM merchants WHERE api_key_prefix=$1 AND api_key_hash=$2',
      [prefix, hash]
    );
    if (!r.rows[0]) {
      return reply.code(401).send({ error: 'invalid_api_key' });
    }
    (req as any).merchant = r.rows[0];
    (req as any).authType = 'api_key';
    return;
  }

  const authHeader = req.headers['authorization'] as string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret || 'dev_jwt_secret') as any;
      const r = await db.query('SELECT * FROM merchants WHERE id=$1', [decoded.merchantId]);
      if (r.rows[0]) {
        (req as any).merchant = r.rows[0];
        (req as any).authType = 'jwt';
        return;
      }
    } catch {
      // Token invalid or expired
    }
  }

  const winUser = (req.headers['x-windows-user'] || req.headers['x-local-system-user']) as string | undefined;
  if (winUser && config.auth?.localSystemAuth?.enabled) {
    const check = await db.query(
      'SELECT * FROM allowed_system_users WHERE username=$1 AND is_allowed=TRUE',
      [winUser]
    );
    if (check.rows[0]) {
      let m = await db.query('SELECT * FROM merchants WHERE external_id=$1', [winUser]);
      if (!m.rows[0]) {
        m = await db.query(
          `INSERT INTO merchants (email, password_hash, auth_provider, external_id)
           VALUES ($1, $2, 'local_windows', $3)
           RETURNING *`,
          [`${winUser.toLowerCase()}@local.system`, 'N/A', winUser]
        );
      }
      (req as any).merchant = m.rows[0];
      (req as any).authType = 'local_windows';
      return;
    } else {
      return reply.code(403).send({ error: 'unauthorized_windows_system_user' });
    }
  }

  const awsSub = req.headers['x-aws-cognito-sub'] as string | undefined;
  if (awsSub && config.auth?.awsAuth?.enabled) {
    let m = await db.query('SELECT * FROM merchants WHERE external_id=$1', [awsSub]);
    if (!m.rows[0]) {
      const awsEmail = (req.headers['x-aws-email'] as string) || `${awsSub}@aws.user`;
      m = await db.query(
        `INSERT INTO merchants (email, password_hash, auth_provider, external_id)
         VALUES ($1, $2, 'aws_cognito', $3)
         RETURNING *`,
        [awsEmail, 'N/A', awsSub]
      );
    }
    (req as any).merchant = m.rows[0];
    (req as any).authType = 'aws_cognito';
    return;
  }

  return reply.code(401).send({ error: 'authentication_required' });
}
