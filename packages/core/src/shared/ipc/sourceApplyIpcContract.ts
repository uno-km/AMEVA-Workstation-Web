/**
 * ============================================================================
 * @file sourceApplyIpcContract.ts
 * @description sourceApplyIpcContract.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './sourceApplyIpcContract';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file shared/ipc/sourceApplyIpcContract.ts
 * @system AMEVA OS Desktop Workstation
 * @role Source Apply IPC Communication Interfaces
 */

// [내부 프로젝트 의존성 모듈 임포트: ../../renderer/services/ai/orchestrator/task-runtime/apply/types]
import type { SourceApplyRequest, SourceApplyPreview, SourceApplyOperation } from '../../renderer/services/ai/orchestrator/task-runtime/apply/types';
// [내부 프로젝트 의존성 모듈 임포트: ../../renderer/services/ai/orchestrator/task-runtime/artifact/repository/types]
import type { RepositoryArtifact } from '../../renderer/services/ai/orchestrator/task-runtime/artifact/repository/types';

/**
 * IpcCreatePreviewRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcCreatePreviewRequest {
  requestId: string;
  missionId: string;
  taskId: string;
  workbenchSessionId: string;
  sourceWorkspaceDigest: string;
  targetArtifact: RepositoryArtifact;
}

/**
 * IpcCreatePreviewResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcCreatePreviewResponse {
  success: boolean;
  preview?: SourceApplyPreview;
  error?: string;
}

/**
 * IpcExecuteApplyRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcExecuteApplyRequest {
  authorizationTicketId: string;
  approvalId?: string;
  workbenchSessionId: string;
  sessionCapabilityToken?: string;
}

/**
 * IpcExecuteApplyResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcExecuteApplyResponse {
  success: boolean;
  executionId?: string;
  errorCode?: string;
}

/**
 * SourceApplyAuthorizationErrorCode 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type SourceApplyAuthorizationErrorCode = 
  | 'PREVIEW_STALE'
  | 'SOURCE_DIGEST_MISMATCH'
  | 'APPROVAL_NOT_FOUND'
  | 'APPROVAL_INVALIDATED'
  | 'CAPABILITY_INVALID'
  | 'ARTIFACT_MISMATCH'
  | 'DIGEST_MISMATCH';

/**
 * IpcAuthorizeSourceApplyRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcAuthorizeSourceApplyRequest {
  sourceApplyRequestId: string;
  sourceApplyOperationId: string;
  approvalId: string;
  missionId: string;
  taskId: string;
  attemptId: string;
  workbenchSessionId: string;
  sessionCapabilityToken?: string;
  repositoryArtifactId: string;
  artifactRevision: number;
  sourceWorkspaceReference: string;
  previewId: string;
  idempotencyKey: string;
  requestedAt: number;
}

/**
 * IpcAuthorizeSourceApplyResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcAuthorizeSourceApplyResponse {
  success: boolean;
  authorizationTicketId?: string;
  errorCode?: SourceApplyAuthorizationErrorCode;
  errorMessage?: string;
}

/**
 * IpcVerifyApplyRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcVerifyApplyRequest {
  executionId: string;
  authorizationTicketId: string;
}

/**
 * IpcVerifyApplyResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcVerifyApplyResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * IpcGetAuthorizationStatusRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcGetAuthorizationStatusRequest {
  authorizationTicketId: string;
}

/**
 * IpcGetAuthorizationStatusResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcGetAuthorizationStatusResponse {
  success: boolean;
  status?: string;
  errorCode?: string;
}

/**
 * IpcReleaseAuthorizationRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcReleaseAuthorizationRequest {
  authorizationTicketId: string;
  reason?: string;
}

/**
 * IpcReleaseAuthorizationResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface IpcReleaseAuthorizationResponse {
  success: boolean;
  errorCode?: string;
}
