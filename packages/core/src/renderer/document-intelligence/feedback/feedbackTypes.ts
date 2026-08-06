export interface DocumentFeedback {
  feedbackId: string;
  fileId: string;
  fileName: string;
  createdAt: string;
  
  // 원래 엔진이 예측한 값
  originalPrediction: {
    shape: string;
    domain: string;
    primaryType: string;
    confidence: number;
  };
  
  // 사용자가 수정한 값
  corrected: {
    shape: string;
    domain: string;
    primaryType: string;
    displayLabel: string;
    selectedKeywords: string[];
    selectedSections: string[];
    notes?: string;
  };
}

export interface RuleCandidate {
  candidateId: string;
  targetDomain: string;
  targetShape?: string;
  suggestedKeywords: string[];
  suggestedSectionHints: string[];
  supportingFeedbackIds: string[];
  confidence: number; // 얼마나 확실한가 (TF-IDF 등 점수 기반)
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
