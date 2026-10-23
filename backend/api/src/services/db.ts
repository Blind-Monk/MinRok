import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  config.database?.connectionString ||
  `postgres://${config.database?.user || 'proxy'}:${config.database?.password || 'proxy'}@${config.database?.host || 'localhost'}:${config.database?.port || 5432}/${config.database?.database || 'proxy'}`;

export const db = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30_000,
});

db.on('error', (err) => console.error('[db] unexpected pool error', err));
