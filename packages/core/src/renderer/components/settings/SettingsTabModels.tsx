/**
 * @file SettingsTabModels.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/settings/SettingsTabModels.tsx
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


import type { AppSettings } from '../SettingsModal'
import type { ModelInfo } from '../../services/ipc/ipcTypes'

import { useProcessStore } from '../../stores/useProcessStore'
import type { DownloadQueueItem } from '../../hooks/app/useDownloadManager'

export interface SettingsTabModelsProps {
  activeTab: string
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
  localModels: ModelInfo[]
  localCodeModels: ModelInfo[]
  formatBytes: (bytes: number) => string
  startModelDownload: (url: string, filename: string, type: 'llm' | 'code') => Promise<void>
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SettingsTabModels`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SettingsTabModels(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SettingsTabModels({
  activeTab,
  settings,
  onUpdateSettings,
  localModels,
  localCodeModels,
  formatBytes,
  startModelDownload,
}: SettingsTabModelsProps) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `downloadQueue`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const downloadQueue = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const downloadQueue = useProcessStore(state => state.downloadQueue)

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeTab !== 'Models'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeTab !== 'Models')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (activeTab !== 'Models') return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      


      {/* 2열 레이아웃 */}
      <div style={{ display: 'flex', gap: '16px' }}>
        
        {/* 1열: 일반 대화형 모델 (LLM) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <div style={{ borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px' }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>💬 일반 대화형 LLM 모델</h4>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>C:\ameva\models\llm</span>
          </div>

          {/* 활성 모델 선택기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>기본 대화 모델 활성화</label>
            <select
              value={settings.modelPath || ''}
              onChange={(e) => onUpdateSettings({ modelPath: e.target.value })}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '6px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                color: 'var(--text-main)', fontSize: '11.5px', outline: 'none'
              }}
            >
              <option value="">(활성 모델 없음)</option>
              {localModels.map(m => (
                <option key={m.path} value={m.path}>{m.name} ({formatBytes(m.size || 0)})</option>
              ))}
            </select>
          </div>

          {/* 감지된 로컬 모델 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>감지된 로컬 모델 파일</span>
            {localModels.length === 0 ? (
              <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-muted)', textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                다운로드된 일반 모델이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
                {localModels.map(m => (
                  <div key={m.path} style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }} title={m.filename}>{m.filename}</span>
                    <span style={{ fontSize: '9.5px', color: 'var(--primary)', flexShrink: 0 }}>{formatBytes(m.size || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 추천 및 다운로드 허브 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>추천 대화 모델 빠른 설치</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                {
                  name: 'Gemma 2 2B (구글)',
                  size: '1.6 GB',
                  desc: '빠른 응답 속도와 우수한 한국어 능력',
                  url: 'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
                  filename: 'gemma-2-2b-it-q4_k_m.gguf'
                },
                {
                  name: 'EXAONE 3.0 2.4B (LG)',
                  size: '1.7 GB',
                  desc: 'LG AI 연구원의 고성능 국산 모델',
                  url: 'https://huggingface.co/mradermacher/EXAONE-3.0-2.4B-Instruct-GGUF/resolve/main/EXAONE-3.0-2.4B-Instruct.Q4_K_M.gguf',
                  filename: 'exaone-3.0-2.4b-instruct-q4_k_m.gguf'
                },
                {
                  name: 'Qwen 2.5 3B (스탠다드)',
                  size: '2.2 GB',
                  desc: '논리력과 밸런스가 뛰어난 스탠다드 모델',
                  url: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
                  filename: 'qwen2.5-3b-instruct-q4_k_m.gguf'
                }
              ].map(model => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isInstalled`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isInstalled = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const isInstalled = localModels.some(m => m.filename.toLowerCase() === model.filename.toLowerCase())
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `queuedItem`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const queuedItem = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const queuedItem = downloadQueue.find((q: DownloadQueueItem) => q.filename.toLowerCase() === model.filename.toLowerCase() && (q.status === 'pending' || q.status === 'downloading'))
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isDownloading`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isDownloading = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const isDownloading = !!queuedItem

                return (
                  <div key={model.filename} style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{model.name} <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>({model.size})</span></span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.desc}</span>
                    </div>
                    <button
                      disabled={isInstalled || isDownloading}
                      onClick={() => void startModelDownload(model.url, model.filename, 'llm')}
                      style={{
                        padding: '4px 8px', borderRadius: '4px',
                        background: isInstalled ? 'rgba(52, 211, 153, 0.15)' : isDownloading ? 'rgba(139, 92, 246, 0.3)' : 'var(--primary)',
                        color: isInstalled ? '#fff' : '#fff',
                        border: 'none', fontSize: '9.5px', fontWeight: 'bold',
                        cursor: isInstalled || isDownloading ? 'default' : 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isInstalled ? '설치됨' : isDownloading ? '진행 중' : '설치'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* 2열: 코딩 특화 모델 (Code) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <div style={{ borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px' }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: 700, margin: 0, color: '#34d399' }}>💻 코딩 특화 Coder 모델</h4>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>C:\ameva\models\code</span>
          </div>

          {/* 활성 모델 선택기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>코딩 특화 모델 활성화</label>
            <select
              value={settings.codeModelPath || ''}
              onChange={(e) => onUpdateSettings({ codeModelPath: e.target.value })}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '6px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                color: 'var(--text-main)', fontSize: '11.5px', outline: 'none'
              }}
            >
              <option value="">(코딩 시 일반 모델로 폴백)</option>
              {localCodeModels.map(m => (
                <option key={m.path} value={m.path}>{m.name} ({formatBytes(m.size || 0)})</option>
              ))}
            </select>
          </div>

          {/* 감지된 로컬 코딩 모델 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>감지된 로컬 코딩 모델 파일</span>
            {localCodeModels.length === 0 ? (
              <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-muted)', textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                다운로드된 코딩 모델이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
                {localCodeModels.map(m => (
                  <div key={m.path} style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }} title={m.filename}>{m.filename}</span>
                    <span style={{ fontSize: '9.5px', color: '#34d399', flexShrink: 0 }}>{formatBytes(m.size || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 추천 및 다운로드 허브 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>추천 코딩 모델 빠른 설치</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                {
                  name: 'Qwen 2.5 Coder 1.5B (경량)',
                  size: '1.1 GB',
                  desc: '경량 코딩 최적화, 노트북에 적극 권장',
                  url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
                  filename: 'qwen2.5-coder-1.5b-instruct-q4_k_m.gguf'
                },
                {
                  name: 'Qwen 2.5 Coder 3B (스탠다드)',
                  size: '2.2 GB',
                  desc: '속도와 코딩 코어 성능의 완벽한 밸런스',
                  url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf',
                  filename: 'qwen2.5-coder-3b-instruct-q4_k_m.gguf'
                },
                {
                  name: 'Qwen 2.5 Coder 7B (고성능)',
                  size: '4.7 GB',
                  desc: '복잡한 설계 및 알고리즘 구현 최적화 (Public)',
                  url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/qwen2.5-coder-7b-instruct-q4_k_m.gguf',
                  filename: 'qwen2.5-coder-7b-instruct-q4_k_m.gguf'
                }
              ].map(model => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isInstalled`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isInstalled = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const isInstalled = localCodeModels.some(m => m.filename.toLowerCase() === model.filename.toLowerCase())
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `queuedItem`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const queuedItem = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const queuedItem = downloadQueue.find((q: DownloadQueueItem) => q.filename.toLowerCase() === model.filename.toLowerCase() && (q.status === 'pending' || q.status === 'downloading'))
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isDownloading`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isDownloading = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const isDownloading = !!queuedItem

                return (
                  <div key={model.filename} style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{model.name} <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>({model.size})</span></span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.desc}</span>
                    </div>
                    <button
                      disabled={isInstalled || isDownloading}
                      onClick={() => void startModelDownload(model.url, model.filename, 'code')}
                      style={{
                        padding: '4px 8px', borderRadius: '4px',
                        background: isInstalled ? 'rgba(52, 211, 153, 0.15)' : isDownloading ? 'rgba(139, 92, 246, 0.3)' : '#34d399',
                        color: isInstalled ? '#34d399' : isDownloading ? '#fff' : '#000',
                        border: 'none', fontSize: '9.5px', fontWeight: 'bold',
                        cursor: isInstalled || isDownloading ? 'default' : 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isInstalled ? '설치됨' : isDownloading ? '진행 중' : '설치'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

