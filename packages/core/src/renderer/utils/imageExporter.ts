/**
 * @file imageExporter.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @role Convert custom blocks to image blocks for universal export support
 */

const CUSTOM_BLOCK_TYPES = [
  'jupyter', 'drawing', 'linkPreview', 'youtube', 'map', 
  'presentation', 'excel', 'kanban', 'inlineDocument'
]

export async function convertCustomBlocksToImages(blocks: any[]): Promise<any[]> {
  try {
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default

    const processBlocks = async (nodes: any[]): Promise<any[]> => {
      const result: any[] = []
      
      for (const block of nodes) {
        // Deep clone to avoid mutating original blocks
        const clonedBlock = JSON.parse(JSON.stringify(block))
        
        if (CUSTOM_BLOCK_TYPES.includes(block.type)) {
          try {
            const domElement = document.querySelector(`[data-id="${block.id}"]`) as HTMLElement
            if (domElement) {
              // 가능하면 .bn-block-content 부분만 캡처 (사이드바 버튼 등 제외)
              let targetElement = domElement.querySelector('.bn-block-content') as HTMLElement
              if (!targetElement) targetElement = domElement

              // html2canvas 옵션: CORS 허용, 배경 투명, 고해상도
              const canvas = await html2canvas(targetElement, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2 
              })
              
              const dataUrl = canvas.toDataURL('image/png')
              
              // 캡처 성공 시 표준 image 블록으로 속성 교체
              clonedBlock.type = 'image'
              clonedBlock.props = {
                url: dataUrl,
                previewWidth: Math.round(canvas.width / 2),
                textAlignment: 'left'
              }
            } else {
              console.warn(`[imageExporter] DOM element not found for block ${block.id}`)
            }
          } catch (e) {
            console.error(`[imageExporter] Failed to capture block ${block.id}:`, e)
          }
        }

        // 자식 블록 재귀 캡처
        if (clonedBlock.children && clonedBlock.children.length > 0) {
          clonedBlock.children = await processBlocks(clonedBlock.children)
        }
        
        result.push(clonedBlock)
      }
      return result
    }

    return await processBlocks(blocks)
  } catch (err) {
    console.error('[imageExporter] html2canvas load failed:', err)
    // 실패 시 원본 블록 그대로 반환
    return blocks
  }
}
