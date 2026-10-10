import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { config } from '../config.js';

const KEY = Buffer.from(config.masterKey || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');

export function encryptCredentials(plain: Record<string, string>): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]);
}

export function decryptCredentials(blob: Buffer): Record<string, string> {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const data = blob.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(plain);
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = 'mk_live_' + randomBytes(24).toString('base64url');
  return { key, prefix: key.slice(0, 16), hash: hashApiKey(key) };
}
