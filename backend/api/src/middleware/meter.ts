import { FastifyRequest, FastifyReply } from 'fastify';

export interface MeterContext {
  startCpu: NodeJS.CpuUsage;
  startMem: number;
  startTime: bigint;
}

const contexts = new WeakMap<FastifyRequest, MeterContext>();

export async function meterStart(req: FastifyRequest) {
  contexts.set(req, {
    startCpu: process.cpuUsage(),
    startMem: process.memoryUsage().heapUsed,
    startTime: process.hrtime.bigint(),
  });
}

export function meterEnd(req: FastifyRequest) {
  const ctx = contexts.get(req);
  if (!ctx) return { cpuUs: 0, memoryMb: 0, durationUs: 0 };
  const cpu = process.cpuUsage(ctx.startCpu);
  const durationUs = Number(process.hrtime.bigint() - ctx.startTime) / 1000;
  return {
    cpuUs: cpu.user + cpu.system,
    memoryMb: Math.round((process.memoryUsage().heapUsed - ctx.startMem) / 1_048_576),
    durationUs,
  };
}
