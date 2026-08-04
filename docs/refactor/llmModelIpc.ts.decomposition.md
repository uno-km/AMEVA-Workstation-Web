# llmModelIpc.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/ipc/llm/llmModelIpc.ts`
- Original line count: 240 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `registerLlmModelIpc`
- kind: function
- original signature: `export function registerLlmModelIpc(): void`
- current consumers: `src/main/ipc/llmIpc.ts`
- target file: `src/main/ipc/llm/llmModelIpc.ts` (Facade)

## 3. Internal Symbol Inventory

- `llm:listModels` handler logic -> `src/main/ipc/llm/handlers/listModelsHandler.ts`
- `llm:importModel` handler logic -> `src/main/ipc/llm/handlers/importModelHandler.ts`
- `llm:downloadModel` and `llm:cancelDownload` handler logic -> `src/main/ipc/llm/handlers/downloadModelHandler.ts`

## 4. Proposed Target File Map

```txt
src/main/ipc/llm/llmModelIpc.ts
  -> src/main/ipc/llm/handlers/listModelsHandler.ts
  -> src/main/ipc/llm/handlers/importModelHandler.ts
  -> src/main/ipc/llm/handlers/downloadModelHandler.ts
  -> src/main/ipc/llm/llmModelIpc.ts (Facade preserving export)
```

## 5. 1:1 Move Records

### Move Record: listModelsHandler
- original file: `src/main/ipc/llm/llmModelIpc.ts`
- original line range: L23-L79
- target file: `src/main/ipc/llm/handlers/listModelsHandler.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: importModelHandler
- original file: `src/main/ipc/llm/llmModelIpc.ts`
- original line range: L81-L101
- target file: `src/main/ipc/llm/handlers/importModelHandler.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: downloadModelHandler
- original file: `src/main/ipc/llm/llmModelIpc.ts`
- original line range: L5-L17, L103-L261
- target file: `src/main/ipc/llm/handlers/downloadModelHandler.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)
