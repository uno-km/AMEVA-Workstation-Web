/**
 * @file SettingsTabCredentials.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/settings/SettingsTabCredentials.tsx
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

import { useState, useEffect } from 'react'
import * as ipc from '../../services/ipc/electronApiAdapter'

interface SettingsTabCredentialsProps {
  isOpen: boolean
  activeTab: string
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SettingsTabCredentials`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SettingsTabCredentials(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SettingsTabCredentials({ isOpen, activeTab }: SettingsTabCredentialsProps) {
  const [credStatus, setCredStatus] = useState<Record<string, boolean>>({
    gemini: false,
    openai: false,
    claude: false,
    github: false,
    googleClientId: false,
  })

  const [newKeyInput, setNewKeyInput] = useState<Record<string, string>>({
    gemini: '',
    openai: '',
    claude: '',
    github: '',
    googleClientId: '',
  })

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `loadCredentials`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const loadCredentials = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const loadCredentials = async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv()) return
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `geminiVal`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const geminiVal = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const geminiVal = await ipc.keychainGet('gemini-api-key')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `openaiVal`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const openaiVal = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const openaiVal = await ipc.keychainGet('openai-api-key')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `claudeVal`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const claudeVal = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const claudeVal = await ipc.keychainGet('claude-api-key')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `githubVal`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const githubVal = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const githubVal = await ipc.keychainGet('github-token')
    const googleClientIdVal = await ipc.keychainGet('google-client-id')

    setCredStatus({
      gemini: !!geminiVal,
      openai: !!openaiVal,
      claude: !!claudeVal,
      github: !!githubVal,
      googleClientId: !!googleClientIdVal,
    })
  }

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen && activeTab === 'Credentials'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen && activeTab === 'Credentials')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen && activeTab === 'Credentials') {
      loadCredentials()
    }
  }, [isOpen, activeTab])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleSaveCredential`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleSaveCredential = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleSaveCredential = async (service: string, keychainKey: string) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `value`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const value = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const value = newKeyInput[service]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!value || !value.trim()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!value || !value.trim())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!value || !value.trim()) return
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv()) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `res`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const res = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const res = await ipc.keychainSet(keychainKey, value.trim())
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `res && res.success`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (res && res.success)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (res && res.success) {
      setNewKeyInput(prev => ({ ...prev, [service]: '' }))
      loadCredentials()
    } else {
      alert(`키 저장 실패: ${res?.error || '알 수 없는 오류'}`)
    }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleClearCredential`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleClearCredential = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleClearCredential = async (service: string, keychainKey: string) => {
    void service
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv()) return
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!confirm('해당 자격 증명을 영구히 삭제하시겠습니까?')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!confirm('해당 자격 증명을 영구히 삭제하시겠습니까?'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!confirm('해당 자격 증명을 영구히 삭제하시겠습니까?')) return

    await ipc.keychainDelete(keychainKey)
    loadCredentials()
  }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeTab !== 'Credentials'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeTab !== 'Credentials')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (activeTab !== 'Credentials') return null

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>API Keys & Credentials</h3>
      <p style={{ fontSize: '9.5px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: '1.4' }}>
        외부 AI 서비스 및 플랫폼 연동을 위한 API Key들을 데스크톱 환경의 <strong>OS 자격 증명 관리자(Keychain / safeStorage)</strong>에 안전하게 암호화하여 위임 보관합니다. 등록된 비밀키는 화면에 노출되지 않습니다.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { id: 'gemini', keyName: 'gemini-api-key', label: 'Google Gemini API Key', placeholder: 'AQ.Ab8... 또는 AIzaSy...' },
          { id: 'openai', keyName: 'openai-api-key', label: 'OpenAI API Key', placeholder: 'sk-...' },
          { id: 'claude', keyName: 'claude-api-key', label: 'Anthropic Claude API Key', placeholder: 'sk-ant-...' },
          { id: 'github', keyName: 'github-token', label: 'GitHub Personal Access Token', placeholder: 'ghp_... 또는 github_pat_...' },
          { id: 'googleClientId', keyName: 'google-client-id', label: 'Google OAuth Client ID', placeholder: '109283748293-...apps.googleusercontent.com' },
        ].map(cred => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isRegistered`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isRegistered = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const isRegistered = credStatus[cred.id]
          return (
            <div key={cred.id} style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{cred.label}</span>
                {isRegistered ? (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    ●●●●●●●● 등록됨 (OS 암호화 보관 중)
                  </span>
                ) : (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    미등록
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={newKeyInput[cred.id]}
                  onChange={e => setNewKeyInput(prev => ({ ...prev, [cred.id]: e.target.value }))}
                  placeholder={isRegistered ? "새로운 키로 덮어쓰려면 여기에 입력하세요" : cred.placeholder}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    color: 'var(--text-main)',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleSaveCredential(cred.id, cred.keyName)}
                  disabled={!newKeyInput[cred.id]?.trim()}
                  style={{
                    padding: '5px 12px',
                    background: newKeyInput[cred.id]?.trim() ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: newKeyInput[cred.id]?.trim() ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: newKeyInput[cred.id]?.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                >
                  등록
                </button>
                {isRegistered && (
                  <button
                    onClick={() => handleClearCredential(cred.id, cred.keyName)}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

