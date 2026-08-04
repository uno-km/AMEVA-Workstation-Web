# AMEVA OS Architecture Specification

## 1. System Overview
AMEVA OS is a serverless local AI & WASM hybrid operating system that executes commands inside a browser sandbox and acts as an MCP server.

## 2. Core Modules

### 2.1 AI Engine Layer
- **`useLocalAIEngine.ts`**: Handles Llama.cpp CLI execution via Electron IPC, streaming tokens, and managing model processes.
- **`useRemoteAIEngine.ts`**: Manages API/Ollama connections for remote/cloud inference.

### 2.2 Store Layer (Zustand)
- **`useAIState.ts`**: Manages global UI settings, current models, and generation status.
- **`useAILogStore.ts`**: Manages sensor logs, chat messages, and transient updates.
  - *Note*: Implements a Ring Buffer pattern for sensor logs to prevent memory leaks.
  - *Note*: Implements a debounced Batch Update for sensor logs to prevent CPU thrashing.
  - *Note*: Utilizes `BroadcastChannel` to synchronize transient logs across local client instances without writing them to the persistent Yjs CRDT model.
- **`useWorkspaceStore.ts`**: 워크스페이스 문서 내용 및 다중 탭 상태를 관리.
- **`useUIStore.ts`**: 모달, 패널, 레이아웃 상태 및 전역 `baseZIndex`를 관리.
  - *Critical Performance Rule*: 스토어의 `baseZIndex` 등 전역 UI 상태 변화가 전체 렌더링에 미치는 영향을 최소화하기 위해, 컨테이너 컴포넌트(예: `App.tsx`, `ModalManager.tsx`)에서 이 스토어를 구독할 때는 반드시 `useShallow`를 활용하여 개별 속성을 선택적으로 구독해야 합니다.
- **`FreeModal` z-index 가드 규칙**: `FreeModal` 컴포넌트 내부 포커스 핸들러에서 중복 `bringToFront()` 호출로 인한 무한 렌더링 루프를 차단하기 위해, 모달의 현재 z-index가 전역 최상위 z-index(`baseZIndex`)보다 작을 때만 상태 업데이트를 수행하는 방어 가드를 적용합니다.

### 2.3 Presentation Layer
- **`AIPanel.tsx`**: The main terminal interface. Acts as a layout wrapper and orchestrator for tabs. Includes the `UtilityPanelHeader` for Non-AI tabs providing screen capture, text search, and editor text insertion.
- **`AIChatInput.tsx`**: (Presentational + Direct Subscription) Handles prompt input and AI generation triggering. Directly subscribes to `useAI()`.
- **`AIChatList.tsx`**: (Container) Renders the virtualized list of AI messages.
- **`MessageBubble.tsx`**: (Presentational) Renders individual chat messages and parses markdown.
- **`InsertPreviewCard.tsx`**: (Presentational) Renders the inline UI for AI text insertion/modification suggestions.
- **`AppLayout.tsx`**: (Container + Layout) Root presentation container rendering `MenuBar`, `Sidebar`, `MarkdownEditor`, `Minimap`, `AIPanel`, `RightTabStrip`, `StatusBar`, and modals.
- **`FinanceDashboardView.tsx`**: (Container) Renders global stock indices, currency rates, bonds, and custom watchlists. Features custom context menus (`StockContextMenu`) and smooth accordion news feeds.
- **`DrawingBlock.tsx`**: (Presentational + Dynamic Import) BlockNote editor plugin block displaying either the rich vector-based Excalidraw canvas with dynamic chunk retry handlers, or a canvas API-based drawing pad fallback when offline or timed out.
- **`InlineDrawingRenderer.tsx`**: (Presentational) MarkdownPreview sub-component parsing `ameva-drawing` JSON codeblocks and restoring read-only Excalidraw layouts or fallback sketchpads in preview mode.

### 2.4 Utility Layer
- **`fileConverters.ts`**: Standalone utility module encapsulating base64 conversions, file parsing, and docx/xlsx/hwpx/pdf exporters to keep React hooks lightweight and focused.
- **`analyzeApiKey.ts`**: Centralized API key parser evaluating provided credentials against strict patterns to automatically extract provider endpoints and default models.
- **`constants.ts` (src/renderer/components/ai/)**: Domain-specific local constants (3-Tier Constants Rule) hosting mock news feeds, utility tab labels, and search highlighting CSS styles.

### 2.5 IPC Bridge Layer
- **`electronApiAdapter.ts`**: Unifies and wraps all IPC invocations to safe Electron contexts. Restricts renderer code from bypassing this layer to directly access the global window API.
- **`preload.ts` & `index.ts`**: Serves as the security and message mapping boundary between the Electron renderer and native main process.

### 2.6 Main Process & IPC Domain Layer
- **`index.ts` (Coordinator)**: Slim main process entrypoint (~220 lines) responsible for app bootstrap, window creation, and delegating domain registration.
- **`fileIpc.ts`**: Handles native file dialogs, file reads/writes, and directory listing.
- **`mcpIpc.ts`**: Handles Model Context Protocol server spawning, proxying, tool calls, and lifecycle management.
- **`pythonIpc.ts`**: Handles embedded Python environment execution, virtual environments, and package installations.
- **`llmIpc.ts` (Facade)**: Unifies AI engine IPC handlers while delegating implementation to specialized sub-modules:
  - `llm/llmLifecycleIpc.ts`: Engine start, stop, restart, health check, logs, and GPU detection.
  - `llm/llmGenerateIpc.ts`: Token generation, streaming sender, and request abortion.
  - `llm/llmModelIpc.ts`: Local model enumeration, file import, HF downloads, and download cancellation.
  - `llm/sttIpc.ts`: Speech-to-Text audio transcription and temp directory allocation.

### 2.7 Exporters Engine Layer
- **`exportersMain.ts` (Facade)**: Main process coordinator for document exports, preserving 100% import compatibility.
- **`exporters/htmlExporter.ts`**: Handles HTML document packaging and XML serialization.
- **`exporters/officeExporter.ts`**: Handles Word (.docx), Excel (.xlsx), and PowerPoint (.pptx) document generation.
- **`exporters/hwpExporter.ts`**: Handles Korean Hangul (.hwpx) document generation.
- **`exporters/exportersHelper.ts`**: Shared formatting, escaping, and inline content transformation utilities.

### 2.8 Root Application Controller Layer
- **`App.tsx` (Root Coordinator)**: Slim top-level React component (~284 lines) orchestrating global state stores, hooks, and layout rendering.
- **`useAppSettingsManager.ts`**: Manages app settings, localStorage persistence, hotkey normalization, and plugin install/uninstall.
- **`useAppEditorInit.ts`**: Initializes BlockNoteEditor instance with collaborative Y.js provider or standalone local storage.
- **`useAppGlobalApi.ts`**: Registers window-level API bridges (`AMEVA_INSERT_TEXT_TO_EDITOR`, `AMEVA_ASK_AGENT`, etc.).
- **`useAppEditorSync.ts`**: Manages editor change listeners, heading markdown auto-formatting, URL link preview conversion, and auto-snapshot timers.
- **`useAppModeSwitch.ts`**: Manages transitions between editor modes (`edit`, `preview`, `raw`), welcome screen bootstrap, and document rollback.

### 2.9 Task Runtime & Execution Trace Layer (Phase 4)
- **`ExecutionTraceManager.ts`**: Central Gateway recording `mission_*`, `task_*`, `tool_*`, and `artifact_*` events. Enforces exact 1 terminal event per tool execution span via idempotency check (`isTerminalEventRecorded`).
- **`ExecutionTraceStore.ts`**: In-memory and persistent trace storage (`__trace_store__`). Implements `restore(missionId)` to automatically reconcile open (`RUNNING`/`STARTED`) spans into `INTERRUPTED` (`tool_execution_failed`) events upon runtime restart or recovery.
- **`SecretRedactor.ts`**: Implements immutable data copying (`redactArguments`, `redactEvent`) while masking passwords, API keys, Bearer tokens, and connection strings (`SENSITIVE_KEY_PATTERN`, `CONNECTION_STRING_REGEX`).
- **`ExecutionTraceViewModel.ts`**: UI Presentation Adapter applying visibility filtering (`filterByVisibility` blocking `INTERNAL` raw CoT) and preventing fake completion UI by marking uncommitted artifacts with `isFinalCommitted: false`.
- **`ToolApprovalPolicy.ts`**: Manages high-risk tool execution approvals, idempotency resolution (`idemp-appr-*`), and execution state restoration.

### 2.10 CSS Design System & Architecture
- **`src/renderer/styles/main.css`**: Central CSS entrypoint aggregating design tokens, base styles, layout grids, editor overrides, and modular component styles.
- **`variables.css`**: Defines global HSL/RGB design tokens, themes (`dark`, `light`, `white`), and z-index layers.
- **`base.css`**: Global resets, typography rules, scrollbars, and utility animations.
- **`layout.css`**: Main layout grid, split panes, titlebar spacers, and resize handle styles.
- **`editor.css`**: BlockNote editor theming, code block styling, and markdown preview overrides.
- **`components/*.css`**: Component-isolated styles (`Sidebar.css`, `AIPanel.css`, `StatusBar.css`, `MenuBar.css`, `Modals.css`).

### 2.10 Recovery Layer
- **`types.ts`**: 복구 상태(RecoveryState) 및 진행 단계(InferencePhase), 체크포인트 데이터 타입 선언.
- **`CheckpointSystem.ts`**: 5초 주기 비동기 IndexedDB 기반 에이전트 스냅샷 백업 시스템.
- **`FailureMemory.ts`**: 복구/실패 이력을 비동기 IndexedDB에 ReadOnly 형태로 누적 기록하는 이력 저장소.
- **`CriticAgent.ts`**: 룰 기반 N-gram(6자~15자 가변 윈도우 스캔) 무한 루프 및 10초 무반응 Heuristic 검수 에이전트.
- **`SupervisorAgent.ts`**: 토큰 방출 빈도를 측정하여 진행 단계를 추정하고 10초 주기 Watchdog 타이머로 오작동을 진단하는 감시자.
- **`RecoveryEngine.ts`**: Stalled/Dead 상태 진입 시 5단계 복구 사다리(Reconnection, Parser Reset, Stream Rebuild, Checkpoint Resume, User Assist) 프로토콜을 수행하는 회복 제어기.


### 2.11 Workbench Foundation Layer (Phase 6.1)
- **IWorkbenchHostAdapter**: Composition root for delegating OS-level operations (fileSystem, commandExecutor) out of Renderer.
- **WorkspaceIsolator**: Enforces large file policies, resolves atomic copy constraints, and blocks path traversal.
- **WorkbenchSessionManager**: Coordinates snapshot preparation, runs diff analysis, and evaluates verification rules before atomic commit.
- **WorkbenchCommandExecutor**: Interprets network isolation policy and evaluates command execution requests against allowed rules.

## 3. Mermaid Architecture Diagram

```mermaid
graph TD
    %% Main Process Layer
    subgraph Main Process [메인 프로세스 계층]
        MainIndex[index.ts<br>(Root Coordinator)]
        MainIndex --> FileIPC[fileIpc.ts]
        MainIndex --> McpIPC[mcpIpc.ts]
        MainIndex --> PythonIPC[pythonIpc.ts]
        MainIndex --> LlmIPC[llmIpc.ts<br>(Facade)]
        MainIndex --> ExportersMain[exportersMain.ts<br>(Facade)]
        
        LlmIPC --> LlmLife[llmLifecycleIpc.ts]
        LlmIPC --> LlmGen[llmGenerateIpc.ts]
        LlmIPC --> LlmMod[llmModelIpc.ts]
        LlmIPC --> SttIpc[sttIpc.ts]
        
        ExportersMain --> HtmlExp[htmlExporter.ts]
        ExportersMain --> OfficeExp[officeExporter.ts]
        ExportersMain --> HwpExp[hwpExporter.ts]
    end

    %% Stores (Zustand)
    subgraph Zustand Stores [상태 관리 계층]
        useAIState[useAIState<br>(상태/설정)]
        useAILogStore[useAILogStore<br>(메시지/스트리밍/센서로그)]
        useWorkspaceStore[useWorkspaceStore<br>(문서/탭/블록)]
        useUIStore[useUIStore<br>(모달/패널/테마)]
    end

    %% Renderer Controllers
    subgraph Renderer Controllers [렌더러 제어 계층]
        AppRoot[App.tsx<br>(Root Coordinator)]
        AppRoot --> AppSettingsMgr[useAppSettingsManager]
        AppRoot --> AppEditorInit[useAppEditorInit]
        AppRoot --> AppGlobalApi[useAppGlobalApi]
        AppRoot --> AppEditorSync[useAppEditorSync]
        AppRoot --> AppModeSwitch[useAppModeSwitch]
    end

    %% UI Components
    subgraph UI Layer [프레젠테이션 계층]
        AppLayout[AppLayout.tsx<br>(Presentation Container)]
        AppRoot --> AppLayout
        AppLayout --> MenuBar[MenuBar.tsx]
        AppLayout --> Sidebar[Sidebar.tsx]
        AppLayout --> MarkdownEditor[MarkdownEditor.tsx]
        AppLayout --> AIPanel[AIPanel.tsx]
        AppLayout --> StatusBar[StatusBar.tsx]
    end

    %% IPC Bridge
    subgraph IPC Bridge [IPC 브릿지 계층]
        Adapter[electronApiAdapter.ts]
    end

    %% Recovery Layer
    subgraph Recovery Layer [자가회복 계층]
        Supervisor[SupervisorAgent.ts<br>(Watchdog/Estimator)]
        Critic[CriticAgent.ts<br>(N-gram/Stall Heuristics)]
        Engine[RecoveryEngine.ts<br>(5-Level Ladder)]
        Checkpoint[CheckpointSystem.ts<br>(IndexedDB Backup)]
        FailMemory[FailureMemory.ts<br>(ReadOnly Log)]
    end

    AppLayout --> Adapter
    Adapter <-->|Electron IPC| MainIndex

    %% Recovery Relations
    Supervisor -.->|진단 통지| Engine
    Critic -.->|반복 감지| Engine
    Engine --> Checkpoint
    Engine --> FailMemory
    Engine -.->|복구 상태 갱신| useAIState
    AIPanel --> useAIState
```
