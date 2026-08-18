/**
 * ============================================================================
 * @file useUnobtrusiveToast.ts
 * @system AMEVA OS Desktop Workstation - UI Hooks
 * @location packages/core/src/renderer/hooks/useUnobtrusiveToast.ts
 * @role Fully Non-Intrusive Micro Speech Bubble Toast State Machine Hook
 * ============================================================================
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ToastVariant, ToastPlacement } from '../components/ui/UnobtrusiveToastBubble';

export interface UnobtrusiveToastOptions {
  /** 토스트 노출 시간 ms (기본값: 2000) */
  durationMs?: number;
  /** 테마 변형 (기본값: emerald) */
  variant?: ToastVariant;
  /** 기준 요소 대비 앵커 위치 (기본값: top) */
  placement?: ToastPlacement;
  /** 앵커 간격 px (기본값: 8) */
  offset?: number;
  /** 아이콘 요소 */
  icon?: ReactNode;
}

export interface ToastState extends UnobtrusiveToastOptions {
  isVisible: boolean;
  message: ReactNode;
}

/**
 * 범용 비간섭형 미니 말풍선 토스트 훅
 */
export function useUnobtrusiveToast(defaultOptions?: UnobtrusiveToastOptions) {
  const [toastState, setToastState] = useState<ToastState>({
    isVisible: false,
    message: '',
    durationMs: defaultOptions?.durationMs || 2000,
    variant: defaultOptions?.variant || 'emerald',
    placement: defaultOptions?.placement || 'top',
    offset: defaultOptions?.offset || 8,
    icon: defaultOptions?.icon
  });

  const timerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToastState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const showToast = useCallback((message: ReactNode, options?: UnobtrusiveToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const mergedOptions: UnobtrusiveToastOptions = {
      durationMs: 2000,
      variant: 'emerald',
      placement: 'top',
      offset: 8,
      ...defaultOptions,
      ...options
    };

    setToastState({
      isVisible: true,
      message,
      ...mergedOptions
    });

    const duration = mergedOptions.durationMs || 2000;
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToastState(prev => ({ ...prev, isVisible: false }));
      }, duration);
    }
  }, [defaultOptions]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    toastState,
    showToast,
    hideToast,
    isVisible: toastState.isVisible
  };
}

/**
 * 불리언 조건 변경 감지 시(false -> true) 2초간 자동 트리거되는 선언적 훅
 */
export function useConditionToast(
  condition: boolean,
  message: ReactNode,
  options?: UnobtrusiveToastOptions
) {
  const { toastState, showToast, hideToast } = useUnobtrusiveToast(options);
  const prevConditionRef = useRef<boolean>(condition);

  useEffect(() => {
    if (!prevConditionRef.current && condition) {
      showToast(message, options);
    }
    prevConditionRef.current = condition;
  }, [condition, message, options, showToast]);

  return {
    toastState,
    showToast,
    hideToast,
    isVisible: toastState.isVisible
  };
}
