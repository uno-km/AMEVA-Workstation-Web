/**
 * @file useSelectionTracking.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @location src/renderer/hooks/editor/useSelectionTracking.ts
 * @role Editor selected text & block range tracker Hook
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 사용자가 에디터 상에서 마우스를 드래그하거나 키보드로 영역을 선택(`handleSelection`)했을 때 선택된 원문 텍스트(selText)를 캡처한다.
 * - 선택 영역이 걸쳐있는 단락들의 시작 블록 ID(anchorBlockId) 및 끝 블록 ID(focusBlockId) 범위를 추출한다.
 * - 캡처된 정보를 상위 UI 스토어 세터(`onSelectedTextChange`, `onSelectionChange`)에 실시간으로 전파하여 AI 챗 전송 맥락 및 하이라이트 지표로 연계되도록 돕는다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 선택된 단락의 자동 요약/번역 분석 연산 (useAIBlockProcessor가 담당).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: window.getSelection() 조회 시 텍스트가 잡히지 않는 경우, 
 *   이전 선택 텍스트 찌꺼기가 전역 챗 인풋 바에 계속 누적 전송되는 오류를 막기 위해
 *   반드시 공백문자('')를 주입하여 상태를 완전히 리셋해 줄 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useCallback: handleSelection 리스너 재생성을 억제하여 타이핑 시의 불필요한 스토어 리렌더 체인을 방지하기 위한 리액트 기본 API.
 */
import { useCallback } from 'react'

/* 
 * [SHARED SCHEMAS]
 * - AmevaEditor: 블록노트 기반 커스텀 렌더 스키마 에디터 타입.
 */
import type { AmevaEditor } from '../../editor/amevaBlockSchema'

/**
 * @hook useSelectionTracking
 * @description 드래그 영역 상태 갱신 리스너를 조율하는 훅.
 */
export function useSelectionTracking(
  /*
   * [HOOK CONFIG PARAMETERS]
   * - editor: BlockNote API 본체.
   * - onSelectedTextChange: 선택 텍스트 전파 콜백.
   * - onSelectionChange: 선택 블록 범위 정보 전파 콜백.
   */
  editor: AmevaEditor | null,
  onSelectedTextChange?: (text: string) => void,
  onSelectionChange?: (selection: { anchorBlockId: string; focusBlockId: string } | null) => void
) {
  /**
   * [CONTRACT - Selection Change Event Capture Handler]
   * - Rationale: 브라우저 native Selection과 BlockNote selection을 교차 캡처하여 최신 범위 메타를 갱신 전파한다.
   */
  const handleSelection = useCallback(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return

    // 1. 브라우저 네이티브 드래그 문자열 캡처 (선택 해제 시 공백 자동 주입)
    const selText = window.getSelection()?.toString() || ''
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `onSelectedTextChange`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (onSelectedTextChange)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (onSelectedTextChange) {
      onSelectedTextChange(selText)
    }

    // 2. BlockNote의 블록 노드 범위 단위 셀렉션 정보 캡처
    const sel = editor.getSelection()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `sel && sel.blocks && sel.blocks.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (sel && sel.blocks && sel.blocks.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (sel && sel.blocks && sel.blocks.length > 0) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `onSelectionChange`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (onSelectionChange)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (onSelectionChange) {
        onSelectionChange({ 
          anchorBlockId: sel.blocks[0].id, 
          focusBlockId: sel.blocks[sel.blocks.length - 1].id 
        })
      }
    } else {
      // 선택 범위 소멸 시 null 전달 처리
      if (onSelectionChange) {
        onSelectionChange(null)
      }
    }
  }, [editor, onSelectedTextChange, onSelectionChange])

  return { handleSelection }
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 복사(Copy) 단축키(Ctrl+C) 가로채기와 드래그 범위를 연계하고 싶을 때:
 *    - 본 `handleSelection` 훅의 캡처 결과물을 에디터 이벤트 단축키 리스너와 동기 바인딩할 것.
 * ============================================================================
 */

