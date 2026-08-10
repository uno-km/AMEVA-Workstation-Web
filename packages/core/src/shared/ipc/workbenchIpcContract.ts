/**
 * ============================================================================
 * @file workbenchIpcContract.ts
 * @description workbenchIpcContract.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './workbenchIpcContract';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * IpcResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type IpcResponse<T> = 
  | { success: true; result: T }
  | { success: false; errorCode: WorkbenchErrorCode; safeMessage: string; retryable?: boolean };

/**
 * WorkbenchErrorCode 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * IpcSessionContext 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcSessionContext {
  workbenchSessionId: string;
  sessionCapabilityToken: string;
  missionId: string;
  taskId: string;
  attemptId: string;
  idempotencyKey?: string;
}

/**
 * IpcCommandRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * IpcCommandResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * IpcSnapshotRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * IpcSnapshotManifestItem 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcSnapshotManifestItem {
  path: string;
  reason: string;
}

/**
 * IpcSnapshotManifest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcSnapshotManifest {
  totalFiles: number;
  totalBytes: number;
  copiedFiles: IpcSnapshotManifestItem[];
  excludedFiles: IpcSnapshotManifestItem[];
  referenceOnlyFiles: IpcSnapshotManifestItem[];
  approvalRequiredFiles: IpcSnapshotManifestItem[];
  failedFiles: IpcSnapshotManifestItem[];
}

/**
 * IpcCleanupRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcCleanupRequest extends IpcSessionContext {
  targetWorkspace: string;
  cleanupReason: string;
}

/**
 * IpcRegisterSessionRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcRegisterSessionRequest {
  missionId: string;
  taskId: string;
  attemptId: string;
  workbenchSessionId: string;
  requestedSourceWorkspace: string;
  requestedIsolatedWorkspace: string;
}

/**
 * IpcRegisterSessionResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcRegisterSessionResponse {
  workbenchSessionId: string;
  sessionCapabilityToken: string;
  allowedWorkspaceRoot: string;
}
