# JupyterCodeViewer.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/JupyterCodeViewer.tsx`
- Original line count: 572 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `getLangMeta`
- kind: function
- original signature: `export function getLangMeta(lang: string): LangMeta`
- current consumers: `JupyterCodeViewer.tsx`, `JupyterCodeEditor.tsx` (maybe)
- target file: `src/renderer/components/jupyter/langMeta.ts`
- migration status: pending

- export name: `JupyterCodeViewer`
- kind: component
- original signature: `export function JupyterCodeViewer({ code, language, onRunFailure }: ...)`
- current consumers: `MessageBubble.tsx`, etc.
- target file: `src/renderer/components/JupyterCodeViewer.tsx`
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: `InlineHtmlRenderer`
- kind: component
- approximate line range: L58-L97
- dependencies: `Globe`, `lucide-react`
- target file: `src/renderer/components/jupyter/InlineHtmlRenderer.tsx`
- migration status: pending

- symbol name: `HtmlPreviewModal`
- kind: component
- approximate line range: L99-L164
- dependencies: `Globe`, `react-dom`
- target file: `src/renderer/components/jupyter/HtmlPreviewModal.tsx`
- migration status: pending

- symbol name: `InlineMermaidRenderer`
- kind: component
- approximate line range: L166-L223
- dependencies: `mermaid`, `react`
- target file: `src/renderer/components/jupyter/InlineMermaidRenderer.tsx`
- migration status: pending

- symbol name: `ConsoleOutput` (extracted from L496-L568)
- kind: component
- approximate line range: L496-L568
- dependencies: `Terminal`, `success`, `resolvedLanguage`, `tableData`, `outputLines`, `accentColor`
- target file: `src/renderer/components/jupyter/ConsoleOutput.tsx`
- migration status: pending

## 4. Proposed Target File Map

```txt
src/renderer/components/JupyterCodeViewer.tsx
  -> src/renderer/components/jupyter/langMeta.ts
  -> src/renderer/components/jupyter/InlineHtmlRenderer.tsx
  -> src/renderer/components/jupyter/HtmlPreviewModal.tsx
  -> src/renderer/components/jupyter/InlineMermaidRenderer.tsx
  -> src/renderer/components/jupyter/ConsoleOutput.tsx
```

## 5. 1:1 Move Records

### Move Record: langMeta
- original file: `src/renderer/components/JupyterCodeViewer.tsx`
- original line range: L18-L56
- target file: `src/renderer/components/jupyter/langMeta.ts`
- target symbol name: `getLangMeta`, `LangMeta`, `LANG_META`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: InlineHtmlRenderer
- original file: `src/renderer/components/JupyterCodeViewer.tsx`
- original line range: L58-L97
- target file: `src/renderer/components/jupyter/InlineHtmlRenderer.tsx`
- target symbol name: `InlineHtmlRenderer`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: HtmlPreviewModal
- original file: `src/renderer/components/JupyterCodeViewer.tsx`
- original line range: L99-L164
- target file: `src/renderer/components/jupyter/HtmlPreviewModal.tsx`
- target symbol name: `HtmlPreviewModal`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: InlineMermaidRenderer
- original file: `src/renderer/components/JupyterCodeViewer.tsx`
- original line range: L166-L223
- target file: `src/renderer/components/jupyter/InlineMermaidRenderer.tsx`
- target symbol name: `InlineMermaidRenderer`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: ConsoleOutput
- original file: `src/renderer/components/JupyterCodeViewer.tsx`
- original line range: L496-L568
- target file: `src/renderer/components/jupyter/ConsoleOutput.tsx`
- target symbol name: `ConsoleOutput`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
