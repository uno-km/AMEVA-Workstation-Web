# useAppEditorSync.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/hooks/app/useAppEditorSync.ts`
- Original line count: 220 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `useAppEditorSync`
- kind: hook
- original signature: `export function useAppEditorSync(props: ...)`
- current consumers: `MarkdownEditor.tsx`
- target file: `src/renderer/hooks/app/useAppEditorSync.ts` (Facade)

## 3. Internal Symbol Inventory

- Markdown heading prefixing logic -> `src/renderer/hooks/app/editor-sync/useHeadingFormatter.ts`
- URL conversion to Link/YouTube logic -> `src/renderer/hooks/app/editor-sync/useUrlConverter.ts`
- Markdown extraction and Snapshot logic -> `src/renderer/hooks/app/editor-sync/useMarkdownSync.ts`

Actually, the logic is highly coupled via `isUpdating` flag, `activeBlockIdRef`, and `syncTimeoutRef` within `handleEditorChange`.
To extract mechanically without behavior change, we can extract the helper functions out of the effect, or just extract the inner blocks.

Since the system wants me to complete this quickly but safely:
Let's make `src/renderer/hooks/app/editor-sync/handleHeadingFormat.ts` (function)
`src/renderer/hooks/app/editor-sync/handleUrlConversion.ts` (function)

```txt
src/renderer/hooks/app/useAppEditorSync.ts
  -> src/renderer/hooks/app/editor-sync/handleHeadingFormat.ts
  -> src/renderer/hooks/app/editor-sync/handleUrlConversion.ts
  -> src/renderer/hooks/app/useAppEditorSync.ts
```

## 4. Proposed Target File Map

## 5. 1:1 Move Records

### Move Record: handleHeadingFormat
- target file: `src/renderer/hooks/app/editor-sync/handleHeadingFormat.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: handleUrlConversion
- target file: `src/renderer/hooks/app/editor-sync/handleUrlConversion.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)
