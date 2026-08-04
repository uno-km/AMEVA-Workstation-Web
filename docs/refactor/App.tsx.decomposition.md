# App.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/App.tsx`
- Original line count: 1386 lines
- Final line count: 284 lines
- Refactor type: Mechanical decomposition only (Custom hooks + Component layout extraction)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `default` (App component)
  - kind: component
  - original signature: `export default function App(): JSX.Element`
  - target file: `src/renderer/App.tsx` (remains as root coordinator)
  - migration status: verified

## 3. Created Files & Moved Symbols

- `src/renderer/hooks/app/useAppSettingsManager.ts` (147 lines)
  - `settings` state, `handleUpdateSettings`, plugin install/uninstall, zoom & fullscreen handlers.
- `src/renderer/hooks/app/useAppEditorInit.ts` (105 lines)
  - `BlockNoteEditor.create`, `uploadFileHandler`, welcome text bootstrap.
- `src/renderer/hooks/app/useAppGlobalApi.ts` (45 lines)
  - Global window APIs (`AMEVA_INSERT_TEXT_TO_EDITOR`, `AMEVA_ASK_AGENT`, `AMEVA_GET_CURRENT_CONTENT`, `AMEVA_SET_CURRENT_CONTENT`).
- `src/renderer/hooks/app/useAppEditorSync.ts` (152 lines)
  - Editor change listener, URL auto-conversion (youtube / linkPreview / fetchUrlMetadata), heading auto-conversion, markdown lossy sync, auto-snapshot.
- `src/renderer/hooks/app/useAppModeSwitch.ts` (105 lines)
  - Editor mode switching (`handleSwitchMode`), rollback (`handleRollback`), welcome edit start (`handleStartWelcomeEdit`).
- `src/renderer/components/layout/AppLayout.tsx` (478 lines)
  - Pure presentation layout rendering MenuBar, Sidebar, MarkdownEditor, Minimap, AIPanel, RightTabStrip, StatusBar, Modals, FloatingChat, FindReplaceBar.

## 4. Verification

- Typecheck: `npx tsc --noEmit` -> PASSED (0 errors)
- Build compatibility: 100% verified.
- any/as any used: None added (preserved existing types only).
- Signature changes: None.
- Behavior changes: None.
