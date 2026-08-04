# SettingsModal.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/SettingsModal.tsx`
- Original line count: 919 lines
- Refactor type: Mechanical decomposition only (extracting inline tab JSX into sub-components)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `HotkeyConfig`
- kind: interface
- original signature: `export interface HotkeyConfig { save: string; open: string; newFile: string; pdfExport: string; toggleAI: string; toggleMode: string; zoomIn: string; zoomOut: string; zoomReset: string; }`
- current consumers: `SettingsTabHotkeys.tsx`, `App.tsx`, etc.
- target file: `src/renderer/components/SettingsModal.tsx` (remains in source for compatibility)
- migration status: verified

- export name: `AppSettings`
- kind: interface
- original signature: `export interface AppSettings { showPeersPointer: boolean; ... }`
- current consumers: `App.tsx`, `useAppSettingsManager.ts`, etc.
- target file: `src/renderer/components/SettingsModal.tsx` (remains in source for compatibility)
- migration status: verified

- export name: `SettingsModal`
- kind: component
- original signature: `export function SettingsModal(props: SettingsModalProps)`
- current consumers: `AppLayout.tsx`, etc.
- target file: `src/renderer/components/SettingsModal.tsx` (remains as root modal container)
- migration status: verified

## 3. Internal Symbol Inventory

- symbol name: `General Tab JSX block`
- kind: inline JSX block
- approximate line range: L370-L447
- dependencies: `activeTab`, `settings`, `onUpdateSettings`, `isProPlan`, `handleToggleProPlan`, `ToggleRight`, `ToggleLeft`
- target file: `src/renderer/components/settings/SettingsTabGeneral.tsx`
- migration status: verified

- symbol name: `Account Tab JSX block`
- kind: inline JSX block
- approximate line range: L450-L496
- dependencies: `activeTab`, `tempName`, `setTempName`, `tempColor`, `setTempColor`, `handleSaveUser`
- target file: `src/renderer/components/settings/SettingsTabAccount.tsx`
- migration status: verified

- symbol name: `Permissions Tab JSX block`
- kind: inline JSX block
- approximate line range: L499-L538
- dependencies: `activeTab`, `settings`, `onUpdateSettings`
- target file: `src/renderer/components/settings/SettingsTabPermissions.tsx`
- migration status: verified

- symbol name: `Appearance Tab JSX block`
- kind: inline JSX block
- approximate line range: L544-L575
- dependencies: `activeTab`, `themes`, `settings`, `handleThemeChange`
- target file: `src/renderer/components/settings/SettingsTabAppearance.tsx`
- migration status: verified

- symbol name: `Models Tab JSX block`
- kind: inline JSX block
- approximate line range: L578-L812
- dependencies: `activeTab`, `downloadStatus`, `settings`, `onUpdateSettings`, `localModels`, `localCodeModels`, `formatBytes`, `startModelDownload`
- target file: `src/renderer/components/settings/SettingsTabModels.tsx`
- migration status: verified

- symbol name: `Customizations Tab JSX block`
- kind: inline JSX block
- approximate line range: L815-L852
- dependencies: `activeTab`, `settings`
- target file: `src/renderer/components/settings/SettingsTabCustomizations.tsx`
- migration status: verified

## 4. Proposed Target File Map

```txt
src/renderer/components/SettingsModal.tsx
  -> src/renderer/components/settings/SettingsTabGeneral.tsx
  -> src/renderer/components/settings/SettingsTabAccount.tsx
  -> src/renderer/components/settings/SettingsTabPermissions.tsx
  -> src/renderer/components/settings/SettingsTabAppearance.tsx
  -> src/renderer/components/settings/SettingsTabModels.tsx
  -> src/renderer/components/settings/SettingsTabCustomizations.tsx
```

## 5. 1:1 Move Records

### Move Record: SettingsTabGeneral
- original file: `src/renderer/components/SettingsModal.tsx`
- original line range: L370-L447
- target file: `src/renderer/components/settings/SettingsTabGeneral.tsx`
- target symbol name: `SettingsTabGeneral`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed, 100% L1:1 mapping preserved)

### Move Record: SettingsTabAccount
- original file: `src/renderer/components/SettingsModal.tsx`
- original line range: L450-L496
- target file: `src/renderer/components/settings/SettingsTabAccount.tsx`
- target symbol name: `SettingsTabAccount`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed, 100% L1:1 mapping preserved)

### Move Record: SettingsTabPermissions
- original file: `src/renderer/components/SettingsModal.tsx`
- original line range: L499-L538
- target file: `src/renderer/components/settings/SettingsTabPermissions.tsx`
- target symbol name: `SettingsTabPermissions`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed, 100% L1:1 mapping preserved)

### Move Record: SettingsTabAppearance
- original file: `src/renderer/components/SettingsModal.tsx`
- original line range: L544-L575
- target file: `src/renderer/components/settings/SettingsTabAppearance.tsx`
- target symbol name: `SettingsTabAppearance`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed, 100% L1:1 mapping preserved)

### Move Record: SettingsTabModels
- original file: `src/renderer/components/SettingsModal.tsx`
- original line range: L578-L812
- target file: `src/renderer/components/settings/SettingsTabModels.tsx`
- target symbol name: `SettingsTabModels`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed, 100% L1:1 mapping preserved)

### Move Record: SettingsTabCustomizations
- original file: `src/renderer/components/SettingsModal.tsx`
- original line range: L815-L852
- target file: `src/renderer/components/settings/SettingsTabCustomizations.tsx`
- target symbol name: `SettingsTabCustomizations`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: verified (tsc --noEmit passed, 100% L1:1 mapping preserved)
