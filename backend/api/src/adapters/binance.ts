import { createHmac, randomUUID } from 'crypto';
import { PaymentAdapter, PaymentRequest, PaymentResult } from './base.js';

export class BinancePayAdapter implements PaymentAdapter {
  readonly provider = 'binance_pay';
  private readonly base = 'https://bpay.binanceapi.com';

  async createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult> {
    if (!creds.secretKey || creds.secretKey.includes('mock')) {
      const mockRef = `bpay_${randomUUID().slice(0, 10)}`;
      return {
        providerReference: mockRef,
        checkoutUrl: `https://pay.binance.com/checkout/${mockRef}`,
        rawResponse: { prepayId: mockRef, mock: true },
      };
    }

    const nonce = randomUUID().replace(/-/g, '').slice(0, 32);
    const timestamp = Date.now().toString();
    const body = JSON.stringify({
      env: { terminalType: 'WEB' },
      merchantTradeNo: `ord_${Date.now()}_${randomUUID().slice(0, 8)}`,
      orderAmount: req.amount,
      currency: req.currency,
      description: req.description,
      goods: {
        goodsType: '01',
        goodsCategory: 'Z000',
        referenceGoodsId: '1',
        goodsName: req.description.slice(0, 100),
      },
      returnUrl: req.returnUrl,
    });
    const payload = `${timestamp}\n${nonce}\n${body}\n`;
    const signature = createHmac('sha512', creds.secretKey).update(payload).digest('hex').toUpperCase();

    const resp = await fetch(`${this.base}/binancepay/openapi/v3/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': creds.apiKey,
        'BinancePay-Signature': signature,
      },
      body,
    });
    const data = (await resp.json()) as any;
    if (data.status !== 'SUCCESS') throw new Error(data.errorMessage ?? 'binance error');
    return {
      providerReference: data.data.prepayId,
      checkoutUrl: data.data.checkoutUrl,
      rawResponse: data,
    };
  }

  async getStatus(ref: string, creds: Record<string, string>) {
    if (!creds.secretKey || creds.secretKey.includes('mock')) {
      return { status: 'succeeded' as const };
    }
    const nonce = randomUUID().replace(/-/g, '').slice(0, 32);
    const timestamp = Date.now().toString();
    const body = JSON.stringify({ prepayId: ref });
    const payload = `${timestamp}\n${nonce}\n${body}\n`;
    const signature = createHmac('sha512', creds.secretKey).update(payload).digest('hex').toUpperCase();
    const resp = await fetch(`${this.base}/binancepay/openapi/v2/order/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': creds.apiKey,
        'BinancePay-Signature': signature,
      },
      body,
    });
    const d = (await resp.json()) as any;
    const st = d?.data?.status;
    return { status: st === 'PAID' ? 'succeeded' : st === 'CANCELED' ? 'failed' : 'pending' } as const;
  }

  verifyWebhook(payload: string, sig: string, secret: string): boolean {
    if (!secret || secret === 'mock_secret') return true;
    const expected = createHmac('sha512', secret).update(payload).digest('hex').toUpperCase();
    return expected === sig;
  }
}
