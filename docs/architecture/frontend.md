# Frontend Architecture

## Core Technologies
- **React (Vite):** Core UI framework.
- **Zustand:** Domain-separated state management.
- **Yjs:** Real-time collaboration CRDT.
- **BlockNote:** Block-based text editor for the main document.

## Component Hierarchy & Modularity

### 1. App Layout
- `AppLayout.tsx`: The primary container managing the Sidebar, Editor, and AI Panel.
- `ModalManager.tsx`: A centralized facade for all dialogs (Settings, Marketplace, Pricing, etc.).

### 2. Theming System
- Relies on CSS Variables (e.g., `var(--primary)`, `var(--bg-panel)`).
- Multiple themes supported: Dark Mode (default), Light Mode, and a specialized Win98 Mode (using `win98-scrollbar`, `win98-font`, and dotted borders for focused states).
- Hardcoded hex colors are actively eliminated to support dynamic thematic switching.

### 3. Editor Engine
- Uses **BlockNote** mapped to custom blocks.
- `JupyterCodeBlock.tsx`: Integrates a CodeMirror editor inline.
- Supports WASM-based local runtime execution (Python, SQL, HTML).

### 4. AI Console & Drawer (Recent Enhancements)
- **`AILogDrawer.tsx`**: Facade UI managing the sliding drawer.
- **`ConsoleLogTab.tsx`**: Renders raw engine logs with advanced log coloring based on log types (e.g., Llama, WebGPU).
- **`ConsoleCommandTab.tsx`**: Interactive terminal UI connected to the backend via IPC, enabling OS-level commands natively within the electron sandbox.
- **`ConsoleContextMenu.tsx`**: Context menu handling clipboard operations (Copy, Paste, Insert to Document).

## State Management (Zustand)
- Follows the "No God Store" rule. State is divided by domain:
  - `useProcessStore.ts`: Manages OS-level task queues and executions.
  - `useAIState.ts`: Manages Llama model loading and engine states.
  - `useAILogStore.ts`: Manages real-time log streaming from the local AI engines.

## IPC Integration
- Uses `electronAPI` exposed via `preload.ts` to communicate with the main process.
- Strictly typed requests via `ipcRenderer.invoke`.
