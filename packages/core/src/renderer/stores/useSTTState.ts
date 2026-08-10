/**
 * ============================================================================
 * @file useSTTState.ts
 * @description useSTTState.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useSTTState';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

// [외부 패키지 및 라이브러리 임포트: zustand]
import { create } from 'zustand';
// [외부 패키지 및 라이브러리 임포트: zustand/middleware]
import { persist } from 'zustand/middleware';

/**
 * STTSettings 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface STTSettings {
  /** 현재 선택된 모델 (e.g. 'turbo', 'medium') */
  activeModel: string;
  /** 오프라인 모드 강제 여부 */
  offlineMode: boolean;
  /** 언어 설정 */
  language: string;
}

/**
 * STTState 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface STTState {
  settings: STTSettings;
  updateSettings: (newSettings: Partial<STTSettings>) => void;
  
  isAvailable: boolean;
  setIsAvailable: (isAvailable: boolean) => void;
  
  /** 모델별 설치 여부 등 관리용 */
  installedModels: string[];
  addInstalledModel: (modelId: string) => void;
}

/**
 * useSTTState 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
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
