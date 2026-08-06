import { KOREAN_STOPWORDS, ENGLISH_STOPWORDS } from './stopwords';

const ALL_STOPWORDS = new Set([...KOREAN_STOPWORDS, ...ENGLISH_STOPWORDS]);

const URL_TOKENS = new Set(['http', 'https', 'www', 'com', 'kr', 'ac', 'co', 'net', 'org']);
const PROTECTED_WORDS = new Set([
  '수강신청', '수강정정', '수강번호', '수강신청결과조회', '개설과목', 
  '강의시간표', '학사서비스', '전공필수', '정보통신대학원', '아주대학교', 
  '원격수업', '출석수업', '병행수업', 'e-learning'
]);

export function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9가-힣\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

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
