/**
 * @file safeJson.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/safeJson.ts
 * @role 전역 JSON 파싱 안정화 유틸리티
 *
 * [책임 범위]
 * - localStorage나 블록 속성 등에서 문자열이 깨진 JSON 데이터를 읽을 때, 앱이 크래시(White Screen)되는 것을 방지.
 * - JSON 파싱 실패 시, 콘솔에 경고를 남기고 제공된 기본값(Fallback)을 안전하게 반환.
 */

/**
 * 안전한 JSON 파싱 함수
 * @param str 파싱할 JSON 문자열
 * @param fallback 파싱 실패 또는 빈 문자열일 때 반환할 기본값
 */
export function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try {
    const parsed = JSON.parse(str)
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback
  } catch (e) {
    console.warn('[safeJsonParse] 파싱 에러 방어됨. Fallback 데이터를 반환합니다.', e)
    return fallback
  }
}
