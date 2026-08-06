import type { DocumentClassificationResult, KeywordStat } from '../types';
import { ruleRegistry } from '../rules/rulePluginRegistry';

export function resolvePrimaryType(
  shapeResult: DocumentClassificationResult,
  domainResult: DocumentClassificationResult,
  keywords: KeywordStat[]
): { primaryType: string, displayLabel: string, classificationStatus: any } {
  const shape = shapeResult.primary;
  const domain = domainResult.primary;
  
  let primaryType = 'unknown';
  let displayLabel = '미분류 문서';
  let status = 'unknown';

  const shapeLabel = ruleRegistry.getShapeRules().find(r => r.id === shape)?.label || shape;
  const domainLabel = ruleRegistry.getDomainRules().find(r => r.id === domain)?.label || domain;

  const hasShape = shape !== 'unknown';
  const hasDomain = domain !== 'unknown';

  if (hasShape && hasDomain) {
    status = 'classified';
    primaryType = `${domain}_${shape}`;
    
    // 특수 예외 조합 매핑
    if (domain === 'academic' && shape === 'guide') {
      const isCourseReg = keywords.slice(0, 10).some(k => k.term === '수강신청' || k.term === '수강정정');
      primaryType = isCourseReg ? 'course_registration_guide' : 'academic_guide';
      displayLabel = isCourseReg ? '학사 수강신청 안내문' : '일반 학사 안내문';
    } else {
      displayLabel = `${domainLabel} ${shapeLabel}`;
    }
  } else if (hasShape && !hasDomain) {
    status = 'shape_detected_domain_unknown';
    primaryType = shape;
    displayLabel = `[${shapeLabel}] 문서`;
  } else if (!hasShape && hasDomain) {
    status = 'domain_detected_shape_unknown';
    primaryType = domain;
    displayLabel = `미분류 ${domainLabel} 문서`;
  } else {
    status = 'unknown';
    displayLabel = '분류 불가 / 일반 문서';
  }

  // 전체 신뢰도가 너무 낮은 경우 fallback
  if (status !== 'unknown' && (shapeResult.confidence + domainResult.confidence) / 2 < 20) {
    status = 'low_confidence';
    displayLabel = '분류 신뢰도 낮음';
  }

  return { primaryType, displayLabel, classificationStatus: status };
}
