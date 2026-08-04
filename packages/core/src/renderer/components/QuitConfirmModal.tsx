/**
 * @file QuitConfirmModal.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/QuitConfirmModal.tsx
 * @role Application exit confirmation dialog Modal
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - Electron 주 프로세스가 창 닫기 시그널을 보내거나 유저가 앱을 강제 종료하려 할 때, 저장하지 않은 문서 데이터를 보존하기 위해 2차 확인 모달을 렌더링한다.
 * - 모달 개폐 시 부드러운 페이드인/아웃 시각 효과를 위해 **렌더링 마운트 플래그(`isRendered`)**와 **불투명도 플래그(`isVisible`)**를 분리 구동한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 앱 종료 여부에 대한 최종 결정을 받고, 승인(`onConfirm`) 또는 취소(`onClose`) 콜백을 전파한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모달이 서서히 사라지는 fade-out 애니메이션(200ms)이 끝나기 전에 DOM에서 엘리먼트가 먼저 삭제되면 화면 깜빡임이 생기므로,
 *   반드시 `setTimeout(() => setIsRendered(false), 200)` 타임아웃 클린업 타이머 계약을 보존하고 소멸 시 `clearTimeout(timer)`을 이행할 것.
 * - MUST NOT bypass stopPropagation: 카드 본체 영역 클릭이 부모 Backdrop 클릭(onClose)으로 번지는 현상을 가드하기 위해,
 *   카드 `div` 요소의 `onClick={(e) => e.stopPropagation()}` 을 반드시 고수할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useEffect, useState: 개폐 페이드 트랜지션 애니메이션 타이머 제어용 React API.
 * - AlertTriangle: 종료 경고 느낌표 아이콘.
 */
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * QuitConfirmModalProps 인터페이스 정의.
 * 부모 모달 매니저로부터 주입받는 제어 속성 규격.
 */
interface QuitConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * @component QuitConfirmModal
 * @description 저장하지 않은 문서가 유실될 위험을 경고하고 앱 강제 종료 여부를 확인하는 팝업 창.
 */
export function QuitConfirmModal({ 
  /*
   * [PROPERTY MAPPINGS]
   * - isOpen: 모달 활성화 플래그.
   * - onClose: 종료 취소 콜백.
   * - onConfirm: 강제 종료 승인 콜백.
   */
  isOpen, 
  onClose, 
  onConfirm 
}: QuitConfirmModalProps) {
  /*
   * [INVARIANT - Render & Transition States]
   * - isRendered: 리액트 DOM 트리 마운트 여부 플래그.
   * - isVisible: CSS opacity 투명도 변환 플래그 (10ms 시간차 인젝션).
   */
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  /**
   * [SIDE EFFECT - Fade In/Out Transition Trigger]
   * - Rationale: isOpen = true 시 즉시 렌더링 후 10ms 뒤 불투명도를 주어 페이드인을 수행하고,
   *   isOpen = false 시 불투명도를 내린 후 200ms 페이드아웃이 끝난 시점에 DOM에서 최종 소멸시킨다.
   */
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen) {
      setIsRendered(true)
      // 10ms 프레임 대기 후 페이드인 시작 (브라우저 스타일 동기화 방지)
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
      // 200ms 트랜지션 완료 시점에 최종 언마운트
      const timer = setTimeout(() => setIsRendered(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 마운트 전인 경우 렌더링 스킵 (Invariant)
  if (!isRendered) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-glass)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, opacity: isVisible ? 1 : 0, transition: 'opacity 0.2s ease',
      WebkitAppRegion: 'no-drag'
    } as any}>
      {/* 
       * [CONTRACT - Stop Propagation Card Wrapper]
       * - MUST NOT remove e.stopPropagation().
       */
      }
      <div 
        style={{
          background: 'var(--bg-main)', border: '1px solid var(--border-muted)',
          borderRadius: '12px', padding: '24px', width: '380px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>정말 종료하시겠습니까?</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>저장하지 않은 작업 내용이 모두 지워집니다.</p>
          </div>
        </div>

        {/* 제어 그룹 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', background: 'var(--bg-glass-active)', border: '1px solid var(--border-muted)',
              color: 'var(--text-main)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px', background: '#ef4444', border: '1px solid #dc2626',
              color: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600
            }}
          >
            강제 종료
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 트랜지션 속도를 0.2s보다 늦추거나 빠르게 조정 시:
 *    - `transition: 'opacity 0.2s'` 스타일 속성과
 *      `setTimeout(() => ..., 200)` 클린업 지연 시간을 반드시 동일 밀리초 단위로 매칭해 줄 것.
 * ============================================================================
 */

