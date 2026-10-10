import Stripe from 'stripe';
import { PaymentAdapter, PaymentRequest, PaymentResult } from './base.js';

export class StripeAdapter implements PaymentAdapter {
  readonly provider = 'stripe';

  async createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult> {
    if (!creds.secretKey || creds.secretKey.includes('mock')) {
      const mockRef = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        providerReference: mockRef,
        checkoutUrl: `https://checkout.stripe.com/pay/${mockRef}`,
        rawResponse: { id: mockRef, object: 'checkout.session', mock: true },
      };
    }

    const stripe = new Stripe(creds.secretKey, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: req.currency.toLowerCase(),
          product_data: { name: req.description },
          unit_amount: Math.round(req.amount * 100),
        },
        quantity: 1,
      }],
      success_url: `${req.returnUrl}?status=success&ref={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.returnUrl}?status=cancel`,
      metadata: req.metadata,
    });
    return { providerReference: session.id, checkoutUrl: session.url!, rawResponse: session };
  }

  async getStatus(ref: string, creds: Record<string, string>) {
    if (!creds.secretKey || creds.secretKey.includes('mock')) {
      return { status: 'succeeded' as const };
    }
    const stripe = new Stripe(creds.secretKey);
    const s = await stripe.checkout.sessions.retrieve(ref);
    const map = { paid: 'succeeded', unpaid: 'pending', no_payment_required: 'succeeded' } as const;
    return { status: map[s.payment_status as keyof typeof map] ?? 'pending' };
  }

  verifyWebhook(payload: string, sig: string, secret: string): boolean {
    if (!secret || secret === 'mock_secret') return true;
    try {
      new Stripe('').webhooks.constructEvent(payload, sig, secret);
      return true;
    } catch {
      return false;
    }
  }
}
