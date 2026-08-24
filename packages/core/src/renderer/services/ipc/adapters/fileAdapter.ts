/**
 * ============================================================================
 * @file fileAdapter.ts
 * @description fileAdapter.ts 파일 작업 및 외부 링크 오픈 IPC 어댑터 모듈입니다.
 * ============================================================================
 */

import type { FileOpenEventData, UrlMetadata } from '../ipcTypes'

export async function openFile(): Promise<FileOpenEventData | null> {
  if (typeof window.electronAPI?.openFile !== 'function') return null
  return window.electronAPI.openFile()
}

export async function saveFile(
  content: string,
  filePath?: string | null
): Promise<{ filePath?: string; success: boolean }> {
  if (typeof window.electronAPI?.saveFile !== 'function') return { success: false }
  return window.electronAPI.saveFile(content, filePath)
}

export async function saveFileAs(
  content: string,
  filePath?: string | null
): Promise<{ filePath?: string; success: boolean }> {
  if (typeof window.electronAPI?.saveFileAs !== 'function') return { success: false }
  return window.electronAPI.saveFileAs(content, filePath)
}

export async function selectLocalFile(
  filters?: Array<{ name: string; extensions: string[] }>
): Promise<{ filePath: string; base64: string } | null> {
  if (typeof window.electronAPI?.selectLocalFile !== 'function') return null
  return window.electronAPI.selectLocalFile(filters)
}

export function onFileOpenArgv(
  callback: (event: unknown, file: FileOpenEventData) => void
): () => void {
  if (typeof window.electronAPI?.onFileOpenArgv !== 'function') return () => {}
  return window.electronAPI.onFileOpenArgv(callback)
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  if (!window.electronAPI?.fetchUrlMetadata) return {}
  try {
    return await window.electronAPI.fetchUrlMetadata(url)
  } catch (e) {
    console.error('[fetchUrlMetadata] URL 메타데이터 조회 실패:', e)
    return {}
  }
}

export function openExternalLink(url: string): void {
  // [SEC-W-010] 링크 연결 시 위험 스킴(javascript, data, vbscript 등) 사전 차단
  const trimmed = (url || '').trim().toLowerCase()
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    console.warn('[SECURITY WARNING] Blocked unsafe external link scheme:', url)
    return
  }

  if (!window.electronAPI?.openExternalLink) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    return
  }
  window.electronAPI.openExternalLink(url)
}
