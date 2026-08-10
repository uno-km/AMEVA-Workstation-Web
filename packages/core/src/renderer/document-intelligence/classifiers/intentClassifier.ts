/**
 * ============================================================================
 * @file intentClassifier.ts
 * @description intentClassifier.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './intentClassifier';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { DocumentIntentResult, KeywordStat } from '../types';

/**
 * INTENT_RULES 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const INTENT_RULES = [
  {
    id: 'damage_analysis', label: '피해분석',
    keywords: ['피해', '피해분석', '피해사례', '붕괴', '균열', '복구', '취약도'],
    phrases: ['피해 현황', '피해 분석', '피해 사례', '복구 방안']
  },
  {
    id: 'integration_guide', label: '연동가이드',
    keywords: ['연동', 'api', 'endpoint', 'request', 'response', '인증', '토큰'],
    phrases: ['api 연동', '인증 절차', '요청 응답', '연동 가이드']
  },
  {
    id: 'financial_analysis', label: '재무분석',
    keywords: ['매출', '비용', '손익', '영업이익', '순이익', '수익률'],
    phrases: ['손익 분석', '재무 분석', '실적 분석']
  },
  {
    id: 'diagnostic_result', label: '진단결과',
    keywords: ['진단', '검사', '결과', '소견', '판독'],
    phrases: ['검사 결과', '진단 소견', '영상 판독']
  },
  {
    id: 'procedure_guide', label: '절차안내',
    keywords: ['방법', '절차', '순서', '클릭', '선택', '입력', '조회'],
    phrases: ['이용 방법', '신청 절차', '처리 절차']
  },
  {
    id: 'contract_review', label: '계약검토',
    keywords: ['계약', '조항', '특약', '의무', '배상', '해지'],
    phrases: ['계약서 검토', '특약 사항', '손해 배상']
  },
  {
    id: 'technical_specification', label: '기술시방',
    keywords: ['시방서', '규격', '재질', '공법', '허용오차'],
    phrases: ['기술 시방서', '품질 기준', '표준 규격']
  },
  {
    id: 'risk_assessment', label: '위험성평가',
    keywords: ['위험성', '리스크', '평가', '대책', '안전', '재해', '예방'],
    phrases: ['위험성 평가', '리스크 분석', '재해 예방', '안전 대책']
  },
  {
    id: 'policy_analysis', label: '정책분석',
    keywords: ['정책', '제도', '규제', '법령', '개선', '시행', '방안'],
    phrases: ['정책 분석', '제도 개선', '법령 개정', '시행 방안']
  },
  {
    id: 'market_analysis', label: '시장분석',
    keywords: ['시장', '동향', '트렌드', '경쟁사', '점유율', '전망', '수요'],
    phrases: ['시장 동향', '트렌드 분석', '경쟁사 분석', '수요 예측']
  },
  {
    id: 'usage_manual', label: '사용매뉴얼',
    keywords: ['매뉴얼', '사용법', '설명서', '가이드', '설치', '주의사항'],
    phrases: ['사용자 매뉴얼', '설치 가이드', '주의 사항']
  },
  {
    id: 'application_notice', label: '신청안내',
    keywords: ['신청', '모집', '접수', '자격', '제출', '기간', '서류'],
    phrases: ['신청 안내', '모집 공고', '제출 서류', '접수 기간']
  },
  {
    id: 'research_summary', label: '연구요약',
    keywords: ['연구', '초록', '서론', '결론', '문헌', '고찰', '시사점'],
    phrases: ['연구 요약', '연구 목적', '선행 연구', '결론 및 제언']
  }
];

/**
 * classifyIntent 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function classifyIntent(
  fileName: string,
  keywords: KeywordStat[],
  fullText: string
): DocumentIntentResult {
  let maxScore = 0;
  let primary = 'unknown';
  let primaryLabel = '미분류';
  const evidence: string[] = [];

  INTENT_RULES.forEach(rule => {
    let score = 0;
    
    rule.keywords.forEach(kw => {
      const found = keywords.find(k => k.term === kw);
      if (found) score += found.score;
    });

    rule.phrases.forEach(phrase => {
      if (fullText.includes(phrase)) score += 30;
    });

    if (score > maxScore) {
      maxScore = score;
      primary = rule.id;
      primaryLabel = rule.label;
    }
  });

  const confidence = maxScore > 0 ? Math.min(100, Math.floor(maxScore / 1.5)) : 0;
  
  if (confidence >= 25) {
    evidence.push(`문서 의도(Intent) 분석 결과 [${primaryLabel}] 성격 강함`);
  } else {
    primary = 'unknown';
    primaryLabel = '미분류';
  }

  return { primary, label: primaryLabel, confidence, evidence };
}
