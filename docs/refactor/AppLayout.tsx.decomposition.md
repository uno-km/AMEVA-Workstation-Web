# AppLayout.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/layout/AppLayout.tsx`
- Original line count: 665 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `AppLayout`
- kind: component
- original signature: `export const AppLayout: React.FC<AppLayoutProps>`
- current consumers: `App.tsx`
- target file: `src/renderer/components/layout/AppLayout.tsx` (Core preserved)
- migration status: pending

- export name: `AppLayoutProps`
- kind: interface
- original signature: `export interface AppLayoutProps { ... }`
- current consumers: `App.tsx`
- target file: `src/renderer/components/layout/AppLayout.tsx`
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `FloatingPiPVideo`
- kind: inline JSX block
- approximate line range: L468-L525
- dependencies: `pipVideoId`, `pipPosition`, `handlePiPMouseDown`, `setPipVideoId`
- target file: `src/renderer/components/layout/FloatingPiPVideo.tsx`
- migration status: pending

- symbol name: `ModalManager`
- kind: inline JSX block
- approximate line range: L527-L587
- dependencies: `DiffModal`, `SettingsModal`, `AboutModal`, `MarkdownGuideModal`, `MarketplaceModal`, `PricingModal`, `ExportModal`, and all their props
- target file: `src/renderer/components/layout/ModalManager.tsx`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/components/layout/AppLayout.tsx
  -> src/renderer/components/layout/FloatingPiPVideo.tsx
  -> src/renderer/components/layout/ModalManager.tsx
  -> src/renderer/components/layout/AppLayout.tsx (Core preserved)
```

## 5. 1:1 Move Records

### Move Record: FloatingPiPVideo
- original file: `src/renderer/components/layout/AppLayout.tsx`
- original line range: L468-L525
- target file: `src/renderer/components/layout/FloatingPiPVideo.tsx`
- target symbol name: `FloatingPiPVideo`
- name changed: Yes (extracted inline JSX into component)
- signature changed: Yes (new component)
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: ModalManager
- original file: `src/renderer/components/layout/AppLayout.tsx`
- original line range: L527-L587
- target file: `src/renderer/components/layout/ModalManager.tsx`
- target symbol name: `ModalManager`
- name changed: Yes (extracted inline JSX into component)
- signature changed: Yes (new component)
- behavior changed: No
- verification result: Yes (Typecheck passed)
