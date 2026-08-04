# officeExporter.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/exporters/officeExporter.ts`
- Original line count: 651 lines (originally), 588 lines currently
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `exportToWord`
- kind: function
- original signature: `export async function exportToWord(blocks: ExporterBlock[]): Promise<Buffer>`
- current consumers: `src/main/exportersMain.ts`
- target file: `src/main/exporters/wordExporter.ts`
- migration status: pending

- export name: `exportToExcel`
- kind: function
- original signature: `export async function exportToExcel(blocks: ExporterBlock[], sourceFileName?: string): Promise<Buffer>`
- current consumers: `src/main/exportersMain.ts`
- target file: `src/main/exporters/excelExporter.ts`
- migration status: pending

- export name: `exportToPPTX`
- kind: function
- original signature: `export async function exportToPPTX(blocks: ExporterBlock[]): Promise<Buffer>`
- current consumers: `src/main/exportersMain.ts`
- target file: `src/main/exporters/pptxExporter.ts`
- migration status: pending

## 3. Internal Symbol Inventory

N/A - the file is mostly just these three large functions and some imports at the top.

## 4. Proposed Target File Map

```txt
src/main/exporters/officeExporter.ts
  -> src/main/exporters/wordExporter.ts
  -> src/main/exporters/excelExporter.ts
  -> src/main/exporters/pptxExporter.ts
  -> src/main/exporters/officeExporter.ts (Re-export wrapper to preserve compatibility)
```

## 5. 1:1 Move Records

### Move Record: exportToWord
- original file: `src/main/exporters/officeExporter.ts`
- original line range: L18-L174
- target file: `src/main/exporters/wordExporter.ts`
- target symbol name: `exportToWord`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: exportToExcel
- original file: `src/main/exporters/officeExporter.ts`
- original line range: L179-L460
- target file: `src/main/exporters/excelExporter.ts`
- target symbol name: `exportToExcel`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: exportToPPTX
- original file: `src/main/exporters/officeExporter.ts`
- original line range: L465-L650
- target file: `src/main/exporters/pptxExporter.ts`
- target symbol name: `exportToPPTX`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
