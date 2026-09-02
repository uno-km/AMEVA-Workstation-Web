/**
 * ============================================================================
 * @file langMeta.ts
 * @description langMeta.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './langMeta';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file langMeta.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/jupyter/langMeta.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

export interface LangMeta {
  color: string
  label: string
  runnable: boolean   // JS/TS/Python → Run 버튼
  previewable: boolean // HTML/Mermaid → Preview 버튼
  isHtml: boolean
  isMermaid: boolean
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `LANG_META`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `LANG_META(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * LANG_META 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const LANG_META: Record<string, LangMeta> = {
  javascript: { color: '#f59e0b', label: 'JavaScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  js:         { color: '#f59e0b', label: 'JavaScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  typescript: { color: '#60a5fa', label: 'TypeScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  ts:         { color: '#60a5fa', label: 'TypeScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  python:     { color: '#3b82f6', label: 'Python',     runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  py:         { color: '#3b82f6', label: 'Python',     runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  html:       { color: '#f97316', label: 'HTML',       runnable: true,  previewable: true,  isHtml: true,  isMermaid: false },
  css:        { color: '#38bdf8', label: 'CSS',        runnable: false, previewable: false, isHtml: false, isMermaid: false },
  mermaid:    { color: '#2563eb', label: 'Mermaid',    runnable: false, previewable: true,  isHtml: false, isMermaid: true  },
  markdown:   { color: '#34d399', label: 'Markdown',   runnable: false, previewable: true,  isHtml: false, isMermaid: false },
  json:       { color: '#34d399', label: 'JSON',       runnable: false, previewable: false, isHtml: false, isMermaid: false },
  xml:        { color: '#fb923c', label: 'XML',        runnable: false, previewable: false, isHtml: false, isMermaid: false },
  sql:        { color: '#e879f9', label: 'SQL',        runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  bash:       { color: '#94a3b8', label: 'Bash',       runnable: false, previewable: false, isHtml: false, isMermaid: false },
  sh:         { color: '#94a3b8', label: 'Shell',      runnable: false, previewable: false, isHtml: false, isMermaid: false },
  c:          { color: '#10b981', label: 'C',          runnable: false, previewable: false, isHtml: false, isMermaid: false },
  cpp:        { color: '#10b981', label: 'C++',        runnable: false, previewable: false, isHtml: false, isMermaid: false },
  java:       { color: '#f43f5e', label: 'Java',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  text:       { color: '#6b7280', label: 'Text',       runnable: false, previewable: false, isHtml: false, isMermaid: false },
  plaintext:  { color: '#6b7280', label: 'Text',       runnable: false, previewable: false, isHtml: false, isMermaid: false },
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `getLangMeta`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `getLangMeta(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * getLangMeta 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function getLangMeta(lang: string): LangMeta {
  return LANG_META[lang.toLowerCase()] ?? {
    color: '#6b7280', label: lang, runnable: false,
    previewable: false, isHtml: false, isMermaid: false,
  }
}

