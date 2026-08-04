# FindReplaceBar.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/FindReplaceBar.tsx`
- Original line count: 517 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `FindReplaceBar`
- kind: component
- original signature: `export function FindReplaceBar(props: FindReplaceBarProps)`
- current consumers: `AppLayout.tsx`
- target file: `src/renderer/components/FindReplaceBar.tsx` (Core preserved)
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `useFindReplace` (extracted logic for search and replace)
- kind: hook
- approximate line range: L28-L291
- dependencies: `useState`, `useEffect`
- target file: `src/renderer/hooks/useFindReplace.ts`
- migration status: pending

- symbol name: `SearchMatch`
- kind: interface
- approximate line range: L14-L19
- dependencies: None
- target file: `src/renderer/hooks/useFindReplace.ts`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/components/FindReplaceBar.tsx
  -> src/renderer/hooks/useFindReplace.ts (extracted state and logic)
  -> src/renderer/components/FindReplaceBar.tsx (Core preserved)
```

## 5. 1:1 Move Records

### Move Record: SearchMatch
- original file: `src/renderer/components/FindReplaceBar.tsx`
- original line range: L14-L19
- target file: `src/renderer/hooks/useFindReplace.ts`
- target symbol name: `SearchMatch`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: useFindReplace
- original file: `src/renderer/components/FindReplaceBar.tsx`
- original line range: L28-L291
- target file: `src/renderer/hooks/useFindReplace.ts`
- target symbol name: `useFindReplace`
- name changed: Yes (extracted inner logic to a named hook)
- signature changed: Yes (it is now a standalone hook)
- behavior changed: No
- verification result: Yes (Typecheck passed)
