# electronApiAdapter.ts Decomposition Ledger

## 1. Original File

- Original path: `src/renderer/services/ipc/electronApiAdapter.ts`
- Original line count: 623 lines
- Refactor type: Mechanical decomposition only
- Behavior change allowed: No
- Rename allowed: No
- Signature change allowed: No
- Import path break allowed: No

## 2. Export Inventory

The file exports 30+ functions. We will group them logically into adapters and re-export them from `electronApiAdapter.ts`.

Groups:
1. `llmAdapter.ts`: `llmGenerate`, `llmAbort`, `onLLMToken`, `onLLMDone`, `onLLMLog`, `llmGetLogs`, `llmAddLog`, `llmCheckHealth`, `llmListModels`, `llmImportModel`, `onModelDownloadProgress`, `llmDownloadModel`, `onLLMDownloadProgress`, `llmRestart`, `llmStart`, `llmStop`, `llmGetGpuName`
2. `fileAdapter.ts`: `openFile`, `saveFile`, `saveFileAs`, `selectLocalFile`, `onFileOpenArgv`, `fetchUrlMetadata`, `openExternalLink`
3. `appAdapter.ts`: `isElectronEnv`, `appReady`, `getZoomLevel`, `setZoomLevel`, `getZoomFactor`, `setZoomFactor`, `showMessageBox`, `planGetStatus`, `planSetStatus`, `isFreeMode`, `newWindow`, `closeApp`
4. `keychainAdapter.ts`: `keychainGet`, `keychainSet`, `keychainDelete`
5. `mcpAdapter.ts`: `mcpSpawn`, `mcpCall`, `mcpKill`, `mcpGetToken`
6. `exportAdapter.ts`: `onExportProgress`, `printToPDF`, `saveExportedFile`, `exportConvert`
7. `sandboxAdapter.ts`: `runPythonCode`, `webSearch`
8. `collabAdapter.ts`: `onServerStatus`, `startCollaborationServer`, `stopCollaborationServer`

All groups will reside in `src/renderer/services/ipc/adapters/`.

## 3. Internal Symbol Inventory

- `window.electronAPI` interface type declaration will remain in `electronApiAdapter.ts` or be moved to `ipcTypes.ts`. Let's move it to `src/renderer/services/ipc/ipcTypes.ts` or just leave it in `electronApiAdapter.ts`.
Wait, it's augmenting the global `Window` object, so it can just stay in `electronApiAdapter.ts`.

## 4. Proposed Target File Map

```txt
src/renderer/services/ipc/electronApiAdapter.ts
  -> src/renderer/services/ipc/adapters/llmAdapter.ts
  -> src/renderer/services/ipc/adapters/fileAdapter.ts
  -> src/renderer/services/ipc/adapters/appAdapter.ts
  -> src/renderer/services/ipc/adapters/keychainAdapter.ts
  -> src/renderer/services/ipc/adapters/mcpAdapter.ts
  -> src/renderer/services/ipc/adapters/exportAdapter.ts
  -> src/renderer/services/ipc/adapters/sandboxAdapter.ts
  -> src/renderer/services/ipc/adapters/collabAdapter.ts
```

## 5. 1:1 Move Records

### Move Record: llmAdapter
- original line range: L172-L310, L435-L480, L512-L516
- target file: `src/renderer/services/ipc/adapters/llmAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: fileAdapter
- original line range: L338-L424
- target file: `src/renderer/services/ipc/adapters/fileAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: appAdapter
- original line range: L30-L41, L182-L187, L426-L433, L481-L510, L517-L534, L565-L575
- target file: `src/renderer/services/ipc/adapters/appAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: keychainAdapter
- original line range: L312-L336
- target file: `src/renderer/services/ipc/adapters/keychainAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: mcpAdapter
- original line range: L43-L69, L535-L552, L618-L623
- target file: `src/renderer/services/ipc/adapters/mcpAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: exportAdapter
- original line range: L553-L564, L577-L588
- target file: `src/renderer/services/ipc/adapters/exportAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: sandboxAdapter
- original line range: L71-L76, L589-L600
- target file: `src/renderer/services/ipc/adapters/sandboxAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)

### Move Record: collabAdapter
- original line range: L78-L98, L601-L617
- target file: `src/renderer/services/ipc/adapters/collabAdapter.ts`
- name/signature/behavior changed: No
- verification result: Yes (Typecheck passed)
