# MessageBubble.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/ai-panel/chat-list/MessageBubble.tsx`
- Original line count: 527 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `MessageBubble`
- kind: component
- original signature: `export function MessageBubble(...)`
- current consumers: `ChatList.tsx`
- target file: `src/renderer/components/ai-panel/chat-list/MessageBubble.tsx`
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `ReasoningTraceViewer` (extracted from L192-L241)
- kind: component
- approximate line range: L192-L241
- dependencies: `Brain`, `ChevronUp`, `ChevronDown`, `ThoughtTreeView`
- target file: `src/renderer/components/ai-panel/chat-list/ReasoningTraceViewer.tsx`
- migration status: pending

- symbol name: `MessageActionBar` (extracted from L414-L515)
- kind: component
- approximate line range: L414-L515
- dependencies: `Check`, `X`, `Copy`
- target file: `src/renderer/components/ai-panel/chat-list/MessageActionBar.tsx`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/components/ai-panel/chat-list/MessageBubble.tsx
  -> src/renderer/components/ai-panel/chat-list/ReasoningTraceViewer.tsx
  -> src/renderer/components/ai-panel/chat-list/MessageActionBar.tsx
  -> src/renderer/components/ai-panel/chat-list/MessageBubble.tsx (Core preserved)
```

## 5. 1:1 Move Records

### Move Record: ReasoningTraceViewer
- original file: `src/renderer/components/ai-panel/chat-list/MessageBubble.tsx`
- original line range: L192-L241
- target file: `src/renderer/components/ai-panel/chat-list/ReasoningTraceViewer.tsx`
- target symbol name: `ReasoningTraceViewer`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: MessageActionBar
- original file: `src/renderer/components/ai-panel/chat-list/MessageBubble.tsx`
- original line range: L414-L515
- target file: `src/renderer/components/ai-panel/chat-list/MessageActionBar.tsx`
- target symbol name: `MessageActionBar`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
