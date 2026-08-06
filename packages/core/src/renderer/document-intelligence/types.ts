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

export interface DocumentClassificationResult {
  primary: string;
  confidence: number;
  scores: Record<string, number>;
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
