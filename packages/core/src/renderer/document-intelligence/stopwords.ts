/**
 * ============================================================================
 * @file stopwords.ts
 * @description stopwords.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './stopwords';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * KOREAN_STOPWORDS 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const KOREAN_STOPWORDS = new Set([
  '이', '그', '저', '것', '수', '등', '및', '또는', '그리고', '그래서', '하지만',
  '어떤', '이런', '저런', '어떻게', '왜', '무엇', '언제', '어디', '누구',
  '하다', '있다', '없다', '되다', '않다', '같다', '이다', '아니다', '위해',
  '관하여', '대하여', '경우', '또한', '통해', '관련', '사항', '내용', '부분',
  '기타', '대해', '가', '는', '은', '를', '을', '에', '에서', '로', '으로',
  '과', '와', '의', '도', '만', '부터', '까지',
  '합니다', '있습니다', '됩니다', '가능합니다', '해야합니다', '바랍니다', '확인합니다'
]);

/**
 * ENGLISH_STOPWORDS 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const ENGLISH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from',
  'by', 'with', 'about', 'as', 'into', 'like', 'through', 'after', 'over',
  'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around',
  'among', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can',
  'could', 'may', 'might', 'must', 'ought', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'this', 'that', 'these', 'those',
  'of', 'ic', 'vol', 'no', 'pp', 'fig', 'table', 'doi', 'issn', 'journal', 'proceedings', 'conference'
]);

/**
 * AMBIGUOUS_TOPIC_WORDS 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const AMBIGUOUS_TOPIC_WORDS = new Set([
  '발생', '결과', '내용', '자료', '분석', '관련', '현황', '사례', '일반', '정보', '포함', '사용', '확인', '방법', '이용', '처리', '신청', '목적', '기본', '상세'
]);
