import fs from 'fs';
import path from 'path';
import fileUrl from 'url';
import pg from 'pg';

const { Pool } = pg;

export async function runDatabaseSetup(configPath) {
  const possibleConfigPaths = [
    configPath,
    process.env.WISE_WORDS_CONFIG,
    path.resolve(process.cwd(), 'config.json'),
    path.resolve(process.cwd(), '../../config.json'),
    path.resolve(process.cwd(), '../config.json'),
  ].filter(Boolean);

  let resolvedConfigPath = possibleConfigPaths.find((p) => fs.existsSync(p));

  if (!resolvedConfigPath) {
    const defaultFallback = path.resolve(process.cwd(), 'config.json');
    throw new Error(`Configuration file not found. Tried paths: ${possibleConfigPaths.join(', ')}`);
  }

  const rawConfig = fs.readFileSync(resolvedConfigPath, 'utf8');
  const config = JSON.parse(rawConfig);

  const dbConfig = config.database || {};
  const connectionString = process.env.DATABASE_URL || dbConfig.connectionString || `postgres://${dbConfig.user || 'proxy'}:${dbConfig.password || 'proxy'}@${dbConfig.host || 'localhost'}:${dbConfig.port || 5432}/${dbConfig.database || 'proxy'}`;

  console.log(`[db-setup] Connecting to database at ${connectionString.replace(/:[^:@]+@/, ':****@')}...`);
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  let client;
  try {
    client = await pool.connect();
    console.log(`[db-setup] Successfully connected to PostgreSQL server.`);
  } catch (connErr) {
    const errorMsg = `[db-setup] FATAL: Unable to connect to PostgreSQL server at ${connectionString.replace(/:[^:@]+@/, ':****@')}.

Error details: ${connErr.message} (${connErr.code || 'NO_CONN'})

Please ensure:
1. PostgreSQL is installed and running on your system.
2. The database credentials and connection parameters in config.json or DATABASE_URL are correct.
3. For local docker setup, run: docker compose -f infra/docker-compose.yml up -d postgres`;

    console.error(errorMsg);
    await pool.end().catch(() => {});
    throw new Error(errorMsg);
  }

  try {
    const migrationPath = path.resolve(process.cwd(), '../../infra/db/migrations/001_init.sql');
    let sql;
    if (fs.existsSync(migrationPath)) {
      sql = fs.readFileSync(migrationPath, 'utf8');
    } else {
      const fallbackPath = path.resolve(process.cwd(), 'infra/db/migrations/001_init.sql');
      sql = fs.readFileSync(fallbackPath, 'utf8');
    }

    console.log(`[db-setup] Executing schema migrations...`);
    await client.query(sql);
    console.log(`[db-setup] Migration completed successfully.`);

    const localUsers = config.auth?.localSystemAuth?.allowedUsers || ['SYSTEM_LOCAL', 'Administrator', 'jules', 'WIN_LOCAL_USER'];
    console.log(`[db-setup] Seeding allowed local system users:`, localUsers);

    for (const username of localUsers) {
      await client.query(
        `INSERT INTO allowed_system_users (username, os_type) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`,
        [username, process.platform === 'win32' ? 'windows' : 'posix']
      );
    }

    console.log(`[db-setup] Database setup & initial seeding completed!`);
  } catch (err) {
    console.error(`[db-setup] Database setup failed during execution:`, err.message);
    throw err;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.js')) {
  runDatabaseSetup().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
