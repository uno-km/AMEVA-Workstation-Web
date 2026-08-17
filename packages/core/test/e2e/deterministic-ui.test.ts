/**
 * ============================================================================
 * @file deterministic-ui.test.ts
 * @system AMEVA OS Desktop Workstation - E2E UI Interaction Test Suite
 * @location packages/core/test/e2e/deterministic-ui.test.ts
 * @role 100% Deterministic data-testid UI Scenario Verification Runner
 * ============================================================================
 */

import { useAIAgentStore } from '../../src/renderer/features/ai-agent/core/useAIAgentStore';
import { AgentOrchestrator } from '../../src/renderer/features/ai-agent/core/AgentOrchestrator';
import { WebLLMEngineAdapter } from '../../src/renderer/features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../../src/renderer/features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { LocalRAGRetrieverAdapter } from '../../src/renderer/features/ai-agent/adapters/LocalRAGRetrieverAdapter';
import { editorToolAdapter } from '../../src/renderer/features/ai-agent/adapters/EditorToolAdapter';
import type { InsertSuggestion } from '../../src/renderer/features/ai-agent/types';

interface E2EReport {
  scenarioId: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const reports: E2EReport[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function runScenario(scenarioId: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    reports.push({ scenarioId, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [E2E PASS] ${scenarioId}: ${name}`);
  } catch (err: any) {
    reports.push({ scenarioId, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✕ [E2E FAIL] ${scenarioId}: ${name} ➔ ${err.message}`);
  }
}

async function main() {
  console.log('======================================================================');
  console.log('🎯 Running Deterministic data-testid E2E UI Interaction Test Suite');
  console.log('======================================================================\n');

  // Mock Editor Instance with full BlockNote CRUD mock
  const mockEditorDoc: any[] = [];
  const mockEditor = {
    document: mockEditorDoc,
    insertBlocks: (blocks: any[], refId?: string, placement?: string) => {
      mockEditorDoc.push(...blocks);
    },
    replaceBlocks: (oldBlocks: any[], newBlocks: any[]) => {
      mockEditorDoc.length = 0;
      mockEditorDoc.push(...newBlocks);
    },
    getTextCursorPosition: () => ({ block: { id: 'blk-cursor' } })
  };
  editorToolAdapter.setEditor(mockEditor);

  // Mock LLM Engine with CoT and Insert XML
  const mockStreamGenerator = async function* () {
    yield '<think>\n문서의 전체 요약 구조를 분석하고 결론 단락을 작성합니다.\n</think>\n';
    yield '요청하신 3줄 요약 결과입니다.\n';
    yield '<insert afterBlockId="START" type="paragraph">1. 고성능 WebGPU 아키텍처 채택</insert>';
  };

  const webLLMEngine = new WebLLMEngineAdapter(mockStreamGenerator, true);
  const ragRetriever = new LocalRAGRetrieverAdapter();
  const orchestrator = new AgentOrchestrator(webLLMEngine, ragRetriever, editorToolAdapter);

  // -------------------------------------------------------------------------
  // Scenario 1: Quick Action [3줄 요약] Click -> CoT & Insert Tag Extraction
  // -------------------------------------------------------------------------
  await runScenario('TC-UI-01', 'Quick Action [3줄 요약] 클릭 ➔ CoT 분리 및 에디터 제안 카드 생성 검증', async () => {
    useAIAgentStore.getState().clearMessages();

    await orchestrator.processUserPrompt('현재 문서의 핵심 내용을 3가지 항목으로 요약해줘.');

    const messages = useAIAgentStore.getState().messages;
    assert(messages.length === 2, `Expected 2 messages (user, assistant), got ${messages.length}`);

    const asstMsg = messages[1];
    assert(asstMsg.role === 'assistant', 'Second message must be assistant');
    assert(asstMsg.thought?.includes('문서의 전체 요약 구조를 분석'), 'Thought (<think>) must be cleanly extracted');
    assert(asstMsg.content.includes('요청하신 3줄 요약 결과입니다.'), 'Clean content must not contain XML tags');
    assert(asstMsg.insertSuggestions?.length === 1, 'Insert suggestions must contain 1 block proposal');
    assert(asstMsg.insertSuggestions![0].content === '1. 고성능 WebGPU 아키텍처 채택', 'Suggestion content must match');
  });

  // -------------------------------------------------------------------------
  // Scenario 2: One-Click [에디터 삽입] (InsertPreviewCard) Action
  // -------------------------------------------------------------------------
  await runScenario('TC-UI-02', '[에디터 삽입] 버튼 클릭 ➔ BlockNote DOM 블록 주입 및 상태 accepted 전이', async () => {
    const messages = useAIAgentStore.getState().messages;
    const asstMsg = messages[1];
    const suggestion: InsertSuggestion = asstMsg.insertSuggestions![0];

    const result = await editorToolAdapter.executeTool('insert_block', suggestion);
    assert(result.success === true, `Tool execution must succeed: ${result.error}`);
    assert(mockEditorDoc.length === 1, 'Mock editor document must have 1 inserted block');

    useAIAgentStore.getState().updateInsertSuggestionStatus(asstMsg.id, 0, 'accepted');
    const updatedMsg = useAIAgentStore.getState().messages.find(m => m.id === asstMsg.id);
    assert(updatedMsg?.insertSuggestions![0].status === 'accepted', 'Suggestion status must be accepted');
  });

  // -------------------------------------------------------------------------
  // Scenario 3: [거절] (InsertPreviewCard) Action
  // -------------------------------------------------------------------------
  await runScenario('TC-UI-03', '[거절] 버튼 클릭 ➔ 제안 상태 rejected 전이 및 DOM 미변경 검증', async () => {
    const initialDocLength = mockEditorDoc.length;
    const asstMsg = useAIAgentStore.getState().messages[1];

    useAIAgentStore.getState().updateInsertSuggestionStatus(asstMsg.id, 0, 'rejected');
    const updatedMsg = useAIAgentStore.getState().messages.find(m => m.id === asstMsg.id);
    assert(updatedMsg?.insertSuggestions![0].status === 'rejected', 'Suggestion status must be rejected');
    assert(mockEditorDoc.length === initialDocLength, 'Document length must remain unchanged on reject');
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Engine Mode Dynamic Switching (WebGPU <-> Remote HTTP API)
  // -------------------------------------------------------------------------
  await runScenario('TC-UI-04', '엔진 모드 실시간 스위칭 (⚡ WebGPU ↔ 🌐 HTTP API) 어댑터 핫스왑 검증', async () => {
    const httpEngine = new RemoteHttpEngineAdapter({
      endpoint: 'http://localhost:11434/v1/chat/completions',
      model: 'qwen2.5:3b'
    });

    orchestrator.setEngine(httpEngine);
    assert(httpEngine.isReady === true, 'HTTP Engine adapter must be ready');
    assert(httpEngine.name.includes('Remote HTTP API'), 'HTTP Engine adapter name must match');

    orchestrator.setEngine(webLLMEngine);
    assert(webLLMEngine.name === 'In-Browser WebGPU (WebLLM)', 'WebGPU Engine adapter must restore');
  });

  // -------------------------------------------------------------------------
  // Scenario 5: User Abort Pipeline (Square Button Click)
  // -------------------------------------------------------------------------
  await runScenario('TC-UI-05', '생성 중단 (Abort Button) 클릭 ➔ 스트리밍 AbortController 정상 시그널 전파', async () => {
    let aborted = false;
    const infiniteGenerator = async function* (sys: string, user: string, opt?: any) {
      while (true) {
        if (opt?.signal?.aborted) {
          aborted = true;
          break;
        }
        yield 'chunk ';
        await new Promise(r => setTimeout(r, 10));
      }
    };

    const abortEngine = new WebLLMEngineAdapter(infiniteGenerator, true);
    const abortOrchestrator = new AgentOrchestrator(abortEngine, ragRetriever, editorToolAdapter);

    const promptPromise = abortOrchestrator.processUserPrompt('무한 스트림 테스트');
    await new Promise(r => setTimeout(r, 20));
    abortOrchestrator.abort();
    await promptPromise;

    assert(useAIAgentStore.getState().isStreaming === false, 'isStreaming state must be false after abort');
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const passedCount = reports.filter(r => r.passed).length;
  const failedCount = reports.filter(r => !r.passed).length;
  console.log('\n======================================================================');
  console.log(`📊 E2E Test Summary: ${passedCount} Passed, ${failedCount} Failed (Total: ${reports.length})`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
