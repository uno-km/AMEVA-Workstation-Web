import { analyzeFrequency } from './analyzers/frequencyAnalyzer';
import { extractEntities } from './analyzers/entityExtractor';
import { detectSections } from './analyzers/sectionDetector';
import type { DocumentProfileResult } from './types';
import { ruleRegistry } from './rules/rulePluginRegistry';
import { classifyShape } from './classifiers/shapeClassifier';
import { classifyDomain } from './classifiers/domainClassifier';
import { userRuleStore } from './rules/user/userRuleStore';
import { classifySubDomain } from './classifiers/subDomainClassifier';
import { classifyIntent } from './classifiers/intentClassifier';
import { discoverTopics } from './analyzers/topicDiscoveryAnalyzer';
import { composeDisplayLabel } from './classifiers/labelComposer';
import type { DocumentSubDomainResult, TopicCluster } from './types';

export async function profileDocument(
  fileMeta: { fileName: string; docType: any; fileSize: number },
  pagesText: { page: number; text: string }[]
): Promise<DocumentProfileResult> {
  const warnings: string[] = [];
  try {
    const userRules = await userRuleStore.listUserRules();
    ruleRegistry.mergeBuiltinAndUserRules(userRules);
  } catch (e) {
    console.error("Failed to load user rules:", e);
    warnings.push("Failed to load user rules");
    ruleRegistry.resetToBuiltIns();
  }

  const fullText = pagesText.map(p => p.text).join('\n');
  
  // 1. 키워드 분석 (파일명 boost 포함)
  const keywords = analyzeFrequency(pagesText, fileMeta.fileName);
  
  // 2. 엔티티 & 섹션 추출
  const entities = extractEntities(fullText);
  const sections = detectSections(pagesText);
  
  // 3. 문서 유형 이중 분류기 적용 (Shape + Domain)
  const shapeResult = classifyShape(fileMeta.fileName, keywords, pagesText.length, entities, fullText);
  const domainResult = classifyDomain(fileMeta.fileName, keywords, fullText);
  
  const activeDomainRule = ruleRegistry.getDomainRules().find(r => r.id === domainResult.primary);
  let subDomainResult: DocumentSubDomainResult = { primary: 'unknown', label: '미분류', confidence: 0, scores: {}, evidence: [] };
  
  if (activeDomainRule) {
    subDomainResult = classifySubDomain(activeDomainRule, fileMeta.fileName, keywords, sections, fullText, entities);
  }

  const intentResult = classifyIntent(fileMeta.fileName, keywords, fullText);

  // 5. Topic Discovery (New)
  const discoveredTopics = discoverTopics(fileMeta.fileName, keywords, [], sections, pagesText, entities, fullText);
  const primaryTopic = discoveredTopics.length > 0 ? discoveredTopics[0] : undefined;

  // 6. Label Composition
  const { primaryType, displayLabel, classificationStatus } = composeDisplayLabel(shapeResult, domainResult, subDomainResult, intentResult, primaryTopic, keywords);

  const evidence = [...shapeResult.evidence, ...domainResult.evidence, ...subDomainResult.evidence, ...intentResult.evidence];
  if (primaryTopic) {
    evidence.push(...primaryTopic.evidence);
  }

    let baseConfidence = Math.floor((shapeResult.confidence + domainResult.confidence + (subDomainResult.confidence || 0) + intentResult.confidence + (primaryTopic?.confidence || 0)) / 5);
    if (shapeResult.confidence < 50) {
      baseConfidence = Math.floor(baseConfidence * 0.85); // Penalty for low shape confidence
    }

    const profileObj = {
      primaryType,
      displayLabel,
      classificationStatus,
      documentShape: shapeResult,
      documentDomain: domainResult,
      documentSubDomain: subDomainResult,
      intent: intentResult,
      discoveredTopics,
      primaryTopic,
      confidence: baseConfidence,
    evidence
  };

  // 4. 중요 페이지 추정 (의미론적 계산)
  const importantPages = detectImportantPages(pagesText, keywords, entities, sections, profileObj);

  return {
    version: '0.2.0',
    source: {
      fileName: fileMeta.fileName,
      docType: fileMeta.docType,
      fileSize: fileMeta.fileSize,
      pageCount: pagesText.length
    },
    profile: profileObj as any,
    keywords,
    coOccurrences: [], 
    sections,
    entities,
    importantPages,
    pageStats: [],
    warnings
  };
}

// 의미론적 중요 페이지 추정 로직
function detectImportantPages(
  pagesText: { page: number; text: string }[],
  keywords: any[],
  entities: any,
  sections: any[],
  classification: any
) {
  const pageScores = pagesText.map(p => {
    let score = 0;
    const reasons: string[] = [];
    const text = p.text;

    // A. 텍스트 밀도 기본 점수
    if (text.length > 500) {
      score += 10;
      // 너무 뻔한 이유는 생략
    }

    // B. 핵심 키워드 출현
    const foundKeywords: string[] = [];
    keywords.slice(0, 10).forEach(kw => {
      if (text.includes(kw.term)) foundKeywords.push(kw.term);
    });
    if (foundKeywords.length >= 3) {
      score += 30;
      if (classification.primaryTopic?.label) {
        reasons.push(`[${classification.primaryTopic.label}] 관련 핵심 키워드 집중 (${foundKeywords.join(', ')})`);
      } else {
        reasons.push(`핵심 키워드 다수 포함 (${foundKeywords.join(', ')})`);
      }
    }

    // C. 특수 목적 룰 (수강신청/학사 관련)
    if (classification.primaryType === 'course_registration_guide' || classification.primaryType === 'academic_guide') {
      if (/수강신청.*유의사항|학점.*제한|졸업.*요건/i.test(text)) {
        score += 50;
        reasons.push("수강신청 핵심 유의사항 포함");
      }
      if (/개설과목|강의시간표/i.test(text)) {
        score += 40;
        reasons.push("개설과목 및 강의시간표 확인 단계");
      }
      if (/포탈.*로그인|학사서비스/i.test(text)) {
        score += 40;
        reasons.push("포탈 접속 및 학사서비스 진입 단계");
      }
      if (/수강번호.*과목명|구분.*학과/i.test(text)) {
        score += 40;
        reasons.push("실제 수강신청 입력 절차 포함");
      }
      if (/수강신청결과조회/i.test(text)) {
        score += 40;
        reasons.push("신청 결과 확인 단계");
      }
    }

    const primaryTopicLabel = classification.primaryTopic?.label;
    const intent = classification.intent?.primary;

    if (primaryTopicLabel === '지진 피해' && intent === 'damage_analysis') {
      if (/지진.*피해|복구|구조물.*사례/i.test(text)) {
        score += 40;
        reasons.push("지진 피해 관련 핵심 키워드 집중");
      }
      if (/사례|복구/i.test(text)) reasons.push("피해 사례 또는 복구 관련 설명 포함");
      if (/출처|사례/i.test(text)) reasons.push("출처/사례 기반 분석 내용 포함");
    }

    if (primaryTopicLabel === 'API 인증' && intent === 'integration_guide') {
      if (/request|response|인증|토큰|endpoint/i.test(text)) {
        score += 40;
        reasons.push("API 인증 절차 관련 핵심 내용 포함");
      }
      if (/요청|응답|토큰/i.test(text)) reasons.push("요청/응답 또는 토큰 관련 설명 포함");
    }

    if (primaryTopicLabel === '재무제표' && intent === 'financial_analysis') {
      if (/매출|비용|영업이익|손익/i.test(text)) {
        score += 40;
        reasons.push("재무제표 및 손익 관련 핵심 지표 포함");
      }
      if (/매출|비용|수익/i.test(text)) reasons.push("매출/비용/수익성 분석 내용 집중");
    }

    // D. 섹션 시작 지점
    const section = sections.find(s => s.page === p.page);
    if (section) {
      score += 20;
      reasons.push(`섹션 시작 (${section.title})`);
    }

    return { page: p.page, score, reasons };
  });

  return pageScores
    .filter(p => p.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
