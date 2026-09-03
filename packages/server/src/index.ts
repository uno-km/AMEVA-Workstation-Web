import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();

  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 AMEVA Workstation Backend Server running at: ${address}`);
    console.log(`🛡️ AMEVA Sentinel Security Middleware: ACTIVE`);
    console.log(`📡 Yjs Real-Time Collaboration Hub: /ws/collaborate/:roomId`);
    console.log(`🏥 Health Check / Keep-Alive: ${address}/healthz`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
