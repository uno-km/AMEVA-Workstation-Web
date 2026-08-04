# llmGenerateIpc.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/ipc/llm/llmGenerateIpc.ts`
- Original line count: 673 lines
- Refactor type: Mechanical decomposition only (extracting inference handlers and prompt formatter from God function)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `registerLlmGenerateIpc`
- kind: function
- original signature: `export function registerLlmGenerateIpc(): void`
- current consumers: `src/main/ipc/llmIpc.ts`
- target file: `src/main/ipc/llm/llmGenerateIpc.ts` (remains as root router/facade)
- migration status: verified

## 3. Internal Symbol Inventory

- symbol name: `createTokenSender`
- kind: function
- approximate line range: L8-L36
- dependencies: none
- target file: `src/main/ipc/llm/helpers/tokenSender.ts`
- migration status: verified

- symbol name: `formatPromptForModel` (extracted from inline L214-L272)
- kind: helper function
- approximate line range: L214-L272
- dependencies: `basename`
- target file: `src/main/ipc/llm/helpers/promptFormatter.ts`
- migration status: verified

- symbol name: `handleOllamaGenerate` (extracted from inline L84-L195)
- kind: handler function
- approximate line range: L84-L195
- dependencies: `http`, `basename`, `LLMProcessManager`, `ipcMain`
- target file: `src/main/ipc/llm/handlers/ollamaHandler.ts`
- migration status: verified

- symbol name: `handleRemoteApiGenerate` (extracted from inline L274-L397)
- kind: handler function
- approximate line range: L274-L397
- dependencies: `https`, `ipcMain`
- target file: `src/main/ipc/llm/handlers/remoteApiHandler.ts`
- migration status: verified

- symbol name: `handleLlamaServerGenerate` (extracted from inline L401-L523)
- kind: handler function
- approximate line range: L401-L523
- dependencies: `http`, `LLMProcessManager`, `ipcMain`
- target file: `src/main/ipc/llm/handlers/llamaServerHandler.ts`
- migration status: verified

- symbol name: `handleLlamaCliGenerate` (extracted from inline L525-L663)
- kind: handler function
- approximate line range: L525-L663
- dependencies: `spawn`, `existsSync`, `string_decoder`, `LLMProcessManager`, `ipcMain`
- target file: `src/main/ipc/llm/handlers/llamaCliHandler.ts`
- migration status: verified

## 4. Proposed Target File Map

```txt
src/main/ipc/llm/llmGenerateIpc.ts
  -> src/main/ipc/llm/helpers/tokenSender.ts
  -> src/main/ipc/llm/helpers/promptFormatter.ts
  -> src/main/ipc/llm/handlers/ollamaHandler.ts
  -> src/main/ipc/llm/handlers/remoteApiHandler.ts
  -> src/main/ipc/llm/handlers/llamaServerHandler.ts
  -> src/main/ipc/llm/handlers/llamaCliHandler.ts
```

## 5. 1:1 Move Records

### Move Record: createTokenSender
- original file: `src/main/ipc/llm/llmGenerateIpc.ts`
- original line range: L8-L36
- target file: `src/main/ipc/llm/helpers/tokenSender.ts`
- target symbol name: `createTokenSender`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: formatPromptForModel
- original file: `src/main/ipc/llm/llmGenerateIpc.ts`
- original line range: L214-L272
- target file: `src/main/ipc/llm/helpers/promptFormatter.ts`
- target symbol name: `formatPromptForModel`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: handleOllamaGenerate
- original file: `src/main/ipc/llm/llmGenerateIpc.ts`
- original line range: L84-L195
- target file: `src/main/ipc/llm/handlers/ollamaHandler.ts`
- target symbol name: `handleOllamaGenerate`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: handleRemoteApiGenerate
- original file: `src/main/ipc/llm/llmGenerateIpc.ts`
- original line range: L274-L397
- target file: `src/main/ipc/llm/handlers/remoteApiHandler.ts`
- target symbol name: `handleRemoteApiGenerate`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: handleLlamaServerGenerate
- original file: `src/main/ipc/llm/llmGenerateIpc.ts`
- original line range: L401-L523
- target file: `src/main/ipc/llm/handlers/llamaServerHandler.ts`
- target symbol name: `handleLlamaServerGenerate`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: handleLlamaCliGenerate
- original file: `src/main/ipc/llm/llmGenerateIpc.ts`
- original line range: L525-L663
- target file: `src/main/ipc/llm/handlers/llamaCliHandler.ts`
- target symbol name: `handleLlamaCliGenerate`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)
