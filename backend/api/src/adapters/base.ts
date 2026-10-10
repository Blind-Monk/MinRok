export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  providerReference: string;
  checkoutUrl: string;
  rawResponse: unknown;
}

export interface PaymentAdapter {
  readonly provider: string;
  createPayment(req: PaymentRequest, creds: Record<string, string>): Promise<PaymentResult>;
  getStatus(ref: string, creds: Record<string, string>): Promise<{ status: 'pending' | 'succeeded' | 'failed' }>;
  verifyWebhook(payload: string, sig: string, secret: string): boolean;
}
