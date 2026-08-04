# useAIMessageState.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/hooks/ai/useAIMessageState.ts`
- Original line count: 272 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `useAIMessageState`
- kind: hook
- original signature: `export function useAIMessageState()`
- current consumers: `useAIAgent.ts`, etc.
- target file: `src/renderer/hooks/ai/useAIMessageState.ts` (Facade)

## 3. Internal Symbol Inventory

- `addUserAndAssistantMessages`
- `finalizeAssistantMessage`
- `updateMessageDiffState`
- `updateInsertSuggestionStatus`

## 4. Proposed Target File Map

```txt
src/renderer/hooks/ai/useAIMessageState.ts
  -> src/renderer/hooks/ai/message-state/useAddMessages.ts
  -> src/renderer/hooks/ai/message-state/useFinalizeMessage.ts
  -> src/renderer/hooks/ai/message-state/useUpdateDiffState.ts
  -> src/renderer/hooks/ai/message-state/useUpdateInsertStatus.ts
  -> src/renderer/hooks/ai/useAIMessageState.ts
```

## 5. 1:1 Move Records

### Move Record: useAddMessages
- target file: `src/renderer/hooks/ai/message-state/useAddMessages.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: useFinalizeMessage
- target file: `src/renderer/hooks/ai/message-state/useFinalizeMessage.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: useUpdateDiffState
- target file: `src/renderer/hooks/ai/message-state/useUpdateDiffState.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: useUpdateInsertStatus
- target file: `src/renderer/hooks/ai/message-state/useUpdateInsertStatus.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)
