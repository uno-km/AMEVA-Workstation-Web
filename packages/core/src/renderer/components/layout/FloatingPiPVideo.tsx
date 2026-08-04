/**
 * @file FloatingPiPVideo.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/layout/FloatingPiPVideo.tsx
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

import React from 'react'

import { useYoutubePiP } from '../../hooks/app/useYoutubePiP'

export interface FloatingPiPVideoProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `FloatingPiPVideo`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `FloatingPiPVideo(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function FloatingPiPVideo({}: FloatingPiPVideoProps = {}) {
  const { pipVideoId, pipPosition, handlePiPMouseDown, setPipVideoId } = useYoutubePiP()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pipVideoId`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pipVideoId)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!pipVideoId) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: pipPosition.x,
        top: pipPosition.y,
        width: '340px',
        height: '220px',
        background: '#18181c',
        border: '1.5px solid var(--primary)',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          height: '28px',
          background: '#0f0f11',
          borderBottom: '1px solid #2e2e38',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          cursor: 'move',
        }}
        onMouseDown={handlePiPMouseDown}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', `https://youtube.com/watch?v=${pipVideoId}`)
          e.dataTransfer.effectAllowed = 'copy'
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          // Right click context menu (optional if user mentioned it)
          const evt = new CustomEvent('app:insert-youtube', { detail: { videoId: pipVideoId } })
          window.dispatchEvent(evt)
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>📺 Floating YouTube PiP Player</span>
        <button
          onClick={() => setPipVideoId(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f87171',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ flex: 1, background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${pipVideoId}?autoplay=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  )
}

