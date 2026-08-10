/**
 * ============================================================================
 * @file imageExporter.ts
 * @description imageExporter.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './imageExporter';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file imageExporter.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @role Convert custom blocks to image blocks for universal export support
 */

const CUSTOM_BLOCK_TYPES = [
  'jupyter', 'drawing', 'linkPreview', 'youtube', 'map', 
  'presentation', 'kanban', 'inlineDocument'
]

/**
 * convertCustomBlocksToImages 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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
