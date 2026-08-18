/**
 * @file useBackgroundInit.ts
 * @system AMEVA OS Desktop Workstation - Core Store & Engine Initializer
 * @location packages/core/src/renderer/stores/useBackgroundInit.ts
 * @role Background Dependency & AI Model Engine Warm-up Orchestration Hook
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 앱 기동 시 메인 스레드 UI 렌더링, 폰트 로딩, 에디터 및 블록 마운트가 60 FPS로 완벽히 완료된 후,
 *   유휴 시간(Idle Callback / 지연 스케줄링)에 Web-LLM (MLC-AI) 및 Xenova Transformers를 백그라운드에서 안전하게 적재한다.
 * - 온디바이스 AI 모델 적재가 초기 화면 전환이나 타 컴포넌트의 사용자 인터랙션을 절대 지연시키거나 점유하지 않도록 
 *   페이지 로드 완료 이벤트(`window.onload`) 및 `requestIdleCallback` 기반 비차단 스케줄러를 적용한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - WebGPU 복구 플래그(`sessionStorage.ameva_auto_init_webgpu`) 및 자동 로딩 설정(`localStorage.ameva_auto_load_llm`) 안전 평가.
 * - 메인 UI 렌더링을 방해하지 않는 비동기 백그라운드 AI 패키지 동적 import 및 스토어(`useDependencyStore`) 전파.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: API 엔진 모드(`ameva_engine_mode === 'api'`)일 경우 불필요한 WebGPU 온디바이스 모델 로딩을 개시하지 말 것.
 * - MUST: 타이머 및 IdleCallback 클린업을 등록하여 빠른 언마운트 시 미실행 비동기 작업을 안전하게 취소할 것.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (packages/core/src/renderer/App.tsx): 애플리케이션 최상위 마운트 시 최초 구동.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - react: 부수효과 제어를 위한 useEffect 훅.
 * - ./useDependencyStore: 시스템 전역 의존성 로딩 상태 스토어.
 * - ../components/useWebLLM: MLC WebGPU 로컬 추론 훅.
 */
import { useEffect } from 'react'
import { useDependencyStore } from './useDependencyStore'
import { useWebLLM } from '../components/useWebLLM'

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `useBackgroundInit`
 * - 역할: 백그라운드 엔진 및 모델 초기화 파이프라인을 비차단(Non-blocking) 방식으로 기동함.
 * - 예시: `useBackgroundInit()`
 */
/**
 * useBackgroundInit 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function useBackgroundInit() {
  const { initDependency, setDependencyStatus } = useDependencyStore()
  const { initModel } = useWebLLM()

  /**
   * [SIDE EFFECT - Non-blocking WebGPU Auto-Load / Recovery Watcher]
   * - Rationale: 페이지와 에디터 마운트가 완전히 끝난 유휴 시점에 WebGPU 모델을 안전하게 백그라운드 로드함.
   */
  useEffect(() => {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `isRecovery`
     * - 자료형 / 예상 값: boolean (세션 스토리지 플래그 기반).
     */
    const isRecovery = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ameva_auto_init_webgpu') === '1'
    if (isRecovery) {
      sessionStorage.removeItem('ameva_auto_init_webgpu')
    }

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `isAutoLoadEnabled`
     * - 자료형 / 예상 값: boolean (로컬 스토리지 영구 설정값).
     */
    const isAutoLoadEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('ameva_auto_load_llm') === 'true'
    const engineMode = (typeof localStorage !== 'undefined' && localStorage.getItem('ameva_engine_mode')) || 'webgpu'

    let timer: any = null
    let idleHandle: any = null

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `(isRecovery || isAutoLoadEnabled) && engineMode !== 'api'`
     * - 만족 시: 온디바이스 WebGPU 모드이므로 페이지가 완전히 렌더링된 후 백그라운드 적재 개시.
     */
    if ((isRecovery || isAutoLoadEnabled) && engineMode !== 'api') {
      const scheduleWarmup = () => {
        const model = localStorage.getItem('ameva_selected_llm_model') || 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC'
        console.log('[AutoInitWebGPU] Non-blocking background WebGPU model warmup starting for:', model)
        initModel(model).catch(e => console.warn('[AutoInitWebGPU] warmup error (non-fatal):', e))
      }

      if (isRecovery) {
        timer = setTimeout(scheduleWarmup, 1200)
      } else {
        // 메인 UI가 렌더링을 마친 후 브라우저 유휴 시간에 안전 적재 (3.5초 딜레이)
        timer = setTimeout(() => {
          if (typeof (window as any).requestIdleCallback === 'function') {
            idleHandle = (window as any).requestIdleCallback(scheduleWarmup, { timeout: 4000 })
          } else {
            scheduleWarmup()
          }
        }, 3500)
      }

      return () => {
        if (timer) clearTimeout(timer)
        if (idleHandle && typeof (window as any).cancelIdleCallback === 'function') {
          (window as any).cancelIdleCallback(idleHandle)
        }
      }
    }
  }, [initModel])

  /**
   * [SIDE EFFECT - Non-blocking Core ML Engine Import]
   * - Rationale: 초기 로딩 렌더링 블로킹을 막기 위해 6초 지연 후 의존성 라이브러리를 동적 import함.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      // 1. Web-LLM (AI 엔진)
      initDependency('web-llm', '로컬 AI 추론 엔진 (@mlc-ai/web-llm)')
      setDependencyStatus('web-llm', 'loading')
      import('@mlc-ai/web-llm')
        .then(() => setDependencyStatus('web-llm', 'ready'))
        .catch((err) => setDependencyStatus('web-llm', 'error', err.message))

      // 2. Transformers (임베딩/비전 엔진)
      initDependency('transformers', '온디바이스 머신러닝 (@xenova/transformers)')
      setDependencyStatus('transformers', 'loading')
      import('@xenova/transformers')
        .then(() => setDependencyStatus('transformers', 'ready'))
        .catch((err) => setDependencyStatus('transformers', 'error', err.message))
    }, 6000)

    return () => clearTimeout(timer)
  }, [])
}
