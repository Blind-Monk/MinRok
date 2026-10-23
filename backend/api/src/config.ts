import fs from 'fs';
import path from 'path';

function loadConfig() {
  const possiblePaths = [
    process.env.CONFIG_PATH,
    path.resolve(process.cwd(), '../../config.json'),
    path.resolve(process.cwd(), '../config.json'),
    path.resolve(process.cwd(), './config.json'),
  ];

  let rawConfig: any = {};

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        rawConfig = JSON.parse(raw);
        break;
      } catch (err) {
        console.warn(`[config] Failed to parse config at ${p}:`, err);
      }
    }
  }

  const defaultAuth = {
    activeProvider: 'form',
    form: { enabled: true, allowSignup: true },
    windows: { enabled: true, allowedUsers: ['SYSTEM_LOCAL', 'Administrator', 'jules', 'WIN_LOCAL_USER'] },
    azure: { enabled: true, tenantId: '', clientId: '', clientSecret: '' },
    amazon: { enabled: true, clientId: '', clientSecret: '' },
    auth0: { enabled: true, domain: '', clientId: '', clientSecret: '' },
    google: { enabled: true, clientId: '', clientSecret: '' },
    microsoft: { enabled: true, clientId: '', clientSecret: '' },
    github: { enabled: true, clientId: '', clientSecret: '' },
    apple: { enabled: true, clientId: '', clientSecret: '' },
    apiKeyAuth: { freeTierDailyLimit: 20 },
  };

  return {
    env: rawConfig.env || process.env.NODE_ENV || 'development',
    masterKey: rawConfig.masterKey || process.env.MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    jwtSecret: rawConfig.jwtSecret || process.env.JWT_SECRET || 'dev_jwt_secret_change_me_please_32chars_long_minimum',
    internalSecret: rawConfig.internalSecret || process.env.INTERNAL_SECRET || 'dev_internal_secret_key_32chars_long',
    database: rawConfig.database || {
      connectionString: process.env.DATABASE_URL || 'postgres://proxy:proxy@localhost:5432/proxy',
    },
    redis: rawConfig.redis || {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    auth: {
      ...defaultAuth,
      ...(rawConfig.auth || {}),
    },
    services: rawConfig.services || {
      apiGateway: { port: 8080, host: '0.0.0.0' },
    },
  };
}

export const config = loadConfig();
