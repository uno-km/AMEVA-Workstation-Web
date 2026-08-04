import React from 'react'

export function InlineExcelRenderer({ code }: { code: string }) {
  let sheets: any = []
  try {
    sheets = JSON.parse(code)
  } catch (err) {
    console.error('[InlineExcelRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>엑셀 시트 데이터를 해석할 수 없습니다.</div>
  }

  if (!Array.isArray(sheets) || sheets.length === 0) {
    return <div style={{ padding: '16px', background: 'var(--bg-muted)', borderRadius: '8px', color: 'var(--text-muted)' }}>빈 엑셀 시트입니다.</div>
  }

  return (
    <div style={{ marginBottom: '2rem', overflowX: 'auto', width: '100%' }}>
      {sheets.map((sheet: any, idx: number) => {
        const celldata = sheet.celldata || []
        if (celldata.length === 0) {
          return (
             <div key={idx} style={{ marginBottom: '1rem' }}>
               <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>[Excel] {sheet.name || 'Sheet'}</h4>
               <p style={{ color: 'var(--text-muted)' }}><em>(Empty Sheet)</em></p>
             </div>
          )
        }
        
        let maxRow = 0
        let maxCol = 0
        for (const cell of celldata) {
          if (cell.r > maxRow) maxRow = cell.r
          if (cell.c > maxCol) maxCol = cell.c
        }
        
        const grid: any[][] = Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(null))
        for (const cell of celldata) {
          grid[cell.r][cell.c] = cell.v
        }

        return (
          <div key={idx} style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>[Excel] {sheet.name || 'Sheet'}</h4>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: 'var(--bg-color)' }}>
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={r}>
                      {row.map((cellValue, c) => {
                        let val = ''
                        if (cellValue) {
                          if (typeof cellValue === 'string' || typeof cellValue === 'number') val = String(cellValue)
                          else if (cellValue.m !== undefined) val = String(cellValue.m)
                          else if (cellValue.v !== undefined) val = String(cellValue.v)
                        }
                        return (
                          <td key={c} style={{ border: '1px solid var(--border-color)', padding: '4px 8px', minWidth: '50px', color: 'var(--text-color)' }}>
                            {val}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
