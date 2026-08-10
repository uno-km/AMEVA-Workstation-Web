/**
 * ============================================================================
 * @file tokenizer.ts
 * @description tokenizer.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './tokenizer';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ./stopwords]
import { KOREAN_STOPWORDS, ENGLISH_STOPWORDS } from './stopwords';

const ALL_STOPWORDS = new Set([...KOREAN_STOPWORDS, ...ENGLISH_STOPWORDS]);

const URL_TOKENS = new Set(['http', 'https', 'www', 'com', 'kr', 'ac', 'co', 'net', 'org']);
const PROTECTED_WORDS = new Set([
  '수강신청', '수강정정', '수강번호', '수강신청결과조회', '개설과목', 
  '강의시간표', '학사서비스', '전공필수', '정보통신대학원', '아주대학교', 
  '원격수업', '출석수업', '병행수업', 'e-learning'
]);

/**
 * normalizeText 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9가-힣\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * tokenize 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const rawTokens = normalized.split(' ');
  return rawTokens.map(token => {
    // 1. 도메인 복합어 보호
    if (PROTECTED_WORDS.has(token)) return token;

    // 2. 조사/어미 제거 (가장 긴 것부터)
    let cleaned = token;
    const suffixes = ['을', '를', '이', '가', '은', '는', '에', '에서', '으로', '로', '과', '와', '의', '도', '만', '부터', '까지', '입니다', '습니다', '됨'];
    for (const suffix of suffixes) {
      if (cleaned.endsWith(suffix) && cleaned.length > suffix.length) {
        cleaned = cleaned.slice(0, -suffix.length);
        break; // 하나만 벗겨냄
      }
    }
    return cleaned;
  }).filter(token => {
    if (token.length < 2) return false;
    if (ALL_STOPWORDS.has(token)) return false;
    if (URL_TOKENS.has(token)) return false;
    if (/^\d+$/.test(token)) return false; // 순수 숫자 제거
    return true;
  });
}
