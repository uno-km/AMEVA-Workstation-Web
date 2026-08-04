/**
 * @file fileConverters.ts
 * @system AMEVA OS Desktop Workstation - Utilities
 * @location src/renderer/utils/fileConverters.ts
 * @role Multipurpose Binary-to-Markdown and Markdown-to-Binary Document converters
 * 
 * [설계 의도 - DESIGN INTENT / ADR / FALLBACK]
 * - 오프라인 상태에서도 DOCX, HWPX, IPYNB, Excel(.xlsx) 파일을 마크다운 평문으로 즉각 상호 변환하고 적재하도록 순수 프런트 자바스크립트 수준의 복원 엔진을 기획했다.
 * - [HTML-to-PDF Browser Fallback / HIGH-002]:
 *   일렉트론이 아닌 순수 웹 브라우저 환경에서 PDF 출력을 요청할 시, Node.js 인쇄 채널을 쓸 수 없다.
 *   이에 대한 Fallback으로 **동적 숨김 `iframe`을 DOM에 추가하여 HTML을 작성하고 `iframe.contentWindow.print()`를 트리거한 후 500ms 지연 소멸**시키는 브라우저 프린트 우회 우회 전략을 구동한다.
 * - [HWPX/DOCX XML Backup Parser]:
 *   DOCX Mammoth 라이브러리 로드가 실패 시, HWPX처럼 zip 압축을 풀어 `word/document.xml` 의 `<w:p>`와 `<w:t>` 태그 정규식 매칭 분석법을 백업으로 가동해 내용을 무결하게 건져 올린다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - IPYNB 쥬피터 JSON 및 Markdown 셀 간 상호 변환(`convertMarkdownToIpynb`, `parseFileToMarkdown`).
 * - 이진 파일 디스크 다운로드 유도(`triggerBrowserDownload`), base64 변환(`arrayBufferToBase64`) 및 Mammoth, JSZip, ExcelJS 등 외부 포맷 번역을 통제한다.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 관련 비즈니스 훅 내부 연산 시 순수 함수 유틸리티로 수입 소비.
 * - 소비처 B (src/renderer/components/): 렌더링 전 데이터 정제 단계에서 포맷터 유틸리티로 소비.
 */

/* 
 * [IMPORT SEGMENTATION & DEPS]
 * - ipc: Electron PDF 인쇄 IPC 채널.
 * - packMarkdownToADC, unpackADCToMarkdown: 미디어 통합 adc 파일 패커.
 * - JSZip: DOCX/HWPX ZIP 압축 아카이브 추출 라이브러리.
 * - ExcelJS: 엑셀 셀 로드 및 마크다운 테이블 복원 라이브러리.
 */
import * as ipc from '../services/ipc/electronApiAdapter'
import { packMarkdownToADC, unpackADCToMarkdown } from './adcPackager'
import {
  blocksToHTML, exportToWord, exportToExcel, exportToHWPX
} from './exporters'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'
import * as pdfjsLib from 'pdfjs-dist'
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Worker CSP 대응 (Blob Module Worker)
const workerBlob = new Blob([`import '${pdfWorkerUrl}';`], { type: 'application/javascript' })
const workerBlobUrl = URL.createObjectURL(workerBlob)
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(workerBlobUrl, { type: 'module' })

/**
 * [CONTRACT - ArrayBuffer to Base64 String]
 * - Rationale: 이진 바이트 스트림을 웹브라우저 btoa 규격의 base64 텍스트로 안전하게 변환한다.
 */
export async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * [CONTRACT - Trigger Browser Download Dialog]
 * - Rationale: 앵커 `a` 태그 엘리먼트를 일시 생성 클릭하여 로컬 파일 다운로드(ObjectURL)를 가동한 뒤 즉시 `revokeObjectURL` 소멸 클린업한다.
 */
export function triggerBrowserDownload(data: Blob | string, filename: string) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blob`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blob = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `url`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const url = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const url = URL.createObjectURL(blob)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `a`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const a = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * [CONTRACT - Markdown to Jupyter Notebook Parser]
 * - Rationale: 마크다운 평문을 순회하여 코드 펜스(```) 구간은 `cell_type: code`로, 이외 일반 본문은 `cell_type: markdown` 셀로 적재 조립하여 IPYNB 포맷 문자열을 반환한다.
 */
export function convertMarkdownToIpynb(markdown: string): string {
  const cells: any[] = []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const lines = markdown.split('\n')
  let currentMarkdownLines: string[] = []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isCodeBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isCodeBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let isCodeBlock = false
  let codeBlockLines: string[] = []
  
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < lines.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < lines.length; i++) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `line`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const line = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const line = lines[i]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `line.trim().startsWith('```')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (line.trim().startsWith('```'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (line.trim().startsWith('```')) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isCodeBlock`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isCodeBlock)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (isCodeBlock) {
        cells.push({
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: codeBlockLines.map((l, idx) => idx === codeBlockLines.length - 1 ? l : l + '\n')
        })
        codeBlockLines = []
        isCodeBlock = false
      } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `currentMarkdownLines.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (currentMarkdownLines.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (currentMarkdownLines.length > 0) {
          cells.push({
            cell_type: 'markdown',
            metadata: {},
            source: currentMarkdownLines.map((l, idx) => idx === currentMarkdownLines.length - 1 ? l : l + '\n')
          })
          currentMarkdownLines = []
        }
        isCodeBlock = true
      }
    } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isCodeBlock`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isCodeBlock)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (isCodeBlock) {
        codeBlockLines.push(line)
      } else {
        currentMarkdownLines.push(line)
      }
    }
  }
  
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `currentMarkdownLines.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (currentMarkdownLines.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (currentMarkdownLines.length > 0) {
    cells.push({
      cell_type: 'markdown',
      metadata: {},
      source: currentMarkdownLines.map((l, idx) => idx === currentMarkdownLines.length - 1 ? l : l + '\n')
    })
  }
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `notebook`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const notebook = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const notebook = {
    cells,
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }
    },
    nbformat: 4,
    nbformat_minor: 2
  }
  return JSON.stringify(notebook, null, 2)
}

/**
 * [CONTRACT - Convert Markdown Blocks to Binary Base64]
 * - Rationale: 타깃 파일 경로의 확장자에 맞춰 docx, xlsx, hwpx, pdf, adc 바이너리를 생성하고 Base64 문자열로 래핑하여 리턴한다.
 * - [HIGH-002] 브라우저 환경인 경우 숨김 iframe에 HTML을 써서 window.print() Fallback을 가동한다.
 */
export async function convertMarkdownToBinary(editorInstance: any, filePath: string): Promise<string> {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ext`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ext = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  
  // 에디터 jupyter 실행 블록을 코드블록 서식으로 치환 정규화
  const copyBlocks = (blocks: any[]): any[] => {
    return blocks.map(block => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `copy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const copy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const copy = { ...block }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `copy.type === 'jupyter'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (copy.type === 'jupyter')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (copy.type === 'jupyter') {
        copy.type = 'codeBlock'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const lang = copy.props?.language || 'javascript'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `finalCodeText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const finalCodeText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const finalCodeText = copy.props?.code || ''
        copy.content = [{ type: 'text', text: finalCodeText, styles: {} }]
        copy.props = { language: lang }
      } else if (copy.children) {
        copy.children = copyBlocks(copy.children)
      }
      return copy
    })
  }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rawBlocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rawBlocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const rawBlocks = copyBlocks(editorInstance.document)
  
  // 1) Word 포맷 변환
  if (ext === 'docx') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blob`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blob = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const blob = await exportToWord(rawBlocks)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `arrayBuffer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const arrayBuffer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const arrayBuffer = await blob.arrayBuffer()
    return arrayBufferToBase64(arrayBuffer as ArrayBuffer)
  }
  
  // 2) Excel 포맷 변환
  if (ext === 'xlsx') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `uint8`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const uint8 = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const uint8 = await exportToExcel(rawBlocks)
    return arrayBufferToBase64(uint8.buffer as ArrayBuffer)
  }
  
  // 3) HWPX 포맷 변환
  if (ext === 'hwpx') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blob`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blob = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const blob = await exportToHWPX(rawBlocks)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `arrayBuffer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const arrayBuffer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const arrayBuffer = await blob.arrayBuffer()
    return arrayBufferToBase64(arrayBuffer as ArrayBuffer)
  }
  
  // 4) PDF 변환 (Electron / Browser Fallback [HIGH-002] 분기)
  if (ext === 'pdf') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const html = await blocksToHTML(rawBlocks)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ipc.isElectronEnv()) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `base64`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const base64 = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const base64 = await ipc.printToPDF(html)
      return base64 || ''
    }
    
    // [HIGH-002] 브라우저 환경 Fallback 인쇄 절차 기동
    await new Promise<void>((resolve) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `iframe`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const iframe = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-9999px'
      iframe.style.left = '-9999px'
      iframe.style.width = '210mm'
      iframe.style.height = '297mm'
      document.body.appendChild(iframe)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `iframeDoc`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const iframeDoc = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `iframeDoc`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (iframeDoc)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(html)
        iframeDoc.close()
        iframe.contentWindow?.focus()
        setTimeout(() => {
          iframe.contentWindow?.print()
          setTimeout(() => {
            document.body.removeChild(iframe)
            resolve()
          }, 500)
        }, 300)
      } else {
        document.body.removeChild(iframe)
        resolve()
      }
    })
    return ''
  }
  
  // 5) 아메바 통합 ADC 변환
  if (ext === 'adc') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const markdown = await editorInstance.blocksToMarkdownLossy(rawBlocks)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blob`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blob = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const blob = await packMarkdownToADC(markdown)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `arrayBuffer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const arrayBuffer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const arrayBuffer = await blob.arrayBuffer()
    return arrayBufferToBase64(arrayBuffer)
  }
  
  return ''
}

/**
 * [CONTRACT - Parse Binary / ipynb File to Markdown String]
 * - Rationale: 가져온 파일 내용이 이진 base64 규격인지 일반 ipynb JSON/텍스트 규격인지 감별하고,
 *   IPYNB, DOCX(Mammoth + XML backup), ADC, HWPX(section0.xml 파싱), XLSX(ExcelJS sheet 변환) 순서로 텍스트 복원을 수행한다.
 */
export async function parseFileToMarkdown(content: string, filePath: string, isBinary: boolean): Promise<string> {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ext`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ext = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const ext = (filePath || '').split('.').pop()?.toLowerCase() || ''
  
  // 일반 텍스트 및 ipynb 파일 처리
  if (!isBinary) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ext === 'ipynb'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ext === 'ipynb')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ext === 'ipynb') {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `json`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const json = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const json = JSON.parse(content)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cells`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cells = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const cells = json.cells || []
        const mdLines: string[] = []
        
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `kernelLang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const kernelLang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        let kernelLang = 'python'
        try {
          kernelLang = json.metadata?.kernelspec?.language || 'python'
        } catch {}
        
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const cell of cells) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
        for (const cell of cells) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `source`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const source = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || ''
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `cell.cell_type === 'markdown'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (cell.cell_type === 'markdown')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (cell.cell_type === 'markdown') {
            mdLines.push(source)
            mdLines.push('')
          } else if (cell.cell_type === 'code') {
            mdLines.push(`\`\`\`${kernelLang}`)
            mdLines.push(source)
            mdLines.push('```')
            mdLines.push('')
          }
        }
        return mdLines.join('\n')
      } catch (err: any) {
        return `Error parsing Jupyter Notebook: ${err.message}`
      }
    }
    return content
  }
  
  // base64 이진 파일 디코딩 복원 시도
  let binaryString = ''
  try {
    let base64Content = content.replace(/\s/g, '')
    if (base64Content.includes(',')) {
      base64Content = base64Content.split(',')[1]
    }
    binaryString = window.atob(base64Content)
  } catch (e) {
    console.warn('[parseFileToMarkdown] atob 디코딩 실패, 원본 텍스트 폴백 사용:', e)
    return content
  }
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `bytes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const bytes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const bytes = new Uint8Array(binaryString.length)
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < binaryString.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `arrayBuffer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const arrayBuffer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const arrayBuffer = bytes.buffer
  
  // PPTX 파일의 경우 텍스트 파싱을 시도하지 않고 안내 메시지 반환
  if (['pptx', 'ppt'].includes(ext)) {
    return 'PowerPoint 파일은 인라인 뷰어로 표시됩니다. 에디터에서 `/ppt` 명령어를 사용하거나 화면에 끌어다 놓으세요.'
  }

  // 1) DOCX Mammoth 디코더 + XML 태그 백업 복원 라우팅
  if (ext === 'docx') {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mammoth`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mammoth = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const mammoth = await import('mammoth')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `result`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const result = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const result = await (mammoth as any).convertToMarkdown({ arrayBuffer })
      return result.value
    } catch (err: any) {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `zip`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const zip = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const zip = await JSZip.loadAsync(arrayBuffer)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `docXml`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const docXml = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const docXml = await zip.file('word/document.xml')?.async('text')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!docXml`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!docXml)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!docXml) return `Error parsing DOCX: word/document.xml not found`
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pMatches`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pMatches = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const pMatches = docXml.match(/<w:p[\s\S]*?>([\s\S]*?)<\/w:p>/g) || []
        const lines: string[] = []
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const pXml of pMatches) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
        for (const pXml of pMatches) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tMatches`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tMatches = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const tMatches = pXml.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          let pText = ''
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const tXml of tMatches) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
          for (const tXml of tMatches) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `text`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const text = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const text = tXml.replace(/<w:t[\s\S]*?>/, '').replace('</w:t>', '')
            pText += text
          }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `pText) lines.push(pText`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (pText) lines.push(pText)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (pText) lines.push(pText)
        }
        return lines.join('\n\n')
      } catch (innerErr: any) {
        return `Error parsing DOCX: ${err.message} (Backup failed: ${innerErr.message})`
      }
    }
  }

  // 2) ADC 통합 문서 압축 해제
  if (ext === 'adc') {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const unpacked = await unpackADCToMarkdown(arrayBuffer)
      return unpacked as any
    } catch (err: any) {
      return `Error unpacking Ameva Document: ${err.message}`
    }
  }
  
  // 3) HWPX XML 직접 압축해제 파싱 기전
  if (ext === 'hwpx') {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `zip`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const zip = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const zip = await JSZip.loadAsync(arrayBuffer)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `sectionXml`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const sectionXml = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const sectionXml = await zip.file('Contents/section0.xml')?.async('text')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!sectionXml`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!sectionXml)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!sectionXml) return 'Error parsing HWPX: section0.xml not found'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pMatches`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pMatches = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pMatches = sectionXml.match(/<hp:p[\s\S]*?>([\s\S]*?)<\/hp:p>/g) || []
      const lines: string[] = []
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const pXml of pMatches) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (const pXml of pMatches) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tMatches`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tMatches = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const tMatches = pXml.match(/<hp:t[\s\S]*?>([\s\S]*?)<\/hp:t>/g) || []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        let pText = ''
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const tXml of tMatches) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
        for (const tXml of tMatches) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `text`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const text = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const text = tXml.replace(/<hp:t[\s\S]*?>/, '').replace('</hp:t>', '')
          pText += text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
        }
        lines.push(pText.trim())
      }
      return lines.join('\n\n')
    } catch (err: any) {
      return `Error parsing HWPX: ${err.message}`
    }
  }
  
  // 4) ExcelJS 엑셀 마크다운 테이블 리포트 변환
  if (ext === 'xlsx' || ext === 'xls') {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `wb`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const wb = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(bytes.buffer as ArrayBuffer)
      const mdLines: string[] = []
      wb.eachSheet((worksheet) => {
        mdLines.push(`## Sheet: ${worksheet.name}`)
        mdLines.push('')
        const sheetRows: string[][] = []
        worksheet.eachRow((row) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cells`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cells = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const cells = (row.values as any[]).slice(1).map(v =>
            v != null ? String(v).replace(/\|/g, '\\|') : ''
          )
          sheetRows.push(cells)
        })
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `sheetRows.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (sheetRows.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (sheetRows.length === 0) {
          mdLines.push('*Empty Sheet*')
          mdLines.push('')
          return
        }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mdTableLines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mdTableLines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const mdTableLines = sheetRows.map((cells, idx) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `line`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const line = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const line = '| ' + cells.join(' | ') + ' |'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `idx === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (idx === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (idx === 0) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `separator`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const separator = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const separator = '| ' + cells.map(() => '---').join(' | ') + ' |'
            return line + '\n' + separator
          }
          return line
        })
        mdLines.push(mdTableLines.join('\n'))
        mdLines.push('')
      })
      return mdLines.join('\n')
    } catch (err: any) {
      return `Error parsing Excel: ${err.message}`
    }
  }
  // 5) 브라우저 호환(pdfjs-dist) PDF 텍스트 추출 로직
  if (ext === 'pdf') {
    try {
      // bytes (Uint8Array)를 pdf.js 다큐먼트로 로드
      const loadingTask = pdfjsLib.getDocument({ 
        data: bytes,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true
      })
      const pdf = await loadingTask.promise
      const numPages = pdf.numPages
      const mdLines: string[] = []
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        // 아이템 위치(X, Y) 기반 텍스트 정렬 및 테이블 형태 복원 휴리스틱
        const items = textContent.items.filter((item: any) => item.str.trim().length > 0)
        const rows: { y: number; items: any[] }[] = []
        const Y_TOLERANCE = 5 // 5px 오차 이내는 같은 줄로 취급

        items.forEach((item: any) => {
          const y = item.transform[5]
          let row = rows.find(r => Math.abs(r.y - y) < Y_TOLERANCE)
          if (!row) {
            row = { y, items: [] }
            rows.push(row)
          }
          row.items.push(item)
        })

        // Y 좌표 내림차순 정렬 (페이지 상단 -> 하단)
        rows.sort((a, b) => b.y - a.y)

        // 각 행 내부 X 좌표 오름차순 정렬 (좌 -> 우)
        const pageText = rows.map(row => {
          row.items.sort((a, b) => a.transform[4] - b.transform[4])
          let rowText = ''
          for (let j = 0; j < row.items.length; j++) {
            const item = row.items[j]
            rowText += item.str
            if (j < row.items.length - 1) {
              const nextItem = row.items[j+1]
              // 현재 항목 끝과 다음 항목 시작의 X 좌표 간격 계산
              const gap = nextItem.transform[4] - (item.transform[4] + item.width)
              if (gap > 15) {
                rowText += ' | '
              } else {
                rowText += ' '
              }
            }
          }
          return rowText.trim()
        }).join('\n')
        
        if (pageText.trim()) {
          mdLines.push(`## Page ${i}`)
          mdLines.push('')
          mdLines.push(pageText.trim())
          mdLines.push('')
        }
      }
      return mdLines.join('\n')
    } catch (err: any) {
      console.error('[parseFileToMarkdown] PDF Parsing failed:', err)
      return `Error parsing PDF: ${err.message}`
    }
  }

  return `Binary file loaded. Content size: ${bytes.length} bytes.`
}

