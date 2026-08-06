import { analyzeFrequency } from './analyzers/frequencyAnalyzer';
import { extractEntities } from './analyzers/entityExtractor';
import { detectSections } from './analyzers/sectionDetector';
import type { DocumentProfileResult } from './types';
import { ruleRegistry } from './rules/rulePluginRegistry';
import { classifyShape } from './classifiers/shapeClassifier';
import { classifyDomain } from './classifiers/domainClassifier';
import { resolvePrimaryType } from './classifiers/primaryTypeResolver';
import { userRuleStore } from './rules/user/userRuleStore';

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
  const shapeResult = classifyShape(fileMeta.fileName, keywords);
  const domainResult = classifyDomain(fileMeta.fileName, keywords, fullText);
  
  const { primaryType, displayLabel, classificationStatus } = resolvePrimaryType(shapeResult, domainResult, keywords);

  const evidence = [...shapeResult.evidence, ...domainResult.evidence];

  const profileObj = {
    primaryType,
    displayLabel,
    classificationStatus,
    documentShape: shapeResult,
    documentDomain: domainResult,
    confidence: Math.floor((shapeResult.confidence + domainResult.confidence) / 2),
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
    let kwCount = 0;
    keywords.slice(0, 10).forEach(kw => {
      if (text.includes(kw.term)) kwCount++;
    });
    if (kwCount >= 3) {
      score += 30;
      reasons.push("핵심 키워드 다수 포함");
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
