# StatusBar.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/StatusBar.tsx`
- Original line count: 576 lines
- Refactor type: Mechanical decomposition only (extracting inline indicator logic into specialized sub-components)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `StatusBar`
- kind: component
- original signature: `export function StatusBar(props: StatusBarProps)`
- current consumers: `AppLayout.tsx`
- target file: `src/renderer/components/StatusBar.tsx`
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `AIStatusIndicator` (extracted from `getAgentServerBadge` L121-L243)
- kind: component
- approximate line range: L121-L243
- dependencies: `ipc`, `lucide-react`
- target file: `src/renderer/components/statusbar/AIStatusIndicator.tsx`
- migration status: pending

- symbol name: `MCPStatusIndicator` (extracted from `getMCPStatusBadge` & MCP hooks L59-L84, L245-L342)
- kind: component
- approximate line range: L59-L84, L245-L342
- dependencies: `useState`, `useEffect`, `MCPClientManager`
- target file: `src/renderer/components/statusbar/MCPStatusIndicator.tsx`
- migration status: pending

- symbol name: `DocStatusIndicator` (extracted from L109-L119, L360-L430)
- kind: component
- approximate line range: L360-L430
- dependencies: `Info`, `AlertTriangle`, `Check`
- target file: `src/renderer/components/statusbar/DocStatusIndicator.tsx`
- migration status: pending

- symbol name: `CollabIndicator` (extracted from L467-L508)
- kind: component
- approximate line range: L467-L508
- dependencies: `PeerState`
- target file: `src/renderer/components/statusbar/CollabIndicator.tsx`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/components/StatusBar.tsx
  -> src/renderer/components/statusbar/AIStatusIndicator.tsx
  -> src/renderer/components/statusbar/MCPStatusIndicator.tsx
  -> src/renderer/components/statusbar/DocStatusIndicator.tsx
  -> src/renderer/components/statusbar/CollabIndicator.tsx
```

## 5. 1:1 Move Records

### Move Record: AIStatusIndicator
- original file: `src/renderer/components/StatusBar.tsx`
- original line range: L121-L243
- target file: `src/renderer/components/statusbar/AIStatusIndicator.tsx`
- target symbol name: `AIStatusIndicator`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: MCPStatusIndicator
- original file: `src/renderer/components/StatusBar.tsx`
- original line range: L59-L84, L245-L342
- target file: `src/renderer/components/statusbar/MCPStatusIndicator.tsx`
- target symbol name: `MCPStatusIndicator`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: DocStatusIndicator
- original file: `src/renderer/components/StatusBar.tsx`
- original line range: L360-L430
- target file: `src/renderer/components/statusbar/DocStatusIndicator.tsx`
- target symbol name: `DocStatusIndicator`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: CollabIndicator
- original file: `src/renderer/components/StatusBar.tsx`
- original line range: L467-L508
- target file: `src/renderer/components/statusbar/CollabIndicator.tsx`
- target symbol name: `CollabIndicator`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
