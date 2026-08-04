/**
 * @file adcPackager.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/adcPackager.ts
 * @role Application Data Container (ADC) / Markdown Export Packager
 */
import JSZip from 'jszip'

/**
 * [CONTRACT - ArrayBuffer to Base64 String]
 * - Rationale: 아카이빙된 zip 바이너리를 문서 블록(HTML/JSON) 내에 base64 텍스트 형태로 임베딩하기 위해 변환한다.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `binary`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const binary = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let binary = ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `bytes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const bytes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const bytes = new Uint8Array(buffer)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `len`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const len = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const len = bytes.byteLength
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < len; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * [CONTRACT - Base64 String to ArrayBuffer]
 * - Rationale: 아카이빙 시 base64 텍스트를 zip 라이브러리가 이해할 수 있는 ArrayBuffer 이진 포맷으로 복원한다.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `binaryString`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const binaryString = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const binaryString = window.atob(base64)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `len`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const len = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const len = binaryString.length
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `bytes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const bytes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const bytes = new Uint8Array(len)
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < len; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * [CONTRACT - Pack Markdown and Base64 Media to ADC Blob]
 * - Rationale: 마크다운 텍스트 내의 모든 base64 Data URL을 추출하여 media/ 폴더 하위에 바이너리 저장 파일로 파킹하고,
 *   원문에는 상대 경로로 교체한 뒤 메타데이터 JSON(`meta.json`)과 함께 최종 ZIP Blob 객체를 구성해 리턴한다.
 */
export async function packMarkdownToADC(markdown: string, metadata?: any): Promise<Blob> {
  const zip = new JSZip()
  let processedMarkdown = markdown
  let mediaIndex = 0
  
  // 1) Electron 환경에서의 모든 로컬 미디어 절대 경로 (media://, file:///, 그리고 C:/ 등 절대경로) 감지 및 파일 바인딩
  const localMediaRegex = /(media:\/\/|file:\/\/\/|[a-zA-Z]:[\\/])([^\s"'()#?,]+)/g
  const mediaMatches: { full: string; absolutePath: string; zipPath: string }[] = []
  let mediaMatch
  
  const tempMediaRegex = new RegExp(localMediaRegex)
  while ((mediaMatch = tempMediaRegex.exec(markdown)) !== null) {
    const full = mediaMatch[0]
    
    // 순수 로컬 절대 경로 추출 및 윈도우 경로 정규화
    let absolutePath = full
    if (absolutePath.startsWith('media://')) {
      absolutePath = absolutePath.substring(8)
    } else if (absolutePath.startsWith('file:///')) {
      absolutePath = absolutePath.substring(8)
    }
    absolutePath = absolutePath.replace(/\\/g, '/')
    
    if (mediaMatches.some(m => m.full === full)) continue
    
    const ext = absolutePath.split('.').pop()?.toLowerCase() || 'png'
    const zipPath = `media/file_${mediaIndex++}.${ext}`
    mediaMatches.push({ full, absolutePath, zipPath })
  }
  
  // Electron API를 이용해 로컬 미디어 바이너리를 읽어 zip 아카이브에 기입
  if (mediaMatches.length > 0 && typeof window !== 'undefined' && window.electronAPI?.readBinary) {
    for (const item of mediaMatches) {
      try {
        const res = await window.electronAPI.readBinary(item.absolutePath)
        if (res.success && res.content) {
          const buffer = base64ToArrayBuffer(res.content)
          zip.file(item.zipPath, buffer)
          processedMarkdown = processedMarkdown.split(item.full).join(item.zipPath)
        }
      } catch (err) {
        console.error(`[packMarkdownToADC] 로컬 미디어 파일 읽기 실패: ${item.absolutePath}`, err)
      }
    }
  }
  
  // 2) 기존 dataUrlRegex 매칭 (폴백 및 타 리소스용)
  const dataUrlRegex = /data:([a-zA-Z0-9/+\-_]+);base64,([a-zA-Z0-9+/=]+)/g
  const dataMatches: { full: string; mime: string; base64: string; path: string }[] = []
  let dataMatch
  const tempRegex = new RegExp(dataUrlRegex)
  while ((dataMatch = tempRegex.exec(processedMarkdown)) !== null) {
    const full = dataMatch[0]
    const mime = dataMatch[1]
    const base64 = dataMatch[2]
    
    if (dataMatches.some(m => m.full === full)) continue
    
    const ext = mime.split('/')[1] || 'png'
    const fileName = `media/file_${mediaIndex++}.${ext}`
    dataMatches.push({ full, mime, base64, path: fileName })
  }
  
  for (const item of dataMatches) {
    const buffer = base64ToArrayBuffer(item.base64)
    zip.file(item.path, buffer)
    processedMarkdown = processedMarkdown.split(item.full).join(item.path)
  }
  
  // 경로 변환된 마크다운 문서 삽입
  zip.file('document.md', processedMarkdown)
  
  // 아메바 문서 작성 정보 메타 기록
  const metaObj = {
    title: metadata?.title || 'Ameva Document',
    author: metadata?.author || 'Unknown',
    createdAt: metadata?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  zip.file('meta.json', JSON.stringify(metaObj, null, 2))
  
  // jszip 바이너리 패키지 출력 리턴
  return await zip.generateAsync({ type: 'blob' })
}

export async function unpackADCToMarkdown(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer)
  const docFile = zip.file('document.md')
  if (!docFile) {
    throw new Error('Invalid .adc package: document.md not found')
  }
  
  let markdown = await docFile.async('text')
  
  // 미디어 파일 경로 추출
  const mediaRegex = /media\/file_\d+\.[a-zA-Z0-9]+/g
  const matches = Array.from(markdown.matchAll(mediaRegex)).map(m => m[0])
  const uniquePaths = Array.from(new Set(matches))
  
  const hasElectronIO = typeof window !== 'undefined' && window.electronAPI?.writeBinary
  const sessionUuid = Math.random().toString(36).substring(2, 10)
  
  // 수집된 상대 경로들을 하나씩 읽어서 복원 진행
  for (const path of uniquePaths) {
    const file = zip.file(path)
    if (file) {
      const buffer = await file.async('arraybuffer')
      
      if (hasElectronIO) {
        // Electron 환경: 임시 폴더에 디스크 저장 후 media:// 복원
        try {
          const base64 = await arrayBufferToBase64(buffer)
          const relativeTarget = `temp_media/${sessionUuid}/${path.split('/').pop()}`
          const res = await window.electronAPI!.writeBinary(relativeTarget, base64) as any
          if (res.success && res.path) {
            const mediaUrl = `media://${res.path}`
            markdown = markdown.split(path).join(mediaUrl)
          } else {
            throw new Error(res.error || '실패')
          }
        } catch (err) {
          console.error(`[unpackADCToMarkdown] Electron 로컬 복원 실패, DataURL 폴백 작동: ${path}`, err)
          const base64 = await arrayBufferToBase64(buffer)
          const ext = path.split('.').pop()?.toLowerCase() || ''
          const mime = getMimeType(ext)
          const dataUrl = `data:${mime};base64,${base64}`
          markdown = markdown.split(path).join(dataUrl)
        }
      } else {
        // 일반 브라우저 환경: 기존 DataURL 변환 폴백
        const base64 = await arrayBufferToBase64(buffer)
        const ext = path.split('.').pop()?.toLowerCase() || ''
        const mime = getMimeType(ext)
        const dataUrl = `data:${mime};base64,${base64}`
        markdown = markdown.split(path).join(dataUrl)
      }
    }
  }
  
  return markdown
}

// 헬퍼: 확장자에 따른 MIME 타입 검출
function getMimeType(ext: string): string {
  if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
    return `video/${ext === 'mov' ? 'quicktime' : ext}`
  } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return `audio/${ext === 'm4a' ? 'mp4' : ext}`
  } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return `image/${ext === 'svg' ? 'svg+xml' : ext}`
  } else if (['pptx', 'ppt'].includes(ext)) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  return 'application/octet-stream'
}

// ──────────────────────────────────────────────────────────────
// PDF-Hybrid ADC 포맷 (v2.0)
// 복수 PDF + 마크다운 섹션 혼합 문서를 JSZip으로 번들
// ──────────────────────────────────────────────────────────────

export interface PdfHybridSection {
  id: string
  type: 'pdf' | 'markdown'
  /** type=pdf: ADC 내 pdf 경로 (pdfs/pdf_0.pdf) */
  file?: string
  /** type=markdown: ADC 내 md 경로 (notes/header.md) */
  markdownFile?: string
  /** PDF 섹션 타이틀 */
  title?: string
  /** 주석 파일 경로 */
  annotations?: string
  /** 주석 임베딩 PDF 경로 */
  annotatedFile?: string
  /** 마크다운 섹션이 삽입될 PDF 섹션 ID */
  insertAfterPdfId?: string
  /** 마크다운이 삽입될 페이지 번호 (0 = 문서 상단/하단) */
  insertAfterPage?: number
}

export interface PdfHybridManifest {
  version: '2.0'
  type: 'pdf-hybrid'
  title: string
  sections: PdfHybridSection[]
  createdAt: string
  author?: string
}

export interface PdfHybridDocument {
  manifest: PdfHybridManifest
  /** key: PDFs section id → base64 */
  pdfDataMap: Record<string, string>
  /** key: PDFs section id → annotations JSON string */
  annotationsMap: Record<string, string>
  /** key: markdown section id → markdown content */
  markdownMap: Record<string, string>
}

/**
 * PDF-Hybrid 문서를 ADC 알집으로 패키징
 *
 * @param doc PdfHybridDocument 객체
 * @returns JSZip Blob (ADC 파일)
 */
export async function packPdfHybridToADC(doc: PdfHybridDocument): Promise<Blob> {
  const zip = new JSZip()

  // manifest.json 저장
  zip.file('manifest.json', JSON.stringify(doc.manifest, null, 2))

  // meta.json (하위 호환)
  zip.file('meta.json', JSON.stringify({
    title: doc.manifest.title,
    type: 'pdf-hybrid',
    version: '2.0',
    createdAt: doc.manifest.createdAt,
    author: doc.manifest.author || 'AMEVA',
  }, null, 2))

  // PDF 파일들 저장 (pdfs/ 폴더)
  for (const section of doc.manifest.sections) {
    if (section.type !== 'pdf' || !section.file) continue

    const pdfBase64 = doc.pdfDataMap[section.id]
    if (pdfBase64) {
      const pdfBuffer = base64ToArrayBuffer(pdfBase64)
      zip.file(section.file, pdfBuffer)
    }

    // 주석 JSON 저장
    const annotationsJson = doc.annotationsMap[section.id]
    if (annotationsJson && section.annotations) {
      zip.file(section.annotations, annotationsJson)
    }
  }

  // 마크다운 파일들 저장 (notes/ 폴더)
  for (const section of doc.manifest.sections) {
    if (section.type !== 'markdown' || !section.markdownFile) continue
    const md = doc.markdownMap[section.id] || ''
    zip.file(section.markdownFile, md)
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

/**
 * ADC 알집 → PdfHybridDocument 언팩
 *
 * @param arrayBuffer ADC 파일 ArrayBuffer
 * @returns PdfHybridDocument 또는 null (pdf-hybrid 타입이 아닌 경우)
 */
export async function unpackADCToPdfHybrid(arrayBuffer: ArrayBuffer): Promise<PdfHybridDocument | null> {
  const zip = await JSZip.loadAsync(arrayBuffer)

  // manifest.json 읽기
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) return null

  const manifestText = await manifestFile.async('text')
  const manifest: PdfHybridManifest = JSON.parse(manifestText)

  if (manifest.type !== 'pdf-hybrid') return null

  const pdfDataMap: Record<string, string> = {}
  const annotationsMap: Record<string, string> = {}
  const markdownMap: Record<string, string> = {}

  for (const section of manifest.sections) {
    if (section.type === 'pdf' && section.file) {
      // PDF 바이너리 → base64
      const pdfFile = zip.file(section.file)
      if (pdfFile) {
        const pdfBuffer = await pdfFile.async('arraybuffer')
        pdfDataMap[section.id] = arrayBufferToBase64(pdfBuffer)
      }

      // 주석 JSON 읽기
      if (section.annotations) {
        const annFile = zip.file(section.annotations)
        if (annFile) {
          annotationsMap[section.id] = await annFile.async('text')
        }
      }
    }

    if (section.type === 'markdown' && section.markdownFile) {
      const mdFile = zip.file(section.markdownFile)
      if (mdFile) {
        markdownMap[section.id] = await mdFile.async('text')
      }
    }
  }

  return { manifest, pdfDataMap, annotationsMap, markdownMap }
}

/**
 * ADC 파일이 pdf-hybrid 타입인지 빠르게 확인
 */
export async function isADCPdfHybrid(arrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer)
    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) return false
    const manifestText = await manifestFile.async('text')
    const manifest = JSON.parse(manifestText)
    return manifest.type === 'pdf-hybrid'
  } catch {
    return false
  }
}
