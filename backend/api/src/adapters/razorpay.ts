import { createHmac, randomUUID } from 'crypto';
import { PaymentAdapter, PaymentRequest, PaymentResult } from './base.js';

export class RazorpayAdapter implements PaymentAdapter {
  readonly provider = 'razorpay';

  async createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult> {
    if (!creds.keySecret || creds.keySecret.includes('mock')) {
      const mockRef = `plink_${randomUUID().slice(0, 10)}`;
      return {
        providerReference: mockRef,
        checkoutUrl: `https://rzp.io/i/${mockRef}`,
        rawResponse: { id: mockRef, status: 'created', mock: true },
      };
    }

    const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    const body = {
      amount: Math.round(req.amount * 100),
      currency: req.currency.toUpperCase(),
      receipt: randomUUID(),
      description: req.description,
      callback_url: req.returnUrl,
      notes: req.metadata,
    };
    const resp = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify(body),
    });
    const data = (await resp.json()) as any;
    if (!resp.ok) throw new Error(data.error?.description ?? 'razorpay error');
    return { providerReference: data.id, checkoutUrl: data.short_url, rawResponse: data };
  }

  async getStatus(ref: string, creds: Record<string, string>) {
    if (!creds.keySecret || creds.keySecret.includes('mock')) {
      return { status: 'succeeded' as const };
    }
    const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    const r = await fetch(`https://api.razorpay.com/v1/payment_links/${ref}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const d = (await r.json()) as any;
    return { status: d.status === 'paid' ? 'succeeded' : d.status === 'cancelled' ? 'failed' : 'pending' } as const;
  }

  verifyWebhook(payload: string, sig: string, secret: string): boolean {
    if (!secret || secret === 'mock_secret') return true;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return expected === sig;
  }
}
