/**
 * ============================================================================
 * @file useMediaCutEditor.ts
 * @description useMediaCutEditor.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useMediaCutEditor';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { mediaEditorStore } from './mediaEditorStore'
import type { MediaClip, MediaEditorState } from './types'

export const useMediaCutEditor = () => {
  const [state, setState] = useState<MediaEditorState>(mediaEditorStore.getState())

  useEffect(() => {
    if ('gpu' in navigator) {
      mediaEditorStore.setGpuAvailable(!!navigator.gpu)
    } else {
      mediaEditorStore.setGpuAvailable(false)
    }
    
    const unsubscribe = mediaEditorStore.subscribe(setState)
    return unsubscribe
  }, [])

  const addClip = useCallback((clip: MediaClip) => {
    mediaEditorStore.addClip(clip)
  }, [])

  const removeClip = useCallback((id: string) => {
    mediaEditorStore.removeClip(id)
  }, [])

  const seek = useCallback((time: number) => {
    mediaEditorStore.setCurrentTime(time)
  }, [])

  const exportCut = useCallback(() => {
    console.warn('WebCodecs 크로마 버전 필요')
  }, [])

  return {
    state,
    addClip,
    removeClip,
    seek,
    exportCut
  }
}
