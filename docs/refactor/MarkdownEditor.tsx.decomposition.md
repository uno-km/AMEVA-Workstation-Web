# MarkdownEditor.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/MarkdownEditor.tsx`
- Original line count: 893 lines
- Refactor type: Mechanical decomposition only (extracting internal layer components and helpers)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `MarkdownEditor`
- kind: component
- original signature: `export function MarkdownEditor(props: MarkdownEditorProps)`
- current consumers: `AppLayout.tsx`, `App.tsx`, etc.
- target file: `src/renderer/components/MarkdownEditor.tsx` (remains as root editor container)
- migration status: verified

## 3. Internal Symbol Inventory

- symbol name: `PeerBlockHighlightLayer`
- kind: component
- approximate line range: L57-L225
- dependencies: `React`, `useState`, `useEffect`, `PeerState`
- target file: `src/renderer/components/editor/PeerBlockHighlightLayer.tsx`
- migration status: verified

- symbol name: `getCustomSlashMenuItems`
- kind: function helper
- approximate line range: L389-L507
- dependencies: `AmevaEditor`, `getDefaultReactSlashMenuItems`, `Code2`, `Globe`, `Eye`, `Terminal`, `FileImage`
- target file: `src/renderer/components/editor/customSlashMenuItems.tsx`
- migration status: verified

- symbol name: `WelcomeBanner`
- kind: component (extracted from inline welcome mode JSX)
- approximate line range: L673-L772
- dependencies: `onStartWelcomeEdit`, `onStartNewDocument`, `onOpenFile`, `currentContent`, `editor`, `MarkdownPreview`, `Code2`
- target file: `src/renderer/components/editor/WelcomeBanner.tsx`
- migration status: verified

## 4. Proposed Target File Map

```txt
src/renderer/components/MarkdownEditor.tsx
  -> src/renderer/components/editor/PeerBlockHighlightLayer.tsx
  -> src/renderer/components/editor/customSlashMenuItems.tsx
  -> src/renderer/components/editor/WelcomeBanner.tsx
```

## 5. 1:1 Move Records

### Move Record: PeerBlockHighlightLayer
- original file: `src/renderer/components/MarkdownEditor.tsx`
- original line range: L57-L225
- target file: `src/renderer/components/editor/PeerBlockHighlightLayer.tsx`
- target symbol name: `PeerBlockHighlightLayer`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed)

### Move Record: getCustomSlashMenuItems
- original file: `src/renderer/components/MarkdownEditor.tsx`
- original line range: L389-L507
- target file: `src/renderer/components/editor/customSlashMenuItems.tsx`
- target symbol name: `getCustomSlashMenuItems`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed)

### Move Record: WelcomeBanner
- original file: `src/renderer/components/MarkdownEditor.tsx`
- original line range: L673-L772
- target file: `src/renderer/components/editor/WelcomeBanner.tsx`
- target symbol name: `WelcomeBanner`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed)

## 6. Summary
- Final line count: 510 lines (down from 893 lines, 43% reduction)
- Typecheck: passed (`npx tsc --noEmit`)
- any/as any used: No
- Re-exports added for compatibility: Yes (`PeerBlockHighlightLayer`, `getCustomSlashMenuItems`, `WelcomeBanner`)
