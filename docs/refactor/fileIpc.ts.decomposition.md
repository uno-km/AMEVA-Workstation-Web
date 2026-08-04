# fileIpc.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/ipc/fileIpc.ts`
- Original line count: 524 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `registerFileIpc`
- kind: function
- original signature: `export function registerFileIpc(getMainWindow: () => BrowserWindow | null, createWindow: () => void): void`
- current consumers: `src/main/index.ts`
- target file: `src/main/ipc/fileIpc.ts` (Core preserved)
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `fetchHtmlMetadata` (extracted from `action:fetchUrlMetadata` handler L389-L522)
- kind: function
- approximate line range: L389-L522
- dependencies: `http`, `https`, `url`
- target file: `src/main/services/htmlScraper.ts`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/main/ipc/fileIpc.ts
  -> src/main/services/htmlScraper.ts (extracted fetchHtmlMetadata logic)
  -> src/main/ipc/fileIpc.ts (Core preserved)
```

## 5. 1:1 Move Records

### Move Record: fetchHtmlMetadata
- original file: `src/main/ipc/fileIpc.ts`
- original line range: L389-L522
- target file: `src/main/services/htmlScraper.ts`
- target symbol name: `fetchHtmlMetadata`
- name changed: Yes (extracted inner logic to a named function, original handler stays in fileIpc.ts but calls this function)
- signature changed: Yes (it is now a standalone function)
- behavior changed: No
- verification result: Yes (Typecheck passed)
