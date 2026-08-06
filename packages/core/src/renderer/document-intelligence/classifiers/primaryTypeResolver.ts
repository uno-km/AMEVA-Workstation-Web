import type { DocumentClassificationResult, DocumentSubDomainResult, DocumentIntentResult, KeywordStat } from '../types';
import { ruleRegistry } from '../rules/rulePluginRegistry';

export function resolvePrimaryType(
  shapeResult: DocumentClassificationResult,
  domainResult: DocumentClassificationResult,
  subDomainResult: DocumentSubDomainResult,
  intentResult: DocumentIntentResult,
  keywords: KeywordStat[]
): { primaryType: string, displayLabel: string, classificationStatus: any } {
  const shape = shapeResult.primary;
  const domain = domainResult.primary;
  const subDomain = subDomainResult.primary;
  const intent = intentResult.primary;
  
  const shapeLabel = ruleRegistry.getShapeRules().find(r => r.id === shape)?.label || shape;
  const domainLabel = ruleRegistry.getDomainRules().find(r => r.id === domain)?.label || domain;
  const subDomainLabel = subDomainResult.label;
  const intentLabel = intentResult.label;

  const hasShape = shape !== 'unknown';
  const hasDomain = domain !== 'unknown';
  const hasSubDomain = subDomain !== 'unknown';
  const hasIntent = intent !== 'unknown';

  let primaryType = 'unknown';
  let displayLabel = '미분류 문서';
  let status = 'unknown';

  if (hasDomain) {
    status = 'classified';
    
    if (hasSubDomain && hasIntent && hasShape) {
      primaryType = `${domain}_${subDomain}_${intent}_${shape}`;
      displayLabel = `${subDomainLabel} ${intentLabel} ${shapeLabel}`;
    } 
    else if (hasSubDomain && hasShape) {
      primaryType = `${domain}_${subDomain}_${shape}`;
      displayLabel = `${subDomainLabel} ${shapeLabel}`;
    }
    else if (hasIntent && hasShape) {
      primaryType = `${domain}_${intent}_${shape}`;
      displayLabel = `${domainLabel} ${intentLabel} ${shapeLabel}`;
    }
    else if (hasShape) {
      primaryType = `${domain}_${shape}`;
      displayLabel = `${domainLabel} ${shapeLabel}`;
    } 
    else {
      status = 'domain_detected_shape_unknown';
      primaryType = domain;
      displayLabel = `미분류 ${domainLabel} 문서`;
    }
  } else if (hasShape) {
    status = 'shape_detected_domain_unknown';
    primaryType = shape;
    displayLabel = `[${shapeLabel}] 문서`;
  } else {
    status = 'unknown';
    displayLabel = '분류 불가 / 일반 문서';
  }

  // 특수 예외 조합 매핑 (기존 호환성 유지)
  if (domain === 'academic' && shape === 'guide') {
    const isCourseReg = keywords.slice(0, 10).some(k => k.term === '수강신청' || k.term === '수강정정');
    if (isCourseReg) {
      primaryType = 'course_registration_guide';
      displayLabel = '학사 수강신청 안내문';
    }
  }

  if (status !== 'unknown' && (shapeResult.confidence + domainResult.confidence) / 2 < 20) {
    status = 'low_confidence';
    displayLabel = '분류 신뢰도 낮음';
  }

  return { primaryType, displayLabel, classificationStatus: status };
}
