import fs from 'fs';
import path from 'path';

function loadConfig() {
  const possiblePaths = [
    process.env.CONFIG_PATH,
    path.resolve(process.cwd(), '../../config.json'),
    path.resolve(process.cwd(), '../config.json'),
    path.resolve(process.cwd(), './config.json'),
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`[config] Failed to parse config at ${p}:`, err);
      }
    }
  }

  return {
    env: process.env.NODE_ENV || 'development',
    masterKey: process.env.MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me_please_32chars_long_minimum',
    internalSecret: process.env.INTERNAL_SECRET || 'dev_internal_secret_key_32chars_long',
    database: {
      connectionString: process.env.DATABASE_URL || 'postgres://proxy:proxy@localhost:5432/proxy',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    auth: {
      localSystemAuth: { enabled: true, allowedUsers: ['SYSTEM_LOCAL', 'Administrator', 'jules', 'WIN_LOCAL_USER'] },
      awsAuth: { enabled: true, region: 'us-east-1', userPoolId: 'us-east-1_UserPoolId', clientId: 'AwsClientId' },
      apiKeyAuth: { freeTierDailyLimit: 20 },
    },
    services: {
      apiGateway: { port: 8080, host: '0.0.0.0' },
    },
  };
}

export const config = loadConfig();
