import type { FastifyInstance } from 'fastify';
import { checkDbHealth, getDb } from '../../db/client.js';
import { sentinelAuditLogs } from '../../db/schema.js';
import { count } from 'drizzle-orm';

export async function registerSentinelRoutes(fastify: FastifyInstance) {
  // Sentinel Engine Health & Audit Status
  fastify.get('/api/sentinel/status', async () => {
    const dbHealth = await checkDbHealth();

    let totalAuditEvents = 0;
    try {
      if (dbHealth.status === 'healthy') {
        const db = getDb();
        const [res] = await db.select({ val: count() }).from(sentinelAuditLogs);
        totalAuditEvents = res?.val || 0;
      }
    } catch {
      // In-memory mode
    }

    return {
      sentinel: {
        status: 'OPERATIONAL',
        mode: 'STRICT_ZERO_TRUST',
        protectionModules: [
          'Dynamic Sliding-Window Rate Limiter',
          'Cryptographic Nonce & HMAC Replay Guard',
          'Fastify PreHandler Bot Heuristics',
          'PostgreSQL Tamper-Evident Audit Event Sink'
        ],
        totalAuditEventsRecorded: totalAuditEvents,
      },
      database: dbHealth,
      timestamp: new Date().toISOString(),
    };
  });
}
