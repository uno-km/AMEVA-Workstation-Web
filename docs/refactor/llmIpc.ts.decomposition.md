# llmIpc.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/ipc/llmIpc.ts`
- Original line count: ~645 lines
- Refactor type: Mechanical decomposition only (Facade pattern + Domain isolation)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `registerLlmIpc`
- kind: function
- original signature: `export function registerLlmIpc(): void`
- current consumers: `src/main/index.ts`
- target file: `src/main/ipc/llmIpc.ts` (Facade)
- migration status: pending -> facade

## 3. Internal Symbol & Handler Inventory

### Group 1: Lifecycle & Status & Logs (`src/main/ipc/llm/llmLifecycleIpc.ts`)
- `llm:add-log`
- `llm:get-logs`
- `llm:check-health`
- `llm:restart`
- `llm:start`
- `llm:stop`
- `llm:is-free-mode`
- `plan:get-status`
- `plan:set-status`
- `llm:getGpuName`

### Group 2: Generation & Streaming (`src/main/ipc/llm/llmGenerateIpc.ts`)
- `createTokenSender(event, sessionId)`
- `llm:generate`
- `llm:abort`

### Group 3: Model Hub & Download (`src/main/ipc/llm/llmModelIpc.ts`)
- `activeDownloadRequest`
- `ALLOWED_DOWNLOAD_HOSTS`
- `MAX_REDIRECT_DEPTH`
- `llm:listModels`
- `llm:importModel`
- `llm:downloadModel`
- `llm:cancelDownload`

### Group 4: Whisper STT (`src/main/ipc/llm/sttIpc.ts`)
- `stt:transcribe`
- `stt:getTempPath`

## 4. Proposed Target File Map

```txt
src/main/ipc/llmIpc.ts (Facade)
  -> src/main/ipc/llm/llmLifecycleIpc.ts (registerLlmLifecycleIpc)
  -> src/main/ipc/llm/llmGenerateIpc.ts (registerLlmGenerateIpc)
  -> src/main/ipc/llm/llmModelIpc.ts (registerLlmModelIpc)
  -> src/main/ipc/llm/sttIpc.ts (registerSttIpc)
```

## 5. 1:1 Move Records & Verification

- Name changed: No
- Signature changed: No
- Behavior changed: No
- Verification strategy: `npx tsc --noEmit` and Facade re-export check.
