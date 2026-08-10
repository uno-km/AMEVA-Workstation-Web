/**
 * ============================================================================
 * @file primaryTypeResolver.ts
 * @description primaryTypeResolver.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './primaryTypeResolver';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { DocumentClassificationResult, DocumentSubDomainResult, DocumentIntentResult, KeywordStat } from '../types';
// [내부 프로젝트 의존성 모듈 임포트: ../rules/rulePluginRegistry]
import { ruleRegistry } from '../rules/rulePluginRegistry';

/**
 * resolvePrimaryType 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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
