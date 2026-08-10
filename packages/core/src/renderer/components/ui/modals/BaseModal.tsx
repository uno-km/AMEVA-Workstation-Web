/**
 * ============================================================================
 * @file BaseModal.tsx
 * @description BaseModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './BaseModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file BaseModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/ui/modals/BaseModal.tsx
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

// [외부 패키지 및 라이브러리 임포트: react]
import React from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { X } from 'lucide-react'

/**
 * BaseModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
  className?: string
  headerExtra?: React.ReactNode
  hideHeader?: boolean
  onMouseDown?: (e: React.MouseEvent) => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `BaseModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `BaseModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * BaseModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  width = '90%',
  height,
  style,
  className = '',
  headerExtra,
  hideHeader,
  onMouseDown
}: BaseModalProps) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen) return null

  return (
    <div
      className={`glass-panel glow-primary ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '16px',
        border: '1px solid var(--border-glow)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(139, 92, 246, 0.35)',
        color: 'var(--text-main)',
        ...style
      }}
    >
      {/* 헤더 */}
      {!hideHeader && (
        <div
          onMouseDown={onMouseDown}
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-glass-active)',
            cursor: onMouseDown ? 'move' : 'default',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            {icon}
            {title && (
              <h3 style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-sans)', margin: 0 }}>
                {title}
              </h3>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {headerExtra}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 바디 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* 푸터 */}
      {footer && (
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-muted)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: 'var(--bg-glass-active)'
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

