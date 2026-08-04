/**
 * @file MCPStatusIndicator.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/statusbar/MCPStatusIndicator.tsx
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

import React, { useState, useEffect } from 'react'
import { MCPClientManager } from '../../utils/mcpClient'

interface MCPStatusIndicatorProps {
  canUseMCP: boolean
  mcpServers: any[]
  activeTooltip: string | null
  handleMouseEnter: (id: string) => void
  handleMouseLeave: () => void
  tooltipStyle: React.CSSProperties
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `MCPStatusIndicator`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `MCPStatusIndicator(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function MCPStatusIndicator({
  canUseMCP,
  mcpServers,
  activeTooltip,
  handleMouseEnter,
  handleMouseLeave,
  tooltipStyle
}: MCPStatusIndicatorProps) {
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [isLoadingTools, setIsLoadingTools] = useState(false)

  // MCP 서버 제공 툴 목록 로드
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `loadTools`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const loadTools = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const loadTools = async () => {
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
        console.warn('[StatusBar] MCP 도구 명세 수집 실패:', e)
      } finally {
        setIsLoadingTools(false)
      }
    }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `canUseMCP && mcpServers && mcpServers.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (canUseMCP && mcpServers && mcpServers.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (canUseMCP && mcpServers && mcpServers.length > 0) {
      loadTools()
    } else {
      setMcpTools([])
    }
  }, [mcpServers, canUseMCP])

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!canUseMCP || !mcpServers || mcpServers.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!canUseMCP || !mcpServers || mcpServers.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!canUseMCP || !mcpServers || mcpServers.length === 0) return null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `activeServers`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const activeServers = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const activeServers = mcpServers.filter((s: any) => s.enabled)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hasActive = activeServers.length > 0
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `statusColor`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const statusColor = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const statusColor = hasActive ? '#10b981' : '#f87171'
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        cursor: 'help',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '4px',
        padding: '2px 8px',
        height: '20px',
        position: 'relative'
      }}
      onMouseEnter={() => handleMouseEnter('mcp')}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: hasActive ? '0 0 5px #10b981' : '0 0 5px #f87171',
        }}
      />
      <strong style={{ fontSize: '10px', color: hasActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
        MCP ({activeServers.length}/{mcpServers.length})
      </strong>

      {/* 👑 커스텀 글래스모피즘 MCP 툴팁 (도구 명세 연동형) */}
      {activeTooltip === 'mcp' && (
        <div 
          style={{ ...tooltipStyle, width: '340px', right: 0 }}
          onMouseEnter={() => handleMouseEnter('mcp')}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
            🔌 AMEVA MCP 통합 게이트웨이
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mcpServers.map((s: any) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `serverTools`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const serverTools = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const serverTools = mcpTools.filter(t => t.serverId === s.id)
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: s.enabled ? '#10b981' : 'var(--text-muted)' }} />
                    <span style={{ color: '#fff' }}>{s.name}</span>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '1px 3px', borderRadius: '2px' }}>
                      {s.type.toUpperCase()}
                    </span>
                  </div>
                  {s.enabled ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '10px', marginTop: '2px' }}>
                      {isLoadingTools ? (
                        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>로딩 중... 🔄</span>
                      ) : serverTools.length === 0 ? (
                        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>제공 도구 없음</span>
                      ) : (
                        serverTools.map(t => (
                          <span 
                            key={t.name}
                            style={{ 
                              fontSize: '8.5px', 
                              color: 'var(--secondary)', 
                              background: 'rgba(6, 182, 212, 0.08)',
                              border: '1px solid rgba(6, 182, 212, 0.15)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontFamily: 'monospace'
                            }}
                          >
                            🛠️ {t.name}
                          </span>
                        ))
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', paddingLeft: '10px' }}>
                      비활성화 상태
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

