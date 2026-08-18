/**
 * ============================================================================
 * @file adcPackager.ts
 * @description adcPackager.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './adcPackager';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file adcPackager.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/adcPackager.ts
 * @role Application Data Container (ADC) / Markdown Export Packager
 */
// [외부 패키지 및 라이브러리 임포트: jszip]
import JSZip from 'jszip'
// [내부 프로젝트 의존성 모듈 임포트: ./vfsDatabase]
import { getAttachment, saveAttachment } from './vfsDatabase'

/**
 * [CONTRACT - ArrayBuffer to Base64 String]
 * - Rationale: 아카이빙된 zip 바이너리를 문서 블록(HTML/JSON) 내에 base64 텍스트 형태로 임베딩하기 위해 변환한다.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
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
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
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
export async function packMarkdownToADC(markdown: string, metadata?: any, rawBlocks?: any[]): Promise<Blob> {
  const zip = new JSZip()
  let processedMarkdown = markdown
  let blocksJsonStr = rawBlocks ? JSON.stringify(rawBlocks) : null

  let mediaIndex = 0

  const manifestFiles: any[] = []

  const alreadyCompressedTypes = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/hwp+zip',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ])

  const getCompressionOptions = (mime: string) => {
    const isCompressed = alreadyCompressedTypes.has(mime)
    return {
      compression: isCompressed ? 'STORE' : 'DEFLATE',
      compressionOptions: isCompressed ? undefined : { level: 6 }
    }
  }

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
        const ext = item.absolutePath.split('.').pop()?.toLowerCase() || 'png'
        let mime = `image/${ext}`
        if (ext === 'pdf') mime = 'application/pdf'
        else if (['pptx', 'ppt'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        else if (['xlsx', 'xls'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        else if (['docx', 'doc'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else if (ext === 'hwpx') mime = 'application/hwp+zip'

        const res = await window.electronAPI.readBinary(item.absolutePath)
        if (res && res.success && res.data) {
          const buffer = base64ToArrayBuffer(res.data)
          // @ts-ignore
          zip.file(item.zipPath, buffer, getCompressionOptions(mime))

          manifestFiles.push({
            id: `file-${mediaIndex}`,
            path: item.zipPath,
            name: item.absolutePath.split(/[\\/]/).pop() || `file_${mediaIndex}.${ext}`,
            mediaType: mime,
            role: 'media'
          })

          processedMarkdown = processedMarkdown.split(item.full).join(item.zipPath)
          if (blocksJsonStr) blocksJsonStr = blocksJsonStr.split(item.full).join(item.zipPath)
        }
      } catch (err) {
        console.error(`[packMarkdownToADC] 로컬 미디어 파일 읽기 실패: ${item.absolutePath}`, err)
      }
    }
  }

  // 1.5) ameva-vfs 가상 파일 시스템 내의 파일 감지 및 압축 (마크다운 및 블록 JSON 모두 탐색)
  const vfsMediaRegex = /ameva-vfs:\/\/([^\s"'()#?,\\\]]+)/g
  const vfsMatches: { full: string; fileId: string }[] = []
  let vfsMatch

  const fullSearchTarget = processedMarkdown + ' ' + (blocksJsonStr || '')
  const tempVfsRegex = new RegExp(vfsMediaRegex)
  while ((vfsMatch = tempVfsRegex.exec(fullSearchTarget)) !== null) {
    const full = vfsMatch[0]
    const fileId = vfsMatch[1]

    if (vfsMatches.some(m => m.fileId === fileId)) continue

    vfsMatches.push({ full, fileId })
  }

  for (const item of vfsMatches) {
    try {
      const blob = await getAttachment(item.fileId)
      if (blob) {
        const buffer = await blob.arrayBuffer()
        const mime = blob.type || 'application/octet-stream'
        
        let ext = mime.split('/')[1] || 'png'
        if (mime.startsWith('video/')) {
          ext = mime.replace('video/', '').replace('quicktime', 'mov').split(';')[0] || 'webm'
        } else if (mime.startsWith('audio/')) {
          ext = mime.replace('audio/', '').split(';')[0] || 'mp3'
        } else if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') ext = 'pptx'
        else if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ext = 'xlsx'
        else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ext = 'docx'
        else if (mime === 'application/pdf') ext = 'pdf'
        else if (mime === 'application/hwp+zip') ext = 'hwpx'
        
        const zipPath = `media/file_${mediaIndex++}.${ext}`

        // @ts-ignore
        zip.file(zipPath, buffer, getCompressionOptions(mime))

        manifestFiles.push({
          id: item.fileId,
          path: zipPath,
          name: zipPath.split('/').pop() || `file_${mediaIndex}`,
          mediaType: mime,
          role: 'media'
        })
      }
    } catch (err) {
      console.error(`[packMarkdownToADC] VFS 파일 읽기 실패: ${item.fileId}`, err)
    }
  }

  // 2) 기존 dataUrlRegex 매칭 (폴백 및 타 리소스용)
  const dataUrlRegex = /data:([a-zA-Z0-9/+\-_.=]+);base64,([a-zA-Z0-9+/=]+)/g
  const dataMatches: { full: string; mime: string; base64: string; path: string; fileId: string }[] = []
  let dataMatch
  const tempRegex = new RegExp(dataUrlRegex)
  while ((dataMatch = tempRegex.exec(processedMarkdown)) !== null) {
    const full = dataMatch[0]
    const mime = dataMatch[1]
    const base64 = dataMatch[2]

    if (dataMatches.some(m => m.full === full)) continue

    let ext = mime.split('/')[1] || 'png'
    if (mime.startsWith('video/')) ext = mime.replace('video/', '').split(';')[0] || 'webm'
    else if (mime.startsWith('audio/')) ext = mime.replace('audio/', '').split(';')[0] || 'mp3'
    else if (mime === 'application/pdf') ext = 'pdf'
    else if (mime.includes('presentationml')) ext = 'pptx'
    else if (mime.includes('spreadsheetml')) ext = 'xlsx'
    else if (mime.includes('wordprocessingml')) ext = 'docx'
    else if (mime === 'application/hwp+zip') ext = 'hwpx'

    const fileId = `0ffc56dc-${Math.random().toString(36).substring(2, 10)}`
    const fileName = `media/${fileId}.${ext}`
    dataMatches.push({ full, mime, base64, path: fileName, fileId })
  }

  for (const item of dataMatches) {
    const buffer = base64ToArrayBuffer(item.base64)
    // @ts-ignore
    zip.file(item.path, buffer, getCompressionOptions(item.mime))

    manifestFiles.push({
      id: item.fileId,
      path: item.path,
      name: item.path.split('/').pop() || `file_${item.fileId}.${item.path.split('.').pop()}`,
      mediaType: item.mime,
      role: 'media'
    })

    const vfsUrl = `ameva-vfs://${item.fileId}`
    processedMarkdown = processedMarkdown.split(item.full).join(vfsUrl)
    if (blocksJsonStr) blocksJsonStr = blocksJsonStr.split(item.full).join(vfsUrl)
  }

  // 경로 변환된 마크다운 문서 및 블록 삽입
  // @ts-ignore
  zip.file('document.md', processedMarkdown, { compression: 'DEFLATE', compressionOptions: { level: 6 } })
  if (blocksJsonStr) {
    // @ts-ignore
    zip.file('blocks.json', blocksJsonStr, { compression: 'DEFLATE', compressionOptions: { level: 6 } })
  }

  // 정식 ADC 포맷 Manifest 기록
  const manifestObj = {
    format: 'ADC',
    version: '1.0',
    id: `adc-${crypto.randomUUID()}`,
    title: metadata?.title || 'Ameva Document',
    author: metadata?.author || 'Unknown',
    createdAt: metadata?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entry: 'document.md',
    files: manifestFiles
  }
  // @ts-ignore
  zip.file('manifest.json', JSON.stringify(manifestObj, null, 2), { compression: 'DEFLATE', compressionOptions: { level: 6 } })
  // 하위 호환을 위한 meta.json (점진적 전환)
  // @ts-ignore
  zip.file('meta.json', JSON.stringify(manifestObj, null, 2), { compression: 'DEFLATE', compressionOptions: { level: 6 } })

  // jszip 바이너리 패키지 출력 리턴
  return await zip.generateAsync({ type: 'blob' })
}

/**
 * unpackADCToMarkdown 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function unpackADCToMarkdown(arrayBuffer: ArrayBuffer): Promise<{ markdown: string, blocks?: any[] }> {
  const zip = await JSZip.loadAsync(arrayBuffer)
  const docFile = zip.file('document.md')
  if (!docFile) {
    throw new Error('Invalid .adc package: document.md not found')
  }

  let markdown = await docFile.async('text')

  const blocksFile = zip.file('blocks.json')
  let blocksText = blocksFile ? await blocksFile.async('text') : null

  // 미디어 파일 경로 추출 (마크다운 및 블록 데이터 모두 탐색, UUID 등 하이픈 포함 확장자 지원)
  const mediaRegex = /media\/file_\d+\.[a-zA-Z0-9\-]+/g
  const allText = markdown + (blocksText || '')
  const matches = Array.from(allText.matchAll(mediaRegex)).map(m => m[0])
  const uniquePaths = Array.from(new Set(matches))

  let manifestFiles: any[] = []
  const manifestFile = zip.file('manifest.json') || zip.file('meta.json')
  if (manifestFile) {
    try {
      const parsed = JSON.parse(await manifestFile.async('text'))
      if (parsed.files) manifestFiles = parsed.files
    } catch (err) {}
  }

  // 1. 매니페스트에 등록된 파일들을 VFS에 등록
  for (const mf of manifestFiles) {
    const file = zip.file(mf.path)
    if (file) {
      const buffer = await file.async('arraybuffer')
      const blob = new Blob([buffer], { type: mf.mediaType || 'application/octet-stream' })
      await saveAttachment(mf.id, blob)
    }
  }

  // 2. 구형 포맷(마크다운 내에 media/file_... 경로가 하드코딩된 경우)을 ameva-vfs:// 로 자동 변환
  for (const path of uniquePaths) {
    const file = zip.file(path)
    if (file) {
      let mf = manifestFiles.find(f => f.path === path)
      let fileId = mf ? mf.id : null

      if (!fileId) {
        // 매니페스트에 없는 레거시 파일인 경우 즉석에서 VFS에 등록
        fileId = `0ffc56dc-${Math.random().toString(36).substring(2, 10)}`
        const buffer = await file.async('arraybuffer')
        const ext = path.split('.').pop()?.toLowerCase() || 'png'
        let mime = `image/${ext}`
        if (ext === 'pdf') mime = 'application/pdf'
        else if (['pptx', 'ppt'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        else if (['xlsx', 'xls'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        else if (['docx', 'doc'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else if (ext === 'hwpx') mime = 'application/hwp+zip'
        
        const blob = new Blob([buffer], { type: mime })
        await saveAttachment(fileId, blob)
      }

      const vfsUrl = `ameva-vfs://${fileId}`
      markdown = markdown.split(path).join(vfsUrl)
      if (blocksText) blocksText = blocksText.split(path).join(vfsUrl)
    }
  }

  let blocks: any[] | undefined = undefined
  if (blocksText) {
    try {
      blocks = JSON.parse(blocksText)
    } catch (err) {
      console.error('[unpackADCToMarkdown] Failed to parse blocks.json', err)
    }
  }

  return { markdown, blocks }
}

// 헬퍼: 확장자에 따른 MIME 타입 검출
/**
 * getMimeType 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * PdfHybridSection 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * PdfHybridManifest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface PdfHybridManifest {
  version: '2.0'
  type: 'pdf-hybrid'
  title: string
  sections: PdfHybridSection[]
  createdAt: string
  author?: string
}

/**
 * PdfHybridDocument 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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
