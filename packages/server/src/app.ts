import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { SentinelGuard } from './middlewares/sentinelGuard.js';
import { registerCollaborationRoutes } from './modules/collaboration/yjsBroker.js';
import { registerConverterRoutes } from './modules/converter/converterService.js';
import { registerAuthRoutes } from './modules/auth/googleAuthRoute.js';
import { registerSentinelRoutes } from './modules/sentinel/sentinelRoute.js';
import { checkDbHealth } from './db/client.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: env.NODE_ENV === 'development',
    trustProxy: true,
  });

  // 1. Security Headers & CORS
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // 2. WebSocket Plugin
  await fastify.register(websocket, {
    options: { maxPayload: 10 * 1024 * 1024 }, // 10MB
  });

  // 3. AMEVA Sentinel Global PreHandler Hook
  fastify.addHook('preHandler', SentinelGuard.hook);

  // 4. Health Check / Keep-Alive Endpoint (Render & UptimeRobot)
  fastify.get('/healthz', async () => {
    const db = await checkDbHealth();
    return {
      status: 'OK',
      uptimeSec: Math.floor(process.uptime()),
      database: db.status,
      timestamp: new Date().toISOString(),
    };
  });

  // 5. Module Routes
  await fastify.register(registerCollaborationRoutes);
  await fastify.register(registerConverterRoutes);
  await fastify.register(registerAuthRoutes);
  await fastify.register(registerSentinelRoutes);

  return fastify;
}
