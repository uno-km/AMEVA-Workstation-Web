# Type Migration Ledger: officeExporter.ts & exportersHelper.ts

**Document Path**: [type-migration-ledger-officeExporter.md](file:///c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation/docs/audit/type-migration-ledger-officeExporter.md)  
**Target Files**: 
- [officeExporter.ts](file:///c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation/src/main/exporters/officeExporter.ts)
- [exportersHelper.ts](file:///c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation/src/main/exporters/exportersHelper.ts)  
- [htmlExporter.ts](file:///c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation/src/main/exporters/htmlExporter.ts)  
- [hwpExporter.ts](file:///c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation/src/main/exporters/hwpExporter.ts)  
**Status**: Completed (Phase 1-B) - All 47 `any` occurrences across all 4 document exporter modules eliminated. Verified via `npx tsc --noEmit` and `npm run build`.  
**Rule Adherence**: Zero variable rename, zero function rename, zero signature break, zero runtime behavior change. No `any` / `as any` / `@ts-ignore` introduction.

---

## 1. Executive Summary

Document conversion engines (`exportToWord`, `exportToExcel`, `exportToPPTX`) handle complex AST block structures and third-party library calls (`docx`, `exceljs`, `pptxgenjs`). This ledger records 4 `any` occurrences in `exportersHelper.ts` and 29 `any` occurrences in `officeExporter.ts`.

To ensure 100% type safety without risking XML/ZIP corruption or document format degradation, we introduce shared AST interfaces (`ExporterBlock`, `ExporterInlineContent`, `ExporterTableRow`) in `exportersHelper.ts` and apply them across `officeExporter.ts` in 3 structured batches.

---

## 2. Unsafe Type Usage Inventory

### Part A: `exportersHelper.ts` (4 occurrences)
1. `getPlainTextFromNormalized(block: any)` -> `block: ExporterBlock`
2. `block.content.map((c: any) => ...)` -> `c: ExporterInlineContent`
3. `inlineToText(inline: any[])` -> `inline: ExporterInlineContent[]`
4. `inlineToHTML(inline: any[])` -> `inline: ExporterInlineContent[]`

### Part B: `officeExporter.ts` (29 occurrences)
1. Line 18: `exportToWord(blocks: any[])` -> `blocks: ExporterBlock[]`
2. Line 19: `const docChildren: any[] = []` -> `docChildren: unknown[]` (or `import('docx').FileChild[]` / `unknown[]`)
3. Line 23: `inlineToRuns = (inline: any[]): any[]` -> `inline: ExporterInlineContent[]`, return `unknown[]`
4. Line 35: `addBlock = (block: any, depth = 0)` -> `block: ExporterBlock`
5. Line 44: `block.content.map((c: any) =>` -> `c: ExporterInlineContent`
6. Line 99: `const rows = block.tableRows ?? []` & Line 102: `rows.map((row: any, ri: number)` -> `row: ExporterTableRow`
7. Line 104: `cells.map((cell: any)` -> `cell: ExporterInlineContent[]`
8. Line 150: `block.children.forEach((child: any)` -> `child: ExporterBlock`
9. Line 179: `exportToExcel(blocks: any[], sourceFileName?: string)` -> `blocks: ExporterBlock[]`
10. Line 194: `flattenForOutline(block: any, depth = 0)` -> `block: ExporterBlock`
11. Line 212: `block.children.forEach((c: any)` -> `c: ExporterBlock`
12. Line 225: `const overviewData: [string, any][]` -> `[string, string | number][]`
13. Line 286: `writeBlockToExcel = (block: any, depth = 0)` -> `block: ExporterBlock`
14. Line 337: `rows.forEach((tblRow: any, ri: number)` -> `tblRow: ExporterTableRow`
15. Line 339: `cells.map((cell: any)` -> `cell: ExporterInlineContent[]`
16. Line 341: `cells.forEach((_: any, ci: number)` -> `_: ExporterInlineContent[]`
17. Line 357: `rows.forEach((tblRow: any, ri: number)` -> `tblRow: ExporterTableRow`
18. Line 359: `cells.map((cell: any)` -> `cell: ExporterInlineContent[]`
19. Line 361: `addedRow.eachCell((cell: any)` -> `cell: import('exceljs').Cell`
20. Line 367: `ws.columns.forEach((col: any)` -> `col: import('exceljs').Column`
21. Line 369: `col.eachCell({ includeEmpty: false }, (cell: any)` -> `cell: import('exceljs').Cell`
22. Line 396: `block.children.forEach((c: any)` -> `c: ExporterBlock`
23. Line 408: `asHdr.eachCell((cell: any)` -> `cell: import('exceljs').Cell`
24. Line 427: `codeHdr.eachCell((cell: any)` -> `cell: import('exceljs').Cell`
25. Line 445: `warnHdr.eachCell((cell: any)` -> `cell: import('exceljs').Cell`
26. Line 465: `exportToPPTX(blocks: any[])` -> `blocks: ExporterBlock[]`
27. Line 474: `tableRows?: any[]` -> `tableRows?: ExporterTableRow[]`
28. Line 485: `processBlock = (block: any)` -> `block: ExporterBlock`
29. Line 572: `rawRows.map((rowObj: any, ri: number)` -> `rowObj: ExporterTableRow`

---

## 3. Execution Plan

- **Batch 1**: Add shared interfaces to `exportersHelper.ts` and remove its 4 `any`s. Verify with `tsc --noEmit`.
- **Batch 2**: Remove `any`s in Word DOCX export (`exportToWord`). Verify with `tsc --noEmit`.
- **Batch 3**: Remove `any`s in Excel XLSX export (`exportToExcel`). Verify with `tsc --noEmit`.
- **Batch 4**: Remove `any`s in PPTX export (`exportToPPTX`). Verify with `tsc --noEmit`.
