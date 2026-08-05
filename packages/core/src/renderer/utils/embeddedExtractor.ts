import { getAttachment } from './vfsDatabase'
import * as pdfjsLib from 'pdfjs-dist'

export async function extractEmbeddedDocuments(blocks: any[]): Promise<any[]> {
  const result: any[] = []

  for (const block of blocks) {
    if (block.type === 'inlineDocument') {
      const sourceUrl = block.props?.sourceUrl
      const docType = block.props?.docType

      if (sourceUrl) {
        try {
          let arrayBuffer: ArrayBuffer
          if (sourceUrl.startsWith('ameva-vfs://')) {
            const fileId = sourceUrl.replace('ameva-vfs://', '')
            const blob = await getAttachment(fileId)
            if (!blob) throw new Error('VFS_EXPIRED')
            arrayBuffer = await blob.arrayBuffer()
          } else if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:') || sourceUrl.startsWith('http')) {
            const res = await fetch(sourceUrl)
            arrayBuffer = await res.arrayBuffer()
          } else if (block.props?.fileBase64) {
            const cleanBase64 = block.props.fileBase64.includes(',') ? block.props.fileBase64.split(',')[1] : block.props.fileBase64
            const binaryString = atob(cleanBase64.replace(/\s/g, ''))
            const len = binaryString.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            arrayBuffer = bytes.buffer
          } else {
            throw new Error('No valid source')
          }

          if (docType === 'pdf') {
            // PDF: Extract all pages as images
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const numPages = pdf.numPages
            
            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i)
              const viewport = page.getViewport({ scale: 2.0 })
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = viewport.width
              canvas.height = viewport.height
              
              if (ctx) {
                await page.render({ canvasContext: ctx, viewport }).promise
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
            continue // Skip adding the original inlineDocument block
          } else if (docType === 'docx') {
            // Word: Extract raw text using mammoth
            const mammoth = await import('mammoth')
            const { value } = await mammoth.extractRawText({ arrayBuffer })
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
            // Excel: Extract sheets using exceljs
            const ExcelJS = await import('exceljs')
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(arrayBuffer)
            
            result.push({
              id: `${block.id}-title`,
              type: 'heading',
              props: { level: 2 },
              content: [{ type: 'text', text: `[내장 문서: ${block.props?.fileName || 'Excel'}]`, styles: {} }],
              children: []
            })

            workbook.worksheets.forEach((sheet, index) => {
              const rows: any[] = []
              sheet.eachRow((row, rowNumber) => {
                const rowData: any[] = []
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
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
            // PPT: Fallback to a placeholder since pptx-preview doesn't do offscreen rendering easily
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

    // Recursively process children
    const clonedBlock = { ...block }
    if (clonedBlock.children && clonedBlock.children.length > 0) {
      clonedBlock.children = await extractEmbeddedDocuments(clonedBlock.children)
    }
    result.push(clonedBlock)
  }

  return result
}
