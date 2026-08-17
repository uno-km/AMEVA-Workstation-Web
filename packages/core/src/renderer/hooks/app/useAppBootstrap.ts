/**
 * @file useAppBootstrap.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useAppBootstrap.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

/**
 * useAppBootstrap.ts
 *
 * 앱 초기 부트스트랩 및 초기화 전담 훅.
 * App.tsx 마운트 시점에 필요한 초기화 작업들을 순서에 맞게 실행한다.
 *
 * [포함 로직]
 * - Electron planGetStatus / isFreeMode 플래그 체크
 * - MCP 서버 목록 초기 로드 및 LocalStorage 복원
 * - 플러그인 지연 로딩 (1200ms lazy load)
 * - 브라우저 zoom factor 초기 복원
 * - Progressive UI 로딩 플래그 (isSidebarReady, isAIPanelReady)
 */

import { useState, useEffect } from 'react'
import { useProcessStore } from '../../stores/useProcessStore'
import { useUIStore } from '../../stores/useUIStore'
import type { AppSettings } from '../../components/SettingsModal'
import { ExcelPlugin } from '../../plugins/ExcelPlugin'
import { safeJsonParse } from '../../utils/safeJson'

/** 기본 MCP 서버 목록 (초기값) */
const DEFAULT_MCP_SERVERS = [
  {
    id: 'mcp-wasm-gateway',
    name: 'AMEVA OS WASM Gateway',
    type: 'http',
    url: 'http://127.0.0.1:11553/mcp',
    enabled: true
  }
]

/**
 * useAppBootstrap
 * 앱 초기화 관련 부트스트랩 로직을 처리하는 훅.
 *
 * @param settings - 현재 앱 설정 (플러그인 자동 로드에 사용)
 * @param handleInstallPlugin - 플러그인 설치 함수
 * @returns isSidebarReady, isAIPanelReady - Progressive Loading 플래그
 */
export function useAppBootstrap(
  settings: AppSettings,
  handleInstallPlugin: (id: string, scriptUrl: string) => Promise<void>
) {
  const {
    setIsFreeModeLocked,
    setMcpServersState,
    setBrowserZoom
  } = useProcessStore()

  // Progressive Loading 플래그: 무거운 컴포넌트를 순차적으로 지연 마운트
  const [isSidebarReady, setIsSidebarReady] = useState(false)
  const [isAIPanelReady, setIsAIPanelReady] = useState(false)

  // 1. 사이드바/AI패널 Progressive Loading 타이머
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `timerSidebar`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const timerSidebar = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const timerSidebar = setTimeout(() => setIsSidebarReady(true), 250)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `timerAI`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const timerAI = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const timerAI = setTimeout(() => setIsAIPanelReady(true), 1500)
    return () => {
      clearTimeout(timerSidebar)
      clearTimeout(timerAI)
    }
  }, [])

  // 2. Electron 플랜 상태 체크 및 MCP 서버 초기 로드
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `initFlagsAndMcp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const initFlagsAndMcp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const initFlagsAndMcp = async () => {

      // --free 시작 플래그 체크
      if ((window as any).electronAPI?.isFreeMode) {
        try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isFree`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isFree = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const isFree = await (window as any).electronAPI.isFreeMode()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isFree`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isFree)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (isFree) {
            console.log('[App] 🚀 --free 모드 감지! 제한 락커 강제 해제')
            setIsFreeModeLocked(false)
          }
        } catch (e) {
          console.error('[useAppBootstrap] --free 조회 실패:', e)
        }
      }

      // MCP 서버 목록 로드
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `stored`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const stored = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const stored = localStorage.getItem('mcp-servers-config')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `stored`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (stored)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (stored) {
          setMcpServersState(safeJsonParse(stored, DEFAULT_MCP_SERVERS))
        } else {
          setMcpServersState(DEFAULT_MCP_SERVERS)
        }
      } catch (e) {
        console.error('[useAppBootstrap] MCP 설정 로드 실패:', e)
        setMcpServersState(DEFAULT_MCP_SERVERS)
      }
    }

    initFlagsAndMcp()
  }, [setIsFreeModeLocked, setMcpServersState])

  // 3. 브라우저 zoom factor 초기 복원
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `(window as any).electronAPI?.getZoomFactor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if ((window as any).electronAPI?.getZoomFactor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if ((window as any).electronAPI?.getZoomFactor) {
      (window as any).electronAPI.getZoomFactor().then((val: any) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `typeof val === 'number') setBrowserZoom(val`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (typeof val === 'number') setBrowserZoom(val)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (typeof val === 'number') setBrowserZoom(val)
      }).catch((e: any) => {
        console.warn('[useAppBootstrap] Zoom factor 조회 실패:', e)
      })
    }
  }, [setBrowserZoom])

  // 4. 설치된 플러그인 지연 로딩 (1200ms 후 병렬 실행)
  useEffect(() => {
    const fetchAndLoadPlugins = async () => {
      try {
        // 1. 마켓플레이스 JSON을 가져옵니다.
        const res = await fetch(`https://raw.githubusercontent.com/uno-km/AMEVA-Workstation-Market-Place/main/public/api/plugins.json?t=${Date.now()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const baseUrl = 'https://raw.githubusercontent.com/uno-km/AMEVA-Workstation-Market-Place/main/public/'

        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `processedData`
         * - 시나리오: scriptUrl/previewUrl이 상대경로이면 raw.githubusercontent.com baseUrl을 붙여 절대경로로 변환한다.
         *             premium 플러그인은 scriptUrl이 .tsx로 끝나므로 handleInstallPlugin 내부의 .tsx 분기로 라우팅된다.
         */
        const processedData = data.map((p: any) => {
          if (p.scriptUrl && !p.scriptUrl.startsWith('http')) p.scriptUrl = baseUrl + p.scriptUrl
          if (p.previewUrl && !p.previewUrl.startsWith('http')) p.previewUrl = baseUrl + p.previewUrl
          return p
        })

        // 2. 전역 스토어에 세팅 (RightTabStrip, PluginTabPanel 등에서 사용)
        useUIStore.getState().setMarketplacePlugins(processedData)

        // 3. 사용자가 구독한 플러그인 로드
        if (!settings.installedPlugins || settings.installedPlugins.length === 0) return

        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `PREMIUM_IDS`
         * - 자료형: Set<string>
         * - 시나리오: premium 플러그인 ID 집합. processedData에서 플러그인 메타를 찾지 못해도
         *             이 집합에 속하면 .tsx fallback URL을 사용하여 JS 404를 방지한다.
         *             plugins.json에서 type==='premium'인 항목이 추가될 때마다 여기에도 반영해야 한다.
         */
        const PREMIUM_IDS = new Set([
          'DatabaseExplorerPlugin', 'FinanceDashboardView', 'GoogleMapsView',
          'google-maps', 'google-map', 'google-maps-view', 'map',
          'KanbanBoard', 'MindMapPlugin', 'PdfRagPlugin', 'PomodoroPlugin',
          'PresentationPlugin', 'RestClientPlugin', 'SmartSearchScrap',
          'VoiceDictationPlugin', 'WireframePlugin'
        ])

        settings.installedPlugins.forEach(async (id) => {
          const pluginMeta = processedData.find((p: any) => p.id === id)
          let scriptUrl: string
          if (pluginMeta?.scriptUrl) {
            scriptUrl = pluginMeta.scriptUrl
          } else if (PREMIUM_IDS.has(id)) {
            scriptUrl = `${baseUrl}plugins/premium/${id}.tsx`
          } else {
            scriptUrl = `${baseUrl}plugins/${id}.js`
          }
          try {
            await handleInstallPlugin(id, scriptUrl)
          } catch (e) {
            console.error(`[useAppBootstrap] 플러그인 '${id}' 자동 활성화 실패:`, e)
          }
        })
      } catch (err) {
        console.error('[useAppBootstrap] 마켓플레이스 플러그인 정보 로드 실패:', err)

        if (!settings.installedPlugins || settings.installedPlugins.length === 0) return
        let urlMap: Record<string, string> = {}
        try {
          urlMap = safeJsonParse(localStorage.getItem('plugin-urls'), {})
        } catch (e) {}

        const FALLBACK_BASE = 'https://raw.githubusercontent.com/uno-km/AMEVA-Workstation-Market-Place/main/public/'
        const PREMIUM_IDS_FALLBACK = new Set([
          'DatabaseExplorerPlugin', 'FinanceDashboardView', 'GoogleMapsView',
          'google-maps', 'google-map', 'google-maps-view', 'map',
          'KanbanBoard', 'MindMapPlugin', 'PdfRagPlugin', 'PomodoroPlugin',
          'PresentationPlugin', 'RestClientPlugin', 'SmartSearchScrap',
          'VoiceDictationPlugin', 'WireframePlugin'
        ])

        settings.installedPlugins.forEach(async (id) => {
          let scriptUrl: string
          if (urlMap[id]) {
            scriptUrl = urlMap[id]
          } else if (PREMIUM_IDS_FALLBACK.has(id)) {
            scriptUrl = `${FALLBACK_BASE}plugins/premium/${id}.tsx`
          } else {
            scriptUrl = `${FALLBACK_BASE}plugins/${id}.js`
          }
          try {
            await handleInstallPlugin(id, scriptUrl)
          } catch (e) {
            console.error(`[useAppBootstrap] 플러그인 '${id}' 자동 활성화 실패:`, e)
          }
        })
      }
    }

    const timer = setTimeout(() => {
      fetchAndLoadPlugins()
    }, 1200)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 5. Electron 네이티브 쉘 미설치 감지 및 다운로드 모달 권장 가동 (웹버전 첫 진입시 자동 노출 제거)
  useEffect(() => {
    // const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI
    // const dismissed = localStorage.getItem('ameva_desktop_install_prompt_dismissed') === 'true'
    // if (!isElectron && !dismissed) {
    //   useUIStore.getState().setIsInstallPromptOpen(true)
    // }
  }, [])

  // 6. SaaS 플러그인 (로컬 기능) 활성화 상태 연동
  useEffect(() => {
    const checkSaaSPlugins = () => {
      const stored = localStorage.getItem('enabled-plugins')
      if (stored) {
        try {
          const parsed = safeJsonParse(stored, {})
          
          // Excel Viewer 플러그인 라이프사이클 처리
          if (parsed.excelViewer) {
            ExcelPlugin.onActivate()
          } else {
            ExcelPlugin.onDeactivate()
          }

        } catch (e) {
          console.error('[useAppBootstrap] SaaS 플러그인 상태 동기화 실패:', e)
        }
      }
    }

    // 마운트 시 초기 연동
    checkSaaSPlugins()

    // MarketplaceModal 등에서 토글 시 발생하는 커스텀 이벤트 수신
    window.addEventListener('saas-plugins-changed', checkSaaSPlugins)
    
    return () => {
      window.removeEventListener('saas-plugins-changed', checkSaaSPlugins)
    }
  }, [])

  return {
    isSidebarReady,
    isAIPanelReady
  }
}

