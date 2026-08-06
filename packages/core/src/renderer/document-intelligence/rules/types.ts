export interface DomainRule {
  id: string;
  label: string;
  source: 'builtin' | 'user' | 'team';
  version: string;
  keywords: string[];
  phrases?: string[];
  sectionHints?: string[];
  filenameHints?: string[];
  unitHints?: string[];
  entityHints?: string[];
  negativeKeywords?: string[];
  weight: number;
}

export interface ShapeRule {
  id: string;
  label: string;
  keywords: string[];
}
