/**
 * @file hwpxParser.ts
 * @system AMEVA OS Desktop Workstation
 * @role HWPX Client-Side Parser using JSZip
 * 
 * [설명]
 * .hwpx 파일은 OWPML(Open Word-Processing Markup Language) 기반의 ZIP 압축 파일입니다.
 * 이 모듈은 브라우저에서 JSZip을 사용하여 hwpx 파일 내의 Contents/section*.xml 들을 
 * 순회하며 텍스트 덩어리와 문단 구조를 마크다운 형태 또는 순수 텍스트 배열로 파싱합니다.
 */

import JSZip from 'jszip';

export interface ParsedHwpx {
  title: string;
  paragraphs: string[];
  rawText: string;
}

export const hwpxParser = {
  /**
   * HWPX 파일 객체를 입력받아 내부 텍스트를 추출합니다.
   */
  extractText: async (file: File): Promise<ParsedHwpx> => {
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      
      const paragraphs: string[] = [];
      let totalText = "";

      // HWPX 파일의 섹션 파일들을 찾습니다 (Contents/section0.xml, section1.xml 등)
      // 또는 정규식을 통해 section.*\.xml 패턴을 전부 순회할 수도 있습니다.
      const sectionFiles = Object.keys(loadedZip.files).filter(name => 
        name.includes('Contents/section') && name.endsWith('.xml')
      );

      // 섹션 번호 순으로 정렬
      sectionFiles.sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
        return numA - numB;
      });

      for (const sectionPath of sectionFiles) {
        const fileData = loadedZip.file(sectionPath);
        if (!fileData) continue;

        const xmlString = await fileData.async('text');
        
        // DOMParser를 이용해 브라우저 네이티브로 XML 해독
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // <hp:p> 태그가 문단, <hp:t> 태그가 텍스트 청크를 의미함
        const pNodes = xmlDoc.getElementsByTagName('hp:p');
        
        for (let i = 0; i < pNodes.length; i++) {
          const pNode = pNodes[i];
          const tNodes = pNode.getElementsByTagName('hp:t');
          let paraText = "";
          
          for (let j = 0; j < tNodes.length; j++) {
            paraText += tNodes[j].textContent || "";
          }

          // 문단 내에 글자가 있거나 빈 문단인 경우 처리
          const trimmed = paraText.trim();
          if (trimmed.length > 0) {
            paragraphs.push(trimmed);
            totalText += trimmed + "\n";
          } else {
            paragraphs.push("");
            totalText += "\n";
          }
        }
      }

      return {
        title: file.name,
        paragraphs,
        rawText: totalText
      };
    } catch (error) {
      console.error("HWPX Parsing Error:", error);
      throw new Error(`HWPX 파일을 파싱하는 중 오류가 발생했습니다: ${(error as Error).message}`);
    }
  }
};
