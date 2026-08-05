/**
 * @file imageExporter.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @role Convert custom blocks to image blocks for universal export support
 */

const CUSTOM_BLOCK_TYPES = [
  'jupyter', 'drawing', 'linkPreview', 'youtube', 'map', 
  'presentation', 'kanban', 'inlineDocument'
]

export async function convertCustomBlocksToImages(blocks: any[], setP?: (percent: number, msg: string) => void): Promise<any[]> {
  try {
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default

    let totalBlocks = 0
    let processedBlocks = 0

    // Count blocks recursively
    const countBlocks = (nodes: any[]) => {
      for (const b of nodes) {
        if (CUSTOM_BLOCK_TYPES.includes(b.type)) totalBlocks++
        if (b.children) countBlocks(b.children)
      }
    }
    countBlocks(blocks)

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

              if (setP && totalBlocks > 0) {
                const percent = 25 + Math.floor((processedBlocks / totalBlocks) * 35) // 25% ~ 60%
                setP(percent, `블록 이미지화 진행 중... (${processedBlocks + 1}/${totalBlocks})`)
              }

              // html2canvas 옵션: CORS 허용, 배경 투명, 고해상도 + 5초 타임아웃
              const canvas = await Promise.race([
                html2canvas(targetElement, {
                  useCORS: true,
                  allowTaint: false,
                  backgroundColor: null,
                  scale: 2 
                }),
                new Promise<HTMLCanvasElement>((_, reject) => setTimeout(() => reject(new Error('html2canvas timeout')), 5000))
              ])
              
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
          processedBlocks++
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
