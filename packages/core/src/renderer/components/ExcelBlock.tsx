/**
 * ============================================================================
 * @file ExcelBlock.tsx
 * @description ExcelBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ExcelBlock';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file ExcelBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/components/editor/blocks/ExcelBlock.tsx
 * @role BlockNote Custom Block for Excel Viewer/Editor
 */

// [외부 패키지 및 라이브러리 임포트: react]
import { useRef, useState, useEffect, lazy, Suspense } from 'react'
// [외부 패키지 및 라이브러리 임포트: @blocknote/react]
import { createReactBlockSpec } from '@blocknote/react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Maximize2, X, Table } from 'lucide-react'

const LazyWorkbook = lazy(() =>
  import('@fortune-sheet/react').then((m) => {
    try {
      import('@fortune-sheet/react/dist/index.css' as any)
    } catch (_) {}
    const Comp = (m.Workbook || m.default?.Workbook || m.default) as any;
    if (!Comp) {
      console.error('[ExcelBlock] FortuneSheet Workbook component not found in module:', m);
    }
    return { default: Comp || (() => <div style={{ padding: 20, color: '#ef4444' }}>Excel Component Load Failed</div>) };
  })
) as any;

// 블록 사양 정의
const ExcelBlockSpec = createReactBlockSpec(
  {
    type: 'excel',
    propSchema: {
      data: {
        default: '[]' // 2D array of cells JSON string
      }
    },
    content: 'none'
  },
  {
    render: (props) => {
      const workbookRef = useRef<any>(null)
      const saveTimeoutRef = useRef<any>(null)
      const [isFullScreen, setIsFullScreen] = useState(false)
      const [isMounted, setIsMounted] = useState(false)

      useEffect(() => {
        setIsMounted(true)
        const timer1 = setTimeout(() => window.dispatchEvent(new Event('resize')), 150)
        const timer2 = setTimeout(() => window.dispatchEvent(new Event('resize')), 500)
        const timer3 = setTimeout(() => window.dispatchEvent(new Event('resize')), 1500)
        return () => {
          clearTimeout(timer1)
          clearTimeout(timer2)
          clearTimeout(timer3)
        }
      }, [])

      const [sheetData] = useState(() => {
        let initial = []
        try {
          const parsed = JSON.parse(props.block.props.data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            initial = parsed.map(sheet => ({
              ...sheet,
              row: sheet.row || 36,
              column: sheet.column || 18,
              defaultRowHeight: sheet.defaultRowHeight || 19,
              defaultColWidth: sheet.defaultColWidth || 73
            }))
          }
        } catch (e) {}

        if (initial.length === 0) {
          initial = [{ 
            name: 'Sheet1', 
            id: 'sheet_01',
            celldata: [], 
            status: 1,
            row: 36,
            column: 18,
            defaultRowHeight: 19,
            defaultColWidth: 73
          }]
        }
        return initial
      })

      const handleSave = (latestData?: any) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          try {
            let allData = latestData
            if (!allData || !Array.isArray(allData)) {
              if (!workbookRef.current || typeof workbookRef.current.getAllSheets !== 'function') return
              allData = workbookRef.current.getAllSheets()
            }
            if (!allData) return

            // Reconstruct celldata from data matrix and remove huge data array for serialization
            const processedData = allData.map((sheet: any) => {
              const copy = { ...sheet }
              if (copy.data && Array.isArray(copy.data)) {
                const newCelldata: any[] = []
                for (let r = 0; r < copy.data.length; r++) {
                  const row = copy.data[r]
                  if (Array.isArray(row)) {
                    for (let c = 0; c < row.length; c++) {
                      const cell = row[c]
                      if (cell && cell !== null && Object.keys(cell).length > 0) {
                        newCelldata.push({ r, c, v: cell })
                      }
                    }
                  }
                }
                copy.celldata = newCelldata
                delete copy.data // remove to save markdown space
              }
              // Also remove luckysheet_select_save which can cause focus issues
              delete copy.luckysheet_select_save
              delete copy.luckysheet_selection_range
              return copy
            })

            const newDataString = JSON.stringify(processedData)
            if (newDataString !== props.block.props.data) {
              props.editor.updateBlock(props.block.id, {
                type: 'excel',
                props: { data: newDataString }
              })
            }
          } catch (e) {
            console.error('Failed to save excel data', e)
          }
        }, 100)
      }

      useEffect(() => {
        const forceSave = () => handleSave()
        window.addEventListener('AMEVA_FORCE_SAVE_BLOCKS', forceSave as EventListener)
        return () => {
          window.removeEventListener('AMEVA_FORCE_SAVE_BLOCKS', forceSave as EventListener)
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }
        }
      }, [handleSave])

      const handleExportTable = async () => {
        if (!workbookRef.current) return
        try {
          const allData = workbookRef.current.getAllSheets()
          const sheet = allData[0]
          if (!sheet || !sheet.celldata) return
          
          let maxR = 0
          let maxC = 0
          sheet.celldata.forEach((cell: any) => {
            if (cell.r > maxR) maxR = cell.r
            if (cell.c > maxC) maxC = cell.c
          })
          
          if (maxR === 0 && maxC === 0 && (!sheet.celldata[0] || (!sheet.celldata[0].v?.m && !sheet.celldata[0].v?.v))) {
             return // Empty sheet
          }

          const matrix: string[][] = Array.from({ length: maxR + 1 }, () => Array(maxC + 1).fill(''))
          sheet.celldata.forEach((cell: any) => {
            const val = cell.v?.m || cell.v?.v || ''
            matrix[cell.r][cell.c] = String(val).replace(/\|/g, '\\|')
          })
          
          let mdTable = ''
          matrix.forEach((row, r) => {
            mdTable += '| ' + row.join(' | ') + ' |\n'
            if (r === 0) {
              mdTable += '|' + row.map(() => '---').join('|') + '|\n'
            }
          })
          
          const blocks = await props.editor.tryParseMarkdownToBlocks(mdTable)
          props.editor.insertBlocks(blocks, props.block.id, 'after')
        } catch (e) {
          console.error('Failed to export table', e)
        }
      }

      return (
        <div 
          contentEditable={false}
          style={{ position: 'relative', margin: '8px 0', width: '100%' }}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          onBlur={(e) => {
            e.stopPropagation()
            handleSave()
          }}
          onMouseLeave={handleSave}
        >
          {isFullScreen ? (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '95%',
                  height: '95%',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '8px 16px', backgroundColor: 'var(--bg-glass)', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Excel Block (Fullscreen)</span>
                  <div>
                    <button onClick={() => { handleSave(); setIsFullScreen(false) }} style={{ padding: '4px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Save & Close</button>
                    <button onClick={() => setIsFullScreen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative', color: '#000', overflow: 'hidden' }}>
                  {isMounted && (
                    <Suspense fallback={<div style={{ padding: '20px' }}>Loading Excel...</div>}>
                      <LazyWorkbook ref={workbookRef} data={sheetData} lang="en" onChange={handleSave} />
                    </Suspense>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '400px', border: '1px solid var(--border-muted)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>Excel Spreadsheet</span>
                <div>
                  <button
                    onClick={handleExportTable}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-main)', marginRight: '8px' }}
                    title="Export as Markdown Table"
                  >
                    <Table size={14} />
                  </button>
                  <button
                    onClick={() => setIsFullScreen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-main)' }}
                    title="Fullscreen Editor"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative', color: '#000', overflow: 'hidden' }}>
                {isMounted && (
                  <Suspense fallback={<div style={{ padding: '20px' }}>Loading Excel...</div>}>
                    <LazyWorkbook ref={workbookRef} data={sheetData} lang="en" onChange={handleSave} />
                  </Suspense>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    parse: (el) => {
      let a = el.tagName.toLowerCase() === 'a' ? el : el.querySelector('a')
      if (a) {
        const href = a.getAttribute('href')
        if (href && href.startsWith('ameva-excel://data/')) {
          try {
            const dataStr = href.replace('ameva-excel://data/', '')
            return { data: decodeURIComponent(dataStr) }
          } catch (e) {
            console.error('Failed to parse Excel data from link', e)
          }
        }
      }
      return undefined
    },
    toExternalHTML: ({ block }) => {
      const dataStr = encodeURIComponent(block.props.data)
      return (
        <p>
          <a href={`ameva-excel://data/${dataStr}`}>[AMEVA Excel Spreadsheet Data]</a>
        </p>
      )
    }
  }
)

/**
 * ExcelBlock 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const ExcelBlock = ExcelBlockSpec()
