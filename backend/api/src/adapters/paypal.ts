import { PaymentAdapter, PaymentRequest, PaymentResult } from './base.js';

export class PayPalAdapter implements PaymentAdapter {
  readonly provider = 'paypal';

  private async token(creds: Record<string, string>) {
    const host = creds.mode === 'live' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';
    const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
    const r = await fetch(`https://${host}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    return ((await r.json()) as any).access_token as string;
  }

  async createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult> {
    if (!creds.clientSecret || creds.clientSecret.includes('mock')) {
      const mockRef = `pp_order_${Date.now()}`;
      return {
        providerReference: mockRef,
        checkoutUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${mockRef}`,
        rawResponse: { id: mockRef, status: 'CREATED', mock: true },
      };
    }

    const host = creds.mode === 'live' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';
    const tk = await this.token(creds);
    const r = await fetch(`https://${host}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: req.currency, value: req.amount.toFixed(2) },
          description: req.description,
        }],
        application_context: {
          return_url: req.returnUrl,
          cancel_url: req.returnUrl,
          user_action: 'PAY_NOW',
        },
      }),
    });
    const d = (await r.json()) as any;
    const link = d.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!link) throw new Error('paypal approve link missing');
    return { providerReference: d.id, checkoutUrl: link, rawResponse: d };
  }

  async getStatus(ref: string, creds: Record<string, string>) {
    if (!creds.clientSecret || creds.clientSecret.includes('mock')) {
      return { status: 'succeeded' as const };
    }
    const host = creds.mode === 'live' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';
    const tk = await this.token(creds);
    const r = await fetch(`https://${host}/v2/checkout/orders/${ref}`, {
      headers: { Authorization: `Bearer ${tk}` },
    });
    const d = (await r.json()) as any;
    return { status: d.status === 'COMPLETED' ? 'succeeded' : d.status === 'VOIDED' ? 'failed' : 'pending' } as const;
  }

  verifyWebhook(): boolean { return true; }
}
