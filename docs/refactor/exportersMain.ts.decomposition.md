# exportersMain.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/exportersMain.ts`
- Original line count: 959 lines
- Refactor type: Mechanical decomposition only (Facade pattern + Domain isolation)
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `blocksToHTML`
  - kind: function
  - original signature: `export function blocksToHTML(blocks: any[]): string`
  - target file: `src/main/exporters/htmlExporter.ts`
  - migration status: pending -> verified
- export name: `exportToWord`
  - kind: function
  - original signature: `export async function exportToWord(blocks: any[]): Promise<Buffer>`
  - target file: `src/main/exporters/officeExporter.ts`
  - migration status: pending -> verified
- export name: `exportToExcel`
  - kind: function
  - original signature: `export async function exportToExcel(blocks: any[], sourceFileName?: string): Promise<Buffer>`
  - target file: `src/main/exporters/officeExporter.ts`
  - migration status: pending -> verified
- export name: `exportToPPTX`
  - kind: function
  - original signature: `export async function exportToPPTX(blocks: any[]): Promise<Buffer>`
  - target file: `src/main/exporters/officeExporter.ts`
  - migration status: pending -> verified
- export name: `exportToHWPX`
  - kind: function
  - original signature: `export async function exportToHWPX(blocks: any[]): Promise<Buffer>`
  - target file: `src/main/exporters/hwpExporter.ts`
  - migration status: pending -> verified
- export name: `exportToXML`
  - kind: function
  - original signature: `export function exportToXML(blocks: any[]): string`
  - target file: `src/main/exporters/htmlExporter.ts`
  - migration status: pending -> verified

## 3. Internal Symbol Inventory

- `escapeHtml` -> `src/main/exporters/exportersHelper.ts`
- `getPlainTextFromNormalized` -> `src/main/exporters/exportersHelper.ts`
- `inlineToText` -> `src/main/exporters/exportersHelper.ts`
- `inlineToHTML` -> `src/main/exporters/exportersHelper.ts`

## 4. Proposed Target File Map

```txt
src/main/exportersMain.ts (Facade)
  -> src/main/exporters/exportersHelper.ts
  -> src/main/exporters/htmlExporter.ts (blocksToHTML, exportToXML)
  -> src/main/exporters/officeExporter.ts (exportToWord, exportToExcel, exportToPPTX)
  -> src/main/exporters/hwpExporter.ts (exportToHWPX)
```

## 5. Verification Strategy

- Typecheck: `npx tsc --noEmit`
- Consumer compatibility: `fileIpc.ts` imports from `exportersMain.js` remain unchanged.
