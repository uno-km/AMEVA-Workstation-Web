# useAppExport.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/hooks/app/useAppExport.ts`
- Original line count: 214 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `useAppExport`
- kind: hook
- original signature: `export function useAppExport(editor: AmevaEditor | null)`
- current consumers: `ExportModal.tsx`
- target file: `src/renderer/hooks/app/useAppExport.ts` (Facade)

## 3. Internal Symbol Inventory

- browser download util `triggerBrowserDownload` -> `src/renderer/hooks/app/export/exportUtils.ts`
- electron export handlers -> `src/renderer/hooks/app/export/handleElectronExport.ts`
- browser export handlers -> `src/renderer/hooks/app/export/handleBrowserExport.ts`
- main `handleExport` -> `src/renderer/hooks/app/export/useHandleExport.ts`

Actually, the simplest way is to extract `handleElectronExport` and `handleBrowserExport` functions.

```txt
src/renderer/hooks/app/useAppExport.ts
  -> src/renderer/hooks/app/export/exportUtils.ts
  -> src/renderer/hooks/app/export/handleElectronExport.ts
  -> src/renderer/hooks/app/export/handleBrowserExport.ts
  -> src/renderer/hooks/app/useAppExport.ts
```

## 5. 1:1 Move Records

### Move Record: exportUtils
- target file: `src/renderer/hooks/app/export/exportUtils.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: handleElectronExport
- target file: `src/renderer/hooks/app/export/handleElectronExport.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: handleBrowserExport
- target file: `src/renderer/hooks/app/export/handleBrowserExport.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)
