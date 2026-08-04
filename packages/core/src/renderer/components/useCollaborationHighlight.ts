/**
 * @file useCollaborationHighlight.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/useCollaborationHighlight.ts
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

import { useEffect, useRef } from 'react'
import { type AmevaEditor } from '../editor/amevaBlockSchema'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useCollaborationHighlight`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useCollaborationHighlight(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useCollaborationHighlight(
  editor: AmevaEditor | null,
  onBlockHighlight: ((blockId: string | null, isEditing: boolean) => void) | undefined,
  editorContainerRef: React.RefObject<HTMLDivElement | null>
) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cbRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cbRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const cbRef = useRef(onBlockHighlight)
  useEffect(() => {
    cbRef.current = onBlockHighlight
  }, [onBlockHighlight])

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor || !cbRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor || !cbRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor || !cbRef.current) return

    let prevActiveId: string | null = null
    let editingTimer: ReturnType<typeof setTimeout> | null = null
    let selectionTimer: ReturnType<typeof setTimeout> | null = null
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isCurrentlyEditing`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isCurrentlyEditing = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let isCurrentlyEditing = false
    let activeBlockEl: Element | null = null
    let activeBnEditor: Element | null = null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isEditorMounted`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isEditorMounted = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isEditorMounted = () => {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `view`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const view = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const view = (editor as any).proseMirrorView || (editor as any)._tiptapEditor?.view
        return !!(view && view.dom && document.body.contains(view.dom))
      } catch {
        return false
      }
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clearActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clearActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const clearActive = () => {
      if (activeBlockEl) {
        activeBlockEl.removeAttribute('data-bn-active')
        activeBlockEl = null
      } else {
        const root = editorContainerRef.current || document
        root.querySelectorAll('[data-bn-active]').forEach(el => el.removeAttribute('data-bn-active'))
      }

      if (activeBnEditor) {
        activeBnEditor.removeAttribute('data-bn-editor-focused')
        activeBnEditor = null
      } else {
        const root = editorContainerRef.current || document
        const bnEditor = root.querySelector('.bn-editor')
        if (bnEditor) bnEditor.removeAttribute('data-bn-editor-focused')
      }
    }

    // 디바운스된 브로드캐스트 전송 (부모 컴포넌트 렌더링 무한 루프 예방)
    const broadcast = (blockId: string, isEditing: boolean) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `cbRef.current) cbRef.current(blockId, isEditing`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (cbRef.current) cbRef.current(blockId, isEditing)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (cbRef.current) cbRef.current(blockId, isEditing)
      prevActiveId = blockId
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const markActive = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isEditorMounted()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isEditorMounted())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isEditorMounted()) return
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `selection`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const selection = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const selection = typeof editor.getSelection === 'function' ? editor.getSelection() : undefined
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!selection || !selection.blocks || selection.blocks.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!selection || !selection.blocks || selection.blocks.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!selection || !selection.blocks || selection.blocks.length === 0) {
          clearActive()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `prevActiveId && cbRef.current) cbRef.current(null, false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (prevActiveId && cbRef.current) cbRef.current(null, false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (prevActiveId && cbRef.current) cbRef.current(null, false)
          prevActiveId = null
          return
        }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blockId = selection.blocks[selection.blocks.length - 1].id
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockId === prevActiveId && isCurrentlyEditing`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockId === prevActiveId && isCurrentlyEditing)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (blockId === prevActiveId && isCurrentlyEditing) return

        clearActive()

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockOuter`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockOuter = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const root = editorContainerRef.current || document
        const blockOuter = root.querySelector(`[data-id="${blockId}"], [data-block-id="${blockId}"]`)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockOuter`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockOuter)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (blockOuter) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `outerEl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const outerEl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const outerEl = blockOuter.closest('.bn-block-outer') ?? blockOuter
          outerEl.setAttribute('data-bn-active', 'true')
          activeBlockEl = outerEl
        }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 시나리오: 에디터 컨테이너
       */
        const bnEditor = root.querySelector('.bn-editor')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `bnEditor) bnEditor.setAttribute('data-bn-editor-focused', 'true'`
       */
        if (bnEditor) {
          bnEditor.setAttribute('data-bn-editor-focused', 'true')
          activeBnEditor = bnEditor
        }

        prevActiveId = blockId
      } catch {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `prevActiveId && cbRef.current) cbRef.current(null, false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (prevActiveId && cbRef.current) cbRef.current(null, false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (prevActiveId && cbRef.current) cbRef.current(null, false)
        prevActiveId = null
      }
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleFocusOut`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleFocusOut = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleFocusOut = () => {
      clearActive()
      /*
       * clearActive() 内部에서 activeBnEditor 해제까지 완벽히 커버하므로 추가 쿼리 생략
       */
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `prevActiveId && cbRef.current) cbRef.current(null, false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (prevActiveId && cbRef.current) cbRef.current(null, false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (prevActiveId && cbRef.current) cbRef.current(null, false)
      prevActiveId = null
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleFocusIn`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleFocusIn = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleFocusIn = () => {
      markActive()
    }

    // 200ms 디바운스 처리된 타이핑 변경 리스너
    const handleChange = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isEditorMounted()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isEditorMounted())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isEditorMounted()) return
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
        if (!pos) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `prevActiveId && cbRef.current) cbRef.current(null, false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (prevActiveId && cbRef.current) cbRef.current(null, false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (prevActiveId && cbRef.current) cbRef.current(null, false)
          prevActiveId = null
          isCurrentlyEditing = false
          return
        }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blockId = pos.block.id
        isCurrentlyEditing = true

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editingTimer) clearTimeout(editingTimer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editingTimer) clearTimeout(editingTimer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (editingTimer) clearTimeout(editingTimer)
        editingTimer = setTimeout(() => {
          broadcast(blockId, true)
          
          // 추가 1.5초 후 타이핑 멈춤 전파
          setTimeout(() => {
            isCurrentlyEditing = false
            broadcast(blockId, false)
          }, 1500)
        }, 200)
      } catch {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `prevActiveId && cbRef.current) cbRef.current(null, false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (prevActiveId && cbRef.current) cbRef.current(null, false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (prevActiveId && cbRef.current) cbRef.current(null, false)
        prevActiveId = null
      }
    }

    // 200ms 디바운스 처리된 커서 이동 리스너
    const handleSelectionChange = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isEditorMounted()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isEditorMounted())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isEditorMounted()) return
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
       * - 변수 명: `blockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blockId = pos.block.id
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockId !== prevActiveId`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockId !== prevActiveId)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (blockId !== prevActiveId) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `selectionTimer) clearTimeout(selectionTimer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (selectionTimer) clearTimeout(selectionTimer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (selectionTimer) clearTimeout(selectionTimer)
          selectionTimer = setTimeout(() => {
            broadcast(blockId, isCurrentlyEditing)
          }, 200)
        }
      } catch {}
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleBlur`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleBlur = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleBlur = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isEditorMounted()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isEditorMounted())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isEditorMounted()) return
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editingTimer) clearTimeout(editingTimer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editingTimer) clearTimeout(editingTimer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (editingTimer) clearTimeout(editingTimer)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `selectionTimer) clearTimeout(selectionTimer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (selectionTimer) clearTimeout(selectionTimer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (selectionTimer) clearTimeout(selectionTimer)
      isCurrentlyEditing = false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `cbRef.current) cbRef.current(null, false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (cbRef.current) cbRef.current(null, false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (cbRef.current) cbRef.current(null, false)
      prevActiveId = null
    }

    // editor.onChange(markActive) 제거 (selectionchange 네이티브 이벤트 하나로 병합하여 DOM 변경 재귀 루프 영구 차단)
    document.addEventListener('selectionchange', markActive)
    document.addEventListener('focusout', handleFocusOut)
    document.addEventListener('focusin', handleFocusIn)

    editor.onChange(handleChange)
    document.addEventListener('selectionchange', handleSelectionChange)
    editorContainerRef.current?.addEventListener('blur', handleBlur, true)

    return () => {
      clearActive()
      document.removeEventListener('selectionchange', markActive)
      document.removeEventListener('focusout', handleFocusOut)
      document.removeEventListener('focusin', handleFocusIn)

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editingTimer) clearTimeout(editingTimer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editingTimer) clearTimeout(editingTimer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (editingTimer) clearTimeout(editingTimer)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `selectionTimer) clearTimeout(selectionTimer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (selectionTimer) clearTimeout(selectionTimer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (selectionTimer) clearTimeout(selectionTimer)
      document.removeEventListener('selectionchange', handleSelectionChange)
      editorContainerRef.current?.removeEventListener('blur', handleBlur, true)
    }
  }, [editor, editorContainerRef])
}

