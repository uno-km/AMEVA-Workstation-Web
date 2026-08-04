/**
 * @file SettingsTabHotkeys.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/settings/SettingsTabHotkeys.tsx
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

import React from 'react'
import type { AppSettings, HotkeyConfig } from '../SettingsModal'

interface SettingsTabHotkeysProps {
  activeTab: string
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SettingsTabHotkeys`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SettingsTabHotkeys(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SettingsTabHotkeys({ activeTab, settings, onUpdateSettings }: SettingsTabHotkeysProps) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeTab !== 'Hotkeys'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeTab !== 'Hotkeys')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (activeTab !== 'Hotkeys') return null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `formatHotkeyForUI`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const formatHotkeyForUI = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const formatHotkeyForUI = (raw: string): string => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!raw`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!raw)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!raw) return '지정 안 됨'
    return raw
      .replace('Control', 'Ctrl')
      .replace('Shift', 'Shift')
      .replace('Alt', 'Alt')
      .replace('Meta', 'Cmd')
      .split('+')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' + ')
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleRecordHotkey`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleRecordHotkey = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleRecordHotkey = (key: keyof HotkeyConfig, e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const activeKeys: string[] = []
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.ctrlKey || e.metaKey) activeKeys.push('Control'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.ctrlKey || e.metaKey) activeKeys.push('Control')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (e.ctrlKey || e.metaKey) activeKeys.push('Control')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.shiftKey) activeKeys.push('Shift'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.shiftKey) activeKeys.push('Shift')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (e.shiftKey) activeKeys.push('Shift')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.altKey) activeKeys.push('Alt'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.altKey) activeKeys.push('Alt')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (e.altKey) activeKeys.push('Alt')
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isModifier`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isModifier = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isModifier = ['control', 'shift', 'alt', 'meta'].includes(e.key.toLowerCase())
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isModifier`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isModifier)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isModifier) {
      // 키패드나 특수 키 보정
      let normalizedKey = e.key
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === ' '`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.key === ' ')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (e.key === ' ') normalizedKey = 'Space'
      
      activeKeys.push(normalizedKey)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hotkeyStr`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hotkeyStr = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const hotkeyStr = activeKeys.join('+')
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentHotkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentHotkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const currentHotkeys = settings.hotkeys || {
        save: 'Control+s',
        open: 'Control+o',
        newFile: 'Control+n',
        pdfExport: 'Control+p',
        toggleAI: 'Control+\\',
        toggleMode: 'Control+e',
        zoomIn: 'Control+=',
        zoomOut: 'Control+-',
        zoomReset: 'Control+0'
      }
      
      onUpdateSettings({
        hotkeys: {
          ...currentHotkeys,
          [key]: hotkeyStr
        }
      })
    }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleResetHotkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleResetHotkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleResetHotkeys = () => {
    onUpdateSettings({
      hotkeys: {
        save: 'Control+s',
        open: 'Control+o',
        newFile: 'Control+n',
        pdfExport: 'Control+p',
        toggleAI: 'Control+\\',
        toggleMode: 'Control+e',
        zoomIn: 'Control+=',
        zoomOut: 'Control+-',
        zoomReset: 'Control+0'
      }
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 0 4px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>사용자 정의 단축키 설정</h3>
        <button
          onClick={handleResetHotkeys}
          style={{
            fontSize: '10px', color: 'var(--primary)', background: 'none',
            border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0,
          }}
        >
          기본값 복원 🔄
        </button>
      </div>
      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        입력 필드를 클릭하고 원하는 단축키 조합을 키보드로 누르면 자동으로 녹화됩니다.
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '260px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {[
          { key: 'save', label: '문서 저장' },
          { key: 'open', label: '문서 열기' },
          { key: 'newFile', label: '새 창 / 새 탭 생성' },
          { key: 'pdfExport', label: 'PDF 내보내기' },
          { key: 'toggleAI', label: 'AI 어시스턴트 토글' },
          { key: 'toggleMode', label: '편집 / 미리보기 모드 전환' },
          { key: 'zoomIn', label: '화면 확대 (Zoom In)' },
          { key: 'zoomOut', label: '화면 축소 (Zoom Out)' },
          { key: 'zoomReset', label: '화면 확대/축소 초기화' },
        ].map(item => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentHotkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentHotkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const currentHotkeys = settings.hotkeys || {
            save: 'Control+s',
            open: 'Control+o',
            newFile: 'Control+n',
            pdfExport: 'Control+p',
            toggleAI: 'Control+\\',
            toggleMode: 'Control+e',
            zoomIn: 'Control+=',
            zoomOut: 'Control+-',
            zoomReset: 'Control+0'
          }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rawVal`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rawVal = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const rawVal = currentHotkeys[item.key as keyof HotkeyConfig] || ''
          return (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-muted)',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.label}</span>
              <input
                type="text"
                readOnly
                value={formatHotkeyForUI(rawVal)}
                placeholder="보조키 + 일반키"
                onKeyDown={(e) => handleRecordHotkey(item.key as keyof HotkeyConfig, e)}
                style={{
                  width: '160px',
                  padding: '4px 8px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '4px',
                  color: 'var(--primary)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textAlign: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}

