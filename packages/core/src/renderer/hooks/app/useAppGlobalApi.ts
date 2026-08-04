/**
 * @file useAppGlobalApi.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useAppGlobalApi.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
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
import { normalizeMarkdown, cleanCodeBlocks, ensureBlockIds } from '../../utils/markdownUtils'
import { type AmevaEditor as AppEditor, type AmevaPartialBlock as AppPartialBlock } from '../../editor/amevaBlockSchema'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useAppGlobalApi`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useAppGlobalApi(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useAppGlobalApi({
  editor,
  currentContent,
  setCurrentContent,
  appendContent,
  setShowAIPanel,
  setActiveRightTab,
}: {
  editor: AppEditor | null
  currentContent: string
  setCurrentContent: (content: string) => void
  appendContent: (content: string) => void
  setShowAIPanel: (show: boolean) => void
  setActiveRightTab: (tab: any) => void
}) {
  useEffect(() => {
    (window as any).AMEVA_INSERT_TEXT_TO_EDITOR = async (text: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editor`
       * - 만족 시: 블록 에디터 인스턴스에 파싱된 마크다운 블록 컬렉션을 병렬 삽입함.
       * - 불만족 시: 원문 appendContent 버퍼에 바이패스 위임.
       */
      if (editor) {
        try {
          const doc = editor.document
          const normalized = normalizeMarkdown(text)
          const blocks = await editor.tryParseMarkdownToBlocks(normalized)
          cleanCodeBlocks(blocks)
          ensureBlockIds(blocks)

          if (doc.length > 0) {
            editor.insertBlocks(blocks, doc[doc.length - 1], 'after')
          } else {
            editor.insertBlocks(blocks, doc[0], 'before')
          }
        } catch (e) {
          console.error('[Insert Text Global API Failed]', e)
          // 마크다운 파싱 예외 시 단순 텍스트 패러그래프로 폴백 세이브
          try {
            const doc = editor.document
            const blockPayload: AppPartialBlock = {
              type: 'paragraph',
              content: [{ type: 'text', text: text, styles: {} }]
            }
            if (doc.length > 0) {
              editor.insertBlocks([blockPayload], doc[doc.length - 1], 'after')
            } else {
              editor.insertBlocks([blockPayload], doc[0], 'before')
            }
          } catch (fallbackErr) {
            console.error('[Fallback paragraph insert failed]', fallbackErr)
          }
        }
      } else {
        appendContent(text)
      }
    }

    (window as any).AMEVA_ASK_AGENT = (text: string) => {
      setShowAIPanel(true)
      setActiveRightTab('ai')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ameva:fill-ai-input', { detail: text }))
      }, 150)
    }
  }, [editor, appendContent, setShowAIPanel, setActiveRightTab])

  // [📝 ameva:insert-text 커스텀 이벤트와 에디터 API 연결 리스너 바인딩]
  useEffect(() => {
    const handleInsertTextEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail) {
        const insertFn = (window as any).AMEVA_INSERT_TEXT_TO_EDITOR
        if (insertFn) {
          insertFn(customEvent.detail)
        }
      }
    }
    window.addEventListener('ameva:insert-text', handleInsertTextEvent)
    return () => {
      window.removeEventListener('ameva:insert-text', handleInsertTextEvent)
    }
  }, [])

  useEffect(() => {
    (window as any).AMEVA_GET_CURRENT_CONTENT = () => {
      return currentContent || ''
    };
    (window as any).AMEVA_SET_CURRENT_CONTENT = async (markdownText: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (editor) {
        try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `normalized`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const normalized = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const normalized = normalizeMarkdown(markdownText)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const blocks = await editor.tryParseMarkdownToBlocks(normalized)
          cleanCodeBlocks(blocks)
          ensureBlockIds(blocks)
          editor.replaceBlocks(editor.document, blocks)
          setCurrentContent(markdownText)
        } catch (e) {
          console.error('클라우드 파일 로드 연계 실패:', e)
        }
      }
    }
  }, [editor, currentContent, setCurrentContent])
}

