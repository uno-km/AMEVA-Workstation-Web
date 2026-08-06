import * as pdfjsLib from 'pdfjs-dist';

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
