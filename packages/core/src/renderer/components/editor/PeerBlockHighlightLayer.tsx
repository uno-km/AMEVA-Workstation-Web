/**
 * @file PeerBlockHighlightLayer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/editor/PeerBlockHighlightLayer.tsx
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

import React, { useState, useEffect } from 'react'
import type { PeerState } from '../../../shared/types'

export interface PeerBlockHighlightLayerProps {
  peers: PeerState[]
  containerRef: React.RefObject<HTMLDivElement | null>
}

interface BlockOverlay {
  peerId: string
  peerName: string
  peerColor: string
  isEditing: boolean
  top: number
  left: number
  width: number
  height: number
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `PeerBlockHighlightLayer`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `PeerBlockHighlightLayer(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function PeerBlockHighlightLayer({ peers, containerRef }: PeerBlockHighlightLayerProps) {
  const [overlays, setOverlays] = useState<BlockOverlay[]>([])

  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `activeList`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const activeList = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const activeList = peers.filter(p => p.blockHighlight?.blockId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeList.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeList.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (activeList.length === 0) {
      setOverlays(prev => prev.length === 0 ? prev : [])
      return
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `computeOverlays`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const computeOverlays = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const computeOverlays = () => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const container = containerRef.current
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!container) return

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
       * - 변수 명: `scrollTop`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const scrollTop = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const scrollTop = container.scrollTop
      const newOverlays: BlockOverlay[] = []

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const peer of activeList) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (const peer of activeList) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!peer.blockHighlight`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!peer.blockHighlight)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!peer.blockHighlight) continue
        const { blockId, isEditing } = peer.blockHighlight

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockDom`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockDom = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blockDom = document.querySelector(`[data-id="${blockId}"], [data-block-id="${blockId}"]`)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!blockDom`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!blockDom)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!blockDom) continue

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `outerEl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const outerEl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const outerEl = blockDom.closest('.bn-block-outer') || blockDom
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rect`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rect = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const rect = outerEl.getBoundingClientRect()

        newOverlays.push({
          peerId: peer.id,
          peerName: peer.name,
          peerColor: peer.color,
          isEditing,
          top: rect.top - containerRect.top + scrollTop,
          left: rect.left - containerRect.left,
          width: rect.width,
          height: rect.height,
        })
      }
      setOverlays(prev => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isDifferent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isDifferent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const isDifferent = newOverlays.length !== prev.length ||
          newOverlays.some((item, idx) => 
            item.peerId !== prev[idx]?.peerId || 
            item.isEditing !== prev[idx]?.isEditing ||
            item.top !== prev[idx]?.top ||
            item.height !== prev[idx]?.height ||
            item.width !== prev[idx]?.width
          )
        return isDifferent ? newOverlays : prev
      })
    }

    let rafId: number | null = null
    const scheduleCompute = () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(computeOverlays)
    }

    scheduleCompute()

    window.addEventListener('resize', scheduleCompute)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const container = containerRef.current
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `container) container.addEventListener('scroll', scheduleCompute`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (container) container.addEventListener('scroll', scheduleCompute)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (container) container.addEventListener('scroll', scheduleCompute)

    let observer: MutationObserver | null = null
    if (container) {
      observer = new MutationObserver(scheduleCompute)
      observer.observe(container, { childList: true, subtree: true, characterData: true })
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', scheduleCompute)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `container) container.removeEventListener('scroll', scheduleCompute`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (container) container.removeEventListener('scroll', scheduleCompute)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (container) container.removeEventListener('scroll', scheduleCompute)
      if (observer) observer.disconnect()
    }
  }, [peers, containerRef])

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `overlays.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (overlays.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (overlays.length === 0) return null

  // 같은 블록에 있는 피어들 라벨 세로 위치 조율용 Map
  const blockLabelCounts = new Map<string, number>()

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 5 }}>
      {overlays.map((ov) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockKey`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockKey = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blockKey = `${ov.top}_${ov.left}`
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `count`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const count = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const count = blockLabelCounts.get(blockKey) || 0
        blockLabelCounts.set(blockKey, count + 1)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `labelTop`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const labelTop = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const labelTop = count * 22

        return (
          <React.Fragment key={ov.peerId}>
            <div
              style={{
                position: 'absolute',
                top: ov.top,
                left: ov.left - 4,
                width: ov.width + 8,
                height: ov.height,
                backgroundColor: ov.peerColor,
                opacity: ov.isEditing ? 0.14 : 0.08,
                pointerEvents: 'none',
                zIndex: 5,
                borderRadius: '4px',
                borderLeft: `3px solid ${ov.peerColor}`,
                transition: 'opacity 0.2s, top 0.12s, height 0.12s',
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: ov.top - 20 + labelTop,
                left: ov.left,
                pointerEvents: 'none',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'top 0.12s',
              }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                backgroundColor: ov.peerColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: 800, color: '#fff',
                boxShadow: `0 0 6px ${ov.peerColor}80`,
                flexShrink: 0,
              }}>
                {ov.peerName.charAt(0).toUpperCase()}
              </div>

              <div style={{
                background: ov.peerColor,
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '3px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                opacity: 0.95,
              }}>
                <span>{ov.peerName}</span>
                {ov.isEditing && (
                  <span style={{
                    fontSize: '8px', opacity: 0.9,
                    animation: 'collab-pulse 1.2s infinite alternate',
                  }}>
                    editing...
                  </span>
                )}
              </div>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

