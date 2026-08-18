/**
 * @file useImageLightbox.ts
 * @system AMEVA OS Desktop Workstation - Editor Media Core
 * @location packages/core/src/renderer/hooks/editor/useImageLightbox.ts
 * @role Editor Image Lightbox Controller Hook
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 에디터 본문 및 갤러리 내의 이미지에 대해 사용자가 의도적으로 더블클릭하거나 
 *   커스텀 이벤트(`ameva:open-lightbox`)를 발행했을 때만 고해상도 무손실 확대 라이트박스 모달을 구동한다.
 * - 본문 작성 중 단순 마우스 클릭 시 무분별하게 전체화면 라이트박스가 팝업되어 사용자 경험을 저해하는 문제를 원천 방지한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 에디터 컨테이너 내부의 `dblclick` 이벤트 감청 및 `selectedImg` 상태 생명주기 관리.
 * - 전역 커스텀 이벤트 `ameva:open-lightbox` 연동 및 정리(cleanup).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 훅 언마운트 시 등록된 `dblclick` 및 `ameva:open-lightbox` 이벤트 리스너를 반드시 해제하여 메모리 누수를 방지할 것.
 * - MUST NOT: 버튼, 링크, 입력 필드 등 인터랙티브 요소 내부의 이미지 클릭 시 라이트박스를 띄우지 말 것.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (packages/core/src/renderer/components/MarkdownEditor.tsx): 메인 마크다운 에디터 내 라이트박스 바인딩.
 * - 소비처 B (packages/core/src/renderer/components/media/AmevaImageBlock.tsx): 갤러리 카드 내 크게보기 연동.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - react: useEffect, useState 상태 및 부수효과 관리를 위한 리액트 코어 훅.
 */
import { useEffect, useState } from 'react'

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `useImageLightbox`
 * - 역할: 에디터 컨테이너 DOM 참조를 받아 이미지 확대 뷰어 대상 URL 상태 및 제어자를 반환함.
 * - 예시: `const { selectedImg, setSelectedImg } = useImageLightbox(editorContainerRef)`
 */
/**
 * useImageLightbox 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function useImageLightbox(editorContainerRef: React.RefObject<HTMLDivElement | null>) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `selectedImg`
   * - 자료형 / 예상 값: string (이미지 URL / blob / base64) 또는 null.
   * - 시나리오: 사용자가 이미지를 더블클릭하거나 크게보기 버튼을 누르면 해당 이미지 URL이 할당되어 모달을 마운트함.
   * - 예시 코드: `setSelectedImg('blob:http://...')`
   */
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  /**
   * [SIDE EFFECT - Double Click & Custom Event Listener Registration]
   * - Rationale: 에디터 컨테이너의 더블클릭 이벤트 및 전역 브로드캐스트 이벤트를 감청하여 안전하게 뷰어를 기동함.
   */
  useEffect(() => {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `!editorContainerRef.current`
     * - 만족 시: DOM 마운트 전이므로 리스너 등록을 건너뜀.
     * - 불만족 시: 유효한 컨테이너 DOM에 이벤트 리스너를 바인딩함.
     */
    if (!editorContainerRef.current) return

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `container`
     * - 자료형 / 예상 값: HTMLDivElement DOM 노드.
     */
    const container = editorContainerRef.current

    /*
     * [FUNCTION CONTRACT]
     * - 함수 명: `handleImgDblClick`
     * - 역할: 마우스 더블클릭 대상이 인터랙티브 요소가 아닌 일반 이미지일 때 라이트박스 오픈.
     */
    const handleImgDblClick = (e: MouseEvent) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `t`
       * - 자료형 / 예상 값: HTMLElement (클릭된 DOM 타깃).
       */
      const t = e.target as HTMLElement

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `t.closest('button, a, input, [data-interactive], .bn-side-menu')`
       * - 만족 시: 버튼 클릭 등 다른 사용자 의도가 우선하므로 라이트박스를 띄우지 않고 탈출.
       */
      if (t.closest('button, a, input, [data-interactive], .bn-side-menu')) return

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `t.tagName === 'IMG'`
       * - 만족 시: 이미지 엘리먼트이므로 src를 읽어 선택 이미지 상태로 승격.
       */
      if (t.tagName === 'IMG') {
        setSelectedImg((t as HTMLImageElement).src)
      }
    }

    /*
     * [FUNCTION CONTRACT]
     * - 함수 명: `handleCustomOpen`
     * - 역할: `ameva:open-lightbox` 커스텀 이벤트를 수신하여 특정 URL의 이미지를 라이트박스로 오픈.
     */
    const handleCustomOpen = (e: any) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.detail?.url`
       * - 만족 시: 전달받은 이미지 URL로 라이트박스를 켬.
       */
      if (e.detail?.url) {
        setSelectedImg(e.detail.url)
      }
    }

    // 전역 및 로컬 이벤트 바인딩
    container.addEventListener('dblclick', handleImgDblClick)
    window.addEventListener('ameva:open-lightbox', handleCustomOpen)

    // CONTRACT: 언마운트 시 완벽한 리스너 클린업 수행
    return () => {
      container.removeEventListener('dblclick', handleImgDblClick)
      window.removeEventListener('ameva:open-lightbox', handleCustomOpen)
    }
  }, [editorContainerRef])

  return { selectedImg, setSelectedImg }
}
