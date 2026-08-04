/**
 * @file useSTTState.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/stores/useSTTState.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (VoiceDictationPlugin.tsx): STT 모델 상태 확인 및 모델 선택 시 소비.
 * - 소비처 B (기타 오디오 처리 플러그인): 현재 선택된 STT 모델의 설정 및 가용성 확인 시 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - STT(Speech-to-Text) 관련 모델 설정(Turbo, Medium) 및 설치 상태를 느슨하게 결합하여(Zustand) 관리.
 * - 브라우저/로컬 환경 기반 STT 엔진의 가용성 및 선택 상태 유지.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface STTSettings {
  /** 현재 선택된 모델 (e.g. 'turbo', 'medium') */
  activeModel: string;
  /** 오프라인 모드 강제 여부 */
  offlineMode: boolean;
  /** 언어 설정 */
  language: string;
}

export interface STTState {
  settings: STTSettings;
  updateSettings: (newSettings: Partial<STTSettings>) => void;
  
  isAvailable: boolean;
  setIsAvailable: (isAvailable: boolean) => void;
  
  /** 모델별 설치 여부 등 관리용 */
  installedModels: string[];
  addInstalledModel: (modelId: string) => void;
}

export const useSTTState = create<STTState>()(
  persist(
    (set) => ({
      settings: {
        activeModel: 'ggml-large-v3-turbo.bin',
        offlineMode: true,
        language: 'ko'
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),

      isAvailable: false,
      setIsAvailable: (isAvailable) => set({ isAvailable }),

      installedModels: [],
      addInstalledModel: (modelId) =>
        set((state) => ({
          installedModels: Array.from(new Set([...state.installedModels, modelId]))
        }))
    }),
    {
      name: 'ameva-stt-settings',
      partialize: (state) => ({
        settings: state.settings,
        installedModels: state.installedModels
      })
    }
  )
);
