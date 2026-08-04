# useCodeRuntime.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/hooks/useCodeRuntime.ts`
- Original line count: 409 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `cleanupCodeRuntime`
- kind: function
- original signature: `export function cleanupCodeRuntime()`
- current consumers: `App.tsx` or similar app teardown
- target file: `src/renderer/hooks/code-runtime/runtimeState.ts` (State manager) + Facade re-export
- migration status: pending

- export name: `useCodeRuntime`
- kind: hook
- original signature: `export function useCodeRuntime(): { isRunning, runJSCode, runPythonCode, runSQLCode }`
- current consumers: `JupyterCodeEditor.tsx`, `useChat.ts`, etc.
- target file: `src/renderer/hooks/useCodeRuntime.ts` (Facade)
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `getOrCreateJSWorker`
- kind: function
- approximate line range: L7-L68
- dependencies: `persistentWorker`
- target file: `src/renderer/hooks/code-runtime/useJSRuntime.ts`
- migration status: pending

- symbol name: `runJSCode`
- kind: function inside hook
- approximate line range: L83-L112
- dependencies: `getOrCreateJSWorker`, `setIsRunning`
- target file: `src/renderer/hooks/code-runtime/useJSRuntime.ts`
- migration status: pending

- symbol name: `runPythonCode`
- kind: function inside hook
- approximate line range: L114-L354
- dependencies: `pyodideInstance`, `setIsRunning`
- target file: `src/renderer/hooks/code-runtime/usePythonRuntime.ts`
- migration status: pending

- symbol name: `runSQLCode`
- kind: function inside hook
- approximate line range: L356-L400
- dependencies: `sqliteDatabaseInstance`, `setIsRunning`
- target file: `src/renderer/hooks/code-runtime/useSQLRuntime.ts`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/hooks/useCodeRuntime.ts
  -> src/renderer/hooks/code-runtime/runtimeState.ts (holds persistentWorker, pyodideInstance, sqliteDatabaseInstance & cleanup)
  -> src/renderer/hooks/code-runtime/useJSRuntime.ts
  -> src/renderer/hooks/code-runtime/usePythonRuntime.ts
  -> src/renderer/hooks/code-runtime/useSQLRuntime.ts
  -> src/renderer/hooks/useCodeRuntime.ts (Facade preserving interface)
```

## 5. 1:1 Move Records

### Move Record: runtimeState
- original file: `src/renderer/hooks/useCodeRuntime.ts`
- original line range: L3-L6, L70-L78
- target file: `src/renderer/hooks/code-runtime/runtimeState.ts`
- target symbol name: `cleanupCodeRuntime`, `getRuntimeState`, `setRuntimeState`
- name changed: No (for cleanupCodeRuntime)
- signature changed: No (for cleanupCodeRuntime)
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: useJSRuntime
- original file: `src/renderer/hooks/useCodeRuntime.ts`
- original line range: L7-L68, L83-L112
- target file: `src/renderer/hooks/code-runtime/useJSRuntime.ts`
- target symbol name: `useJSRuntime` (extracted hook)
- name changed: Yes (extracted into domain hook)
- signature changed: Yes
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: usePythonRuntime
- original file: `src/renderer/hooks/useCodeRuntime.ts`
- original line range: L114-L354
- target file: `src/renderer/hooks/code-runtime/usePythonRuntime.ts`
- target symbol name: `usePythonRuntime` (extracted hook)
- name changed: Yes
- signature changed: Yes
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: useSQLRuntime
- original file: `src/renderer/hooks/useCodeRuntime.ts`
- original line range: L356-L400
- target file: `src/renderer/hooks/code-runtime/useSQLRuntime.ts`
- target symbol name: `useSQLRuntime` (extracted hook)
- name changed: Yes
- signature changed: Yes
- behavior changed: No
- verification result: Yes (Typecheck passed)
