import { createHmac } from 'crypto';
import { PaymentAdapter, PaymentRequest, PaymentResult } from './base.js';

export class CoinbaseCommerceAdapter implements PaymentAdapter {
  readonly provider = 'coinbase_commerce';

  async createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult> {
    if (!creds.apiKey || creds.apiKey.includes('mock')) {
      const mockRef = `cb_charge_${Date.now()}`;
      return {
        providerReference: mockRef,
        checkoutUrl: `https://commerce.coinbase.com/charges/${mockRef}`,
        rawResponse: { id: mockRef, hosted_url: `https://commerce.coinbase.com/charges/${mockRef}`, mock: true },
      };
    }

    const r = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': creds.apiKey,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify({
        name: req.description,
        description: req.description,
        pricing_type: 'fixed_price',
        local_price: { amount: req.amount.toString(), currency: req.currency },
        redirect_url: req.returnUrl,
        metadata: req.metadata ?? {},
      }),
    });
    const d = (await r.json()) as any;
    if (!r.ok) throw new Error(d.error?.message ?? 'coinbase error');
    return { providerReference: d.data.id, checkoutUrl: d.data.hosted_url, rawResponse: d };
  }

  async getStatus(ref: string, creds: Record<string, string>) {
    if (!creds.apiKey || creds.apiKey.includes('mock')) {
      return { status: 'succeeded' as const };
    }
    const r = await fetch(`https://api.commerce.coinbase.com/charges/${ref}`, {
      headers: { 'X-CC-Api-Key': creds.apiKey, 'X-CC-Version': '2018-03-22' },
    });
    const d = (await r.json()) as any;
    const status = d.data?.timeline?.slice(-1)[0]?.status;
    return { status: status === 'COMPLETED' ? 'succeeded' : status === 'EXPIRED' ? 'failed' : 'pending' } as const;
  }

  verifyWebhook(payload: string, sig: string, secret: string): boolean {
    if (!secret || secret === 'mock_secret') return true;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return expected === sig;
  }
}
