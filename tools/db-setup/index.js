import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

export async function runDatabaseSetup(configPath) {
  const resolvedConfigPath = configPath || path.resolve(process.cwd(), '../../config.json');
  if (!fs.existsSync(resolvedConfigPath)) {
    throw new Error(`Configuration file not found at ${resolvedConfigPath}`);
  }

  const rawConfig = fs.readFileSync(resolvedConfigPath, 'utf8');
  const config = JSON.parse(rawConfig);

  const dbConfig = config.database || {};
  const connectionString = process.env.DATABASE_URL || dbConfig.connectionString || `postgres://${dbConfig.user || 'proxy'}:${dbConfig.password || 'proxy'}@${dbConfig.host || 'localhost'}:${dbConfig.port || 5432}/${dbConfig.database || 'proxy'}`;

  console.log(`[db-setup] Connecting to database...`);
  const pool = new Pool({ connectionString });

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
    await pool.query(sql);
    console.log(`[db-setup] Migration completed successfully.`);

    const localUsers = config.auth?.localSystemAuth?.allowedUsers || ['SYSTEM_LOCAL', 'Administrator', 'jules', 'WIN_LOCAL_USER'];
    console.log(`[db-setup] Seeding allowed local system users:`, localUsers);

    for (const username of localUsers) {
      await pool.query(
        `INSERT INTO allowed_system_users (username, os_type) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`,
        [username, process.platform === 'win32' ? 'windows' : 'posix']
      );
    }

    console.log(`[db-setup] Database setup & initial seeding completed!`);
  } catch (err) {
    console.error(`[db-setup] Database setup failed:`, err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.js')) {
  runDatabaseSetup().catch(() => process.exit(1));
}
