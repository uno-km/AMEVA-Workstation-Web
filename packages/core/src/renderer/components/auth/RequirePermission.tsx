import React from 'react';
import type { ReactNode } from 'react';
import { useProcessStore } from '../../stores/useProcessStore';
import type { PermissionScope } from '../../stores/useProcessStore';
import { Lock, Sparkles } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

interface RequirePermissionProps {
  scope: PermissionScope;
  children: ReactNode;
  fallback?: ReactNode;
  hideInsteadOfFallback?: boolean;
}

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
