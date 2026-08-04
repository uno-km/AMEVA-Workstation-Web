/**
 * @file useBacktickFence.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/useBacktickFence.ts
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

import { useEffect } from 'react'
import { type AmevaEditor } from '../editor/amevaBlockSchema'

const FENCE_LANG_MAP: Record<string, string> = {
  js: 'javascript', javascript: 'javascript',
  ts: 'typescript', typescript: 'typescript',
  py: 'python',     python: 'python',
  html: 'html', css: 'css', mermaid: 'mermaid',
  md: 'markdown',  markdown: 'markdown',
  json: 'json', xml: 'xml', sql: 'sql',
  bash: 'bash', sh: 'bash', c: 'c', cpp: 'cpp', java: 'java',
  text: 'plaintext', plaintext: 'plaintext', txt: 'plaintext',
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useBacktickFence`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useBacktickFence(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useBacktickFence(editor: AmevaEditor | null) {
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleKeyDown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleKeyDown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleKeyDown = (e: KeyboardEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key !== 'Enter'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.key !== 'Enter')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (e.key !== 'Enter') return
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const pos = editor.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!pos) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `block`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const block = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const block = pos.block
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.type !== 'paragraph'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.type !== 'paragraph')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (block.type !== 'paragraph') return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `content`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const content = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const content = (block as { content?: unknown }).content
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `text`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const text = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const text = Array.isArray(content)
          ? content.map((c: any) => c.text || c.type === 'text' ? c.text : '').join('')
          : typeof content === 'string'
            ? content
            : ''

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `text.startsWith('```')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (text.startsWith('```'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (text.startsWith('```')) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `langInput`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const langInput = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const langInput = text.slice(3).trim().toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `matchedLang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const matchedLang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const matchedLang = FENCE_LANG_MAP[langInput] || 'javascript'
          e.preventDefault()

          editor.updateBlock(block.id, {
            type: 'codeBlock',
            props: { language: matchedLang },
            content: [],
          })

          setTimeout(() => {
            try {
              editor.setTextCursorPosition(block.id, 'start')
              editor.focus()
            } catch {}
          }, 20)
        }
      } catch {}
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const container = document.querySelector('.bn-editor')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (container) {
      container.addEventListener('keydown', handleKeyDown as any)
    }
    return () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (container) {
        container.removeEventListener('keydown', handleKeyDown as any)
      }
    }
  }, [editor])
}

