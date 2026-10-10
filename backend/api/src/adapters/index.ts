import { PaymentAdapter } from './base.js';
import { StripeAdapter } from './stripe.js';
import { PayPalAdapter } from './paypal.js';
import { RazorpayAdapter } from './razorpay.js';
import { BinancePayAdapter } from './binance.js';
import { CoinbaseCommerceAdapter } from './coinbase.js';
import { MoonPayAdapter } from './moonpay.js';

const registry: Record<string, PaymentAdapter> = {
  stripe: new StripeAdapter(),
  paypal: new PayPalAdapter(),
  razorpay: new RazorpayAdapter(),
  binance_pay: new BinancePayAdapter(),
  coinbase_commerce: new CoinbaseCommerceAdapter(),
  moonpay: new MoonPayAdapter(),
};

export function getAdapter(provider: string): PaymentAdapter {
  const a = registry[provider];
  if (!a) throw new Error(`Unknown provider: ${provider}`);
  return a;
}

export const SUPPORTED_PROVIDERS = Object.keys(registry);
