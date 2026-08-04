/**
 * @file SettingsTabMCP.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/settings/SettingsTabMCP.tsx
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

import { useState, useEffect, useCallback } from 'react'
import { ToggleLeft, ToggleRight, Plus, Trash2 } from 'lucide-react'
import { MCPClientManager } from '../../utils/mcpClient'
import * as ipc from '../../services/ipc/electronApiAdapter'

interface SettingsTabMCPProps {
  isOpen: boolean
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SettingsTabMCP`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SettingsTabMCP(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SettingsTabMCP({ isOpen }: SettingsTabMCPProps) {
  const [mcpServers, setMcpServers] = useState<any[]>([])
  const [newMcpName, setNewMcpName] = useState('')
  const [newMcpType, setNewMcpType] = useState<'stdio' | 'http'>('http')
  const [newMcpUrl, setNewMcpUrl] = useState('')
  const [newMcpCmd, setNewMcpCmd] = useState('')
  const [newMcpArgs, setNewMcpArgs] = useState('')
  
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [isLoadingTools, setIsLoadingTools] = useState(false)
  const [expandedTool, setExpandedTool] = useState<string | null>(null)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `refreshMcpTools`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const refreshMcpTools = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const refreshMcpTools = useCallback(async () => {
    setIsLoadingTools(true)
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tools`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tools = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const tools = await MCPClientManager.fetchAllTools()
      setMcpTools(tools)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingTools(false)
    }
  }, [])

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `configs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const configs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const configs = MCPClientManager.loadConfigs()
      setMcpServers(configs)
      refreshMcpTools()
    }
  }, [isOpen, refreshMcpTools])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleAddMcp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleAddMcp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleAddMcp = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!newMcpName.trim()) return alert('서버 이름을 입력해 주세요.'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!newMcpName.trim()) return alert('서버 이름을 입력해 주세요.')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!newMcpName.trim()) return alert('서버 이름을 입력해 주세요.')
    
    const newServer: any = {
      id: `mcp-${Date.now()}`,
      name: newMcpName.trim(),
      type: newMcpType,
      enabled: true
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `newMcpType === 'http'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (newMcpType === 'http')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (newMcpType === 'http') {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!newMcpUrl.trim()) return alert('URL을 입력해 주세요.'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!newMcpUrl.trim()) return alert('URL을 입력해 주세요.')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!newMcpUrl.trim()) return alert('URL을 입력해 주세요.')
      newServer.url = newMcpUrl.trim()
    } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!newMcpCmd.trim()) return alert('실행 명령어를 입력해 주세요.'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!newMcpCmd.trim()) return alert('실행 명령어를 입력해 주세요.')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!newMcpCmd.trim()) return alert('실행 명령어를 입력해 주세요.')
      newServer.command = newMcpCmd.trim()
      newServer.args = newMcpArgs.trim() ? newMcpArgs.split(/\s+/) : []
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `updated`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const updated = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const updated = [...mcpServers, newServer]
    MCPClientManager.setConfigs(updated)
    setMcpServers(updated)
    
    setNewMcpName('')
    setNewMcpUrl('')
    setNewMcpCmd('')
    setNewMcpArgs('')

    setTimeout(() => refreshMcpTools(), 200)
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleToggleMcp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleToggleMcp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleToggleMcp = (id: string) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `updated`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const updated = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const updated = mcpServers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    MCPClientManager.setConfigs(updated)
    setMcpServers(updated)
    setTimeout(() => refreshMcpTools(), 200)
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleDeleteMcp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleDeleteMcp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleDeleteMcp = async (id: string) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `updated`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const updated = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const updated = mcpServers.filter(s => s.id !== id)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ipc.isElectronEnv()) {
      await ipc.mcpKill(id)
    }
    MCPClientManager.setConfigs(updated)
    setMcpServers(updated)
    setTimeout(() => refreshMcpTools(), 200)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>MCP Server Manager</h3>
        <button
          onClick={refreshMcpTools}
          style={{
            fontSize: '10px', color: 'var(--primary)', background: 'none',
            border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0
          }}
        >
          새로고침 🔄
        </button>
      </div>
      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        외부 Stdio 자식 프로세스 또는 HTTP API 게이트웨이 기반의 MCP 도구(Tools) 서버를 하드코딩 없이 통합 제어합니다.
      </div>

      {/* 1. MCP 추가 폼 */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-muted)',
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <strong style={{ fontSize: '10.5px', color: 'var(--primary)' }}>➕ 새 MCP 서버 추가</strong>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="서버 이름 (예: 파일 매니저)"
            value={newMcpName}
            onChange={e => setNewMcpName(e.target.value)}
            style={{
              flex: 1, padding: '5px 8px', background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-muted)', borderRadius: '4px',
              color: 'var(--text-main)', fontSize: '10.5px', outline: 'none'
            }}
          />
          <select
            value={newMcpType}
            onChange={e => setNewMcpType(e.target.value as any)}
            style={{
              padding: '4px 8px', background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-muted)', borderRadius: '4px',
              color: 'var(--text-main)', fontSize: '10.5px', outline: 'none'
            }}
          >
            <option value="http">HTTP Gateway</option>
            <option value="stdio">Stdio Process</option>
          </select>
        </div>

        {newMcpType === 'http' ? (
          <input
            type="text"
            placeholder="HTTP 게이트웨이 주소 URL (예: http://127.0.0.1:11553/mcp)"
            value={newMcpUrl}
            onChange={e => setNewMcpUrl(e.target.value)}
            style={{
              padding: '5px 8px', background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-muted)', borderRadius: '4px',
              color: 'var(--text-main)', fontSize: '10.5px', outline: 'none'
            }}
          />
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="실행 명령어 (예: npx, python)"
              value={newMcpCmd}
              onChange={e => setNewMcpCmd(e.target.value)}
              style={{
                flex: 1, padding: '5px 8px', background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-muted)', borderRadius: '4px',
                color: 'var(--text-main)', fontSize: '10.5px', outline: 'none'
              }}
            />
            <input
              type="text"
              placeholder="파라미터 (예: -y @modelcontextprotocol/server-postgres)"
              value={newMcpArgs}
              onChange={e => setNewMcpArgs(e.target.value)}
              style={{
                flex: 1, padding: '5px 8px', background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-muted)', borderRadius: '4px',
                color: 'var(--text-main)', fontSize: '10.5px', outline: 'none'
              }}
            />
          </div>
        )}
        <button
          onClick={handleAddMcp}
          style={{
            padding: '6px', background: 'var(--primary)', border: 'none',
            borderRadius: '4px', color: '#fff', fontSize: '10.5px',
            fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '4px'
          }}
        >
          <Plus size={12} /> 서버 추가 등록
        </button>
      </div>

      {/* 2. 등록된 서버 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto', marginBottom: '10px' }}>
        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>⚙️ 활성 서버 인스턴스</span>
        {mcpServers.length === 0 ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
            등록된 MCP 서버가 없습니다.
          </div>
        ) : (
          mcpServers.map(server => (
            <div
              key={server.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                borderRadius: '6px', padding: '6px 10px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: server.enabled ? '#10b981' : 'var(--text-muted)'
                  }} />
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{server.name}</span>
                  <span style={{
                    fontSize: '8.5px', color: 'var(--primary)',
                    background: 'rgba(168,85,247,0.1)', padding: '1px 4px', borderRadius: '3px'
                  }}>
                    {server.type.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                  {server.type === 'http' ? server.url : `${server.command} ${(server.args || []).join(' ')}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleToggleMcp(server.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                >
                  {server.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} style={{ color: 'var(--text-dark)' }} />}
                </button>
                <button
                  onClick={() => handleDeleteMcp(server.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. 로드된 실제 도구 아코디언 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>🛠️ 실시간 제공 도구 목록 ({mcpTools.length}개)</span>
        {isLoadingTools ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
            MCP 서버들로부터 도구 명세를 가져오는 중... 🔄
          </div>
        ) : mcpTools.length === 0 ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
            활성화된 서버가 없거나 제공하는 도구가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
            {mcpTools.map(tool => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isExpanded`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isExpanded = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const isExpanded = expandedTool === tool.name
              return (
                <div
                  key={tool.name}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                    style={{
                      padding: '6px 10px', cursor: 'pointer', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center',
                      background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                      fontSize: '10.5px', fontWeight: 600
                    }}
                  >
                    <span style={{ color: 'var(--secondary)' }}>{tool.name}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {isExpanded ? '접기 🔼' : '펼치기 🔽'}
                    </span>
                  </div>
                  {isExpanded && (
                    <div style={{
                      padding: '8px 10px', borderTop: '1px solid var(--border-muted)',
                      background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '4px'
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-main)' }}>
                        {tool.description || '설명 없음'}
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <strong>입력 명세:</strong> {JSON.stringify(tool.inputSchema?.properties || {})}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

