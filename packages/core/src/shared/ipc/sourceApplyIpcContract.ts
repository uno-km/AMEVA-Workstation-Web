/**
 * @file shared/ipc/sourceApplyIpcContract.ts
 * @system AMEVA OS Desktop Workstation
 * @role Source Apply IPC Communication Interfaces
 */

import type { SourceApplyRequest, SourceApplyPreview, SourceApplyOperation } from '../../renderer/services/ai/orchestrator/task-runtime/apply/types';
import type { RepositoryArtifact } from '../../renderer/services/ai/orchestrator/task-runtime/artifact/repository/types';

export interface IpcCreatePreviewRequest {
  requestId: string;
  missionId: string;
  taskId: string;
  workbenchSessionId: string;
  sourceWorkspaceDigest: string;
  targetArtifact: RepositoryArtifact;
}

export interface IpcCreatePreviewResponse {
  success: boolean;
  preview?: SourceApplyPreview;
  error?: string;
}

export interface IpcExecuteApplyRequest {
  authorizationTicketId: string;
  approvalId?: string;
  workbenchSessionId: string;
  sessionCapabilityToken?: string;
}

export interface IpcExecuteApplyResponse {
  success: boolean;
  executionId?: string;
  errorCode?: string;
}

export type SourceApplyAuthorizationErrorCode = 
  | 'PREVIEW_STALE'
  | 'SOURCE_DIGEST_MISMATCH'
  | 'APPROVAL_NOT_FOUND'
  | 'APPROVAL_INVALIDATED'
  | 'CAPABILITY_INVALID'
  | 'ARTIFACT_MISMATCH'
  | 'DIGEST_MISMATCH';

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

export interface IpcAuthorizeSourceApplyResponse {
  success: boolean;
  authorizationTicketId?: string;
  errorCode?: SourceApplyAuthorizationErrorCode;
  errorMessage?: string;
}

export interface IpcVerifyApplyRequest {
  executionId: string;
  authorizationTicketId: string;
}

export interface IpcVerifyApplyResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface IpcGetAuthorizationStatusRequest {
  authorizationTicketId: string;
}

export interface IpcGetAuthorizationStatusResponse {
  success: boolean;
  status?: string;
  errorCode?: string;
}

export interface IpcReleaseAuthorizationRequest {
  authorizationTicketId: string;
  reason?: string;
}

export interface IpcReleaseAuthorizationResponse {
  success: boolean;
  errorCode?: string;
}
