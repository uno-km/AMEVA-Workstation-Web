/**
 * ============================================================================
 * @file pdfAnnotationWriter.ts
 * @description pdfAnnotationWriter.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './pdfAnnotationWriter';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file pdfAnnotationWriter.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/pdfAnnotationWriter.ts
 * @role pdf-lib 기반 PDF 바이너리 주석 임베딩 유틸
 *
 * [책임 범위 - RESPONSIBILITY]
 * - SVG 오버레이에서 수집된 주석(PdfAnnotation[])을 pdf-lib API를 통해
 *   실제 PDF 바이너리 파일에 표준 PDF 주석으로 임베딩한다.
 * - 하이라이트(Highlight), 자유 텍스트(FreeText), 밑줄(Underline), 사각형(Square)을 지원한다.
 * - 결과물은 새 PDF Uint8Array로 반환되며, ADC 알집 번들 또는 직접 다운로드에 사용된다.
 */

// [외부 패키지 및 라이브러리 임포트: pdf-lib]
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

/**
 * PdfAnnotation 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface PdfAnnotation {
  id: string
  pageNum: number           // 1-indexed
  type: 'highlight' | 'text' | 'draw' | 'arrow' | 'rect' | 'underline'
  color: string             // '#FFEB3B' 형식
  opacity: number           // 0 ~ 1
  /** 페이지 내 상대 좌표 (0~1 비율) */
  x: number
  y: number
  width: number
  height: number
  text?: string             // text 스티커 메모 내용
  points?: [number, number][]  // draw 자유 드로잉 포인트 배열
  createdAt: string
}

/** hex 색상 → pdf-lib rgb() 변환 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  }
}

/**
 * PDF base64 + 주석 배열 → 주석이 임베딩된 새 PDF Uint8Array 반환
 *
 * @param pdfBase64 원본 PDF base64 문자열
 * @param annotations 임베딩할 주석 배열
 * @returns 주석이 포함된 새 PDF Uint8Array
 */
export async function embedAnnotationsToPdf(
  pdfBase64: string,
  annotations: PdfAnnotation[]
): Promise<Uint8Array> {
  // base64 → ArrayBuffer
  const binaryStr = window.atob(pdfBase64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  const pdfDoc = await PDFDocument.load(bytes)
  const pages = pdfDoc.getPages()

  // 폰트 로드 (텍스트 주석용)
  let font: any
  try {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  } catch {}

  for (const ann of annotations) {
    const pageIdx = ann.pageNum - 1
    if (pageIdx < 0 || pageIdx >= pages.length) continue
    const page = pages[pageIdx]
    const { width: pw, height: ph } = page.getSize()

    // 절대 좌표 계산 (PDF 좌표계 = 좌하단 원점)
    const absX = ann.x * pw
    const absY = ph - (ann.y * ph) - (ann.height * ph) // Y축 반전
    const absW = ann.width * pw
    const absH = ann.height * ph

    const { r, g, b } = hexToRgb(ann.color)
    const color = rgb(r, g, b)

    switch (ann.type) {
      case 'highlight': {
        // 반투명 색상 사각형으로 하이라이트 표현
        page.drawRectangle({
          x: absX,
          y: absY,
          width: absW,
          height: absH,
          color,
          opacity: ann.opacity * 0.4,
          borderWidth: 0,
        })
        break
      }

      case 'underline': {
        // 하단 선으로 밑줄 표현
        page.drawLine({
          start: { x: absX, y: absY },
          end: { x: absX + absW, y: absY },
          thickness: 1.5,
          color,
          opacity: ann.opacity,
        })
        break
      }

      case 'rect': {
        // 테두리 사각형
        page.drawRectangle({
          x: absX,
          y: absY,
          width: absW,
          height: absH,
          borderColor: color,
          borderWidth: 2,
          opacity: 0,
          borderOpacity: ann.opacity,
        })
        break
      }

      case 'text': {
        // 텍스트 스티커: 배경 박스 + 텍스트
        if (!ann.text) break
        const fontSize = 10
        page.drawRectangle({
          x: absX - 2,
          y: absY - 2,
          width: absW + 4,
          height: absH + 4,
          color: rgb(1, 1, 0.8),
          borderColor: rgb(0.9, 0.8, 0.2),
          borderWidth: 1,
          opacity: 0.9,
        })
        if (font) {
          page.drawText(ann.text, {
            x: absX + 2,
            y: absY + absH - fontSize - 2,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
            maxWidth: absW - 4,
            lineHeight: fontSize + 2,
          })
        }
        break
      }

      case 'draw': {
        // 자유 드로잉 - 연속 선으로 표현
        if (!ann.points || ann.points.length < 2) break
        for (let i = 1; i < ann.points.length; i++) {
          const [x1r, y1r] = ann.points[i - 1]
          const [x2r, y2r] = ann.points[i]
          page.drawLine({
            start: {
              x: x1r * pw,
              y: ph - y1r * ph,
            },
            end: {
              x: x2r * pw,
              y: ph - y2r * ph,
            },
            thickness: 2,
            color,
            opacity: ann.opacity,
          })
        }
        break
      }

      case 'arrow': {
        // 화살표: 선 + 삼각형 헤드
        const cx = absX + absW
        const cy = absY + absH / 2
        page.drawLine({
          start: { x: absX, y: absY + absH / 2 },
          end: { x: cx, y: cy },
          thickness: 2,
          color,
          opacity: ann.opacity,
        })
        // 화살촉 삼각형
        const headSize = 8
        page.drawLine({ start: { x: cx, y: cy }, end: { x: cx - headSize, y: cy + headSize / 2 }, thickness: 2, color, opacity: ann.opacity })
        page.drawLine({ start: { x: cx, y: cy }, end: { x: cx - headSize, y: cy - headSize / 2 }, thickness: 2, color, opacity: ann.opacity })
        break
      }
    }
  }

  return pdfDoc.save()
}

/**
 * Uint8Array → base64 문자열 변환
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
