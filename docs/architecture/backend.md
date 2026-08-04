# Backend Architecture

## Core Concept
AMEVA Workstation is a serverless local AI & WASM hybrid operating system running as an Electron app. It serves as its own host, preventing the need for complex cloud deployments.

## Main Process Components (Electron Main)

### 1. Reverse WebSocket IPC (`mcp_proxy.js`)
- Runs as a background proxy on Port `11553`.
- Intercepts messages from the frontend to run host commands asynchronously.
- Connects the WASM C-Kernel to the underlying host OS.

### 2. C-Kernel WebAssembly Core
- A standalone POSIX-like kernel (`wasm/kernel.c`) compiled via `wasi-sdk`.
- Handles File System mapping, command parsing, and isolated sandboxing execution without direct OS privileges unless routed through the proxy.
- Mounted within the frontend to simulate a complete OS.

### 3. File System (VFS)
- A virtual file system running purely in memory and persisted into HTML5 LocalStorage on the renderer thread.
- Standard POSIX commands (`ls`, `cd`, `cat`) within the WASM kernel interact strictly with this VFS.

### 4. IPC Handlers
- **File IPC**: Handles file dialogs, saving, and native host file reading.
- **Python IPC**: Execution layer for the local bundled Python runtime.
- **LLM IPC**: Interacts with local inferences (`llama.cpp`, `ollama`) wrapping binary execution and streaming standard output.
- **Terminal IPC (`terminalIpc.ts`)**: Secure bridge allowing the renderer's `ConsoleCommandTab` to invoke underlying OS terminal commands (e.g., PowerShell) via `child_process.exec`. Provides root-directory sandboxing/cwd tracking natively.

## Error Handling & Resiliency
- Strict "No Swallow" policy on exceptions.
- System-level interactions (LLM binding, WebSocket connections) must catch errors and emit them back to the renderer to prevent memory leaks and VFS corruption.
- **Graceful Shutdown & Window Defense**:
  - `WindowDefenseManager`: Centralized module preventing accidental renderer data loss (blocks `F5`, `Ctrl+R` while allowing `Ctrl+Shift+R`). Intercepts `close` events with a synchronous confirmation dialog to safeguard unsaved work.
  - Background LLM processes (`llama-server`) are gracefully shut down via `SIGINT` signals with a 3-second timeout before forced `SIGKILL` on application quit (`SIGINT`, `SIGTERM`, `will-quit`).
  - Heavy synchronous cleanups (`execSync('taskkill')`) are strictly replaced with asynchronous tracking and teardowns to prevent main thread blocking during Electron startup.
