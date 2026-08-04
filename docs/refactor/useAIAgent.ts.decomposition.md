# useAIAgent.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/hooks/useAIAgent.ts`
- Original line count: 633 lines
- Refactor type: Mechanical decomposition only (extracting inline settings, models, health check, generator, response handler, and block processor into specialized sub-hooks in `src/renderer/hooks/ai/`)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `useAIAgent`
- kind: hook
- original signature: `export function useAIAgent()`
- current consumers: `src/renderer/hooks/useAI.ts`
- target file: `src/renderer/hooks/useAIAgent.ts` (remains as root facade hook)
- migration status: verified

## 3. Internal Symbol Inventory

- symbol name: `useAISettings` (extracted from inline L57-L81 & L512-L524)
- kind: hook
- approximate line range: L57-L81, L512-L524
- dependencies: `useState`, `useCallback`, `AISettings`, `DEFAULT_SETTINGS`
- target file: `src/renderer/hooks/ai/useAISettings.ts`
- migration status: verified

- symbol name: `useAIModels` (extracted from inline L117-L170)
- kind: hook
- approximate line range: L117-L170
- dependencies: `useCallback`, `useEffect`, `ipc`, `useAIState`
- target file: `src/renderer/hooks/ai/useAIModels.ts`
- migration status: verified

- symbol name: `useAIHealthCheck` (extracted from inline L173-L205)
- kind: hook
- approximate line range: L173-L205
- dependencies: `useEffect`, `ipc`, `useAIState`
- target file: `src/renderer/hooks/ai/useAIHealthCheck.ts`
- migration status: verified

- symbol name: `useAIBlockProcessor` (extracted from inline L527-L591)
- kind: hook
- approximate line range: L527-L591
- dependencies: `useCallback`, `ipc`, `AISettings`
- target file: `src/renderer/hooks/ai/useAIBlockProcessor.ts`
- migration status: verified

- symbol name: `useAIResponseHandler` (extracted from inline L363-L489)
- kind: hook
- approximate line range: L363-L489
- dependencies: `useCallback`, `parseEditSuggestion`, `parseInsertSuggestions`, `useAIMessageState`
- target file: `src/renderer/hooks/ai/useAIResponseHandler.ts`
- migration status: verified

- symbol name: `useAIGenerator` (extracted from inline L211-L356)
- kind: hook
- approximate line range: L211-L356
- dependencies: `useCallback`, `determineIntent`, `detectCodingRequest`, `checkUsageLimit`, `buildSystemPrompt`, `ipc`, `useAIQueue`, `useAIIpc`, `useAIStreamProcessor`
- target file: `src/renderer/hooks/ai/useAIGenerator.ts`
- migration status: verified

## 4. Proposed Target File Map

```txt
src/renderer/hooks/useAIAgent.ts
  -> src/renderer/hooks/ai/useAISettings.ts
  -> src/renderer/hooks/ai/useAIModels.ts
  -> src/renderer/hooks/ai/useAIHealthCheck.ts
  -> src/renderer/hooks/ai/useAIBlockProcessor.ts
  -> src/renderer/hooks/ai/useAIResponseHandler.ts
  -> src/renderer/hooks/ai/useAIGenerator.ts
```

## 5. 1:1 Move Records

### Move Record: useAISettings
- original file: `src/renderer/hooks/useAIAgent.ts`
- original line range: L57-L81, L512-L524
- target file: `src/renderer/hooks/ai/useAISettings.ts`
- target symbol name: `useAISettings`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors)

### Move Record: useAIModels
- original file: `src/renderer/hooks/useAIAgent.ts`
- original line range: L117-L170
- target file: `src/renderer/hooks/ai/useAIModels.ts`
- target symbol name: `useAIModels`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors)

### Move Record: useAIHealthCheck
- original file: `src/renderer/hooks/useAIAgent.ts`
- original line range: L173-L205
- target file: `src/renderer/hooks/ai/useAIHealthCheck.ts`
- target symbol name: `useAIHealthCheck`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors)

### Move Record: useAIBlockProcessor
- original file: `src/renderer/hooks/useAIAgent.ts`
- original line range: L527-L591
- target file: `src/renderer/hooks/ai/useAIBlockProcessor.ts`
- target symbol name: `useAIBlockProcessor`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors)

### Move Record: useAIResponseHandler
- original file: `src/renderer/hooks/useAIAgent.ts`
- original line range: L363-L489
- target file: `src/renderer/hooks/ai/useAIResponseHandler.ts`
- target symbol name: `useAIResponseHandler`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors)

### Move Record: useAIGenerator
- original file: `src/renderer/hooks/useAIAgent.ts`
- original line range: L211-L356
- target file: `src/renderer/hooks/ai/useAIGenerator.ts`
- target symbol name: `useAIGenerator`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors)
