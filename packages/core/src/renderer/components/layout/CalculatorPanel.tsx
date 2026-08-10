/**
 * ============================================================================
 * @file CalculatorPanel.tsx
 * @description CalculatorPanel.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './CalculatorPanel';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Calculator, X, Delete } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useUIStore]
import { useUIStore } from '../../stores/useUIStore'

/**
 * CalculatorPanel 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function CalculatorPanel() {
  const { setShowAIPanel } = useUIStore()
  const [display, setDisplay] = useState('0')
  const [equation, setEquation] = useState('')

  const handleNum = (num: string) => {
    if (display === '0' || display === 'Error') setDisplay(num)
    else setDisplay(display + num)
  }

  const handleOp = (op: string) => {
    if (display === 'Error') return
    setEquation(display + ' ' + op)
    setDisplay('0')
  }

  const handleCalc = () => {
    if (!equation || display === 'Error') return
    try {
      const full = equation + ' ' + display
      // eval 대용 안전한 수식 계산
      const result = new Function(`return ${full.replace('×', '*').replace('÷', '/')}`)()
      setDisplay(String(result))
      setEquation('')
    } catch {
      setDisplay('Error')
      setEquation('')
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setEquation('')
  }

  const handleDel = () => {
    if (display.length > 1) setDisplay(display.slice(0, -1))
    else setDisplay('0')
  }

  const btnStyle = {
    background: 'var(--bg-glass-active)',
    border: '1px solid var(--border-muted)',
    borderRadius: '12px',
    color: 'var(--text-main)',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-deep)', borderLeft: '1px solid var(--border-muted)',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid var(--border-muted)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#ec4899' }}><Calculator size={24} /></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>계산기</span>
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          onClick={() => setShowAIPanel(false)}
        ><X size={14} /></button>
      </div>

      {/* 계산기 본체 */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 디스플레이 */}
        <div style={{
          background: '#0f0f13', borderRadius: '16px', padding: '20px',
          border: '1px inset rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', justifyContent: 'center', gap: '8px'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', minHeight: '20px' }}>{equation}</div>
          <div style={{ color: '#fff', fontSize: '36px', fontWeight: 700, letterSpacing: '2px', wordBreak: 'break-all' }}>
            {display}
          </div>
        </div>

        {/* 키패드 */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', gridTemplateRows: 'repeat(5, 1fr)' }}>
          <button style={{ ...btnStyle, color: '#ec4899' }} onClick={handleClear}>C</button>
          <button style={{ ...btnStyle, color: '#ec4899' }} onClick={handleDel}><Delete size={20} /></button>
          <button style={{ ...btnStyle, color: '#a855f7' }} onClick={() => handleOp('%')}>%</button>
          <button style={{ ...btnStyle, color: '#a855f7', fontSize: '24px' }} onClick={() => handleOp('/')}>÷</button>

          <button style={btnStyle} onClick={() => handleNum('7')}>7</button>
          <button style={btnStyle} onClick={() => handleNum('8')}>8</button>
          <button style={btnStyle} onClick={() => handleNum('9')}>9</button>
          <button style={{ ...btnStyle, color: '#a855f7', fontSize: '24px' }} onClick={() => handleOp('*')}>×</button>

          <button style={btnStyle} onClick={() => handleNum('4')}>4</button>
          <button style={btnStyle} onClick={() => handleNum('5')}>5</button>
          <button style={btnStyle} onClick={() => handleNum('6')}>6</button>
          <button style={{ ...btnStyle, color: '#a855f7', fontSize: '24px' }} onClick={() => handleOp('-')}>-</button>

          <button style={btnStyle} onClick={() => handleNum('1')}>1</button>
          <button style={btnStyle} onClick={() => handleNum('2')}>2</button>
          <button style={btnStyle} onClick={() => handleNum('3')}>3</button>
          <button style={{ ...btnStyle, color: '#a855f7', fontSize: '24px' }} onClick={() => handleOp('+')}>+</button>

          <button style={{ ...btnStyle, gridColumn: 'span 2' }} onClick={() => handleNum('0')}>0</button>
          <button style={btnStyle} onClick={() => handleNum('.')}>.</button>
          <button style={{ ...btnStyle, background: '#ec4899', color: '#fff', border: 'none' }} onClick={handleCalc}>=</button>
        </div>
      </div>
    </div>
  )
}
