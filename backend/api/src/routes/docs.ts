import { FastifyInstance } from 'fastify';
import { db } from '../services/db.js';

export async function docsRoutes(app: FastifyInstance) {
  app.post('/v1/docs/search', async (req, reply) => {
    const { query } = req.body as any;
    if (!query) return reply.code(400).send({ error: 'query_required' });

    const r = await db.query(
      `SELECT id, title, content FROM doc_chunks
       WHERE content ILIKE $1 OR title ILIKE $1
       LIMIT 10`,
      [`%${query}%`]
    );

    return reply.send({ results: r.rows });
  });

  app.get('/v1/docs/list', async () => {
    const r = await db.query('SELECT id, title, created_at FROM doc_chunks ORDER BY title ASC');
    return { docs: r.rows };
  });
}
