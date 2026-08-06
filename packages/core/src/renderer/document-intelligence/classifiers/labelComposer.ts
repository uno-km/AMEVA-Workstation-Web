import type { DocumentClassificationResult, DocumentSubDomainResult, DocumentIntentResult, TopicCluster, KeywordStat } from '../types';
import { ruleRegistry } from '../rules/rulePluginRegistry';

export function composeDisplayLabel(
  shapeResult: DocumentClassificationResult,
  domainResult: DocumentClassificationResult,
  subDomainResult: DocumentSubDomainResult,
  intentResult: DocumentIntentResult,
  primaryTopic?: TopicCluster,
  keywords?: KeywordStat[]
): { primaryType: string, displayLabel: string, classificationStatus: any } {
  const shape = shapeResult.primary;
  const domain = domainResult.primary;
  const subDomain = subDomainResult.primary;
  const intent = intentResult.primary;
  
  const shapeLabel = ruleRegistry.getShapeRules().find(r => r.id === shape)?.label || shape;
  const domainLabel = ruleRegistry.getDomainRules().find(r => r.id === domain)?.label || domain;
  const subDomainLabel = subDomainResult.label;
  const intentLabel = intentResult.label;
  const topicLabel = primaryTopic?.label;

  const hasShape = shape !== 'unknown';
  const hasDomain = domain !== 'unknown';
  const hasSubDomain = subDomain !== 'unknown';
  const hasIntent = intent !== 'unknown';
  const hasTopic = !!topicLabel;

  let primaryType = 'unknown';
  let displayLabel = '미분류 문서';
  let status = 'unknown';

  // Helper to remove duplicate words (e.g. "지진 피해 피해분석" -> "지진 피해 분석")
  const mergeLabels = (...parts: string[]) => {
    const validParts = parts.filter(p => !!p);
    if (validParts.length === 0) return '';
    
    // Simple naive deduplication: split into words and build string avoiding consecutive duplicates
    const words: string[] = [];
    validParts.join(' ').split(' ').forEach(w => {
      // Check if word is already in the last 2 words to avoid repetition like "피해 피해분석"
      if (!words.some(existing => existing.includes(w) || w.includes(existing))) {
        words.push(w);
      }
    });
    return words.join(' ');
  };

  // A. primaryTopic + intent + shape
  if (hasTopic && hasIntent && hasShape) {
    status = 'classified';
    primaryType = `topic_${primaryTopic.id}_${intent}_${shape}`;
    displayLabel = mergeLabels(topicLabel, intentLabel, shapeLabel);
  }
  // B. primaryTopic + shape
  else if (hasTopic && hasShape) {
    status = 'classified';
    primaryType = `topic_${primaryTopic.id}_${shape}`;
    displayLabel = mergeLabels(topicLabel, shapeLabel);
  }
  // C. subDomain + intent + shape (fallback if no primary topic)
  else if (hasSubDomain && hasIntent && hasShape) {
    status = 'classified';
    primaryType = `${domain}_${subDomain}_${intent}_${shape}`;
    displayLabel = mergeLabels(subDomainLabel, intentLabel, shapeLabel);
  }
  // D. domain + intent + shape
  else if (hasDomain && hasIntent && hasShape) {
    status = 'classified';
    primaryType = `${domain}_${intent}_${shape}`;
    displayLabel = mergeLabels(domainLabel, intentLabel, shapeLabel);
  }
  // E. domain + shape
  else if (hasDomain && hasShape) {
    status = 'classified';
    primaryType = `${domain}_${shape}`;
    displayLabel = mergeLabels(domainLabel, shapeLabel);
  }
  // F. shape only
  else if (hasShape) {
    status = 'shape_detected_domain_unknown';
    primaryType = shape;
    displayLabel = `[${shapeLabel}] 문서`;
  }
  // G. domain only
  else if (hasDomain) {
    status = 'domain_detected_shape_unknown';
    primaryType = domain;
    displayLabel = `미분류 ${domainLabel} 문서`;
  }

  // 특수 예외 조합 매핑 (기존 호환성 유지)
  if (domain === 'academic' && shape === 'guide' && keywords) {
    const isCourseReg = keywords.slice(0, 10).some(k => k.term === '수강신청' || k.term === '수강정정');
    if (isCourseReg) {
      primaryType = 'course_registration_guide';
      displayLabel = '학사 수강신청 안내문';
    }
  }

  if (status !== 'unknown' && (shapeResult.confidence + (domainResult.confidence || 0)) / 2 < 20) {
    status = 'low_confidence';
    displayLabel = '분류 신뢰도 낮음';
  }

  return { primaryType, displayLabel, classificationStatus: status };
}
