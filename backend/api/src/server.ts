import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import rawBody from 'fastify-raw-body';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { paymentRoutes } from './routes/payment.js';
import { billingRoutes } from './routes/billing.js';
import { docsRoutes } from './routes/docs.js';
import { db } from './services/db.js';

const app = Fastify({ logger: { level: 'info' } });

await app.register(cors, { origin: true });
await app.register(rawBody, { field: 'rawBody', global: false, encoding: false });
await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

await app.register(swagger, {
  openapi: {
    info: {
      title: 'Payment Proxy Platform API',
      description: 'Open-source non-custodial payment orchestration proxy',
      version: '1.0.0',
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

app.get('/health', async () => {
  await db.query('SELECT 1');
  return { ok: true, version: '1.0.0', service: 'api-gateway' };
});

await app.register(authRoutes);
await app.register(paymentRoutes);
await app.register(billingRoutes);
await app.register(docsRoutes);

const port = config.services?.apiGateway?.port || 8080;
const host = config.services?.apiGateway?.host || '0.0.0.0';

await app.listen({ port, host });
console.log(`[api-gateway] Server running on http://${host}:${port}`);
