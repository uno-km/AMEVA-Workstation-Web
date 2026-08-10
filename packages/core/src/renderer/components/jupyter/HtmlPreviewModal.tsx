/**
 * ============================================================================
 * @file HtmlPreviewModal.tsx
 * @description HtmlPreviewModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './HtmlPreviewModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file HtmlPreviewModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/jupyter/HtmlPreviewModal.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useEffect, useRef } from 'react'
// [외부 패키지 및 라이브러리 임포트: react-dom]
import { createPortal } from 'react-dom'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Globe } from 'lucide-react'

// HTML Full modal preview
/**
 * HtmlPreviewModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function HtmlPreviewModal({ code, onClose }: { code: string; onClose: () => void }) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `iframeRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const iframeRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `doc`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const doc = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const doc = iframeRef.current?.contentDocument
      || iframeRef.current?.contentWindow?.document
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `doc`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (doc)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (doc) {
      doc.open()
      doc.write(code)
      doc.close()
    }
  }, [code])

  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onKey`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onKey = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '80vw', height: '75vh', borderRadius: '12px',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          border: '1.5px solid rgba(249,115,22,0.4)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', background: '#111827',
          borderBottom: '1px solid rgba(249,115,22,0.2)',
        }}>
          <Globe size={14} style={{ color: '#f97316' }} />
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>HTML Live Sandbox Preview</span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              color: '#9ca3af', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
            }}
          >
            &times;
          </button>
        </div>
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts allow-modals"
          title="Html Preview Fullscreen"
          style={{ width: '100%', flex: 1, border: 'none', background: '#fff' }}
        />
      </div>
    </div>,
    document.body
  )
}

