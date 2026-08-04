/**
 * @file ConsoleOutput.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/jupyter/ConsoleOutput.tsx
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
import { Terminal } from 'lucide-react'

interface ConsoleOutputProps {
  success: boolean | null
  resolvedLanguage: string
  tableData: any
  outputLines: { type: 'stdout' | 'stderr' | 'info'; text: string }[]
  accentColor: string
  onAskAgent?: () => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `ConsoleOutput`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `ConsoleOutput(...)` 호출 시 런타임 비동기 연쇄 반응 유도.
   */
export function ConsoleOutput({
  success,
  resolvedLanguage,
  tableData,
  outputLines,
  accentColor,
  onAskAgent
}: ConsoleOutputProps) {
  return (
    <div style={{
      background: 'var(--term-bg)',
      borderTop: `1px solid ${accentColor}22`,
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: '12px',
      textAlign: 'left',
      boxSizing: 'border-box',
      borderRadius: '0 0 8px 8px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px', background: 'var(--bg-glass-active)', borderBottom: '1px solid var(--term-border)',
        userSelect: 'none'
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Terminal size={11} />
          _ OUTPUT
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {success === false && onAskAgent && (
            <button
              onClick={onAskAgent}
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                color: '#c4b5fd',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '9.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✨ 에이전트에게 물어보기
            </button>
          )}
          {success !== null && (
            <span style={{
              color: success ? '#10b981' : '#f43f5e',
              background: success ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${success ? '#10b98133' : '#f43f5e33'}`,
              padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold'
            }}>
              {success ? 'EXIT 0' : 'EXIT 1'}
            </span>
          )}
        </div>
      </div>
      <div style={{
        padding: '12px 16px', maxHeight: '200px', overflowY: 'auto',
        color: 'var(--term-text)',
        lineHeight: '1.5'
      }}>
        {resolvedLanguage === 'sql' && success && tableData ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--term-text)', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
                {tableData.columns.map((col: string, i: number) => (
                  <th key={i} style={{ padding: '6px 10px', fontWeight: 'bold', color: '#a78bfa' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.values.map((row: any[], ri: number) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {row.map((val: any, ci: number) => (
                    <td key={ci} style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{val !== null ? String(val) : <span style={{color:'#6b7280', fontStyle:'italic'}}>NULL</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {outputLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.type === 'stderr' ? 'var(--danger)' : line.type === 'info' ? `${accentColor}cc` : 'var(--term-text)',
                  marginBottom: '2px',
                }}
              >
                {line.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

