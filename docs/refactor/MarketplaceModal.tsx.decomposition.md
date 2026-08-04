# MarketplaceModal.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/MarketplaceModal.tsx`
- Original line count: 531 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `PluginMetadata`
- kind: interface
- original signature: `export interface PluginMetadata { ... }` (Wait, it was not exported. I will export it for internal use)
- current consumers: `MarketplaceModal.tsx`
- target file: `src/renderer/components/marketplace/types.ts`
- migration status: pending

- export name: `MarketplaceModalProps`
- kind: interface
- original signature: `export interface MarketplaceModalProps { ... }` (Not exported, but I will export it for use)
- current consumers: `MarketplaceModal.tsx`
- target file: `src/renderer/components/marketplace/types.ts`
- migration status: pending

- export name: `MarketplaceModal`
- kind: component
- original signature: `export function MarketplaceModal(props: MarketplaceModalProps)`
- current consumers: `AppLayout.tsx` (maybe)
- target file: `src/renderer/components/MarketplaceModal.tsx` (Core preserved)
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `MarketplaceHeader` (extracted from L168-L216)
- kind: component
- approximate line range: L168-L216
- dependencies: `Layers`, `RefreshCw`, `X`
- target file: `src/renderer/components/marketplace/MarketplaceHeader.tsx`
- migration status: pending

- symbol name: `MarketplaceToolbar` (extracted from L217-L271)
- kind: component
- approximate line range: L217-L271
- dependencies: `Search`
- target file: `src/renderer/components/marketplace/MarketplaceToolbar.tsx`
- migration status: pending

- symbol name: `SaaSPluginCard` (extracted from L345-L419)
- kind: component
- approximate line range: L345-L419
- dependencies: React
- target file: `src/renderer/components/marketplace/SaaSPluginCard.tsx`
- migration status: pending

- symbol name: `PluginCard` (extracted from L428-L507)
- kind: component
- approximate line range: L428-L507
- dependencies: `Check`, `PluginMetadata`
- target file: `src/renderer/components/marketplace/PluginCard.tsx`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/components/MarketplaceModal.tsx
  -> src/renderer/components/marketplace/types.ts
  -> src/renderer/components/marketplace/MarketplaceHeader.tsx
  -> src/renderer/components/marketplace/MarketplaceToolbar.tsx
  -> src/renderer/components/marketplace/SaaSPluginCard.tsx
  -> src/renderer/components/marketplace/PluginCard.tsx
  -> src/renderer/components/MarketplaceModal.tsx (Core preserved)
```

## 5. 1:1 Move Records

### Move Record: types
- original file: `src/renderer/components/MarketplaceModal.tsx`
- original line range: L4-L20
- target file: `src/renderer/components/marketplace/types.ts`
- target symbol name: `PluginMetadata`, `MarketplaceModalProps`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: MarketplaceHeader
- original file: `src/renderer/components/MarketplaceModal.tsx`
- original line range: L168-L216
- target file: `src/renderer/components/marketplace/MarketplaceHeader.tsx`
- target symbol name: `MarketplaceHeader`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: MarketplaceToolbar
- original file: `src/renderer/components/MarketplaceModal.tsx`
- original line range: L217-L271
- target file: `src/renderer/components/marketplace/MarketplaceToolbar.tsx`
- target symbol name: `MarketplaceToolbar`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: SaaSPluginCard
- original file: `src/renderer/components/MarketplaceModal.tsx`
- original line range: L345-L419
- target file: `src/renderer/components/marketplace/SaaSPluginCard.tsx`
- target symbol name: `SaaSPluginCard`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: PluginCard
- original file: `src/renderer/components/MarketplaceModal.tsx`
- original line range: L428-L507
- target file: `src/renderer/components/marketplace/PluginCard.tsx`
- target symbol name: `PluginCard`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
