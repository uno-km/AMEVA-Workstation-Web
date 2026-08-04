# agentEngine.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/utils/agentEngine.ts`
- Original line count: 558 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `AgentState`
- kind: const / type
- original signature: `export const AgentState = { ... }; export type AgentState = ...;`
- current consumers: `useAIAgent.ts`, etc.
- target file: `src/renderer/utils/agent/types.ts`
- migration status: pending

- export name: `ToolDefinition`, `AgentConfig`, `AgentSessionStep`, `AgentSessionResult`, `ILLMAdapter`
- kind: interface
- original signature: `export interface ...`
- current consumers: `agentEngine.ts`, `useAIAgent.ts`
- target file: `src/renderer/utils/agent/types.ts`
- migration status: pending

- export name: `AgentEngine`
- kind: class
- original signature: `export class AgentEngine { ... }`
- current consumers: `useAIAgent.ts`
- target file: `src/renderer/utils/agentEngine.ts` (maintains as facade/core)
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `LlamaCppAdapter`
- kind: class
- approximate line range: L74-L112
- dependencies: `ILLMAdapter`, `ipc`
- target file: `src/renderer/utils/agent/adapters/LlamaCppAdapter.ts`
- migration status: pending

- symbol name: `OllamaAdapter`
- kind: class
- approximate line range: L114-L141
- dependencies: `ILLMAdapter`
- target file: `src/renderer/utils/agent/adapters/OllamaAdapter.ts`
- migration status: pending

- symbol name: `tryHealJSON`
- kind: function
- approximate line range: L483-L556
- dependencies: none
- target file: `src/renderer/utils/agent/tryHealJSON.ts`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/utils/agentEngine.ts
  -> src/renderer/utils/agent/types.ts
  -> src/renderer/utils/agent/adapters/LlamaCppAdapter.ts
  -> src/renderer/utils/agent/adapters/OllamaAdapter.ts
  -> src/renderer/utils/agent/tryHealJSON.ts
  -> src/renderer/utils/agentEngine.ts (Core preserved)
```

## 5. 1:1 Move Records

### Move Record: types
- original file: `src/renderer/utils/agentEngine.ts`
- original line range: L4-L72
- target file: `src/renderer/utils/agent/types.ts`
- target symbol name: `AgentState`, `ToolDefinition`, `AgentConfig`, `AgentSessionStep`, `AgentSessionResult`, `ILLMAdapter`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: LlamaCppAdapter
- original file: `src/renderer/utils/agentEngine.ts`
- original line range: L74-L112
- target file: `src/renderer/utils/agent/adapters/LlamaCppAdapter.ts`
- target symbol name: `LlamaCppAdapter`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: OllamaAdapter
- original file: `src/renderer/utils/agentEngine.ts`
- original line range: L114-L141
- target file: `src/renderer/utils/agent/adapters/OllamaAdapter.ts`
- target symbol name: `OllamaAdapter`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: tryHealJSON
- original file: `src/renderer/utils/agentEngine.ts`
- original line range: L483-L556
- target file: `src/renderer/utils/agent/tryHealJSON.ts`
- target symbol name: `tryHealJSON`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
