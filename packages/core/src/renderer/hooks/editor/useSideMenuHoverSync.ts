/**
 * @file useSideMenuHoverSync.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @location src/renderer/hooks/editor/useSideMenuHoverSync.ts
 * @role Editor Side menu hover style synchronization corrector Hook
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - BlockNote 라이브러리는 블록 왼쪽 여백에 [+] 버튼과 [::] 드래그 그랩용 플로팅 포털 사이드 메뉴를 렌더링한다.
 * - 마우스가 본문을 떠나 플로팅 포털 메뉴 버튼으로 올라가는 시점에 CSS 호버 클래스가 어긋나면서 현재 편집 중인 블록의 테두리 하이라이팅 불빛이 꺼지는 visual jump 버그가 발생한다.
 * - 이 문제를 JS 이벤트 브릿징으로 안전하게 우회하기 위해, 마우스 포인터가 플로팅 메뉴 영역 내에 머물고 있을 때는
 *   우측 본문 60px 떨어진 지점의 블록 엘리먼트를 식별하여 `data-bn-hover-sync="true"` 커스텀 속성을 강제로 주입 및 유지한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 마우스 호버 감청 이벤트(`handleSideMenuHover`)를 구동하고, 타깃 블록의 CSS 속성을 토글 제어한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 리스너 누수 방지를 위해 훅 언마운트(`cleanup`) 시점에 전역 윈도우 마우스 무브 이벤트를 완벽히 `removeEventListener` 하고,
 *   임시 주입되었던 `data-bn-hover-sync` 속성을 반드시 소멸 제거해 줄 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useEffect: 최초 기동 시 전역 윈도우 마우스 무브 감청 등록 및 해제를 위한 리액트 훅.
 */
import { useEffect } from 'react'

/**
 * @hook useSideMenuHoverSync
 * @description 사이드 포털 버튼 호버 시 본문 블록의 호버 테두리 스타일이 꺼지지 않도록 동기화 보정해 주는 훅.
 */
export function useSideMenuHoverSync() {
  /**
   * [SIDE EFFECT - Global Mouse Move Hijacker with rAF Throttling]
   * - Rationale: 마우스 무브를 감지하여 플로팅 메뉴 포털 호버 좌표를 캡처하되,
   *   requestAnimationFrame으로 배칭하여 매 픽셀마다 발생하는 동기식 Reflow(Layout Thrashing)를 원천 차단한다.
   */
  useEffect(() => {
    /*
     * [INVARIANT - Last Hovered Block Cache Element]
     * - lastHoveredBlock: 이전 턴에 임시로 hover 속성을 받았던 DOM 블록 노드 캐시 변수.
     */
    let lastHoveredBlock: Element | null = null
    let rafId: number | null = null
    let latestEvent: MouseEvent | null = null

    const processHover = () => {
      rafId = null
      if (!latestEvent) return
      const e = latestEvent
      latestEvent = null

      const target = e.target as HTMLElement | null
      if (!target) return
      
      // 마우스가 BlockNote의 플로팅 [+] 단추나 드래그 핸들 단추 위에 올라가 있는지 감지
      const isSideMenu = target.closest('.bn-side-menu') || target.closest('button[data-test-id="side-menu-button"]') || target.closest('button[data-test-id="drag-handle"]')
      
      if (isSideMenu) {
        // Rationale: 사이드 버튼 위치에서 우측으로 60px 이동(본문 영역 내부)한 지점의 실제 블록 요소를 역캡처
        const el = document.elementFromPoint(e.clientX + 60, e.clientY)
        const blockOuter = el?.closest('.bn-block-outer')
        
        // 새로 감지된 블록 노드가 이전 노드와 다를 때 속성 교체 주입
        if (blockOuter && lastHoveredBlock !== blockOuter) {
          if (lastHoveredBlock) lastHoveredBlock.removeAttribute('data-bn-hover-sync')
          blockOuter.setAttribute('data-bn-hover-sync', 'true')
          lastHoveredBlock = blockOuter
        }
      } else {
        // 사이드 메뉴 영역을 벗어났을 경우 즉각 속성 제거
        if (lastHoveredBlock) {
          lastHoveredBlock.removeAttribute('data-bn-hover-sync')
          lastHoveredBlock = null
        }
      }
    }

    // 마우스 무브 이벤트 핸들러 (rAF 스케줄러)
    const handleSideMenuHover = (e: MouseEvent) => {
      latestEvent = e
      if (rafId === null) {
        rafId = requestAnimationFrame(processHover)
      }
    }

    // 전역 감청 등록 (passive: true로 스크롤/이벤트 루프 지연 방지)
    window.addEventListener('mousemove', handleSideMenuHover, { passive: true })
    
    // CONTRACT: 소멸 시 리스너 해제 및 스타일 복구
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleSideMenuHover)
      if (lastHoveredBlock) lastHoveredBlock.removeAttribute('data-bn-hover-sync')
    }
  }, [])
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 사이드바 폭이 변경되어 본문 60px 탐색이 엇나갈 때:
 *    - `e.clientX + 60` 탐색 오프셋 거리를 스타일 시트 패딩 두께에 맞추어 변수로 조절할 것.
 * ============================================================================
 */

