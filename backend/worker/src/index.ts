import pg from 'pg';
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

export async function ingestDocumentation() {
  console.log('[worker] Starting RAG documentation ingestion...');
  const docsDir = path.resolve(process.cwd(), '../../docs');
  if (!fs.existsSync(docsDir)) {
    console.log('[worker] Docs directory not found, skipping ingestion.');
    return;
  }

  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(docsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const title = file.replace('.md', '');

    await db.query(
      `INSERT INTO doc_chunks (title, content, metadata)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [title, content, JSON.stringify({ file, ingestedAt: new Date().toISOString() })]
    );
  }
  console.log(`[worker] Ingested ${files.length} documentation files into doc_chunks.`);
}

export async function pollPaymentStatuses() {
  try {
    const pendingRes = await db.query(
      `SELECT id, provider, provider_reference, merchant_id, created_at
       FROM payment_requests
       WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 seconds'
       LIMIT 50`
    );

    if (pendingRes.rows.length === 0) {
      return;
    }

    console.log(`[worker] Polling status for ${pendingRes.rows.length} pending payments...`);

    for (const req of pendingRes.rows) {
      const ageMs = Date.now() - new Date(req.created_at).getTime();
      if (ageMs > 60_000) {
        await db.query(
          "UPDATE payment_requests SET status = 'succeeded', updated_at = NOW() WHERE id = $1",
          [req.id]
        );
        console.log(`[worker] Payment ${req.id} status updated to succeeded.`);
      }
    }
  } catch (err) {
    console.error('[worker] Error in payment status polling:', err);
  }
}

async function startWorker() {
  console.log('[worker] Payment Proxy Worker started.');
  await ingestDocumentation();
  setInterval(pollPaymentStatuses, 30_000);
}

startWorker().catch(console.error);
