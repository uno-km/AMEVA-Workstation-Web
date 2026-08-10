/**
 * ============================================================================
 * @file embeddedExtractor.ts
 * @description 문서 내에 내장된(embedded) 파일(PDF, Word, Excel, PPT 등)을 추출하여 에디터 블록 형태로 변환하는 유틸리티입니다.
 * @usage 주로 문서 에디터 내부에서 사용자가 인라인 문서를 삽입하거나 렌더링할 때 호출되어, 해당 문서의 텍스트나 이미지를 추출합니다.
 * @example
 * // 문서 블록 배열을 넘기면 내장 문서가 포함된 블록을 분석해 추출합니다.
 * const extractedBlocks = await extractEmbeddedDocuments(blocks);
 * 
 * @created 2026-08-10 20:25:00
 * @updated 2026-08-10 20:25:00
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 적용
 * ============================================================================
 */

// [가상 파일 시스템(VFS) 데이터베이스에서 첨부 파일을 가져오는 함수 임포트]
import { getAttachment } from './vfsDatabase'
// [PDF 문서 파싱 및 렌더링을 위한 pdfjs-dist 외부 라이브러리 임포트]
import * as pdfjsLib from 'pdfjs-dist'

/**
 * 주어진 에디터 블록 배열을 순회하며 'inlineDocument' 타입의 블록이 있을 경우,
 * PDF, Word, Excel 등의 파일 내용을 추출하여 새로운 블록 데이터 형태로 변환해 반환합니다.
 * 
 * @param {any[]} blocks - 검사하고 추출할 원본 에디터 블록들의 배열
 * @returns {Promise<any[]>} 파일 추출 처리가 완료된 새로운 블록 배열
 */
export async function extractEmbeddedDocuments(blocks: any[]): Promise<any[]> {
  /** 
   * 최종적으로 반환될 새로운 블록들을 담는 결과 배열 변수
   * @type {any[]} 
   */
  const result: any[] = []

  for (const block of blocks) {
    if (block.type === 'inlineDocument') {
      /** 
       * 내장 문서의 원본 소스 주소(URL) 문자열
       * @type {string | undefined} 
       */
      const sourceUrl = block.props?.sourceUrl
      /** 
       * 내장 문서의 파일 확장자 혹은 종류 (예: 'pdf', 'docx', 'xlsx', 'pptx')
       * @type {string | undefined} 
       */
      const docType = block.props?.docType

      if (sourceUrl) {
        try {
          /** 
           * 추출한 문서 파일 데이터를 담기 위한 메모리 버퍼 변수
           * @type {ArrayBuffer} 
           */
          let arrayBuffer: ArrayBuffer
          
          if (sourceUrl.startsWith('ameva-vfs://')) {
            /** 
             * VFS URL 주소에서 프로토콜 부분을 제외한 실제 파일 식별자(ID)
             * @type {string} 
             */
            const fileId = sourceUrl.replace('ameva-vfs://', '')
            /** 
             * VFS 데이터베이스에서 비동기로 가져온 파일 Blob 데이터
             * @type {Blob | undefined} 
             */
            const blob = await getAttachment(fileId)
            if (!blob) throw new Error('VFS_EXPIRED')
            arrayBuffer = await blob.arrayBuffer()
          } else if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:') || sourceUrl.startsWith('http')) {
            /** 
             * 일반 URL이나 Blob 주소일 경우 Fetch API를 통해 가져온 응답 객체
             * @type {Response} 
             */
            const res = await fetch(sourceUrl)
            arrayBuffer = await res.arrayBuffer()
          } else if (block.props?.fileBase64) {
            /** 
             * Base64 인코딩된 문자열에서 데이터 URL 접두어(쉼표 앞부분)를 제거한 순수 데이터 문자열
             * @type {string} 
             */
            const cleanBase64 = block.props.fileBase64.includes(',') ? block.props.fileBase64.split(',')[1] : block.props.fileBase64
            /** 
             * Base64 문자열의 공백을 제거한 후 디코딩하여 얻은 원시 바이너리 텍스트 문자열
             * @type {string} 
             */
            const binaryString = atob(cleanBase64.replace(/\s/g, ''))
            /** 
             * 디코딩된 바이너리 문자열의 총 길이
             * @type {number} 
             */
            const len = binaryString.length
            /** 
             * 바이너리 데이터를 담기 위해 생성된 8비트 부호 없는 정수형 배열
             * @type {Uint8Array} 
             */
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            arrayBuffer = bytes.buffer
          } else {
            throw new Error('No valid source')
          }

          if (docType === 'pdf') {
            // PDF: 모든 페이지를 이미지 캔버스 형태로 변환하여 추출합니다.
            /** 
             * PDFJS를 이용해 로드된 PDF 문서 객체 모델
             * @type {import('pdfjs-dist').PDFDocumentProxy} 
             */
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            /** 
             * 로드된 PDF 문서의 총 페이지 수
             * @type {number} 
             */
            const numPages = pdf.numPages
            
            for (let i = 1; i <= numPages; i++) {
              /** 
               * 현재 반복 중인 개별 PDF 페이지 객체
               * @type {import('pdfjs-dist').PDFPageProxy} 
               */
              const page = await pdf.getPage(i)
              /** 
               * 해상도를 2배(2.0 scale)로 설정한 페이지 화면 비율/크기 객체
               * @type {import('pdfjs-dist').PageViewport} 
               */
              const viewport = page.getViewport({ scale: 2.0 })
              /** 
               * 렌더링을 위해 생성된 HTML Canvas 엘리먼트
               * @type {HTMLCanvasElement} 
               */
              const canvas = document.createElement('canvas')
              /** 
               * Canvas 엘리먼트의 2D 렌더링 컨텍스트 객체
               * @type {CanvasRenderingContext2D | null} 
               */
              const ctx = canvas.getContext('2d')
              
              canvas.width = viewport.width
              canvas.height = viewport.height
              
              if (ctx) {
                // PDF 페이지를 캔버스에 비동기로 렌더링합니다.
                await page.render({ canvasContext: ctx, viewport }).promise
                /** 
                 * 렌더링된 캔버스를 Base64 형태의 PNG 이미지 데이터 URL로 변환한 문자열
                 * @type {string} 
                 */
                const dataUrl = canvas.toDataURL('image/png')
                
                result.push({
                  id: `${block.id}-page-${i}`,
                  type: 'image',
                  props: {
                    url: dataUrl,
                    previewWidth: Math.round(viewport.width / 2),
                    textAlignment: 'left'
                  },
                  children: []
                })
              }
            }
            continue // 원본 inlineDocument 블록을 추가하지 않고 다음 블록으로 넘어갑니다.
          } else if (docType === 'docx') {
            // Word: Mammoth 라이브러리를 사용해 순수 텍스트만을 추출합니다.
            /** 
             * 동적으로 임포트된 Mammoth 라이브러리 모듈
             * @type {any} 
             */
            const mammoth = await import('mammoth')
            /** 
             * Mammoth를 통해 Word 문서 파일 버퍼에서 추출한 순수 텍스트 문자열
             * @type {string} 
             */
            const { value } = await mammoth.extractRawText({ arrayBuffer })
            /** 
             * 줄바꿈을 기준으로 분리하고 빈 문단을 제외한 단락들의 배열
             * @type {string[]} 
             */
            const paragraphs = value.split('\n').filter(p => p.trim())
            
            result.push({
              id: `${block.id}-title`,
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: `[내장 문서: ${block.props?.fileName || 'Word'}]`, styles: {} }],
              children: []
            })
            
            for (let i = 0; i < paragraphs.length; i++) {
              result.push({
                id: `${block.id}-p-${i}`,
                type: 'paragraph',
                props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                content: [{ type: 'text', text: paragraphs[i], styles: {} }],
                children: []
              })
            }
            continue
          } else if (docType === 'xlsx') {
            // Excel: exceljs 라이브러리를 사용하여 시트 및 테이블 데이터를 추출합니다.
            /** 
             * 동적으로 임포트된 exceljs 라이브러리 모듈
             * @type {any} 
             */
            const ExcelJS = await import('exceljs')
            /** 
             * 데이터를 분석하기 위해 생성된 exceljs 워크북(엑셀 파일) 인스턴스
             * @type {any} 
             */
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(arrayBuffer)
            
            result.push({
              id: `${block.id}-title`,
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: `[내장 문서: ${block.props?.fileName || 'Excel'}]`, styles: {} }],
              children: []
            })

            workbook.worksheets.forEach((sheet: any, index: number) => {
              /** 
               * 현재 순회 중인 엑셀 시트의 전체 행 데이터를 담는 배열
               * @type {any[]} 
               */
              const rows: any[] = []
              sheet.eachRow((row: any, rowNumber: number) => {
                /** 
                 * 단일 행에 포함된 열(셀) 데이터 객체들을 임시로 저장하는 배열
                 * @type {any[]} 
                 */
                const rowData: any[] = []
                row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
                  rowData.push({
                    type: 'tableContent',
                    content: cell.value ? String(cell.value) : ''
                  })
                })
                rows.push(rowData)
              })
              
              if (rows.length > 0) {
                result.push({
                  id: `${block.id}-sheet-${index}`,
                  type: 'heading',
                  props: { level: 3 },
                  content: [{ type: 'text', text: sheet.name, styles: {} }],
                  children: []
                })
                
                result.push({
                  id: `${block.id}-table-${index}`,
                  type: 'table',
                  props: {},
                  tableRows: rows.map(r => ({ cells: r.map((c: any) => [{ type: 'text', text: c.content, styles: {} }]) })),
                  content: { type: 'tableContent', rows: rows.map(r => r.map((c: any) => ({ content: c.content }))) },
                  children: []
                })
              }
            })
            continue
          } else if (docType === 'pptx') {
            // PPT: pptx-preview 라이브러리는 백그라운드 렌더링이 어려우므로 안내 메시지로 대체합니다.
            result.push({
              id: `${block.id}-title`,
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: `[내장 문서: ${block.props?.fileName || 'PowerPoint'}]`, styles: {} }],
              children: []
            })
            result.push({
              id: `${block.id}-desc`,
              type: 'paragraph',
              props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
              content: [{ type: 'text', text: '(PowerPoint 문서는 텍스트/이미지 추출이 제한되어 있습니다.)', styles: { italic: true, textColor: '#94a3b8' } }],
              children: []
            })
            continue
          }

        } catch (e) {
          console.error('[embeddedExtractor] Failed to extract inline document:', e)
        }
      }
    }

    // 자식 블록들이 존재할 경우 재귀적으로 처리를 수행합니다.
    /** 
     * 원본 블록의 데이터 참조 오염을 막기 위해 깊은 복사(스프레드)한 복제 블록
     * @type {any} 
     */
    const clonedBlock = { ...block }
    if (clonedBlock.children && clonedBlock.children.length > 0) {
      clonedBlock.children = await extractEmbeddedDocuments(clonedBlock.children)
    }
    result.push(clonedBlock)
  }

  return result
}

