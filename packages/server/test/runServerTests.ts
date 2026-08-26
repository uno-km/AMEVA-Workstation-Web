import { buildApp } from '../src/app.js';
import { SentinelGuard } from '../src/middlewares/sentinelGuard.js';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import crypto from 'crypto';
import { env } from '../src/config/env.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${msg}`);
    failed++;
  }
}

async function run() {
  console.log('===============================================================');
  console.log('🧪 Running AMEVA Workstation Backend Server Test Suite');
  console.log('===============================================================\n');

  // Test Suite 1: Sentinel Security Core
  console.log('📦 [Suite 1: AMEVA Sentinel Security Core]');
  const traceId1 = SentinelGuard.generateTraceId();
  assert(traceId1.startsWith('trc_') && traceId1.length > 15, `Trace ID generated: ${traceId1}`);

  const rateKey = `test_ip_${Date.now()}`;
  const r1 = SentinelGuard.checkRateLimit(rateKey, 2, 5);
  const r2 = SentinelGuard.checkRateLimit(rateKey, 2, 5);
  const r3 = SentinelGuard.checkRateLimit(rateKey, 2, 5);
  assert(r1 === true && r2 === true && r3 === false, 'Sliding-window Rate Limiter throttles on max limit');

  // Test Suite 2: Cryptographic Nonce & Signature
  console.log('\n📦 [Suite 2: Cryptographic Nonce & Replay Defense]');
  const nonce = crypto.randomBytes(8).toString('hex');
  const now = Date.now();
  const validSig = crypto
    .createHmac('sha256', env.SENTINEL_SECRET)
    .update(`${nonce}:${now}`)
    .digest('hex');

  const v1 = SentinelGuard.verifyNonce(nonce, now, validSig);
  assert(v1 === true, 'Valid Nonce and HMAC signature passes verification');

  const vReplay = SentinelGuard.verifyNonce(nonce, now, validSig);
  assert(vReplay === false, 'Replay attack with same Nonce is blocked');

  const vBadSig = SentinelGuard.verifyNonce('bad-nonce', now, 'invalid-signature');
  assert(vBadSig === false, 'Invalid HMAC signature is rejected');

  // Test Suite 3: Fastify App & HTTP Endpoints
  console.log('\n📦 [Suite 3: Fastify App & Sentinel API Endpoints]');
  const app = await buildApp();

  const healthRes = await app.inject({ method: 'GET', url: '/healthz' });
  assert(healthRes.statusCode === 200, `/healthz returns 200 OK`);
  const healthJson = healthRes.json();
  assert(healthJson.status === 'OK', `Health payload status: ${healthJson.status}`);

  const sentinelRes = await app.inject({ method: 'GET', url: '/api/sentinel/status' });
  assert(sentinelRes.statusCode === 200, `/api/sentinel/status returns 200 OK`);
  const sentinelJson = sentinelRes.json();
  assert(sentinelJson.sentinel.status === 'OPERATIONAL', `Sentinel engine mode: ${sentinelJson.sentinel.mode}`);

  // Test Suite 4: Document Converter Engine
  console.log('\n📦 [Suite 4: Document Converter Engine]');
  const convRes = await app.inject({
    method: 'POST',
    url: '/api/converter/text',
    payload: {
      content: '# Title 1\nSome text\n## Section 2\nMore details',
      targetFormat: 'outline',
    },
  });
  assert(convRes.statusCode === 200, `Converter API returns 200 OK`);
  const convJson = convRes.json();
  assert(convJson.headings && convJson.headings.length === 2, `Extracted 2 document headings in outline mode`);

  // Test Suite 5: Yjs CRDT Vector Sync & Snapshot
  console.log('\n📦 [Suite 5: Yjs CRDT Vector State & Snapshots]');
  const docA = new Y.Doc();
  const docB = new Y.Doc();
  docA.getText('markdown').insert(0, '# Hello from Collaborator A\n');

  const updateA = Y.encodeStateAsUpdate(docA);
  Y.applyUpdate(docB, updateA);

  assert(
    docB.getText('markdown').toString() === '# Hello from Collaborator A\n',
    'Yjs CRDT state converges across isolated documents'
  );

  await app.close();

  console.log('\n===============================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
