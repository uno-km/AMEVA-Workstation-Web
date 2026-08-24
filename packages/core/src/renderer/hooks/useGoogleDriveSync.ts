/**
 * @file useGoogleDriveSync.ts
 * @system AMEVA Workstation - Web & Cloud Integration
 * @location src/renderer/hooks/useGoogleDriveSync.ts
 * @role Google Drive Deep Link handling, Open-with listener, and two-way synchronization
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'
import { googleDriveService } from '../services/googleDriveService'
import type { GoogleDriveFileMetadata } from '../services/googleDriveService'
import type { AmevaEditor as AppEditor } from '../editor/amevaBlockSchema'
import type { EditorMode } from '../../shared/types'

export interface UseGoogleDriveSyncProps {
  editor: AppEditor | null
  setEditorMode: (mode: EditorMode) => void
  loadMarkdownIntoEditor?: (targetEditor: AppEditor, rawContent: string, isBinary?: boolean, path?: string) => Promise<void>
}

export function useGoogleDriveSync({
  editor,
  setEditorMode,
  loadMarkdownIntoEditor,
}: UseGoogleDriveSyncProps) {
  const {
    currentContent,
    setCurrentContent,
    setOriginalContent,
    setFilePath,
    setLastSavedTime,
    updateActiveTab,
    activeTabId,
    tabs,
  } = useWorkspaceStore()

  const [activeDriveFile, setActiveDriveFile] = useState<GoogleDriveFileMetadata | null>(null)
  const [isDriveLoading, setIsDriveLoading] = useState(false)
  const [isDriveSaving, setIsDriveSaving] = useState(false)
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null)

  const initializedRef = useRef(false)
  const pendingFileRef = useRef<{ content: string; metadata: GoogleDriveFileMetadata; isBinary: boolean } | null>(null)

  // 1. Google Drive Open-with URL State 파싱 및 자동 파일 다운로드 & 마운트
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const handleDeepLink = async () => {
      const statePayload = googleDriveService.parseUrlState()
      if (!statePayload || statePayload.fileIds.length === 0) return

      const targetFileId = statePayload.fileIds[0]
      setIsDriveLoading(true)
      setDriveSyncError(null)

      try {
        console.log(`[GoogleDriveSync] Deep-link 감지됨. 대상 파일 ID: ${targetFileId} 다운로드 시작...`)
        const { content, metadata, isBinary } = await googleDriveService.readFileContent(targetFileId)
        
        const gdrivePath = `gdrive://${metadata.id}/${metadata.name}`
        setFilePath(gdrivePath)
        setLastSavedTime(new Date())
        setActiveDriveFile(metadata)

        // 브라우저 탭 타이틀 변경
        if (typeof document !== 'undefined') {
          document.title = `${metadata.name} - AMEVA Workstation`
        }

        // 워크스페이스 활성 탭 갱신
        if (activeTabId) {
          updateActiveTab(activeTabId, {
            filePath: gdrivePath,
            title: metadata.name,
            isDirty: false,
          })
        }

        // 즉시 에디터 모드로 전환 (웰컴 화면 탈출)
        setEditorMode('edit')

        // 에디터 인스턴스가 이미 마운트되어 있으면 즉시 로드, 아니면 대기 큐에 보관
        if (editor && loadMarkdownIntoEditor) {
          console.log(`[GoogleDriveSync] 에디터 인스턴스에 파일 내용 마운트 (${metadata.name})`)
          await loadMarkdownIntoEditor(editor, content, isBinary, metadata.name)
        } else {
          console.log(`[GoogleDriveSync] 에디터 인스턴스 대기 중... 파일 정보 큐에 저장`)
          pendingFileRef.current = { content, metadata, isBinary }
          if (!isBinary) {
            setCurrentContent(content)
            setOriginalContent(content)
          }
        }

        // URL 쿼리 파라미터 정리 (새로고침 시 중복 재요청 방지)
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash
          window.history.replaceState({}, document.title, cleanUrl)
        }
      } catch (err: any) {
        console.error('[GoogleDriveSync] Deep-link 파일 로드 오류:', err)
        setDriveSyncError(err.message || 'Google Drive 파일을 불러오지 못했습니다.')
      } finally {
        setIsDriveLoading(false)
      }
    }

    handleDeepLink()
  }, [editor, loadMarkdownIntoEditor, setEditorMode, setCurrentContent, setOriginalContent, setFilePath, setLastSavedTime, activeTabId, updateActiveTab])

  // 2. 에디터가 뒤늦게 초기화 마운트되었을 때 대기 중인 Google Drive 파일 주입
  useEffect(() => {
    if (editor && pendingFileRef.current && loadMarkdownIntoEditor) {
      const { content, metadata, isBinary } = pendingFileRef.current
      pendingFileRef.current = null
      console.log(`[GoogleDriveSync] 에디터 마운트 완료 -> 대기 중이던 Google Drive 파일 주입: ${metadata.name}`)
      setEditorMode('edit')
      loadMarkdownIntoEditor(editor, content, isBinary, metadata.name).catch((err) => {
        console.error('[GoogleDriveSync] Delayed load markdown failed:', err)
      })
    }
  }, [editor, loadMarkdownIntoEditor, setEditorMode])

  // 3. Google Drive로 현재 문서 저장 함수
  const saveToGoogleDrive = useCallback(async (customFileId?: string) => {
    const fileId = customFileId || activeDriveFile?.id
    if (!fileId) {
      throw new Error('연결된 Google Drive 파일 ID가 없습니다.')
    }

    setIsDriveSaving(true)
    setDriveSyncError(null)
    try {
      const updatedMeta = await googleDriveService.saveFileContent(fileId, currentContent)
      setActiveDriveFile(updatedMeta)
      setOriginalContent(currentContent)
      setLastSavedTime(new Date())
      return updatedMeta
    } catch (err: any) {
      console.error('[GoogleDriveSync] Save to drive error:', err)
      setDriveSyncError(err.message || 'Google Drive 저장 중 오류가 발생했습니다.')
      throw err
    } finally {
      setIsDriveSaving(false)
    }
  }, [activeDriveFile, currentContent, setOriginalContent, setLastSavedTime])

  // 4. Google Drive에 새 문서 생성 및 연결 함수
  const createInGoogleDrive = useCallback(async (fileName = 'Untitled.md') => {
    setIsDriveSaving(true)
    setDriveSyncError(null)
    try {
      const createdMeta = await googleDriveService.createFile(fileName, currentContent)
      setActiveDriveFile(createdMeta)
      setFilePath(`gdrive://${createdMeta.id}/${createdMeta.name}`)
      setOriginalContent(currentContent)
      setLastSavedTime(new Date())
      return createdMeta
    } catch (err: any) {
      console.error('[GoogleDriveSync] Create in drive error:', err)
      setDriveSyncError(err.message || 'Google Drive 새 파일 생성 실패')
      throw err
    } finally {
      setIsDriveSaving(false)
    }
  }, [currentContent, setFilePath, setOriginalContent, setLastSavedTime])

  return {
    activeDriveFile,
    isDriveLoading,
    isDriveSaving,
    driveSyncError,
    saveToGoogleDrive,
    createInGoogleDrive
  }
}
