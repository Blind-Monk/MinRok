import { db } from './db.js';

const CPU_MICROCENTS_PER_US = Math.round((0.000024 / 1_000_000) * 100_000_000 * 5);
const MEM_MICROCENTS_PER_MB_S = Math.round((0.000003 / 1024) * 100_000_000 * 5);
const FIXED_REQUEST_MICROCENTS = 500;

export function computeCost(cpuUs: number, memMb: number, durationUs: number): number {
  const durationS = durationUs / 1_000_000;
  return (
    cpuUs * CPU_MICROCENTS_PER_US +
    memMb * durationS * MEM_MICROCENTS_PER_MB_S +
    FIXED_REQUEST_MICROCENTS
  );
}

export async function checkQuotaAndCredits(merchantId: string, dailyFreeLimit = 20): Promise<{ isFree: boolean; hasCredits: boolean }> {
  const client = await db.connect();
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const r = await client.query(
      'SELECT credits_balance, daily_requests_count, last_request_date::text FROM merchants WHERE id=$1',
      [merchantId]
    );
    if (!r.rows[0]) return { isFree: false, hasCredits: false };

    const m = r.rows[0];
    let dailyCount = m.daily_requests_count || 0;
    const lastDate = m.last_request_date ? m.last_request_date.slice(0, 10) : '';

    if (lastDate !== todayStr) {
      dailyCount = 0;
      await client.query(
        'UPDATE merchants SET daily_requests_count=0, last_request_date=$1 WHERE id=$2',
        [todayStr, merchantId]
      );
    }

    if (dailyCount < dailyFreeLimit) {
      return { isFree: true, hasCredits: true };
    }

    return {
      isFree: false,
      hasCredits: (m.credits_balance ?? 0) >= 5000,
    };
  } finally {
    client.release();
  }
}

export async function incrementDailyQuota(merchantId: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  await db.query(
    'UPDATE merchants SET daily_requests_count = daily_requests_count + 1, last_request_date = $1 WHERE id=$2',
    [todayStr, merchantId]
  );
}

export async function deductCredits(merchantId: string, amount: number, reason: string, ref?: string) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'UPDATE merchants SET credits_balance = credits_balance - $1, credits_used = credits_used + $1 WHERE id=$2 RETURNING credits_balance',
      [amount, merchantId]
    );
    const balance = r.rows[0].credits_balance;
    await client.query(
      'INSERT INTO credit_ledger (merchant_id, delta, reason, reference_id, balance_after) VALUES ($1,$2,$3,$4,$5)',
      [merchantId, -amount, reason, ref, balance]
    );
    await client.query('COMMIT');
    return balance;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function addCredits(merchantId: string, amount: number, reason: string, ref?: string) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'UPDATE merchants SET credits_balance = credits_balance + $1 WHERE id=$2 RETURNING credits_balance',
      [amount, merchantId]
    );
    await client.query(
      'INSERT INTO credit_ledger (merchant_id, delta, reason, reference_id, balance_after) VALUES ($1,$2,$3,$4,$5)',
      [merchantId, amount, reason, ref, r.rows[0].credits_balance]
    );
    await client.query('COMMIT');
    return r.rows[0].credits_balance;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
