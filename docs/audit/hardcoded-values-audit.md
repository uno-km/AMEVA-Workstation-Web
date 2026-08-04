# Hardcoded Values & Config Fields Audit
> 4차 감사 | 하드코딩 감사 | 2026-07-07

---

## 1. 3단계 상수화 헌법 위반 항목

### 1단계 위반 — `.env`에 있어야 할 값

| 값 | 현재 위치 | 영향 | 단계 |
|---|---|---|---|
| `http://127.0.0.1:11553/mcp` | `useAppBootstrap.ts:26` | 기본 MCP 서버 URL — 개발/배포 환경 바뀌면 코드 수정 필요 | P2 |
| `http://localhost:3010/plugins/` | `useAppBootstrap.ts:127` | 플러그인 서버 URL — 환경별 달라야 함 | P2 |

### 2단계 위반 — `src/shared/constants`에 있어야 할 값

| 값　　　　　　　　　　　　　　　　　　　　　　　　　　　　　| 현재 위치　　　　　　　　　　　　　　　　　　　　　　　　　| 파일 수 | 단계 |
| -------------------------------------------------------------| ------------------------------------------------------------| ---------| ------|
| `'C:\\ameva\\models\\llm\\qwen2.5-3b-instruct-q4_k_m.gguf'` | `useAIState.ts`, `llmGenerateIpc.ts`, `llmLifecycleIpc.ts` | 3　　　 | P1　 |
| `'C:\\ameva\\llama\\llama-server.exe'`　　　　　　　　　　　| `llmProcessManager.ts:51`　　　　　　　　　　　　　　　　　| 1　　　 | P1　 |
| `'C:\\ameva\\whisper\\whisper-cli.exe'`　　　　　　　　　　 | `llmProcessManager.ts:64`　　　　　　　　　　　　　　　　　| 1　　　 | P1　 |
| `'C:\\ameva\\models\\stt\\ggml-small.bin'`　　　　　　　　　| `sttIpc.ts:18`　　　　　　　　　　　　　　　　　　　　　　 | 1　　　 | P1　 |
| `12345` (llama-server port)　　　　　　　　　　　　　　　　 | `llmProcessManager.ts:38`　　　　　　　　　　　　　　　　　| 1　　　 | P1　 |
| `'ameva_ai_settings'` (localStorage key)　　　　　　　　　　| `useAIState.ts:58`　　　　　　　　　　　　　　　　　　　　 | 1　　　 | P2　 |
| `'app-settings'` (localStorage key)　　　　　　　　　　　　 | `useAppSettingsManager.ts:19`　　　　　　　　　　　　　　　| 1　　　 | P2　 |
| `'mcp-servers-config'` (localStorage key)　　　　　　　　　 | `useAppBootstrap.ts:95`　　　　　　　　　　　　　　　　　　| 1　　　 | P2　 |
| `'is-pro-plan'` (localStorage key)　　　　　　　　　　　　　| `useProcessStore.ts:61`, `useAppBootstrap.ts:71`　　　　　 | 2　　　 | P2　 |
| `'ameva-sensor-logs-channel'` (BroadcastChannel)　　　　　　| `useAILogStore.ts:32`　　　　　　　　　　　　　　　　　　　| 1　　　 | P2　 |

### 3단계 위반 — 도메인 종속 constants.ts에 있어야 할 값

| 값 | 현재 위치 | 도메인 | 단계 |
|---|---|---|---|
| `15000` (MCP timeout ms) | `mcpProcessManager.ts:86` | mcp | P2 |
| `1200` (plugin lazy load delay ms) | `useAppBootstrap.ts:125` | app-bootstrap | P2 |
| `250` (sidebar ready delay ms) | `useAppBootstrap.ts:55` | app-bootstrap | P2 |
| `1500` (AI panel ready delay ms) | `useAppBootstrap.ts:56` | app-bootstrap | P2 |
| `350` (large file chunk delay ms) | `useAppFileOperations.ts:48` | file-operations | P2 |
| `200` (line count threshold for chunked load) | `useAppFileOperations.ts:39` | file-operations | P2 |
| `120` (first chunk line count) | `useAppFileOperations.ts:40` | file-operations | P2 |
| `80` (export animation delay ms) | `useAppExport.ts:30` | export | P3 |
| `120` (export save delay ms) | `useAppExport.ts:52` | export | P3 |
| `2000` (export success display ms) | `useAppExport.ts:69` | export | P3 |
| `3500` (download toast display ms) | `useAppIpcBridge.ts:47` | ipc-bridge | P3 |
| `4000` (download complete toast ms) | `useAppIpcBridge.ts:53` | ipc-bridge | P3 |
| `0.4` (min zoom) | `useProcessStore.ts:99,107` | zoom | P3 |
| `2.5` (max zoom) | `useProcessStore.ts:99,107` | zoom | P3 |

---

## 2. Config Fields Audit

### `AppSettings` (SettingsModal / useAppSettingsManager)

| 필드 | 기본값 | 소비자 | 상태 |
|---|---|---|---|
| `showPeersPointer` | `true` | `useCollaboration`, MarkdownEditor | OK |
| `showPeersDrag` | `true` | `useCollaboration` | OK |
| `showCodeConsole` | `true` | Editor 컴포넌트 | OK |
| `autoSnapshot` | `true` | `useAppSnapshot` | OK |
| `theme` | `'dark'` | `useAppSettingsManager` (body attr) | OK |
| `wordWrap` | `true` | 에디터 설정 | OK |
| `showMinimap` | `true` | 에디터 설정 | OK |
| `installedPlugins` | `[]` | `useAppBootstrap` | OK |
| `hotkeys.save` | `'Control+s'` | KeyboardManager | OK |
| `hotkeys.open` | `'Control+o'` | KeyboardManager | OK |
| `hotkeys.newFile` | `'Control+n'` | KeyboardManager | OK |
| `hotkeys.pdfExport` | `'Control+p'` | KeyboardManager | OK |
| `hotkeys.toggleAI` | `'Control+\\'` | KeyboardManager | OK |
| `hotkeys.toggleMode` | `'Control+e'` | KeyboardManager | OK |
| `hotkeys.zoomIn` | `'Control+='` | `useAppSettingsManager` | OK |
| `hotkeys.zoomOut` | `'Control+-'` | `useAppSettingsManager` | OK |
| `hotkeys.zoomReset` | `'Control+0'` | `useAppSettingsManager` | OK |
| `modelPath` | **없음** | `SettingsModal` 잘못 접근 | **BROKEN** |
| `codeModelPath` | **없음** | `SettingsModal` 잘못 접근 | **BROKEN** |

### `AISettings` (useAIState)

| 필드 | 기본값 | 소비자 | 상태 |
|---|---|---|---|
| `modelPath` | 하드코딩 gguf 경로 | `useAIGenerator`, `llm:generate` | OK |
| `codeModelPath` | `''` | `useAIGenerator` | OK |
| `temperature` | `AI_TERMINAL_CONSTANTS.DEFAULT_TEMPERATURE` | `llm:generate` | OK |
| `maxTokens` | `AI_TERMINAL_CONSTANTS.DEFAULT_MAX_TOKENS` | `llm:generate` | OK |
| `systemPrompt` | 긴 한국어 시스템 프롬프트 | `buildSystemPrompt` | OK |
| `apiType` | `'local'` | `useAIGenerator` | OK |
| `apiKey` | undefined | `useAIGenerator` | OK |
| `apiEndpoint` | undefined | `useAIGenerator` | OK |
| `apiModel` | undefined | `useAIGenerator` | OK |
| `gpuOnly` | undefined | `useAIGenerator` | OK |

---

## 3. Store State Initial Values

### `useWorkspaceStore.ts` 초기값

| 필드 | 초기값 | 영속화 | 주의 |
|---|---|---|---|
| `filePath` | `null` | No | 재시작 후 복원 불가 |
| `currentContent` | `''` | No | 재시작 후 복원 불가 |
| `originalContent` | `''` | No | 재시작 후 복원 불가 |
| `lastSavedTime` | `null` | No | 정상 |
| `fileOpenMode` | `'replace'` | No | 정상 |
| `tabs` | `[{ id: 'default', ... }]` | No | **재시작 후 탭 복원 불가** |
| `activeTabId` | `'default'` | No | 재시작 후 복원 불가 |
| `appendedFiles` | `[]` | No | 정상 |
| `selectedText` | `''` | No | 정상 |
| `activeBlockId` | `null` | No | 정상 |
| `taggedBlocks` | `[]` | No | 정상 |
| `selectedSnapshot` | `null` | No | 정상 |

### `useProcessStore.ts` 초기값

| 필드 | 초기값 | 영속화 | 주의 |
|---|---|---|---|
| `isProPlan` | `loadIsProPlan()` from localStorage | localStorage | OK |
| `isFreeModeLocked` | `false` | No | 읽기 소비자 없음 |
| `editorZoom` | `1.0` | No | 재시작 후 복원 불가 (별도 복원 로직 없음) |
| `browserZoom` | `1.0` | useAppBootstrap에서 getZoomFactor로 복원 | OK |
| `exportProgress` | `IDLE_EXPORT_PROGRESS` | No | 정상 |
| `mcpServersState` | `[]` | useAppBootstrap에서 localStorage 복원 | OK |
| `activePlugins` | `[]` | No | 소비자 없음 |

### `useAIState.ts` 초기값

| 필드 | 초기값 | 영속화 | 주의 |
|---|---|---|---|
| `settings` | `loadInitialSettings()` from `ameva_ai_settings` | localStorage | OK |
| `isGenerating` | `false` | No | 정상 |
| `isAvailable` | `false` | No | 정상 |
| `models` | `[]` | No | `useLocalAIEngine.loadModels()` 호출로 채워짐 |
| `codeModels` | `[]` | No | OK |
| `pendingQueue` | `[]` | No | OK |

---

## 4. Sentinel Values (매직 넘버/문자열 위험 등급)

| 값 | 등급 | 이유 |
|---|---|---|
| `'C:\\ameva\\models\\llm\\qwen2.5-3b-instruct-q4_k_m.gguf'` | **P1-Critical** | 모델 이름이 바뀌면 3파일 수정 필요. 기본 설정값으로 상수화 필수 |
| `12345` (llama-server port) | P1 | 포트 충돌 가능. 상수화 또는 설정으로 이동 |
| `15000` (MCP timeout) | P2 | 15초 타임아웃이 너무 짧거나 길 수 있음. 상수화 |
| `http://127.0.0.1:11553/mcp` | P2 | 환경별 URL — .env 이동 |
| `Control+\\` (toggleAI 단축키) | P3 | 문자열 리터럴 — 타입 안전성 낮음 |
| `'ameva_ai_settings'` | P3 | localStorage key 하드코딩 — 충돌 위험 |
