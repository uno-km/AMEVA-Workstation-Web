/**
 * ============================================================================
 * @file CodeConsole.tsx
 * @description CodeConsole.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './CodeConsole';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file CodeConsole.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/CodeConsole.tsx
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
import React from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Terminal, AlertCircle, CheckCircle, Loader } from 'lucide-react'

/**
 * CodeConsoleProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface CodeConsoleProps {
  outputs: string[]
  isRunning: boolean
  success?: boolean
  onClose: () => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `CodeConsole`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `CodeConsole(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * CodeConsole 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function CodeConsole({ outputs, isRunning, success, onClose }: CodeConsoleProps) {
  return (
    <div
      className="glow-primary"
      style={{
        marginTop: '8px',
        backgroundColor: 'var(--term-bg)',
        border: '1px solid var(--term-border)',
        borderRadius: '6px',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* 콘솔 헤더 */}
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--term-icon-color)' }}>
          <Terminal size={14} />
          <span>콘솔 출력 결과</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRunning ? (
            <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader size={12} className="animate-spin" /> 실행 중...
            </span>
          ) : success === true ? (
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> 성공
            </span>
          ) : success === false ? (
            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> 오류 발생
            </span>
          ) : null}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            닫기
          </button>
        </div>
      </div>

      {/* 출력 결과 스크롤 영역 */}
      <div
        style={{
          padding: '10px 14px',
          maxHeight: '160px',
          overflowY: 'auto',
          color: 'var(--term-text)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          lineHeight: '1.5',
        }}
      >
        {outputs.length === 0 ? (
          <span style={{ color: 'var(--text-dark)' }}>출력 결과가 없습니다. 코드를 실행해 보십시오.</span>
        ) : (
          outputs.map((line, idx) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `color`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const color = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let color = 'var(--term-text)'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `line.includes('[ERROR]') || line.includes('[TIMEOUT ERROR]') || line.includes('[COMPILATION ERROR]') || line.includes('[RUNTIME ERROR]')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (line.includes('[ERROR]') || line.includes('[TIMEOUT ERROR]') || line.includes('[COMPILATION ERROR]') || line.includes('[RUNTIME ERROR]'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (line.includes('[ERROR]') || line.includes('[TIMEOUT ERROR]') || line.includes('[COMPILATION ERROR]') || line.includes('[RUNTIME ERROR]')) {
              color = 'var(--danger)'
            } else if (line.includes('[WARN]')) {
              color = '#f59e0b'
            }
            return (
              <div key={idx} style={{ color }}>
                {line}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

