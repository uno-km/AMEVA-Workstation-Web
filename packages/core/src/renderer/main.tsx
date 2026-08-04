/**
 * @file main.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/main.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'
// 포커스 영역 관리 싱글턴 — import만으로 전역 이벤트 리스너 등록
import './lib/focusRegion'
import { registerPlatformAdapter } from '../shared/adapters/platformAdapter'
import { desktopAdapter } from '../shared/adapters/desktopAdapterImpl'
import { mobileAdapter } from '../shared/adapters/mobileAdapterImpl'

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `App`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const App = ...` 형태로 안전 캐싱 후 가공 기동.
       */
const App = lazy(() => import('./App'))

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `SplashScreen`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const SplashScreen = ...` 형태로 안전 캐싱 후 가공 기동.
       */
const SplashScreen = () => (
  <div style={{
    width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', backgroundColor: '#1e1e1e', color: '#888', 
    fontFamily: 'sans-serif', flexDirection: 'column', gap: '1.5rem'
  }}>
    <div style={{
      width: '40px', height: '40px', border: '3px solid #333', 
      borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite'
    }} />
    <div style={{ fontSize: '14px', letterSpacing: '0.05em' }}>Loading AMEVA Workstation...</div>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
  </div>
)

// 런타임 환경에 따른 플랫폼 어댑터 동적 등록
if (window.electronAPI) {
  registerPlatformAdapter(desktopAdapter)
} else {
  registerPlatformAdapter(mobileAdapter)
}

const rootContainer = document.getElementById('root')!
let root = (window as any).__reactRoot
if (!root) {
  root = ReactDOM.createRoot(rootContainer)
  ;(window as any).__reactRoot = root
}

root.render(
  <React.StrictMode>
    <Suspense fallback={<SplashScreen />}>
      <App />
    </Suspense>
  </React.StrictMode>
)

