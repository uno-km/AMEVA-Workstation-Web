# Sidebar.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/Sidebar.tsx`
- Original line count: 775 lines
- Refactor type: Mechanical decomposition only (extracting inline tab views into separate components)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `Sidebar`
- kind: component
- original signature: `export function Sidebar(props: SidebarProps)`
- current consumers: `AppLayout.tsx`, etc.
- target file: `src/renderer/components/Sidebar.tsx` (remains as root sidebar container)
- migration status: verified

## 3. Internal Symbol Inventory

- symbol name: `SidebarTabFiles` (extracted from inline `activeTab === 'files'` JSX)
- kind: component
- approximate line range: L244-L493
- dependencies: `EditorFormat`, `EditorMode`, `ExportFormat`, `FileText`, `Save`, `Terminal`, `Eye`, `Plus`, `Trash2`, `ChevronDown`, `ChevronRight`
- target file: `src/renderer/components/sidebar/SidebarTabFiles.tsx`
- migration status: verified

- symbol name: `SidebarTabHistory` (extracted from inline `activeTab === 'history'` JSX)
- kind: component
- approximate line range: L495-L580
- dependencies: `DocumentSnapshot`, `Plus`, `RefreshCw`, `Trash2`
- target file: `src/renderer/components/sidebar/SidebarTabHistory.tsx`
- migration status: verified

- symbol name: `SidebarTabCollab` (extracted from inline `activeTab === 'collab'` JSX)
- kind: component
- approximate line range: L582-L709
- dependencies: `PeerState`, `Server`, `Share2`
- target file: `src/renderer/components/sidebar/SidebarTabCollab.tsx`
- migration status: verified

- symbol name: `SidebarTabChat` (extracted from inline `activeTab === 'chat'` JSX)
- kind: component
- approximate line range: L711-L770
- dependencies: `ChatMessage`, `ChatPanel`, `MessageCircle`, `Share2`
- target file: `src/renderer/components/sidebar/SidebarTabChat.tsx`
- migration status: verified

## 4. Proposed Target File Map

```txt
src/renderer/components/Sidebar.tsx
  -> src/renderer/components/sidebar/SidebarTabFiles.tsx
  -> src/renderer/components/sidebar/SidebarTabHistory.tsx
  -> src/renderer/components/sidebar/SidebarTabCollab.tsx
  -> src/renderer/components/sidebar/SidebarTabChat.tsx
```

## 5. 1:1 Move Records

### Move Record: SidebarTabFiles
- original file: `src/renderer/components/Sidebar.tsx`
- original line range: L244-L493
- target file: `src/renderer/components/sidebar/SidebarTabFiles.tsx`
- target symbol name: `SidebarTabFiles`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: SidebarTabHistory
- original file: `src/renderer/components/Sidebar.tsx`
- original line range: L495-L580
- target file: `src/renderer/components/sidebar/SidebarTabHistory.tsx`
- target symbol name: `SidebarTabHistory`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: SidebarTabCollab
- original file: `src/renderer/components/Sidebar.tsx`
- original line range: L582-L709
- target file: `src/renderer/components/sidebar/SidebarTabCollab.tsx`
- target symbol name: `SidebarTabCollab`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)

### Move Record: SidebarTabChat
- original file: `src/renderer/components/Sidebar.tsx`
- original line range: L711-L770
- target file: `src/renderer/components/sidebar/SidebarTabChat.tsx`
- target symbol name: `SidebarTabChat`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (npx tsc --noEmit passed, 0 errors, 100% behavior/name/signature preserved)
