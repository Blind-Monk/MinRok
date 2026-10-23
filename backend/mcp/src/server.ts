#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

function loadConfig() {
  const possiblePaths = [
    process.env.CONFIG_PATH,
    path.resolve(process.cwd(), '../../config.json'),
    path.resolve(process.cwd(), '../config.json'),
    path.resolve(process.cwd(), './config.json'),
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    }
  }
  return {};
}

const config = loadConfig();
const PROXY_URL = process.env.PROXY_URL || `http://localhost:${config.services?.apiGateway?.port || 8080}`;
const API_KEY = process.env.MERCHANT_API_KEY || 'mk_live_dev_placeholder';

const server = new Server(
  { name: 'payment-proxy', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_payment_link',
      description: 'Create a payment checkout URL. Returns a URL to redirect the customer.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount to charge' },
          currency: { type: 'string', description: 'ISO-4217 code, e.g. USD, INR' },
          description: { type: 'string', description: 'Description of item/service' },
          returnUrl: { type: 'string', description: 'URL the customer returns to after payment' },
          provider: { type: 'string', enum: ['stripe','paypal','razorpay','binance_pay','coinbase_commerce','moonpay'] },
        },
        required: ['amount', 'currency', 'description', 'returnUrl'],
      },
    },
    {
      name: 'check_payment_status',
      description: 'Get current status of a previously created payment.',
      inputSchema: {
        type: 'object',
        properties: { requestId: { type: 'string' } },
        required: ['requestId'],
      },
    },
    {
      name: 'get_balance',
      description: 'Check remaining free quota and compute credit balance.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'search_docs',
      description: 'Search payment proxy platform documentation via vector/keyword search.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  const call = async (reqPath: string, init: RequestInit = {}) => {
    const res = await fetch(`${PROXY_URL}${reqPath}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, ...(init.headers ?? {}) },
    });
    return res.json();
  };

  if (name === 'create_payment_link') {
    const data = await call('/v1/charge', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(args),
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
  if (name === 'check_payment_status') {
    const data = await call(`/v1/charge/${(args as any).requestId}`);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
  if (name === 'get_balance') {
    const data = await call('/v1/billing/balance');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
  if (name === 'search_docs') {
    const data = await call('/v1/docs/search', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
