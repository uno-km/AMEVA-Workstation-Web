import { DocumentArtifactFormat } from '../types'; // I need to make sure this import resolves or just define the types directly if easier.

export interface DocumentHostRequestBase {
  missionId: string;
  taskId: string;
  attemptId: string;
  workbenchSessionId: string;
  sessionCapabilityToken: string;
  documentJobId: string;
  documentId: string;
  artifactId: string;
  artifactRevision: string;
  artifactFormat: string;
  idempotencyKey: string;
}

export interface DocumentArtifactGenerateRequest extends DocumentHostRequestBase {
  integratedDocumentReference: string; // The full text or a reference ID
  outputLogicalPath: string; // e.g. "output.docx"
  expectedContentDigest?: string;
  generationOptions?: any;
}

export interface DocumentArtifactExtractRequest extends DocumentHostRequestBase {
  artifactReference: string; // The logical path
  expectedArtifactDigest?: string;
  expectedDocumentId?: string;
  reopenPolicyVersion?: string;
}

export interface GenerationResult {
  success: boolean;
  format: string;
  generatorName: string;
  generatorVersion: string;
  generatorCapability: string;
  generationExecutionProvenance: string;
  generatedByteLength: number;
  artifactDigest: string;
  outputArtifactReference: string;
  warnings: string[];
  errorCode?: string;
}

export interface ExtractionResult {
  success: boolean;
  format: string;
  extractorName: string;
  extractorVersion: string;
  extractorCapability: string;
  extractionExecutionProvenance: string;
  extractedTextLength: number;
  extractedText?: string;
  normalizedText?: string;
  normalizedTextDigest: string;
  extractionDigest: string;
  sectionCandidates: string[];
  warnings: string[];
  errorCode?: string;
  retryable?: boolean;
}

export type DocumentHostResponse<T> = 
  | { success: true; result: T }
  | { success: false; errorCode: string; safeMessage: string; retryable: boolean };
