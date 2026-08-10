/**
 * ============================================================================
 * @file DocStatusIndicator.tsx
 * @description DocStatusIndicator.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './DocStatusIndicator';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file DocStatusIndicator.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/statusbar/DocStatusIndicator.tsx
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
import { Info, AlertTriangle, Check } from 'lucide-react'

/**
 * DocStatusIndicatorProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface DocStatusIndicatorProps {
  filePath: string | null
  isDirty: boolean
  lastSavedTime: Date | null
  activeTooltip: string | null
  setActiveTooltip: (id: string | null) => void
  tooltipStyle: React.CSSProperties
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `DocStatusIndicator`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `DocStatusIndicator(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * DocStatusIndicator 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function DocStatusIndicator({
  filePath,
  isDirty,
  lastSavedTime,
  activeTooltip,
  setActiveTooltip,
  tooltipStyle
}: DocStatusIndicatorProps) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `formatSavedTime`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const formatSavedTime = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const formatSavedTime = (date: Date | null) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!date) return '최근 저장 시간 기록 없음 (새 문서`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!date) return '최근 저장 시간 기록 없음 (새 문서)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!date) return '최근 저장 시간 기록 없음 (새 문서)'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `yyyy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const yyyy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const yyyy = date.getFullYear()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mm`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mm = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const mm = String(date.getMonth() + 1).padStart(2, '0')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dd`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dd = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const dd = String(date.getDate()).padStart(2, '0')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hh`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hh = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const hh = String(date.getHours()).padStart(2, '0')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `min`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const min = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const min = String(date.getMinutes()).padStart(2, '0')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ss`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ss = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `최근 저장 시간: ${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Info size={12} style={{ color: 'var(--primary)' }} />
        <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '260px' }}>
          {filePath ? filePath.split(/[\\/]/).pop() : '무제 문서.md'}
        </span>
      </div>
      <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-muted)' }} />
      {isDirty ? (
        <span 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: '#fb923c', // 주황색 계열 (수정 중)
            cursor: 'help',
            fontWeight: 600,
            fontSize: '11px',
            position: 'relative'
          }}
          onMouseEnter={() => setActiveTooltip('save')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <AlertTriangle size={11} style={{ color: '#fb923c' }} /> 저장되지 않음

          {activeTooltip === 'save' && (
            <div style={{ ...tooltipStyle, width: '280px', left: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fb923c', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                ⚠️ 미저장 수정사항 존재
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                에디터 본문에 저장되지 않은 변경사항이 있습니다. <br />
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Ctrl+S</span> 단축키를 눌러 디스크에 안전하게 저장하십시오.
              </div>
            </div>
          )}
        </span>
      ) : (
        <span 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: 'var(--success)', 
            cursor: 'help',
            fontSize: '11px',
            position: 'relative'
          }}
          onMouseEnter={() => setActiveTooltip('save')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <Check size={11} style={{ color: 'var(--success)' }} /> 저장됨

          {activeTooltip === 'save' && (
            <div style={{ ...tooltipStyle, width: '260px', left: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                ✓ 문서가 디스크에 동기화됨
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-main)' }}>
                {formatSavedTime(lastSavedTime)}
              </div>
            </div>
          )}
        </span>
      )}
    </>
  )
}

