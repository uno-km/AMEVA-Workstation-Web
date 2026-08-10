/**
 * ============================================================================
 * @file ConfirmModal.tsx
 * @description ConfirmModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ConfirmModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file ConfirmModal.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/ui/modals/ConfirmModal.tsx
 * @role Generic Confirmation Popup Modal Base (붕어빵 틀)
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 모달창 중 '확인/취소'를 묻는 팝업 UI의 레이아웃, 클릭 바깥 영역 처리, 애니메이션, 포커싱 정책을 공통화한다.
 * - 새로고침, 새 문서, 애플리케이션 종료 등 다양한 상황에서 주입(Injection)되는 제목, 설명, 아이콘만 바꿔 재사용(Inheritance/Composition)한다.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React from 'react'

/**
 * ConfirmModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  confirmButtonColor?: string
  icon: React.ReactNode
}

/**
 * ConfirmModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmButtonColor = '#3b82f6',
  icon
}: ConfirmModalProps) {
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
            {icon}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 800 }}>{title}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
              {description}
            </p>
          </div>
        </div>

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
          
          <button 
            autoFocus
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              border: 'none', background: confirmButtonColor,
              color: '#fff', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: `0 0 12px ${confirmButtonColor}66`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
