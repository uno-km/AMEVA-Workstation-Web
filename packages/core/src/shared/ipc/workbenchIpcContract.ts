export type IpcResponse<T> = 
  | { success: true; result: T }
  | { success: false; errorCode: WorkbenchErrorCode; safeMessage: string; retryable?: boolean };

export type WorkbenchErrorCode = 
  | 'INVALID_WORKBENCH_CONTEXT'
  | 'WORKBENCH_SESSION_NOT_FOUND'
  | 'WORKBENCH_SESSION_UNAUTHORIZED'
  | 'WORKBENCH_CONTEXT_MISMATCH'
  | 'IPC_SENDER_UNAUTHORIZED'
  | 'PATH_CHANGED_DURING_OPERATION'
  | 'CLEANUP_SCOPE_VIOLATION'
  | 'BLOCKED_BY_APPROVAL_INTEGRATION'
  | 'SHELL_EXECUTION_NOT_ALLOWED'
  | 'INVALID_PATH'
  | 'SNAPSHOT_ERROR'
  | 'EXECUTION_ERROR'
  | 'CANCEL_ERROR'
  | 'CLEANUP_ERROR'
  | 'INSPECT_ERROR'
  | 'INVALID_REQUEST'
  | 'NETWORK_ISOLATION_VIOLATION';

export interface IpcSessionContext {
  workbenchSessionId: string;
  sessionCapabilityToken: string;
  missionId: string;
  taskId: string;
  attemptId: string;
  idempotencyKey?: string;
}

export interface IpcCommandRequest extends IpcSessionContext {
  commandId: string;
  executable: string;
  arguments: string[];
  workingDirectory: string;
  environmentKeys: Record<string, string>;
  timeoutMs: number;
  maxOutputBytes: number;
  expectedExitCodes: number[];
  networkRequired: boolean;
  approvalId?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IpcCommandResult {
  commandId: string;
  status: 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'BLOCKED_BY_POLICY' | 'INTERRUPTED';
  exitCode: number;
  signal: string | null;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  timedOut: boolean;
  cancelled: boolean;
  stdoutPreview: string;
  stderrPreview: string;
  outputTruncated: boolean;
  capabilitiesUsed: Record<string, string>;
}

export interface IpcSnapshotRequest extends IpcSessionContext {
  sourceDir: string;
  destDir: string;
  allowedPaths: string[] | null;
  maxSingleFileBytes: number;
  maxWorkspaceBytes: number;
  maxFileCount: number;
  largeFilePolicy: 'EXCLUDE' | 'REFERENCE_ONLY' | 'REQUIRE_APPROVAL' | 'FAIL';
  requiredInputs?: string[];
  protectedPaths?: string[];
}

export interface IpcSnapshotManifestItem {
  path: string;
  reason: string;
}

export interface IpcSnapshotManifest {
  totalFiles: number;
  totalBytes: number;
  copiedFiles: IpcSnapshotManifestItem[];
  excludedFiles: IpcSnapshotManifestItem[];
  referenceOnlyFiles: IpcSnapshotManifestItem[];
  approvalRequiredFiles: IpcSnapshotManifestItem[];
  failedFiles: IpcSnapshotManifestItem[];
}

export interface IpcCleanupRequest extends IpcSessionContext {
  targetWorkspace: string;
  cleanupReason: string;
}

export interface IpcRegisterSessionRequest {
  missionId: string;
  taskId: string;
  attemptId: string;
  workbenchSessionId: string;
  requestedSourceWorkspace: string;
  requestedIsolatedWorkspace: string;
}

export interface IpcRegisterSessionResponse {
  workbenchSessionId: string;
  sessionCapabilityToken: string;
  allowedWorkspaceRoot: string;
}
