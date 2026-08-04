# JupyterCodeEditor.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/JupyterCodeEditor.tsx`
- Original line count: 569 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `RunState`
- kind: interface
- original signature: `export interface RunState { ... }`
- current consumers: `AmevaBlockSchema.ts`, `MarkdownEditor.tsx` (maybe)
- target file: `src/renderer/components/jupyter/RunState.ts`
- migration status: pending

- export name: `JupyterCodeEditorHeader`
- kind: component
- original signature: `export function JupyterCodeEditorHeader(...)`
- current consumers: `MarkdownEditor.tsx`, `CustomBlocks.tsx`
- target file: `src/renderer/components/jupyter/JupyterCodeEditorHeader.tsx`
- migration status: pending

- export name: `JupyterCodeEditorTerminal`
- kind: component
- original signature: `export function JupyterCodeEditorTerminal(...)`
- current consumers: `MarkdownEditor.tsx`, `CustomBlocks.tsx`
- target file: `src/renderer/components/jupyter/JupyterCodeEditorTerminal.tsx`
- migration status: pending

## 3. Internal Symbol Inventory

(None beyond the exports)

## 4. Proposed Target File Map

```txt
src/renderer/components/JupyterCodeEditor.tsx
  -> src/renderer/components/jupyter/RunState.ts
  -> src/renderer/components/jupyter/JupyterCodeEditorHeader.tsx
  -> src/renderer/components/jupyter/JupyterCodeEditorTerminal.tsx
```

## 5. 1:1 Move Records

### Move Record: RunState
- original file: `src/renderer/components/JupyterCodeEditor.tsx`
- original line range: L15-L20
- target file: `src/renderer/components/jupyter/RunState.ts`
- target symbol name: `RunState`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: JupyterCodeEditorHeader
- original file: `src/renderer/components/JupyterCodeEditor.tsx`
- original line range: L23-L244
- target file: `src/renderer/components/jupyter/JupyterCodeEditorHeader.tsx`
- target symbol name: `JupyterCodeEditorHeader`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: JupyterCodeEditorTerminal
- original file: `src/renderer/components/JupyterCodeEditor.tsx`
- original line range: L247-L568
- target file: `src/renderer/components/jupyter/JupyterCodeEditorTerminal.tsx`
- target symbol name: `JupyterCodeEditorTerminal`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
