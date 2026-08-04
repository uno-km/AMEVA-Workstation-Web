# index.ts Decomposition Ledger

## 1. Original File

- Original path: `src/main/index.ts`
- Original line count: 1990
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No (index.ts is entry point with no exports)

## 2. Export Inventory

- export name: None (Entry point file)
- kind: Entry Script
- original signature: N/A
- current consumers: Electron Main Process
- target file: `src/main/index.ts` (retained as slim bootstrap & window manager)
- migration status: pending

## 3. Internal Symbol Inventory

- symbol name: IPC Handlers (File/Dialog/Window/Export/Server/Keychain)
  - kind: IPC Registration Blocks
  - approximate line range: L204-L379, L1603-L1670, L1741, L1772-L1809, L1827-L1960
  - dependencies: `dialog`, `BrowserWindow`, `ipcMain`, `shell`, `safeStorage`, `exportersMain`, `CollabServerManager`, `net`
  - used by: Renderer Process via IPC
  - target file: `src/main/ipc/fileIpc.ts`
  - migration status: pending
- symbol name: IPC Handlers (MCP Process Management)
  - kind: IPC Registration Blocks
  - approximate line range: L1750-L1770, L1963-L1990
  - dependencies: `ipcMain`, `MCPProcessManager`
  - used by: Renderer Process via IPC
  - target file: `src/main/ipc/mcpIpc.ts`
  - migration status: pending
- symbol name: IPC Handlers (Python Runtime Execution)
  - kind: IPC Registration Blocks
  - approximate line range: L380-L407
  - dependencies: `ipcMain`, `spawn`
  - used by: Renderer Process via IPC
  - target file: `src/main/ipc/pythonIpc.ts`
  - migration status: pending
- symbol name: IPC Handlers (LLM / STT / Plan Management)
  - kind: IPC Registration Blocks
  - approximate line range: L408-L1599
  - dependencies: `ipcMain`, `LLMProcessManager`, `net`, `fs`
  - used by: Renderer Process via IPC
  - target file: `src/main/ipc/llmIpc.ts`
  - migration status: pending

## 4. Proposed Target File Map

```txt
src/main/index.ts
  -> src/main/ipc/fileIpc.ts
  -> src/main/ipc/mcpIpc.ts
  -> src/main/ipc/pythonIpc.ts
  -> src/main/ipc/llmIpc.ts
```

- target path: `src/main/ipc/fileIpc.ts`
  - responsibility: Dialogs, file I/O, window controls, URL metadata, keychain, PDF export, collab server IPC
  - symbols to move: `dialog:*`, `action:printToPDF`, `action:webSearch`, `action:openExternal`, `action:fetchUrlMetadata`, `export:*`, `window:*`, `keychain:*`, `server:*`
  - dependencies: `electron`, `path`, `fs/promises`, `./exportersMain.js`, `./services/collabServer.js`
  - exports: `registerFileIpc(getMainWindow: () => BrowserWindow | null): void`
  - must preserve names: Yes
  - behavior change: None

- target path: `src/main/ipc/mcpIpc.ts`
  - responsibility: MCP process spawning, calling, killing, token retrieval
  - symbols to move: `mcp:spawn`, `mcp:call`, `mcp:kill`, `mcp:getToken`
  - dependencies: `electron`, `../services/mcpProcessManager.js`
  - exports: `registerMcpIpc(): void`
  - must preserve names: Yes
  - behavior change: None

- target path: `src/main/ipc/pythonIpc.ts`
  - responsibility: Python runtime code execution
  - symbols to move: `runtime:runPython`
  - dependencies: `electron`, `child_process`
  - exports: `registerPythonIpc(): void`
  - must preserve names: Yes
  - behavior change: None

- target path: `src/main/ipc/llmIpc.ts`
  - responsibility: LLM server management, generation, streaming, model downloading, STT transcription
  - symbols to move: `llm:*`, `plan:*`, `stt:*`
  - dependencies: `electron`, `path`, `fs`, `fs/promises`, `url`, `net`, `../services/llmProcessManager.js`
  - exports: `registerLlmIpc(getMainWindow: () => BrowserWindow | null): void`
  - must preserve names: Yes
  - behavior change: None

## 5. 1:1 Move Records

### Move Record: registerFileIpc
- original file: `src/main/index.ts`
- original line range: L204-L379, L1603-L1670, L1741, L1772-L1809, L1827-L1960
- target file: `src/main/ipc/fileIpc.ts`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: registerMcpIpc
- original file: `src/main/index.ts`
- original line range: L1750-L1770, L1963-L1990
- target file: `src/main/ipc/mcpIpc.ts`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: registerPythonIpc
- original file: `src/main/index.ts`
- original line range: L380-L407
- target file: `src/main/ipc/pythonIpc.ts`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: registerLlmIpc
- original file: `src/main/index.ts`
- original line range: L408-L1599
- target file: `src/main/ipc/llmIpc.ts`
- name changed: No
- signature changed: No
- behavior changed: No
- verification result: Yes (Typecheck passed)
