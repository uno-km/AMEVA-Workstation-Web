# Runtime Connectivity & Source Consistency Audit
> 감사 유형: 4차 최종 감사 | 감사일: 2026-07-07 | 역할: Runtime Connectivity Auditor / Test Architect

---

## 1. Overall Audit Summary

| 항목 | 수치 |
|---|---|
| 스캔된 파일 수 | ~120 (main: 20, renderer: ~85, shared: 8) |
| 검사된 export 심볼 수 | ~280 |
| 검사된 declared 심볼 수 | ~420 |
| Top-down 추적 심볼 수 | ~160 |
| Bottom-up 추적 체인 수 | ~45 |
| 추적된 사용자 플로우 수 | 14 (P0: 9, P1: 5) |
| IPC 채널 검증 수 | 38 |
| 이벤트 리스너 검증 수 | 12 |
| 연결 끊김 이슈 (BREAK) | 10 |
| Shape 불일치 이슈 (SHAPE) | 5 |
| Zero Runtime Invocation 후보 | 8 |
| Console-only 사용 | 4 |
| TypeScript 컴파일 상태 | **FAIL** (tsc_errors.log 기준) |
| 테스트 스크립트 | **없음** (package.json에 test 스크립트 미정의) |
| 코드 변경 여부 | **없음** (감사 전용) |

---

## 2. P0 User Flow Results

| Flow | Status | 이슈 수 | 심각도 | 비고 |
|---|---|---:|---|---|
| App Startup | PASS | 1 | Medium | `useAppBootstrap`에서 `as any` 캐스팅 사용 |
| File Open | PASS | 0 | — | `dialog:openFile` 전체 체인 연결됨 |
| File Save | WARN | 2 | High | `saveFileAs` preload 미노출; `dialog:saveFile` 응답 타입 불일치 |
| Editor Input | PASS | 1 | Low | `convertJupyterToCodeBlocks` 내부 로직 검증 필요 |
| AI Chat Flow | WARN | 2 | High | `agentEngine` 경로 실패; `agentStockCard.ts` 런타임 에러 |
| LLM Token Streaming | PASS | 1 | Medium | `llm:abort:${sessionId}` vs `llm:abort` 채널 불일치 |
| Settings Flow | WARN | 3 | High | `planSetStatus` 이름 오류; `modelPath`/`codeModelPath` AppSettings 미존재 |
| Error Display Flow | PASS | 1 | Low | toast 자동 소멸 타이머 cleanup 없음 |
| IPC Basic Bridge | WARN | 2 | Medium | `onExportProgress` 미구독; `saveFileAs` preload 미노출 |

---

## 3. P1 User Flow Results

| Flow | Status | 이슈 수 | 심각도 | 비고 |
|---|---|---:|---|---|
| Export (docx/xlsx/pptx/hwpx) | PASS | 1 | Medium | `export:showInFolder` preload 미노출 |
| Python Code Execution | WARN | 1 | Medium | `runtime:runPython`이 보안 정책으로 항상 실패 반환 |
| MCP Flow | PASS | 1 | Medium | MCP timeout 15초 하드코딩 |
| Web Search | PASS | 1 | Medium | Pro Plan 게이트 정상; `getProPlanMemory()` 중복 검사 |
| Keychain | PASS | 0 | — | 전체 체인 연결됨 |
| Workspace Restore | WARN | 2 | High | 재시작 후 탭/편집 상태 복원 로직 없음 |
| STT Flow | BROKEN | 1 | High | `sttTranscribe`/`sttGetTempPath` preload 노출됨, 렌더러 adapter 미존재 |

---

## 4. Broken Connectivity Issues

### [BREAK-001] `saveFileAs` — preload 미노출
- **경로**: `fileAdapter.ts:saveFileAs` → `window.electronAPI.saveFileAs` → **preload에 없음**
- **영향 파일**: `fileAdapter.ts`, `preload.ts`
- **심각도**: High
- **수정 단계**: P0

### [BREAK-002] `onExportProgress` — 구독자 및 발신자 없음
- **경로**: `exportAdapter.ts:onExportProgress` → 어디서도 호출 안 됨
- **추가**: Main에서 `export:progress` 이벤트 발신 코드도 없음
- **심각도**: Medium
- **수정 단계**: P1

### [BREAK-003] `llm:abort:${sessionId}` vs `llm:abort` 채널 불일치
- **Renderer 호출**: `ipcRenderer.send('llm:abort:${sessionId}')` (preload)
- **Main 핸들러**: `ipcMain.on('llm:abort')` — sessionId 없는 고정 채널
- **결과**: 세션별 abort 실제 미작동, 전체 프로세스 kill만 동작
- **심각도**: High
- **수정 단계**: P0

### [BREAK-004] `sttTranscribe` — 렌더러 adapter 없음
- **Main**: `ipcMain.handle('stt:transcribe')`, preload에 노출됨, `electron.d.ts` 타입 정의됨
- **Renderer**: `services/ipc/adapters/` 디렉토리에 STT adapter 파일 없음
- **결과**: 렌더러에서 STT 기능 호출 불가
- **심각도**: High
- **수정 단계**: P1

### [BREAK-005] `export:showInFolder` — preload 미노출
- **Main**: `ipcMain.on('export:showInFolder')` 핸들러 존재
- **Preload**: 미노출
- **Renderer**: adapter 없음
- **심각도**: Medium
- **수정 단계**: P1

### [BREAK-006] `useAIAgentMode` — 모듈 경로 해석 실패
- **파일**: `useAIAgentMode.ts:3`
- **오류 import**: `'../../services/ai/agentEngine'`
- **실제 위치**: `src/renderer/utils/agentEngine.ts`
- **증거**: `tsc_errors.log` → `TS2307: Cannot find module '../../services/ai/agentEngine'`
- **심각도**: Critical
- **수정 단계**: P0

### [BREAK-007] `agentStockCard.ts` — 런타임 타입 오류
- **파일**: `services/ai/agentStockCard.ts`
- **오류**: `.cleanContent`, `.suggestions` 속성이 `string` 타입에 없음
- **증거**: `tsc_errors.log` → `TS2339: Property 'cleanContent' does not exist on type 'string'`
- **결과**: `parseStockDataAndGenerateCard` 함수 호출 시 런타임 크래시
- **심각도**: High
- **수정 단계**: P0

### [BREAK-008] `SettingsModal.tsx` — `planSetStatus` 타입 시스템 불일치
- **파일**: `SettingsModal.tsx:292`
- **오류**: `window.electronAPI.planSetStatus` 접근 시 타입 에러
- **증거**: `tsc_errors.log` → `TS2551: Property 'planSetStatus' does not exist`
- **근본 원인**: `electron.d.ts` vs `electronApiAdapter.ts` Window 인터페이스 중복 선언
- **심각도**: High
- **수정 단계**: P0

### [BREAK-009] `agentEngine.ts` — `enum` 사용 (`erasableSyntaxOnly` 위반)
- **파일**: `utils/agentEngine.ts:73,108`
- **오류**: `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled`
- **결과**: `agentEngine.ts` 컴파일 불가 → `AgentEngine` 클래스 런타임 사용 불가
- **심각도**: Critical
- **수정 단계**: P0

### [BREAK-010] Workspace Restore — 재시작 후 탭 상태 복원 없음
- **경로**: 앱 재시작 → `useWorkspaceStore` 초기화
- **문제**: `tabs` 초기값이 `[{ id: 'default', filePath: null, ... }]`로 하드코딩, localStorage 복원 없음
- **심각도**: High
- **수정 단계**: P1

---

## 5. Bottom-Up Broken Chains (소비자 없는 심볼)

### [CHAIN-001] `useAIAgentMode` — 어떤 훅/컴포넌트에서도 import 없음
- **분류**: Zombie Hook (구현됨, 미연결)
- **심각도**: Critical

### [CHAIN-002] `useAICollabStore` — 전체 스토어 소비자 없음
- **분류**: Store Without Consumer
- **심각도**: Medium

### [CHAIN-003] `addTaggedBlock` / `removeTaggedBlock` (WorkspaceStore) — 소비자 없음
- **분류**: Dead Store Action
- **심각도**: Medium

### [CHAIN-004] `addAppendedFile` (WorkspaceStore) — 소비자 없음
- **비고**: `setAppendedFiles`로 우회 사용 중
- **심각도**: Low

### [CHAIN-005] `activePlugins` / `setActivePlugins` (ProcessStore) — 소비자 없음
- **심각도**: Medium

### [CHAIN-006] `isFreeModeLocked` (ProcessStore) — 읽기 소비자 없음
- **비고**: `setIsFreeModeLocked`는 호출됨, `SettingsModal`은 local `useState` 사용
- **심각도**: Medium

### [CHAIN-007] `resetExportProgress` (ProcessStore) — 소비자 없음
- **심각도**: Low

---

## 6. Zero Runtime Invocation (ZRI) Candidates

| 코드 | 이유 | 심각도 |
|---|---|---|
| `useAIAgentMode.runAgentMode` | 훅이 어디서도 import 안 됨 | Critical |
| `AgentEngine` 클래스 | enum 컴파일 에러로 런타임 불가 | Critical |
| `sttTranscribe` (renderer) | adapter 없음 | High |
| `export:showInFolder` IPC | preload 및 adapter 없음 | Medium |
| `useAICollabStore` 전체 | 소비자 없음 | Medium |
| `onExportProgress` adapter | 구독자 없음, Main 발신 없음 | Medium |
| `saveFileAs` (fileAdapter) | preload 미노출 | High |
| `parseStockDataAndGenerateCard` | 런타임 속성 오류로 크래시 | High |

---

## 7. IPC Contract Verification Table

| 채널 | Renderer 호출 | Preload 노출 | Main 핸들러 | 상태 |
|---|---|---|---|---|
| `llm:abort:${sessionId}` | `llmAbort(sessionId)` | `send('llm:abort:${sessionId}')` | `on('llm:abort')` 고정 | **MISMATCH** |
| `dialog:saveFile` (saveFileAs) | `fileAdapter.saveFileAs()` | **없음** | `handle('dialog:saveFile')` | **BROKEN** |
| `stt:transcribe` | **없음 (adapter 없음)** | `sttTranscribe` | `handle('stt:transcribe')` | **BROKEN** |
| `stt:getTempPath` | **없음 (adapter 없음)** | `sttGetTempPath` | `handle('stt:getTempPath')` | **BROKEN** |
| `export:showInFolder` | **없음** | **없음** | `on('export:showInFolder')` | **BROKEN** |
| `export:progress` | `onExportProgress()` | `onExportProgress?` | **발신 없음** | **BROKEN** |
| `app:ready` | `appReady()` | `appReady()` | `handle('app:ready')` | OK |
| `dialog:openFile` | `openFile()` | `openFile()` | `handle('dialog:openFile')` | OK |
| `dialog:saveFile` | `saveFile()` | `saveFile()` | `handle('dialog:saveFile')` | WARN (shape 불일치) |
| `dialog:saveExportedFile` | `saveExportedFile()` | `saveExportedFile?` | `handle` | OK |
| `dialog:selectLocalFile` | `selectLocalFile()` | `selectLocalFile()` | `handle` | OK |
| `action:printToPDF` | `printToPDF()` | `printToPDF?` | `handle` | OK |
| `action:webSearch` | `webSearch()` | `webSearch?` | `handle` | OK |
| `export:convert` | `exportConvert()` | `exportConvert?` | `handle` | OK |
| `server:start` | `startCollaborationServer()` | `startCollaborationServer?` | `handle` | OK |
| `server:stop` | `stopCollaborationServer()` | `stopCollaborationServer?` | `handle` | OK |
| `server:status` | `onServerStatus()` | `onServerStatus?` | `sender.send` | OK |
| `runtime:runPython` | `runPythonCode()` | `runPythonCode?` | `handle` (항상 실패) | WARN |
| `window:setZoom` | `setZoomLevel()` | `setZoomLevel?` | `on` | OK |
| `window:getZoom` | `getZoomLevel()` | `getZoomLevel?` | `handle` | OK |
| `window:setZoomFactor` | `setZoomFactor()` | `setZoomFactor?` | `on` | OK |
| `window:getZoomFactor` | `getZoomFactor()` | `getZoomFactor?` | `handle` | OK |
| `window:close` | `closeApp()` | `closeApp?` | `on` | OK |
| `window:new-window` | `newWindow()` | `newWindow?` | `on` | OK |
| `action:openExternal` | `openExternalLink()` | `openExternalLink()` | `on` | OK |
| `mcp:spawn` | `mcpSpawn()` | `mcpSpawn?` | `handle` | OK |
| `mcp:call` | `mcpCall()` | `mcpCall?` | `handle` | OK |
| `mcp:kill` | `mcpKill()` | `mcpKill?` | `handle` | OK |
| `mcp:getToken` | `mcpGetToken()` | `mcpGetToken?` | `handle` | OK |
| `llm:generate` | `llmGenerate()` | `llmGenerate()` | `handle` | OK |
| `llm:token:${id}` | `onLLMToken()` | `onLLMToken()` | `sender.send` | OK |
| `llm:done:${id}` | `onLLMDone()` | `onLLMDone()` | `sender.send` | OK |
| `llm:log` | `onLLMLog()` | `onLLMLog()` | `sender.send` | OK |
| `llm:add-log` | `llmAddLog()` | `llmAddLog()` | `on` | OK |
| `llm:get-logs` | `llmGetLogs()` | `llmGetLogs()` | `handle` | OK |
| `llm:check-health` | `llmCheckHealth()` | `llmCheckHealth()` | `handle` | OK |
| `llm:restart` | `llmRestart()` | `llmRestart?` | `handle` | OK |
| `llm:start` | `llmStart()` | `llmStart()` | `handle` | OK |
| `llm:stop` | `llmStop()` | `llmStop()` | `handle` | OK |
| `llm:is-free-mode` | `isFreeMode()` | `isFreeMode?` | `handle` | OK |
| `plan:get-status` | `planGetStatus()` | `planGetStatus?` | `handle` | OK |
| `plan:set-status` | `planSetStatus()` | `planSetStatus?` | `handle` | OK |
| `llm:getGpuName` | `llmGetGpuName()` | `llmGetGpuName?` | `handle` | OK |
| `keychain:set` | `keychainSet()` | `keychainSet?` | `handle` | OK |
| `keychain:get` | `keychainGet()` | `keychainGet?` | `handle` | OK |
| `keychain:delete` | `keychainDelete()` | `keychainDelete?` | `handle` | OK |
| `action:fetchUrlMetadata` | `fetchUrlMetadata()` | `fetchUrlMetadata()` | `handle` | OK |
| `file:open-argv` | `onFileOpenArgv()` | `onFileOpenArgv()` | `webContents.send` | OK |

---

## 8. Event Listener Issues

| 이벤트 | 리스너 | Cleanup | 발화 가능 | 위험 |
|---|---|---|---|---|
| `llm:token:${sessionId}` | `useAIIpc.subscribeSession` | OK | OK | 정상 |
| `llm:done:${sessionId}` | `useAIIpc.subscribeSession` | OK | OK | 정상 |
| `llm:download-progress` | `useAppIpcBridge` | OK | OK | 정상 |
| `file:open-argv` | `useAppIpcBridge` | OK | OK | 정상 |
| `server:status` | `useCollaboration` | OK | OK | 정상 |
| `BroadcastChannel('ameva-sensor-logs-channel')` | `useAILogStore` (모듈 레벨) | **없음** | OK | **Memory leak — 모듈 스코프라 cleanup 불가** |
| `onExportProgress` | **구독자 없음** | N/A | Unknown | **발신처도 없음** |
| `app.on('second-instance')` | main index.ts | N/A | OK | 정상 |
| `Y.Doc` 이벤트 | useCollaboration | OK (doc.destroy) | OK | 정상 |

---

## 9. Runtime Shape Consistency Issues

### [SHAPE-001] `dialog:saveFile` 응답 불일치
- **Adapter 기대**: `{ filePath?: string; success: boolean }`
- **Main 실제 반환**: `string | null` (파일 경로 직접 반환)
- **결과**: `result.success` 접근 시 undefined
- **심각도**: High

### [SHAPE-002] `LLMGenerateParams.apiType` — preload vs ipcTypes 불일치
- **Preload**: `apiType?: 'local' | 'api'` (2개 값)
- **ipcTypes.ts**: `apiType?: 'local' | 'api' | 'wasm' | 'ollama'` (4개 값)
- **결과**: 'ollama', 'wasm' 타입 안전성 미확보
- **심각도**: Medium

### [SHAPE-003] `ModelInfo.name` 옵셔널 vs 컴포넌트 필수 기대
- **ipcTypes.ts**: `name?: string` (옵셔널)
- **SettingsModal.tsx**: `name: string` (필수)
- **증거**: `tsc_errors.log` → `TS2345: Type 'string | undefined' is not assignable to type 'string'` (7건)
- **심각도**: High

### [SHAPE-004] `AppSettings`에 `modelPath`/`codeModelPath` 미존재
- **SettingsModal.tsx**: `settings.modelPath`, `settings.codeModelPath` 접근
- **AppSettings 타입**: 해당 필드 없음 (AISettings에만 존재)
- **증거**: `tsc_errors.log` → `TS2339: Property 'modelPath' does not exist on type 'AppSettings'`
- **결과**: 설정이 올바른 저장소에 저장되지 않음
- **심각도**: High

### [SHAPE-005] `AIMessage`, `AISettings`, `InsertSuggestion` — `useAI`에서 미수출
- **소비자**: `AIChatList.tsx`, `AIHeader.tsx`, `MessageBubble.tsx`, `InsertPreviewCard.tsx`
- **잘못된 import**: `from '../../hooks/useAI'`
- **실제 위치**: `src/renderer/types/aiTypes.ts`
- **증거**: `tsc_errors.log` → `TS2305: Module has no exported member 'AIMessage'` (3파일)
- **심각도**: High

---

## 10. Unused / Dead / Hardcoded Findings

| 심볼/값 | 분류 | 파일 | 심각도 |
|---|---|---|---|
| UIStore toggle 메서드 12종 | Store Action Without Consumer | `useUIStore.ts` | Low |
| `activePlugins` / `setActivePlugins` | Store State Without Consumer | `useProcessStore.ts` | Medium |
| `isFreeModeLocked` (ProcessStore 읽기) | Zombie State | `useProcessStore.ts` | Medium |
| `resetExportProgress` | Store Action Without Consumer | `useProcessStore.ts` | Low |
| `serverInfo` (useCollaboration) | UI State Without Render Effect | `useCollaboration.ts` | Low |
| `sessionToken` (useCollaboration) | UI State Without Render Effect | `useCollaboration.ts` | Medium |
| `'C:\\ameva\\models\\llm\\qwen2.5-3b-instruct-q4_k_m.gguf'` | Magic String (3파일 중복) | llmGenerateIpc.ts 등 | Medium |
| `http://127.0.0.1:11553/mcp` | Hardcoded URL | `useAppBootstrap.ts` | Low |
| `15000` (MCP timeout) | Magic Number | `mcpProcessManager.ts:86` | Low |
| `1200` (plugin lazy load) | Magic Number | `useAppBootstrap.ts:125` | Low |
| console.log 4건 (프로덕션) | Console-Only Usage | 다수 파일 | Low |

---

## 11. High Cardinality Risks

| 대상 | 위험 | 심각도 |
|---|---|---|
| `loadMarkdownIntoEditor` 대형 파일 | 200줄 임계값 후 350ms `setTimeout` + DOM 갱신 지연 | Medium |
| `useAILogStore.sensorLogs` 고빈도 | `MAX_LOG_BUFFER` 제한 있으나 BroadcastChannel 메시지 폭주 시 100ms 디바운스 | Medium |
| `MCPProcessManager.callServer` 병렬 호출 | `pendingResolvers` Map 무제한 성장 가능 | Medium |
| `AIMessage` 목록 가상화 없음 | 1000개 이상 메시지 시 전체 렌더링 | Medium |
| `agentEngine.ts` 컴파일 실패 | Import 실패로 앱 크래시 가능 | Critical |
| `useHistory.snapshots` 상한 없음 | 대형 문서 다수 스냅샷 메모리 누적 | Low |

---

## 12. TypeScript 에러 목록 요약 (tsc_errors.log)

```
Critical:
  - useAIAgentMode.ts: Cannot find module '../../services/ai/agentEngine' (TS2307)
  - agentEngine.ts: enum 사용 금지 (TS1294) — erasableSyntaxOnly
  - agentEngine.ts: Cannot find name 'sessionId' (TS2304)
  - agentStockCard.ts: Property 'cleanContent'/'suggestions' does not exist (TS2339)

High:
  - SettingsModal.tsx: planSetStatus 타입 오류 (TS2551)
  - SettingsModal.tsx: ModelInfo.name 타입 불일치 7건 (TS2345)
  - SettingsModal.tsx: modelPath/codeModelPath AppSettings에 없음 (TS2339) 2건
  - AIChatList.tsx / AIHeader.tsx / MessageBubble.tsx / InsertPreviewCard.tsx: AIMessage/AISettings/InsertSuggestion 미수출 (TS2305) 4건
  - useNativeUploadIntercept.ts: base64/filePath 속성 없음 (TS2339) 3건
  - useCollaborationHighlight.ts: selection → setSelection 오타 (TS2551)
  - App.tsx: printToPDF/exportConvert possibly undefined 10건 (TS2722/TS18048)
  - App.tsx: string | undefined 타입 불일치 5건 (TS2322)

Medium:
  - useBacktickFence.ts: content 속성 없음 (TS2339)
  - analyzeApiKey.ts: 타입 오류 3건
  - agentStockCard.ts: Expected 1 arguments, but got 3 (TS2554)

Low (unused imports/vars):
  - AboutModal.tsx, AIPanelHeader.tsx, AIInputContextBar.tsx 등 다수에서 TS6133 (unused)
```

---

## 13. Test Coverage Gaps

| 기능 | 누락 테스트 유형 | 제안 |
|---|---|---|
| IPC channel 전체 38개 | IPC Contract Test | 채널별 invoke 후 응답 shape 검증 |
| `dialog:saveFile` 응답 shape | Contract Test | Main 반환 vs adapter 기대 shape 일치 |
| `llm:abort:${sessionId}` | Integration Test | 세션별 abort 후 streaming 중단 확인 |
| `useAIGenerator.generateResponse` | Unit Test | 사용량 제한, 코딩 모델 전환, 큐 enqueue |
| Export (docx/xlsx/pptx/hwpx) | Snapshot Test | blocks → 파일 변환 결과 |
| `useCollaboration` Y.js 동기화 | Integration Test | 2인 연결 후 문서 동기화 |
| App Bootstrap 순서 | Integration Test | planGetStatus → MCP 로드 순서 |
| Workspace restore | E2E Test | 재시작 후 마지막 파일/탭 복원 |

---

## 14. Code Modification Status (불변성 확인)

| 항목 | 결과 |
|---|---|
| 코드 수정 | 없음 |
| 파일 이동 | 없음 |
| 심볼 이름 변경 | 없음 |
| 동작 변경 | 없음 |
| Import/export 변경 | 없음 |
| `any` / `as any` 도입 | 없음 |
| 테스트 추가 | 없음 |

---

## 15. Recommended Next Actions

### P0 (즉시 수정)

1. **[BREAK-006]** `useAIAgentMode.ts` import 경로 수정  
   `'../../services/ai/agentEngine'` → `'../../utils/agentEngine'`

2. **[BREAK-009]** `agentEngine.ts` enum 제거  
   `enum` → `const object` 또는 string literal union

3. **[BREAK-007]** `agentStockCard.ts` 속성 오류 수정  
   `parseStockDataAndGenerateCard` 반환 타입 정합

4. **[SHAPE-005]** `AIMessage`, `AISettings`, `InsertSuggestion` import 경로 수정  
   `from '../../hooks/useAI'` → `from '../../types/aiTypes'`

5. **[BREAK-003]** `llm:abort` 채널명 통일  
   Main IPC를 `llm:abort:${sessionId}` 로 변경

6. **[SHAPE-001]** `dialog:saveFile` 응답 shape 통일  
   Main 반환 `{ success, filePath }` 또는 adapter 조정

7. **[SHAPE-004]** `AppSettings` vs `AISettings` 혼용 수정  
   `SettingsModal`이 `AISettings` 스토어 직접 사용하도록

### P1 (우선 검토)

1. **[BREAK-001]** `saveFileAs` preload 노출 추가
2. **[BREAK-004]** STT renderer adapter 추가 (`services/ipc/adapters/sttAdapter.ts`)
3. **[BREAK-010]** Workspace restore localStorage 영속화 구현
4. **[BREAK-005]** `export:showInFolder` preload 노출 추가
5. IPC Contract 테스트 프레임워크 추가 (`vitest`)

### P2 (중장기 검토)

1. `useAICollabStore` 실제 사용 계획 확인 또는 제거 결정
2. UIStore 미사용 toggle 메서드 정리
3. ProcessStore `activePlugins` 관련 로직 명확화
4. `onExportProgress` 이벤트 발신 로직 구현 또는 제거
5. `BroadcastChannel` 모듈 레벨 메모리 릭 수정
6. 하드코딩 상수 (`C:\ameva\...`, `15000`, `1200`) 상수 파일로 이동
