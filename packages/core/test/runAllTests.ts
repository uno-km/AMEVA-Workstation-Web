/**
 * ============================================================================
 * @file runAllTests.ts
 * @system AMEVA OS Desktop Workstation - Formal Test Runner
 * @location packages/core/test/runAllTests.ts
 * @role Systematic Test Suite Runner for Core Domain, RAG, SemanticCache, and Router
 * ============================================================================
 */

import { WebLLMEngineAdapter } from '../src/renderer/features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../src/renderer/features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { LocalRAGRetrieverAdapter } from '../src/renderer/features/ai-agent/adapters/LocalRAGRetrieverAdapter';
import { AgentOrchestrator } from '../src/renderer/features/ai-agent/core/AgentOrchestrator';
import { editorToolAdapter } from '../src/renderer/features/ai-agent/adapters/EditorToolAdapter';
import { calculateCosineSimilarity } from '../src/renderer/features/rag-embedding/vectorStore';
import { calculateRRFScore } from '../src/renderer/utils/ragUtils';
import { buildGraphFromChunks } from '../src/renderer/features/knowledge-graph/graphStore';
import { semanticCache, SemanticCache } from '../src/renderer/features/ai-agent/core/semanticCache';
import { smartHybridRouter, SmartHybridRouter } from '../src/renderer/features/ai-agent/core/SmartHybridRouter';
import type { EmbeddingChunk } from '../src/renderer/features/rag-embedding/types';

interface TestReport {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const reports: TestReport[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    reports.push({ suite, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err: any) {
    reports.push({ suite, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✕ [FAIL] ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('===============================================================');
  console.log('🧪 Running AMEVA-Workstation Formal Domain & AI Test Suites');
  console.log('===============================================================\n');

  // Suite 1: AI Agent Ports & Adapters
  console.log('📦 [Suite 1: AI Agent Hexagonal Adapters]');
  await runTest('AI Agent', 'WebLLMEngineAdapter - Stream generation & ready state', async () => {
    const mockGen = async function* (sys: string, user: string) {
      yield 'token1 ';
      yield 'token2';
    };
    const adapter = new WebLLMEngineAdapter(mockGen, true);
    assert(adapter.isReady === true, 'Adapter should be ready');
    assert(adapter.name === 'In-Browser WebGPU (WebLLM)', 'Adapter name must match');

    let output = '';
    for await (const chunk of adapter.generateStream('sys', 'user')) {
      output += chunk;
    }
    assert(output === 'token1 token2', 'Streaming tokens must concatenate correctly');
  });

  await runTest('AI Agent', 'RemoteHttpEngineAdapter - Configuration & readiness', async () => {
    const adapter = new RemoteHttpEngineAdapter({
      endpoint: 'http://localhost:11434/v1/chat/completions',
      model: 'qwen2.5:3b'
    });
    assert(adapter.isReady === true, 'Adapter should be ready when config provided');
    assert(adapter.getConfig().model === 'qwen2.5:3b', 'Model config must match');
  });

  await runTest('AI Agent', 'LocalRAGRetrieverAdapter - Query and GraphRAG relations synthesis', async () => {
    const adapter = new LocalRAGRetrieverAdapter();
    assert(typeof adapter.search === 'function', 'Search method must exist');
    assert(typeof adapter.buildContextPrompt === 'function', 'buildContextPrompt method must exist');
    const { prompt } = await adapter.buildContextPrompt('테스트 질의');
    assert(typeof prompt === 'string', 'Prompt must be returned');
  });

  // Suite 2: Agent Orchestrator & XML/CoT Parsing
  console.log('\n📦 [Suite 2: Agent Orchestrator & ReAct Loop]');
  await runTest('Orchestrator', 'ReAct parser splits <think> CoT trace and <insert> suggestions', async () => {
    const mockGen = async function* () {
      yield '<think>\n문맥을 분석하고 단락 삽입 결정을 내린다.\n</think>\n';
      yield '요청하신 내용을 정리했습니다.\n';
      yield '<insert afterBlockId="blk-1" type="paragraph">신규 요약 단락</insert>';
    };

    const webLLM = new WebLLMEngineAdapter(mockGen, true);
    const rag = new LocalRAGRetrieverAdapter();
    const orchestrator = new AgentOrchestrator(webLLM, rag, editorToolAdapter);

    await orchestrator.processUserPrompt('테스트 질의 파싱');
  });

  // Suite 3: RAG IR & GraphRAG Algorithms
  console.log('\n📦 [Suite 3: RAG IR & Graph Algorithms]');
  await runTest('RAG IR', 'Cosine Similarity & RRF math operations', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];
    assert(calculateCosineSimilarity(vecA, vecB) === 1, 'Identical vectors must have cosine 1.0');
    assert(calculateCosineSimilarity(vecA, vecC) === 0, 'Orthogonal vectors must have cosine 0.0');

    const rrfScore = calculateRRFScore(1, 1, 60, 0.5, 0.5);
    assert(rrfScore > 0, 'RRF score must be positive');
  });

  await runTest('GraphRAG', 'Knowledge Graph auto-extraction from chunks', () => {
    const mockChunks: EmbeddingChunk[] = [
      {
        id: 'chk-1',
        blockId: 'blk-1',
        section: '소개',
        text: 'AMEVA는 웹 기반 AI 워크스테이션입니다.',
        embedding: [0.5, 0.5, 0.5],
        createdAt: Date.now()
      },
      {
        id: 'chk-2',
        blockId: 'blk-2',
        section: '아키텍처',
        text: '헥사고날 포트 및 어댑터 아키텍처를 채택했습니다.',
        embedding: [0.5, 0.5, 0.51],
        createdAt: Date.now()
      }
    ];

    const graph = buildGraphFromChunks(mockChunks);
    assert(graph.nodes.length >= 3, 'Must contain Root + Section/Chunk nodes');
    assert(graph.edges.length >= 2, 'Must contain tree edges');
  });

  // Suite 4: Semantic Cache & Smart Hybrid Router (SCRUM-132)
  console.log('\n📦 [Suite 4: Semantic Cache & Smart Router]');
  await runTest('Semantic Cache', 'Exact query hit & Vector Cosine similarity matching (>= 0.95)', async () => {
    const cache = new SemanticCache(0.95);
    await cache.clear();

    const query = '이 문서 요약해줘';
    const vecA = [0.8, 0.6, 0.0];
    await cache.set(query, { content: '캐시된 요약 결과입니다.' }, vecA);

    // Exact Match Hit
    const exactHit = await cache.findMatch('이 문서 요약해줘');
    assert(exactHit !== null, 'Exact query must hit cache');
    assert(exactHit?.response.content === '캐시된 요약 결과입니다.', 'Cached content must match');

    // Vector Similarity Hit (cosine ~ 0.99)
    const vecNear = [0.81, 0.59, 0.0];
    const simHit = await cache.findMatch('다른 질의', vecNear);
    assert(simHit !== null, 'High-similarity vector must hit cache');

    // Low Similarity Miss (orthogonal)
    const vecFar = [0.0, 0.0, 1.0];
    const miss = await cache.findMatch('전혀 다른 질의', vecFar);
    assert(miss === null, 'Low-similarity vector must miss cache');
  });

  await runTest('Smart Router', 'Complexity & readiness routing dispatch', () => {
    const router = new SmartHybridRouter();

    // Case 1: Simple summary prompt ➔ Local WebGPU
    const decision1 = router.route('3줄 요약해줘', { isWebGPUReady: true, isBackendAvailable: true });
    assert(decision1.target === 'local_webgpu', 'Simple task should route to local WebGPU');

    // Case 2: Heavy comprehensive report ➔ Remote HTTP API
    const decision2 = router.route('전체 논문 전수 분석 및 빅데이터 심층 벤치마크 작성', { isWebGPUReady: true, isBackendAvailable: true });
    assert(decision2.target === 'remote_http', 'Heavy task should route to remote HTTP backend');

    // Case 3: WebGPU not ready fallback ➔ Remote HTTP
    const decision3 = router.route('단순 질의', { isWebGPUReady: false, isBackendAvailable: true });
    assert(decision3.target === 'remote_http', 'WebGPU fallback should route to remote HTTP');
  });

  // Summary
  const passedCount = reports.filter(r => r.passed).length;
  const failedCount = reports.filter(r => !r.passed).length;
  console.log('\n===============================================================');
  console.log(`📊 Test Summary: ${passedCount} Passed, ${failedCount} Failed (Total: ${reports.length})`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
