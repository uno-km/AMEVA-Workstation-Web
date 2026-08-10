/**
 * ============================================================================
 * @file RequirePermission.tsx
 * @description RequirePermission.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './RequirePermission';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React from 'react';
// [외부 패키지 및 라이브러리 임포트: react]
import type { ReactNode } from 'react';
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useProcessStore]
import { useProcessStore } from '../../stores/useProcessStore';
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useProcessStore]
import type { PermissionScope } from '../../stores/useProcessStore';
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Lock, Sparkles } from 'lucide-react';
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useUIStore]
import { useUIStore } from '../../stores/useUIStore';

/**
 * RequirePermissionProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface RequirePermissionProps {
  scope: PermissionScope;
  children: ReactNode;
  fallback?: ReactNode;
  hideInsteadOfFallback?: boolean;
}

/**
 * RequirePermission 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function RequirePermission({ scope, children, fallback, hideInsteadOfFallback = false }: RequirePermissionProps) {
  const hasPermission = useProcessStore((state) => state.hasPermission);
  const setShowPricingModal = useUIStore((state) => state.setShowPricingModal);
  
  if (hasPermission(scope)) {
    return <>{children}</>;
  }

  if (hideInsteadOfFallback) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback UI
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      padding: '3rem 2rem', textAlign: 'center', 
      backgroundColor: 'rgba(236, 72, 153, 0.03)', 
      borderRadius: '12px', 
      border: '1px dashed rgba(236, 72, 153, 0.3)',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
      }}>
        <Lock size={24} style={{ color: '#fff' }} />
      </div>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700 }}>
        Premium Feature
      </h3>
      <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '300px', lineHeight: 1.5 }}>
        해당 기능은 <strong>Pro 또는 Enterprise 전용</strong>입니다.<br/>업그레이드 하시겠습니까?
      </p>
      <button
        onClick={() => setShowPricingModal(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
          border: 'none', color: '#fff', padding: '10px 24px',
          borderRadius: '24px', cursor: 'pointer', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
          transition: 'transform 0.2s, boxShadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.25)';
        }}
      >
        <Sparkles size={16} />
        지금 업그레이드 하기
      </button>
      <div style={{ marginTop: '1rem', fontSize: '10px', color: 'var(--text-dark)' }}>
        Required Permission: <code>{scope}</code>
      </div>
    </div>
  );
}
