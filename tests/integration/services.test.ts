import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Integration Configuration Test', () => {
  it('should verify config.json exists and contains valid microservices structure', () => {
    const configPath = path.resolve(process.cwd(), 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.services.apiGateway.port).toBe(8080);
    expect(config.services.webhookRx.port).toBe(8081);
    expect(config.services.mcpServer.port).toBe(8082);
    expect(config.auth.apiKeyAuth.freeTierDailyLimit).toBe(20);
  });
});
