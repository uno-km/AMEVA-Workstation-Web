/**
 * @file RefreshConfirmModal.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/RefreshConfirmModal.tsx
 * @role Confirmation Popup Modal before Browser Reload (Hard Refresh)
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 사용자가 실수로 단축키(F5, Ctrl+R)를 누르거나 수동 리로드 시, 에디터에 미처 저장되지 않은 로컬 VFS 데이터 유실을 막기 위해 1차 가드 모달을 띄운다.
 * - [ADR] 포커스 데드락 프리징 이슈 해결:
 *   - 이전 코드에서는 모달 마운트 시 `setTimeout(50ms)` 딜레이로 수동 `.focus()`를 줌으로써,
 *   - 하위 에디터 포커스 리스너 및 타 모달(`FreeModal` 등)의 포커싱 로직과 얽혀 렌더링 무한 루프 프리징 버그가 발생했음.
 *   - 이에 대한 대책으로 **수동 포커스 제어 코드를 전면 제거(MUST NOT manual focus)**하고,
 *     새로고침 실행 버튼에 **HTML5 표준 `autoFocus` 속성을 부여**하여 브라우저 엔진 차원에서 마운트 시점에 안전하게 포커스를 1회 획득하도록 디자인함.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 새로고침 승인/취소 상태 의사결정을 구하고, 최종 선택 결과를 부모 컴포넌트에 통보한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 실제 브라우저 새로고침 명령 수행 (`window.location.reload` 등은 본 컴포넌트 호출부인 App.tsx 단축키 영역이 가로채서 수행함).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - INVARIANT: 모달 외부 Backdrop 영역 클릭 시 `onClose`가 실행되어 창이 닫혀야 하나,
 *   모달 본체 카드 영역(div)을 클릭했을 때는 이벤트가 버블링되어 모달이 의도치 않게 닫히는 현상을 막기 위해
 *   반드시 카드 엘리먼트에 `e.stopPropagation()` 계약을 보존할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - RotateCw: 새로고침 순환 화살표 아이콘.
 */
import { RotateCw } from 'lucide-react'

/**
 * @interface RefreshConfirmModalProps
 * @description RefreshConfirmModal 제어에 요구되는 속성들.
 */
export interface RefreshConfirmModalProps {
  /** 모달 노출 제어 플래그 */
  isOpen: boolean
  /** 닫기/취소 클릭 시 핸들러 */
  onClose: () => void
  /** 새로고침 승인 확정 시 핸들러 */
  onConfirm: () => void
}

/**
 * @component RefreshConfirmModal
 * @description 새로고침 동작 전 사용자 데이터 유실 경고 및 재확인을 요청하는 팝업 모달.
 */
export function RefreshConfirmModal({ 
  /*
   * [PROPERTY MAPPINGS]
   * - isOpen: 모달 활성화 플래그.
   * - onClose: 모달 강제 종료/취소 콜백.
   * - onConfirm: 리로드 최종 승인 확정 콜백.
   */
  isOpen, 
  onClose, 
  onConfirm 
}: RefreshConfirmModalProps) {
  // CONTRACT: 모달이 비활성화 상태인 경우 렌더링을 완전히 스킵한다 (Invariant)
  if (!isOpen) return null

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999999,
        pointerEvents: 'auto'
      }} 
      onClick={onClose}
    >
      {/* 
       * [CONTRACT - Stop Propagation Card Wrapper]
       * - MUST NOT remove e.stopPropagation(). 제거 시 내부 요소 클릭이 backdrop으로 전파되어 모달이 즉시 강제 종료됨.
       */
      }
      <div 
        style={{
          background: 'var(--bg-main)', 
          border: '1px solid var(--border-glow)',
          borderRadius: '12px', width: '400px', padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', 
          display: 'flex', flexDirection: 'column', gap: '16px',
          pointerEvents: 'auto'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCw size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 800 }}>새로고침 하시겠습니까?</h2>
            <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              저장하지 않은 데이터(로컬 임시 버퍼)는 모두 삭제됩니다.
            </p>
          </div>
        </div>

        {/* 제어 버튼 그룹 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              border: '1px solid var(--border-muted)', background: 'transparent',
              color: 'var(--text-main)', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            취소
          </button>
          
          {/* 
           * [CONTRACT - HTML5 autoFocus Implementation]
           * - MUST possess autoFocus={true}. 유저가 단축키 입력 직후 엔터를 눌렀을 때 즉시 승인될 수 있도록 
           *   브라우저 기본 포커싱 계약을 보존함. (수동 focus() 실행 시 렌더링 무한 루프 위험이 있음).
           */
          }
          <button 
            autoFocus
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              border: 'none', background: '#3b82f6', /* 기존 회색 대신 가시성 높은 파란색 브랜드 컬러 적용 */
              color: '#fff', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
            }}
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  )
}

