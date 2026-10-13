import { describe, it, expect } from 'vitest';
import { config } from '../../backend/api/src/config.js';

describe('SaaS Auth Configuration & Active Provider', () => {
  it('should load auth config with activeProvider defaulting or specified', () => {
    expect(config.auth).toBeDefined();
    expect(config.auth.activeProvider).toBeDefined();
    expect(typeof config.auth.activeProvider).toBe('string');
  });

  it('should have configuration blocks for supported auth providers', () => {
    expect(config.auth.form).toBeDefined();
    expect(config.auth.windows).toBeDefined();
    expect(config.auth.azure).toBeDefined();
    expect(config.auth.amazon).toBeDefined();
    expect(config.auth.auth0).toBeDefined();
    expect(config.auth.google).toBeDefined();
    expect(config.auth.microsoft).toBeDefined();
    expect(config.auth.github).toBeDefined();
    expect(config.auth.apple).toBeDefined();
  });
});
