import { createHmac } from 'crypto';
import { PaymentAdapter, PaymentRequest, PaymentResult } from './base.js';

export class MoonPayAdapter implements PaymentAdapter {
  readonly provider = 'moonpay';

  async createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult> {
    const params = new URLSearchParams({
      apiKey: creds.publishableKey || 'pk_test_mock',
      currencyCode: req.metadata?.cryptoCurrency ?? 'eth',
      baseCurrencyAmount: req.amount.toString(),
      baseCurrencyCode: req.currency.toLowerCase(),
      redirectURL: req.returnUrl,
      externalTransactionId: req.metadata?.orderId ?? '',
    });
    const sig = createHmac('sha256', creds.secretKey || 'mock_secret').update(`?${params}`).digest('base64');
    params.append('signature', sig);
    return {
      providerReference: `moonpay_${Date.now()}`,
      checkoutUrl: `https://buy.moonpay.com?${params}`,
      rawResponse: { params: params.toString() },
    };
  }

  async getStatus() { return { status: 'pending' as const }; }
  verifyWebhook(): boolean { return true; }
}
