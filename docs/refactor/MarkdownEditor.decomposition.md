# MarkdownEditor.tsx Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/components/MarkdownEditor.tsx`
- Original line count: ~644
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

- export name: `MarkdownEditor`
- kind: component
- current consumers: `AppLayout.tsx`
- target file: `src/renderer/components/MarkdownEditor.tsx` (remains as shell)
- migration status: verified

## 3. Internal Symbol Inventory

- symbol name: `handleEditorMouseMove` (and `hoverBlock` state)
- kind: React Hook / DOM Event Handler
- approximate line range: 88-164
- target file: `src/renderer/hooks/editor/useHoverBlock.ts`
- migration status: verified

- symbol name: `handleSideMenuHover` effect
- kind: React Effect
- approximate line range: 166-198
- target file: `src/renderer/hooks/editor/useSideMenuHoverSync.ts`
- migration status: verified

- symbol name: `onDropCapture` logic
- kind: DOM Event Handler
- approximate line range: 312-378
- target file: `src/renderer/hooks/editor/useEditorDragDrop.ts`
- migration status: verified

- symbol name: `onPasteCapture` logic
- kind: DOM Event Handler
- approximate line range: 379-437
- target file: `src/renderer/hooks/editor/useEditorPaste.ts`
- migration status: verified

- symbol name: Rich Styling Toolbar JSX
- kind: JSX Element Block
- approximate line range: 263-306
- target file: `src/renderer/components/editor/RichStyleToolbar.tsx`
- migration status: pending

- symbol name: `handleImgClick` (ImageLightbox logic)
- kind: React Effect
- approximate line range: 221-231
- target file: `src/renderer/hooks/editor/useImageLightbox.ts`
- migration status: pending

- symbol name: `handleSelection` (Drag selection tracking)
- kind: React Handler
- approximate line range: 233-248
- target file: `src/renderer/hooks/editor/useSelectionTracking.ts`
- migration status: pending

## 4. Proposed Target File Map

```text
src/renderer/components/MarkdownEditor.tsx
  -> src/renderer/components/editor/RichStyleToolbar.tsx
  -> src/renderer/hooks/editor/useHoverBlock.ts
  -> src/renderer/hooks/editor/useSideMenuHoverSync.ts
  -> src/renderer/hooks/editor/useEditorDragDrop.ts
  -> src/renderer/hooks/editor/useEditorPaste.ts
  -> src/renderer/hooks/editor/useImageLightbox.ts
  -> src/renderer/hooks/editor/useSelectionTracking.ts
```

## 5. 1:1 Move Records

Pending extraction execution...
