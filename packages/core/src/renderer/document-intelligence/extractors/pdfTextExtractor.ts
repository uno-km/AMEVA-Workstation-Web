/**
 * ============================================================================
 * @file pdfTextExtractor.ts
 * @description pdfTextExtractor.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './pdfTextExtractor';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: pdfjs-dist]
import * as pdfjsLib from 'pdfjs-dist';

/**
 * extractPdfText 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function extractPdfText(fileData: ArrayBuffer | Blob): Promise<{ page: number; text: string }[]> {
  try {
    const data = fileData instanceof Blob ? await fileData.arrayBuffer() : fileData;
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
    const pdf = await loadingTask.promise;
    
    const pagesText: { page: number; text: string }[] = [];
    const numPages = pdf.numPages;
    
    // 비동기 처리 분산 (UI 렉 방지)
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      pagesText.push({ page: i, text: pageText });
      
      // Allow UI thread to breathe every 10 pages
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return pagesText;
  } catch (err) {
    console.error('Failed to extract PDF text:', err);
    throw new Error('PDF 텍스트 추출 중 오류가 발생했습니다.');
  }
}
