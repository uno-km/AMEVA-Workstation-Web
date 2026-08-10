/**
 * ============================================================================
 * @file usePdfAnnotations.ts
 * @description usePdfAnnotations.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './usePdfAnnotations';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file usePdfAnnotations.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/usePdfAnnotations.ts
 * @role PDF 주석 상태 관리 훅
 *
 * [책임 범위 - RESPONSIBILITY]
 * - 주석 목록(annotations[])의 추가/수정/삭제 CRUD를 관리한다.
 * - 현재 활성화된 주석 도구(tool) 및 색상(color)을 관리한다.
 * - 주석 데이터를 localStorage에 자동 저장하고 불러온다.
 * - pdf-lib를 통해 주석을 실제 PDF 바이너리에 임베딩하는 saveAnnotatedPdf()를 제공한다.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import { useState, useEffect, useCallback } from 'react'
// [내부 프로젝트 의존성 모듈 임포트: ../utils/pdfAnnotationWriter]
import type { PdfAnnotation } from '../utils/pdfAnnotationWriter'
// [내부 프로젝트 의존성 모듈 임포트: ../utils/pdfAnnotationWriter]
import { embedAnnotationsToPdf, uint8ArrayToBase64 } from '../utils/pdfAnnotationWriter'

/**
 * AnnotationTool 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type AnnotationTool = 'none' | 'highlight' | 'underline' | 'text' | 'draw' | 'arrow' | 'rect' | 'eraser'

const ANNOTATION_COLORS = [
  '#FFEB3B', // 노란 하이라이트
  '#FF5252', // 빨간
  '#69F0AE', // 초록
  '#40C4FF', // 파란
  '#FF80AB', // 핑크
  '#B388FF', // 보라
]

/**
 * UsePdfAnnotationsReturn 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface UsePdfAnnotationsReturn {
  annotations: PdfAnnotation[]
  activeTool: AnnotationTool
  activeColor: string
  setActiveTool: (tool: AnnotationTool) => void
  setActiveColor: (color: string) => void
  addAnnotation: (ann: Omit<PdfAnnotation, 'id' | 'createdAt'>) => void
  updateAnnotation: (id: string, fields: Partial<PdfAnnotation>) => void
  deleteAnnotation: (id: string) => void
  clearPageAnnotations: (pageNum: number) => void
  clearAllAnnotations: () => void
  saveAnnotatedPdf: (pdfBase64: string) => Promise<string> // 주석 임베딩된 PDF base64 반환
  annotationColors: string[]
}

/**
 * PDF 주석 관리 훅
 * @param storageKey localStorage 키 (파일명 기반)
 */
export function usePdfAnnotations(storageKey: string): UsePdfAnnotationsReturn {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([])
  const [activeTool, setActiveTool] = useState<AnnotationTool>('none')
  const [activeColor, setActiveColor] = useState<string>('#FFEB3B')

  // localStorage에서 주석 로드
  useEffect(() => {
    if (!storageKey) return
    try {
      const stored = localStorage.getItem(`pdf-annotations-${storageKey}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setAnnotations(parsed)
        }
      }
    } catch (e) {
      console.error('[usePdfAnnotations] 주석 로드 실패:', e)
    }
  }, [storageKey])

  // 주석 변경 시 localStorage 자동 저장
  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(`pdf-annotations-${storageKey}`, JSON.stringify(annotations))
    } catch (e) {
      console.error('[usePdfAnnotations] 주석 저장 실패:', e)
    }
  }, [annotations, storageKey])

  const addAnnotation = useCallback((ann: Omit<PdfAnnotation, 'id' | 'createdAt'>) => {
    const newAnn: PdfAnnotation = {
      ...ann,
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }
    setAnnotations(prev => [...prev, newAnn])
  }, [])

  const updateAnnotation = useCallback((id: string, fields: Partial<PdfAnnotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...fields } : a))
  }, [])

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }, [])

  const clearPageAnnotations = useCallback((pageNum: number) => {
    setAnnotations(prev => prev.filter(a => a.pageNum !== pageNum))
  }, [])

  const clearAllAnnotations = useCallback(() => {
    setAnnotations([])
  }, [])

  /**
   * 주석을 실제 PDF 바이너리에 임베딩하여 새 PDF base64 반환
   * pdf-lib 사용 → WebAssembly 불필요, 순수 JS
   */
  const saveAnnotatedPdf = useCallback(async (pdfBase64: string): Promise<string> => {
    if (annotations.length === 0) return pdfBase64
    try {
      const annotatedBytes = await embedAnnotationsToPdf(pdfBase64, annotations)
      return uint8ArrayToBase64(annotatedBytes)
    } catch (e) {
      console.error('[usePdfAnnotations] PDF 주석 임베딩 실패:', e)
      return pdfBase64
    }
  }, [annotations])

  return {
    annotations,
    activeTool,
    activeColor,
    setActiveTool,
    setActiveColor,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearPageAnnotations,
    clearAllAnnotations,
    saveAnnotatedPdf,
    annotationColors: ANNOTATION_COLORS,
  }
}
