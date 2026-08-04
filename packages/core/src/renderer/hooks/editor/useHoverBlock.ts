/**
 * @file useHoverBlock.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/hooks/editor/useHoverBlock.ts
 * @role Editor hover block ID & coordinate tracker Hook
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 에디터 영역 내의 마우스 움직임(`handleEditorMouseMove`)을 감청하여 마우스 포인터 바로 아래에 있는 블록의 ID, 내용(text), 및 상대 뷰포트 좌표(DOMRect)를 추적한다.
 * - 마우스가 블록을 벗어나 옆 공백으로 이동했을 때의 마우스 Y축 가드 처리를 제공하여 별표(✨) 버튼 및 추가 단추가 흔들리거나 깜빡이는 것을 방지한다.
 * - 동일 블록 재진입 시 렌더링 최적화를 위한 픽셀 좌표 오차범위(< 1px) 가드 판정을 수행한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - [중요] 호버 상태 자체는 기본 기능인 '+' 버튼 슬래시 메뉴 등록에 필수적이므로,
 *   절대로 `isProPlan` 플래그 체크를 이유로 호버 데이터를 강제 `null`화 시키지 마라 (MarkdownEditor 렌더에서만 Pro 조건으로 별표 노출을 제어함).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT bypass sparkle guard: 별표 버튼 위에 마우스가 안착해 있을 때 호버 상태를 null 처리해 버리면
 *   별표 버튼이 클릭 감지 직전에 사라져 버리는 터치 버그가 생기므로, `el.closest('.sparkle-hover-btn')` 검출 시 반드시 상태 갱신을 생략할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useState: 호버된 블록 메타정보({id, rect, text})를 캐시하여 버튼 위치 스타일로 전파하기 위한 리액트 상태 훅.
 * - useCallback: handleEditorMouseMove 핸들러 재생성을 억제하여 렌더링 폭풍을 차단하기 위한 메모이즈 훅.
 */
import { useState, useCallback } from 'react'

/* 
 * [SHARED SCHEMAS & TYPES]
 * - AmevaEditor: BlockNote 기반의 커스텀 블록 스키마 바인딩 형식.
 * - EditorMode: 웰컴/편집/미리보기 모드 타입 정의.
 */
import type { AmevaEditor } from '../../editor/amevaBlockSchema'
import type { EditorMode } from '../../../shared/types'

/**
 * @hook useHoverBlock
 * @description 에디터에서 마우스가 위치한 특정 블록 노드를 감지하고 크기/위치를 실시간 산출하는 호버 트래커 훅.
 */
export function useHoverBlock(
  /*
   * [HOOK CONFIG PARAMETERS]
   * - editor: BlockNote API 본체.
   * - editorMode: welcome/edit/preview/raw 화면 모드.
   * - editorContainerRef: 에디터 래퍼 DOM 참조.
   * - onMouseMove: 마우스 이동 연계 콜백.
   * - isProPlan: 프로 요금제 가입 여부.
   */
  editor: AmevaEditor | null,
  editorMode: EditorMode,
  editorContainerRef: React.RefObject<HTMLDivElement | null>,
  onMouseMove: (e: React.MouseEvent) => void,
  canUseAITagging: boolean
) {
  /*
   * [INVARIANT - Hover Block Record State]
   * - hoverBlock: 현재 호버된 블록의 메타 데이터.
   */
  const [hoverBlock, setHoverBlock] = useState<{ id: string; rect: DOMRect; text: string } | null>(null)

  /**
   * [CONTRACT - Editor Mouse Move Handler]
   * - Rationale: 마우스 뷰포트 clientX/clientY 위치의 DOM 요소를 추적하여 블록 경계를 획득한다.
   */
  const handleEditorMouseMove = useCallback((e: React.MouseEvent) => {
    // 부모 협업 포인터 동기화를 위한 콜백 리다이렉트 기동
    onMouseMove(e)

    // 편집 모드가 아니거나 에디터 인스턴스가 활성화 전인 경우 즉각 초기화
    // WARNING: 절대 canUseAITagging 검사를 추가하여 락을 걸지 마라. (Free 에디터의 + 슬래시 삽입 붕괴 방지).
    if (editorMode !== 'edit' || !editor) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `hoverBlock !== null) setHoverBlock(null`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (hoverBlock !== null) setHoverBlock(null)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (hoverBlock !== null) setHoverBlock(null)
      return
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const container = editorContainerRef.current
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!container) return

    // 브라우저 뷰포트 마우스 위치 좌표
    const clientX = e.clientX
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clientY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clientY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const clientY = e.clientY

    // 커서 좌표 아래에 있는 실시간 최하단 DOM 엘리먼트 캡처
    const el = document.elementFromPoint(clientX, clientY)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!el`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!el)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!el) return

    // CONTRACT: 별표 버튼 호버 시 상태 락 유지 계약 준수
    const isOverSparkle = el.closest('.sparkle-hover-btn')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOverSparkle`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOverSparkle)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOverSparkle) {
      return
    }

    // 블록 단락을 감싸는 블록노트 공식 클래스 탐색
    const blockOuter = el.closest('.bn-block-outer') as HTMLElement
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
       * - 변수 명: `blockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const blockId = blockOuter.getAttribute('data-id') || blockOuter.querySelector('[data-id]')?.getAttribute('data-id')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockId`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockId)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (blockId) {
        try {
          // 블록노트 인스턴스로부터 상세 단락 구조체 획득
          const targetBlock = editor.getBlock(blockId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `targetBlock`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (targetBlock)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (targetBlock) {
            // 인라인 텍스트 문자열 병합 취합
            const textContent = targetBlock.content
              ? (targetBlock.content as any).map((c: any) => c.text).join('')
              : ''

            // 절대 좌표에서 컨테이너 스크롤 높이를 합산하여 상대 배치용 탑/레프트 산출
            const rect = blockOuter.getBoundingClientRect()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `containerRect`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const containerRect = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const containerRect = container.getBoundingClientRect()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `calculatedTop`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const calculatedTop = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const calculatedTop = rect.top - containerRect.top + container.scrollTop
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `calculatedLeft`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const calculatedLeft = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const calculatedLeft = rect.left - containerRect.left

            // [PERFORMANCE CRITICAL] 1px 오차 범위 렌더 가드
            if (
              hoverBlock &&
              hoverBlock.id === blockId &&
              Math.abs(hoverBlock.rect.top - calculatedTop) < 1 &&
              Math.abs(hoverBlock.rect.left - calculatedLeft) < 1 &&
              Math.abs(hoverBlock.rect.width - rect.width) < 1 &&
              Math.abs(hoverBlock.rect.height - rect.height) < 1
            ) {
              return
            }

            setHoverBlock({
              id: blockId,
              rect: {
                top: calculatedTop,
                left: calculatedLeft,
                width: rect.width,
                height: rect.height,
              } as DOMRect,
              text: textContent.trim() || (targetBlock.type === 'heading' ? '제목 문단' : '본문 문단')
            })
            return
          }
        } catch {}
      }
    }

    // [INVARIANT - Y-axis Margin Safe Guard]
    // 마우스가 우측 공백 마진 등으로 빠졌으나, Y축 세로 높이가 해당 블록 위아래 8px 여유 공간 내인 경우 호버 버튼을 유지함
    if (hoverBlock) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockDom`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockDom = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const blockDom = document.querySelector(`[data-id="${hoverBlock.id}"], [data-block-id="${hoverBlock.id}"]`)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockDom`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockDom)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (blockDom) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `outer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const outer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const outer = blockDom.closest('.bn-block-outer') || blockDom
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `bRect`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const bRect = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const bRect = outer.getBoundingClientRect()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `clientY >= bRect.top - 8 && clientY <= bRect.bottom + 8`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (clientY >= bRect.top - 8 && clientY <= bRect.bottom + 8)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (clientY >= bRect.top - 8 && clientY <= bRect.bottom + 8) {
          return
        }
      }
    }

    // 영역 이탈 시 상태 해제
    if (hoverBlock !== null) {
      setHoverBlock(null)
    }
  }, [editor, editorMode, onMouseMove, editorContainerRef, hoverBlock, canUseAITagging])

  return { hoverBlock, setHoverBlock, handleEditorMouseMove }
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 호버 상태 감지 범위(현재 8px 마진 가드)를 변경하거나 스무딩하고 싶을 때:
 *    - `clientY >= bRect.top - 8` 수식의 오프셋 상수를 조절할 것.
 * ============================================================================
 */

