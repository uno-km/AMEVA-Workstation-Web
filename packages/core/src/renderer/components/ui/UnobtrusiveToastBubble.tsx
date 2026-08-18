/**
 * ============================================================================
 * @file UnobtrusiveToastBubble.tsx
 * @system AMEVA OS Desktop Workstation - UI Primitives & Feedback Layer
 * @location packages/core/src/renderer/components/ui/UnobtrusiveToastBubble.tsx
 * @role Zero-Overhead, Non-Intrusive Micro Speech Bubble Toast Primitive
 * ============================================================================
 * 
 * [설계 철학 및 불변 규칙 - CORE INVARIANTS]
 * 1. 완전 비간섭성: pointer-events: none 및 user-select: none을 강제 적용하여,
 *    토스트가 떠 있는 도중에도 하위 레이어의 에디터 타이핑, 마우스 클릭, 드래그를 전혀 방해하지 않는다.
 * 2. 위치 가변성: top, bottom, left, right 4방향 앵커와 세밀한 offset을 지원하며, 
 *    배치 방향에 맞춰 정밀한 말풍선 꼬리(Tail Arrow)가 자동 생성된다.
 * 3. 테마 프리셋: emerald(성공/완료), indigo(AI/지능), cyan(임베딩/시스템), amber(주의), rose(경고), dark(모던 글래스).
 */

import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type ToastVariant = 'emerald' | 'indigo' | 'cyan' | 'amber' | 'rose' | 'dark';
export type ToastPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface UnobtrusiveToastBubbleProps {
  /** 토스트 노출 여부 */
  show: boolean;
  /** 토스트에 표시될 메시지 */
  message: ReactNode;
  /** 선택적 좌측 아이콘 */
  icon?: ReactNode;
  /** 테마 변형 (기본값: emerald) */
  variant?: ToastVariant;
  /** 기준 요소 대비 앵커 위치 (기본값: top) */
  placement?: ToastPlacement;
  /** 앵커 간격 px (기본값: 8) */
  offset?: number;
  /** 사용자 정의 추가 스타일 */
  style?: CSSProperties;
  /** 추가 클래스명 */
  className?: string;
}

const VARIANT_THEMES: Record<ToastVariant, {
  bg: string;
  border: string;
  shadow: string;
  text: string;
  arrow: string;
}> = {
  emerald: {
    bg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(16, 185, 129, 0.6)',
    shadow: '0 4px 16px rgba(16, 185, 129, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
    text: '#34d399',
    arrow: 'rgba(16, 185, 129, 0.6)'
  },
  indigo: {
    bg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(59, 130, 246, 0.6)',
    shadow: '0 4px 16px rgba(59, 130, 246, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
    text: '#93c5fd',
    arrow: 'rgba(59, 130, 246, 0.6)'
  },
  cyan: {
    bg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(6, 182, 212, 0.6)',
    shadow: '0 4px 16px rgba(6, 182, 212, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
    text: '#38bdf8',
    arrow: 'rgba(6, 182, 212, 0.6)'
  },
  amber: {
    bg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(245, 158, 11, 0.6)',
    shadow: '0 4px 16px rgba(245, 158, 11, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
    text: '#fbbf24',
    arrow: 'rgba(245, 158, 11, 0.6)'
  },
  rose: {
    bg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(244, 63, 94, 0.6)',
    shadow: '0 4px 16px rgba(244, 63, 94, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
    text: '#fb7185',
    arrow: 'rgba(244, 63, 94, 0.6)'
  },
  dark: {
    bg: 'rgba(15, 23, 42, 0.96)',
    border: 'rgba(255, 255, 255, 0.15)',
    shadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
    text: '#f1f5f9',
    arrow: 'rgba(255, 255, 255, 0.15)'
  }
};

export const UnobtrusiveToastBubble: React.FC<UnobtrusiveToastBubbleProps> = ({
  show,
  message,
  icon,
  variant = 'emerald',
  placement = 'top',
  offset = 8,
  style,
  className
}) => {
  if (!show) return null;

  const theme = VARIANT_THEMES[variant] || VARIANT_THEMES.emerald;

  // Placement calculation styles
  let positionStyles: CSSProperties = {};
  let arrowStyles: CSSProperties = {};

  if (placement === 'top') {
    positionStyles = {
      bottom: `calc(100% + ${offset}px)`,
      left: '50%',
      transform: 'translateX(-50%)'
    };
    arrowStyles = {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '4px solid transparent',
      borderRight: '4px solid transparent',
      borderTop: `4px solid ${theme.arrow}`
    };
  } else if (placement === 'bottom') {
    positionStyles = {
      top: `calc(100% + ${offset}px)`,
      left: '50%',
      transform: 'translateX(-50%)'
    };
    arrowStyles = {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '4px solid transparent',
      borderRight: '4px solid transparent',
      borderBottom: `4px solid ${theme.arrow}`
    };
  } else if (placement === 'left') {
    positionStyles = {
      right: `calc(100% + ${offset}px)`,
      top: '50%',
      transform: 'translateY(-50%)'
    };
    arrowStyles = {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '4px solid transparent',
      borderBottom: '4px solid transparent',
      borderLeft: `4px solid ${theme.arrow}`
    };
  } else if (placement === 'right') {
    positionStyles = {
      left: `calc(100% + ${offset}px)`,
      top: '50%',
      transform: 'translateY(-50%)'
    };
    arrowStyles = {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '4px solid transparent',
      borderBottom: '4px solid transparent',
      borderRight: `4px solid ${theme.arrow}`
    };
  }

  return (
    <>
      <style>{`
        @keyframes amevaUnobtrusiveBubbleIn {
          0% { opacity: 0; transform: scale(0.92) translate(-50%, 4px); }
          100% { opacity: 1; transform: scale(1) translate(-50%, 0); }
        }
      `}</style>
      <div
        className={className}
        style={{
          position: 'absolute',
          ...positionStyles,
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: theme.text,
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          letterSpacing: '-0.2px',
          animation: 'amevaUnobtrusiveBubbleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          ...style
        }}
      >
        {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        <span>{message}</span>
        {/* Tail Arrow */}
        <div
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            ...arrowStyles
          }}
        />
      </div>
    </>
  );
};
