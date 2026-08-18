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
import '@mantine/core/styles.css'
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
const LOADING_STEPS = [
  'VFS 가상 파일 시스템 및 로컬 스토리지 마운트 중',
  '리치 마크다운 에디터 및 플러그인 레지스트리 로드 중',
  'AI 인텔리전스 및 WebGPU 런타임 점검 중',
  '워크스페이스 세션 및 레이아웃 상태 복원 중',
  '시스템 초기화 및 작업 환경 구성 중'
]

const SplashScreen = () => {
  const [stepIndex, setStepIndex] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length)
    }, 750)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#94a3b8', 
      fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', 
      flexDirection: 'column', gap: '1.25rem', userSelect: 'none'
    }}>
      <div style={{
        width: '38px', height: '38px', border: '2.5px solid rgba(255, 255, 255, 0.08)', 
        borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'amevaSpin 0.9s linear infinite'
      }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.04em' }}>
          Loading AMEVA Workstation
        </div>
        <div style={{
          fontSize: '11.5px',
          color: 'rgba(255, 255, 255, 0.38)',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          minHeight: '18px'
        }}>
          <span>{LOADING_STEPS[stepIndex]}</span>
          <span style={{ display: 'inline-flex', width: '16px', textAlign: 'left' }}>
            <span className="ameva-dot ameva-dot-1">.</span>
            <span className="ameva-dot ameva-dot-2">.</span>
            <span className="ameva-dot ameva-dot-3">.</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes amevaSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes amevaDotFade {
          0%, 20% { opacity: 0; }
          40%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .ameva-dot-1 { animation: amevaDotFade 1.2s infinite 0.0s; }
        .ameva-dot-2 { animation: amevaDotFade 1.2s infinite 0.25s; }
        .ameva-dot-3 { animation: amevaDotFade 1.2s infinite 0.5s; }
      `}</style>
    </div>
  )
}


// 런타임 환경에 따른 플랫폼 어댑터 동적 등록
if (window.electronAPI) {
  registerPlatformAdapter(desktopAdapter)
} else {
  registerPlatformAdapter(mobileAdapter)
}

if (import.meta.env.DEV) {
  import('./document-intelligence/feedback/documentFeedbackStore').then(m1 => {
    import('./document-intelligence/rules/user/userRuleGenerator').then(m2 => {
      import('./document-intelligence/rules/user/userRuleStore').then(m3 => {
        (window as any).amevaDnaDebug = {
          listFeedbacks: () => m1.documentFeedbackStore.listDocumentFeedback(),
          generateRuleCandidates: () => m2.userRuleGenerator.generateRuleCandidates(),
          listRuleCandidates: () => m2.userRuleGenerator.listRuleCandidates(),
          approveRuleCandidate: (id: string) => m2.userRuleGenerator.approveRuleCandidate(id),
          rejectRuleCandidate: (id: string) => m2.userRuleGenerator.rejectRuleCandidate(id),
          listUserDomainRules: () => m3.userRuleStore.listUserRules()
        };
      });
    });
  });
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

