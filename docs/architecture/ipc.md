# IPC (Inter-Process Communication) Architecture

## Bridge System
The Electron context isolation strictly prohibits the renderer (Frontend) from directly accessing Node.js APIs (Backend). AMEVA Workstation solves this through `preload.ts`, creating an `electronAPI` proxy.

## Preload Interface (`src/main/preload.ts`)
The `preload.ts` scripts map string-based IPC channels to type-safe function signatures.

```typescript
// Example Definition
export const electronAPI = {
  // File System
  readHostFile: (path: string) => ipcRenderer.invoke('file:read', path),
  
  // Terminal Execution
  executeTerminal: (cmd: string, cwd?: string) => ipcRenderer.invoke('terminal:execute', cmd, cwd),
  
  // AI Inference
  startLlamaServer: (modelPath: string) => ipcRenderer.invoke('llama:start', modelPath)
}
```

## Backend IPC Registration (`src/main/ipc/*`)
Each domain handles its own logic inside a dedicated file, which is then registered centrally in `src/main/index.ts`.

### 1. `terminalIpc.ts`
- **Channel:** `terminal:execute`
- **Method:** `execAsync(command, { cwd })`
- **Responsibility:** Accepts raw bash/powershell strings and executes them asynchronously, returning `{ stdout, stderr, exitCode }`.

### 2. `pythonIpc.ts`
- **Channel:** `python:run`
- **Responsibility:** Spawns a sub-process for the embedded python executable to safely execute machine learning loops or standard data processing scripts requested from the `JupyterCodeBlock`.

### 3. `llmIpc.ts` (Llama / Ollama)
- **Channel:** `llama:start`, `llama:stop`, `llama:status`
- **Responsibility:** Binds directly to the local C++ bindings or binaries of llama.cpp. Manages process lifecycle to prevent zombie processes.
