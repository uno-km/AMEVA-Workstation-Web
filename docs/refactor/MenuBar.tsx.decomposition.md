# Decomposition Plan

## Target

- Original file: `src/renderer/components/MenuBar.tsx`
- Approximate size: 450 lines
- Refactor mode: Extract bloated `useEffect` into a custom hook (`useMenuBarShortcuts`)
- Behavior change: None
- Rename allowed: No
- Signature change allowed: No

## Step 1. Inventory

- Internal functions/classes/types to record:
  - `handleKeyDown` inside `useEffect` (lines 115-171)
- Side effects to identify: Global `keydown` event listener for Alt-key shortcuts.
- Runtime boundaries to protect: Component state (`isAltMode`, `activeMenu`) must be accurately updated.

## Step 2. Target File Map

- target file: `src/renderer/hooks/app/useMenuBarShortcuts.ts`
  - responsibility: Manage global keydown events for Alt-key menu navigation.
  - symbols to move: The entire `useEffect` handling `handleKeyDown`.
  - compatibility strategy: Inject the hook in `MenuBar.tsx` passing required dependencies as an options object.

## Step 3. Move Order

1. Create `src/renderer/hooks/app/useMenuBarShortcuts.ts` and define `useMenuBarShortcuts` with exact same logic.
2. Replace the bloated `useEffect` in `MenuBar.tsx` with a single call to `useMenuBarShortcuts(options)`.
3. Fix unused variable warnings in `AILogDrawer.tsx`, `SettingsTransitionOverlay.tsx`, and `SettingsModal.tsx`.

## Step 4. Verification Strategy

- Typecheck command: IDE built-in TS compiler.
- Manual checks: Alt shortcuts must continue working perfectly as designed without React dependency array warnings.

## Step 5. Risk Areas

- React state/store: Passing state setters (`setIsAltMode`, `setActiveMenu`) and triggering actions correctly so closures don't get stale.
