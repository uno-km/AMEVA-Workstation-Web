/**
 * ============================================================================
 * @file mediaEditorStore.ts
 * @description mediaEditorStore.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './mediaEditorStore';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import type { MediaEditorState, MediaClip } from './types'

let state: MediaEditorState = {
  tracks: [],
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  gpuAvailable: false
}

const listeners = new Set<(state: MediaEditorState) => void>()

export const mediaEditorStore = {
  getState: () => state,
  setState: (partial: Partial<MediaEditorState>) => {
    state = { ...state, ...partial }
    listeners.forEach(listener => listener(state))
  },
  subscribe: (listener: (state: MediaEditorState) => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  addClip: (clip: MediaClip) => {
    const newTracks = [...state.tracks]
    if (newTracks.length === 0) {
      newTracks.push({ id: 'track-1', clips: [] })
    }
    newTracks[0] = {
      ...newTracks[0],
      clips: [...newTracks[0].clips, clip]
    }
    mediaEditorStore.setState({ tracks: newTracks })
  },
  removeClip: (id: string) => {
    const newTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(c => c.id !== id)
    }))
    mediaEditorStore.setState({ tracks: newTracks })
  },
  setCurrentTime: (t: number) => {
    mediaEditorStore.setState({ currentTime: t })
  },
  setGpuAvailable: (b: boolean) => {
    mediaEditorStore.setState({ gpuAvailable: b })
  }
}
