# Declared Symbol Inventory
> 4차 감사 | 선언 심볼 목록 | 2026-07-07

---

## 1. Main Process Symbols

### `src/main/index.ts`

| 심볼　　　　　　　　　　　 | 종류　　 | 소비자　　　　　　　　　| 상태 |
| ----------------------------| ----------| -------------------------| ------|
| `createWindow()`　　　　　 | function | app.whenReady()　　　　 | OK　 |
| `mainWindow`　　　　　　　 | variable | IPC handlers, lifecycle | OK　 |
| `onSecondInstance` handler | event　　| app.on　　　　　　　　　| OK　 |

### `src/main/preload.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `contextBridge.exposeInMainWorld` | API bridge | `window.electronAPI` | OK |
| `appReady` | exposed fn | `appAdapter.ts` | OK |
| `openFile` | exposed fn | `fileAdapter.ts` | OK |
| `saveFile` | exposed fn | `fileAdapter.ts` | OK |
| `saveFileAs` | exposed fn | `fileAdapter.ts` | **BROKEN — preload에 없음** |
| `selectLocalFile` | exposed fn | `fileAdapter.ts` | OK |
| `onFileOpenArgv` | exposed fn | `fileAdapter.ts` | OK |
| `fetchUrlMetadata` | exposed fn | `fileAdapter.ts` | OK |
| `openExternalLink` | exposed fn | `fileAdapter.ts` | OK |
| `llmGenerate` | exposed fn | `llmAdapter.ts` | OK |
| `llmAbort` | exposed fn | `llmAdapter.ts` | **MISMATCH — 채널명** |
| `llmStart` | exposed fn | `llmAdapter.ts` | OK |
| `llmStop` | exposed fn | `llmAdapter.ts` | OK |
| `llmCheckHealth` | exposed fn | `llmAdapter.ts` | OK |
| `llmListModels` | exposed fn | `llmAdapter.ts` | OK |
| `llmImportModel` | exposed fn | `llmAdapter.ts` | OK |
| `llmGetLogs` | exposed fn | `llmAdapter.ts` | OK |
| `llmAddLog` | exposed fn | `llmAdapter.ts` | OK |
| `onLLMToken` | exposed fn | `llmAdapter.ts` | OK |
| `onLLMDone` | exposed fn | `llmAdapter.ts` | OK |
| `onLLMLog` | exposed fn | `llmAdapter.ts` | OK |
| `onModelDownloadProgress` | exposed fn | `llmAdapter.ts` | OK |
| `llmDownloadModel` | exposed fn | `llmAdapter.ts` | OK |
| `llmRestart` | exposed fn | `llmAdapter.ts` | OK |
| `llmGetGpuName` | exposed fn | `llmAdapter.ts` | OK |
| `llmGetLogs` | exposed fn | `llmAdapter.ts` | OK |
| `sttTranscribe` | exposed fn | **없음** | **BROKEN — renderer adapter 없음** |
| `sttGetTempPath` | exposed fn | **없음** | **BROKEN — renderer adapter 없음** |
| `mcpSpawn` | exposed fn | `mcpAdapter.ts` | OK |
| `mcpCall` | exposed fn | `mcpAdapter.ts` | OK |
| `mcpKill` | exposed fn | `mcpAdapter.ts` | OK |
| `mcpGetToken` | exposed fn | `mcpAdapter.ts` | OK |
| `keychainGet` | exposed fn | `keychainAdapter.ts` | OK |
| `keychainSet` | exposed fn | `keychainAdapter.ts` | OK |
| `keychainDelete` | exposed fn | `keychainAdapter.ts` | OK |
| `planGetStatus` | exposed fn | `appAdapter.ts` | OK |
| `planSetStatus` | exposed fn | `appAdapter.ts` | OK |
| `isFreeMode` | exposed fn | `appAdapter.ts` | OK |
| `printToPDF` | exposed fn | `exportAdapter.ts` | OK |
| `saveExportedFile` | exposed fn | `exportAdapter.ts` | OK |
| `exportConvert` | exposed fn | `exportAdapter.ts` | OK |
| `onExportProgress` | exposed fn | `exportAdapter.ts` | **WARN — 구독자 없음** |
| `runPythonCode` | exposed fn | `sandboxAdapter.ts` | WARN (항상 실패) |
| `webSearch` | exposed fn | `sandboxAdapter.ts` | OK |
| `startCollaborationServer` | exposed fn | `collabAdapter.ts` | OK |
| `stopCollaborationServer` | exposed fn | `collabAdapter.ts` | OK |
| `onServerStatus` | exposed fn | `collabAdapter.ts` | OK |
| `setZoomLevel` | exposed fn | `appAdapter.ts` | OK |
| `getZoomLevel` | exposed fn | `appAdapter.ts` | OK |
| `setZoomFactor` | exposed fn | `appAdapter.ts` | OK |
| `getZoomFactor` | exposed fn | `appAdapter.ts` | OK |
| `showMessageBox` | exposed fn | `appAdapter.ts` | OK |
| `newWindow` | exposed fn | `appAdapter.ts` | OK |
| `closeApp` | exposed fn | `appAdapter.ts` | OK |

### `src/main/services/llmProcessManager.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `LLMProcessManager` (class) | class | `llmLifecycleIpc.ts`, `llmGenerateIpc.ts`, `sttIpc.ts` | OK |
| `findLlamaCli()` | static method | `llmLifecycleIpc.ts` | OK |
| `findWhisperCli()` | static method | `sttIpc.ts` | OK |
| `forceCleanupLocalLLMProcesses()` | static method | `index.ts` | OK |
| `activeLLMProcess` | static var | `llmLifecycleIpc.ts`, `llmGenerateIpc.ts` | OK |
| `activeServerProcess` | static var | `llmLifecycleIpc.ts`, `llmGenerateIpc.ts` | OK |
| `serverPort` | static var | `llmGenerateIpc.ts` | OK |
| `formatters` | static var | 내부 | OK |

### `src/main/services/mcpProcessManager.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `MCPProcessManager` (class) | class | `mcpIpc.ts` | OK |
| `spawnServer()` | static method | `mcpIpc.ts` | OK |
| `callServer()` | static method | `mcpIpc.ts` | OK |
| `killServer()` | static method | `mcpIpc.ts` | OK |
| `killAll()` | static method | `index.ts` (will-quit) | OK |

### `src/main/services/planState.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `isFreeModeRequested` | const | `planState.ts` 내부, `llmIpc.ts`? | OK |
| `getProPlanMemory()` | function | `mcpIpc.ts`, `fileIpc.ts` | OK |
| `setProPlanMemory()` | function | `planIpc.ts` | OK |

---

## 2. Renderer Stores

### `useUIStore.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `isSettingsOpen` | state | 컴포넌트 | OK |
| `setIsSettingsOpen` | action | 컴포넌트 | OK |
| `isAboutOpen` | state | 컴포넌트 | OK |
| `setIsAboutOpen` | action | 컴포넌트 | OK |
| `isGuideOpen` | state | 컴포넌트 | OK |
| `setIsGuideOpen` | action | 컴포넌트 | OK |
| `isDiffOpen` | state | 컴포넌트 | OK |
| `setIsDiffOpen` | action | 컴포넌트 | OK |
| `isMarketplaceModalOpen` | state | 컴포넌트 | OK |
| `setIsMarketplaceModalOpen` | action | 컴포넌트 | OK |
| `isPricingModalOpen` | state | 컴포넌트 | OK |
| `setIsPricingModalOpen` | action | 컴포넌트 | OK |
| `isModelHubOpen` | state | 컴포넌트 | OK |
| `setIsModelHubOpen` | action | 컴포넌트 | OK |
| `isSidebarOpen` | state | 컴포넌트 | OK |
| `setIsSidebarOpen` | action | 컴포넌트 | OK |
| `isStatusBarVisible` | state | 컴포넌트 | OK |
| `setIsStatusBarVisible` | action | 컴포넌트 | OK |
| `isChatFloatingMode` | state | 컴포넌트 | OK |
| `setIsChatFloatingMode` | action | 컴포넌트 | OK |
| `activeRightTab` | state | 컴포넌트 | OK |
| `setActiveRightTab` | action | 컴포넌트 | OK |
| `toastMessage` | state | 컴포넌트 | OK |
| `setToastMessage` | action | `useAppIpcBridge.ts` | OK |
| `toggleSettings` | action | **소비자 없음** | Dead |
| `toggleAbout` | action | **소비자 없음** | Dead |
| `toggleGuide` | action | **소비자 없음** | Dead |
| `toggleDiff` | action | **소비자 없음** | Dead |
| `toggleMarketplaceModal` | action | **소비자 없음** | Dead |
| `togglePricingModal` | action | **소비자 없음** | Dead |
| `toggleModelHub` | action | **소비자 없음** | Dead |
| `toggleSidebar` | action | **소비자 없음** | Dead |
| `toggleStatusBar` | action | **소비자 없음** | Dead |
| `toggleChatFloating` | action | **소비자 없음** | Dead |
| `toggleRightTab` | action | **소비자 없음** | Dead |

### `useWorkspaceStore.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `filePath` | state | `useAppFileOperations` 등 | OK |
| `setFilePath` | action | `useAppFileOperations` | OK |
| `currentContent` | state | `App.tsx`, `useAppFileOperations` | OK |
| `setCurrentContent` | action | `useAppFileOperations` | OK |
| `appendContent` | action | 컴포넌트 | OK |
| `originalContent` | state | `useAppFileOperations` | OK |
| `setOriginalContent` | action | `useAppFileOperations` | OK |
| `lastSavedTime` | state | StatusBar | OK |
| `setLastSavedTime` | action | `useAppFileOperations` | OK |
| `fileOpenMode` | state | `useAppFileOperations` | OK |
| `setFileOpenMode` | action | 컴포넌트 | OK |
| `tabs` | state | `App.tsx` | OK |
| `setTabs` | action | `useAppFileOperations` | OK |
| `addTab` | action | `useAppFileOperations` | OK |
| `removeTab` | action | **소비자 없음** | Dead |
| `updateActiveTab` | action | `useAppFileOperations` | OK |
| `updateTab` | action | `useAppFileOperations` | OK |
| `activeTabId` | state | `App.tsx` | OK |
| `setActiveTabId` | action | `useAppFileOperations` | OK |
| `appendedFiles` | state | `useAppFileOperations` | OK |
| `setAppendedFiles` | action | `useAppFileOperations` | OK |
| `addAppendedFile` | action | **소비자 없음** | Dead |
| `selectedText` | state | `AIPanel`, `App.tsx` | OK |
| `setSelectedText` | action | 컴포넌트 | OK |
| `activeBlockId` | state | 컴포넌트 | OK |
| `setActiveBlockId` | action | 컴포넌트 | OK |
| `taggedBlocks` | state | `useAIGenerator` 등 | OK |
| `setTaggedBlocks` | action | 컴포넌트 | OK |
| `addTaggedBlock` | action | **소비자 없음** | Dead |
| `removeTaggedBlock` | action | **소비자 없음** | Dead |
| `selectedSnapshot` | state | `DiffModal` | OK |
| `setSelectedSnapshot` | action | 컴포넌트 | OK |

### `useProcessStore.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `downloadStatus` | state | `App.tsx` | OK |
| `setDownloadStatus` | action | `useAppIpcBridge` | OK |
| `exportProgress` | state | `ExportModal` | OK |
| `setExportProgress` | action | `useAppExport` | OK |
| `updateExportProgress` | action | `useAppExport` | OK |
| `resetExportProgress` | action | **소비자 없음** | Dead |
| `exportMinimized` | state | `ExportModal` | OK |
| `setExportMinimized` | action | `useAppExport` | OK |
| `toggleExportMinimized` | action | `ExportModal` | OK |
| `isProPlan` | state | `App.tsx`, 기타 | OK |
| `setIsProPlan` | action | `useAppBootstrap` | OK |
| `isFreeModeLocked` | state | **읽기 소비자 없음** | Zombie |
| `setIsFreeModeLocked` | action | `useAppBootstrap` | OK (쓰기만) |
| `mcpServersState` | state | 컴포넌트 | OK |
| `setMcpServersState` | action | `useAppBootstrap` | OK |
| `activePlugins` | state | **소비자 없음** | Dead |
| `setActivePlugins` | action | **소비자 없음** | Dead |
| `editorZoom` | state | `App.tsx` 등 | OK |
| `setEditorZoom` | action | `useAppSettingsManager` | OK |
| `adjustEditorZoom` | action | `useAppSettingsManager` | OK |
| `browserZoom` | state | `useAppBootstrap` | OK |
| `setBrowserZoom` | action | `useAppBootstrap` | OK |
| `adjustBrowserZoom` | action | 컴포넌트 | OK |

### `useAIState.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `isGenerating` | state | `useAIAgent`, `App.tsx` | OK |
| `setIsGenerating` | action | `useAIAgent` | OK |
| `settings` | state | `useAISettings`, `useAIGenerator` | OK |
| `updateSettings` | action | `useAI` facade | OK |
| `isAvailable` | state | `AIStatusIndicator` 등 | OK |
| `setIsAvailable` | action | `useLocalAIEngine` | OK |
| `models` | state | AIPanel | OK |
| `setModels` | action | `useLocalAIEngine` | OK |
| `codeModels` | state | AIPanel | OK |
| `setCodeModels` | action | `useLocalAIEngine` | OK |
| `pendingQueue` | state | `useAI` facade | OK |
| `setPendingQueue` | action | **소비자 없음** | Dead |
| `addPendingQueue` | action | **소비자 없음** | Dead |
| `clearPendingQueue` | action | **소비자 없음** | Dead |
| `removeFromQueue` | action | `useAI` facade | OK |

### `useAILogStore.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `sensorLogs` | state | AIPanel 등 | OK |
| `addSensorLog` | action | `useLocalAIEngine`, `useAIEngineLogs` | OK |
| `clearSensorLogs` | action | 컴포넌트 | OK |
| `messages` | state | `useAI` facade, AIPanel | OK |
| `setMessages` | action | `useAIGenerator`, `useAIAgent` | OK |
| `addMessage` | action | 잠재 소비자 있음 | OK |
| `updateMessage` | action | 잠재 소비자 있음 | OK |
| `deleteMessage` | action | 잠재 소비자 있음 | OK |
| `clearMessages` | action | 잠재 소비자 있음 | OK |
| `streamingText` | state | `useAIAgent`, AIPanel | OK |
| `setStreamingText` | action | `useAIGenerator`, `useAIAgent` | OK |
| `_flushExternalLogs` | action | BroadcastChannel | OK |

### `useAICollabStore.ts`

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `connectedUsers` | state | **소비자 없음** | Dead |
| `updateUser` | action | **소비자 없음** | Dead |
| `removeUser` | action | **소비자 없음** | Dead |
| `clearUsers` | action | **소비자 없음** | Dead |

---

## 3. Renderer Hooks

### `src/renderer/hooks/app/`

| 심볼 | 소비자 | 상태 |
|---|---|---|
| `useAppBootstrap` | `App.tsx` | OK |
| `useAppIpcBridge` | `App.tsx` | OK |
| `useAppFileOperations` | `App.tsx` | OK |
| `useAppSettingsManager` | `App.tsx` | OK |
| `useAppExport` | `App.tsx` | OK |
| `useAppEditorInit` | `App.tsx` | OK |
| `useAppSnapshot` | `App.tsx` | OK |
| `handleElectronExport` | `useAppExport` | OK |
| `handleBrowserExport` | `useAppExport` | OK |

### `src/renderer/hooks/ai/`

| 심볼 | 소비자 | 상태 |
|---|---|---|
| `useAISettings` | `useAIAgent` | OK |
| `useAIModels` | `useAIAgent` | OK |
| `useAIHealthCheck` | `useAIAgent` | OK |
| `useAIIpc` | `useAIAgent` | OK |
| `useAIStreamProcessor` | `useAIAgent` | OK |
| `useAIMessageState` | `useAIAgent` | OK |
| `useAIQueue` | `useAIAgent` | OK |
| `useAIEngineLogs` | `useAIAgent` | OK |
| `useAIBlockProcessor` | `useAIAgent` | OK |
| `useAIResponseHandler` | `useAIAgent` | OK |
| `useAIGenerator` | `useAIAgent` | OK |
| `useAIAgentMode` | **소비자 없음** | **ZOMBIE** |
| `useAIRAG` | `useAIPanelLogic` | Indirect |
| `useAIModelHub` | `useAIPanelLogic` | Indirect |
| `useAIPanelLogic` | 컴포넌트? | 확인 필요 |
| `useAIPanelScroll` | 컴포넌트? | 확인 필요 |
| `useAIPanelState` | 컴포넌트? | 확인 필요 |
| `useAIKeychain` | 컴포넌트? | 확인 필요 |

### `src/renderer/hooks/`

| 심볼 | 소비자 | 상태 |
|---|---|---|
| `useAI` | AIPanel 등 | OK |
| `useLocalAIEngine` | `useAIAgent` | OK |
| `useAIAgent` | `useAI` | OK |
| `useCodeRuntime` | 컴포넌트 | OK |
| `useCollaboration` | `MarkdownEditor` | OK |
| `useHistory` | `App.tsx` | OK |

---

## 4. Renderer Services (IPC)

### `src/renderer/services/ipc/adapters/`

| 파일 | 상태 |
|---|---|
| `llmAdapter.ts` | OK — 전체 함수 연결됨 |
| `fileAdapter.ts` | WARN — `saveFileAs` preload 미노출 |
| `appAdapter.ts` | OK |
| `keychainAdapter.ts` | OK |
| `mcpAdapter.ts` | OK |
| `exportAdapter.ts` | WARN — `onExportProgress` 구독자 없음 |
| `sandboxAdapter.ts` | WARN — `runPythonCode` 항상 실패 |
| `collabAdapter.ts` | OK |
| `sttAdapter.ts` | **없음** — BROKEN |

### `src/renderer/services/ai/`

| 심볼 | 소비자 | 상태 |
|---|---|---|
| `determineIntent` | `useAIGenerator` | OK |
| `detectCodingRequest` | `useAIGenerator` | OK |
| `checkUsageLimit` | `useAIGenerator` | OK |
| `incrementUsageCount` | `useAIGenerator` | OK |
| `buildSystemPrompt` | `useAIGenerator` | OK |
| `agentTools.registerAgentTools` | `useAIAgentMode` (미연결) | Zombie |
| `agentPromptFactory.buildAgentQuery` | `useAIAgentMode` (미연결) | Zombie |
| `agentPromptFactory.getAgentSystemPrompt` | `useAIAgentMode` (미연결) | Zombie |
| `agentStockCard.parseStockDataAndGenerateCard` | `useAIAgentMode` (미연결, 오류) | BROKEN |
| `analyzeApiKey` | `useAIKeychain`? | 확인 필요 |

---

## 5. Main Process Exporters

| 심볼 | 종류 | 소비자 | 상태 |
|---|---|---|---|
| `blocksToHTML` | function | `fileIpc.ts` | OK |
| `exportToXML` | function | `fileIpc.ts` | OK |
| `exportToWord` | function | `fileIpc.ts` | OK |
| `exportToExcel` | function | `fileIpc.ts` | OK |
| `exportToPPTX` | function | `fileIpc.ts` | OK |
| `exportToHWPX` | function | `fileIpc.ts` | OK |

---

## 6. Shared Types

### `src/shared/types.ts`

| 타입 | 소비자 | 상태 |
|---|---|---|
| `ExportFormat` | `useAppExport`, `fileIpc` | OK |
| `EditorMode` | `useAppFileOperations` | OK |
| `ExportProgress` | `useProcessStore` | OK |
| `PeerState` | `useCollaboration` | OK |

### `src/renderer/types/aiTypes.ts`

| 타입 | 소비자 | 상태 |
|---|---|---|
| `AIMessage` | `useAILogStore`, `useAIAgent`, 컴포넌트 | OK (직접) |
| `AISettings` | `useAIState`, `useAIGenerator` | OK (직접) |
| `InsertSuggestion` | AI 컴포넌트 | WARN — 잘못된 경로로 import 시도 |

### `src/renderer/services/ipc/ipcTypes.ts`

| 타입 | 소비자 | 상태 |
|---|---|---|
| `LLMGenerateParams` | `llmAdapter`, `llmGenerateIpc` | OK |
| `LLMGenerateResult` | `llmAdapter`, `llmGenerateIpc` | OK |
| `LLMDoneEventData` | `llmAdapter`, `useAIIpc` | OK |
| `LLMLogEventData` | `llmAdapter` | OK |
| `ModelInfo` | `llmAdapter`, `SettingsModal` | WARN (name 옵셔널 불일치) |
| `UrlMetadata` | `fileAdapter` | OK |
| `FileOpenEventData` | `fileAdapter`, `useAppIpcBridge` | OK |
| `HealthCheckResult` | `llmAdapter` | OK |
| `ModelImportResult` | `llmAdapter` | OK |
| `ModelDownloadProgressEvent` | `llmAdapter`, `useAppIpcBridge` | OK |
| `ExportProgressEvent` | `exportAdapter` | WARN (구독자 없음) |
