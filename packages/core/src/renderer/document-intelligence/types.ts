export interface DocumentSourceMeta {
  fileName: string;
  docType: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'unknown';
  fileSize: number;
  pageCount: number;
  sheetCount?: number;
  slideCount?: number;
}

export interface KeywordStat {
  term: string;
  count: number;
  score: number;
  pages: number[];
}

export interface CoOccurrence {
  terms: [string, string];
  count: number;
  pages: number[];
}

export interface SectionCandidate {
  title: string;
  page: number;
  level: number;
  confidence: number;
  source: 'outline' | 'pattern' | 'heuristic';
}

export interface Entities {
  dates: string[];
  money: string[];
  organizations: string[];
  emails: string[];
  urls: string[];
  percentages: string[];
  phones: string[];
}

export interface DocumentSubDomainResult {
  primary: string;
  label: string;
  confidence: number;
  scores: Record<string, number>;
  evidence: string[];
}

export interface DocumentIntentResult {
  primary: string;
  label: string;
  confidence: number;
  evidence: string[];
}

export interface DocumentClassificationResult {
  primary: string;
  confidence: number;
  scores: Record<string, number>;
  evidence: string[];
}

export interface TopicCluster {
  id: string;
  label: string;
  terms: string[];
  phrases: string[];
  pages: number[];
  score: number;
  confidence: number;
  evidence: string[];
}

export interface DocumentProfileResult {
  version: string;
  source: DocumentSourceMeta;
  profile: {
    primaryType: string;
    displayLabel: string;
    classificationStatus: 'classified' | 'low_confidence' | 'domain_detected_shape_unknown' | 'shape_detected_domain_unknown' | 'unknown';
    documentShape: DocumentClassificationResult;
    documentDomain: DocumentClassificationResult;
    documentSubDomain?: DocumentSubDomainResult;
    intent?: DocumentIntentResult;
    discoveredTopics?: TopicCluster[];
    primaryTopic?: TopicCluster;
    confidence: number;
    evidence: string[];
    fallbackMessage?: string;
  };
  keywords: KeywordStat[];
  coOccurrences: CoOccurrence[];
  sections: SectionCandidate[];
  entities: Entities;
  importantPages: { page: number; score: number; reasons: string[] }[];
  pageStats: { page: number; charCount: number; tokenCount: number; topTerms: string[] }[];
  warnings: string[];
}
