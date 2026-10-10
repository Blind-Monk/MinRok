import { describe, it, expect } from 'vitest';
import { encryptCredentials, decryptCredentials, generateApiKey, hashApiKey } from '../../backend/api/src/services/crypto.js';
import { computeCost } from '../../backend/api/src/services/billing.js';
import { StripeAdapter } from '../../backend/api/src/adapters/stripe.js';
import { RazorpayAdapter } from '../../backend/api/src/adapters/razorpay.js';
import { BinancePayAdapter } from '../../backend/api/src/adapters/binance.js';

describe('Crypto Service', () => {
  it('should encrypt and decrypt credentials with AES-256-GCM', () => {
    const creds = { secretKey: 'sk_test_12345', webhookSecret: 'whsec_abc' };
    const encrypted = encryptCredentials(creds);
    expect(Buffer.isBuffer(encrypted)).toBe(true);

    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toEqual(creds);
  });

  it('should generate valid API key with mk_live_ prefix', () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key.startsWith('mk_live_')).toBe(true);
    expect(prefix).toBe(key.slice(0, 16));
    expect(hash).toBe(hashApiKey(key));
  });
});

describe('Billing Math', () => {
  it('should compute cost in microcents correctly', () => {
    const cost = computeCost(1000, 10, 500);
    expect(cost).toBeGreaterThan(500);
  });
});

describe('Adapters Unit Tests', () => {
  it('StripeAdapter createPayment mock mode', async () => {
    const adapter = new StripeAdapter();
    const res = await adapter.createPayment(
      { amount: 50, currency: 'USD', description: 'Test', returnUrl: 'http://localhost' },
      { secretKey: 'sk_test_mock' }
    );
    expect(res.providerReference).toBeDefined();
    expect(res.checkoutUrl).toContain('stripe.com');
  });

  it('RazorpayAdapter createPayment mock mode', async () => {
    const adapter = new RazorpayAdapter();
    const res = await adapter.createPayment(
      { amount: 100, currency: 'INR', description: 'Test INR', returnUrl: 'http://localhost' },
      { keySecret: 'mock_secret' }
    );
    expect(res.providerReference).toBeDefined();
    expect(res.checkoutUrl).toContain('rzp.io');
  });

  it('BinancePayAdapter createPayment mock mode', async () => {
    const adapter = new BinancePayAdapter();
    const res = await adapter.createPayment(
      { amount: 20, currency: 'USDT', description: 'Crypto Test', returnUrl: 'http://localhost' },
      { secretKey: 'mock_secret' }
    );
    expect(res.providerReference).toBeDefined();
    expect(res.checkoutUrl).toContain('binance.com');
  });
});
