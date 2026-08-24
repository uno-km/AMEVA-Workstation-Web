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
      console.log(`[GoogleDriveSync] Google Drive Deep-link 감지됨. 대상 파일 ID: ${targetFileId}`)

      // 1) 즉시 웰컴 배너를 닫고 에디터 모드로 전환
      setEditorMode('edit')
      setIsDriveLoading(true)
      setDriveSyncError(null)

      const tempPath = `gdrive://${targetFileId}/Google_Drive_Document`
      setFilePath(tempPath)
      if (typeof document !== 'undefined') {
        document.title = `Loading Google Drive File... - AMEVA Workstation`
      }

      try {
        // 2) Google 로그인 토큰 확인 (없으면 로그인 시도)
        let user = googleDriveService.getStoredUser()
        if (!user || !user.accessToken) {
          console.log('[GoogleDriveSync] 구글 드라이브 접근 토큰 획득 시도...')
          const loginRes = await googleDriveService.login(true)
          if (!loginRes.success || !loginRes.user?.accessToken) {
            throw new Error(loginRes.error || 'Google Drive 접근 권한 승인이 필요합니다.')
          }
          user = loginRes.user
        }

        // 3) Google Drive 파일 메타데이터 및 본문 다운로드
        const { content, metadata, isBinary } = await googleDriveService.readFileContent(targetFileId, user.accessToken)
        
        const gdrivePath = `gdrive://${metadata.id}/${metadata.name}`
        setFilePath(gdrivePath)
        setLastSavedTime(new Date())
        setActiveDriveFile(metadata)

        if (typeof document !== 'undefined') {
          document.title = `${metadata.name} - AMEVA Workstation`
        }

        if (activeTabId) {
          updateActiveTab(activeTabId, {
            filePath: gdrivePath,
            title: metadata.name,
            isDirty: false,
          })
        }

        // 4) 에디터 또는 뷰어에 파일 주입
        if (editor && loadMarkdownIntoEditor) {
          console.log(`[GoogleDriveSync] 에디터에 파일 내용 마운트 (${metadata.name})`)
          await loadMarkdownIntoEditor(editor, content, isBinary, metadata.name)
        } else {
          console.log(`[GoogleDriveSync] 에디터 초기화 대기 큐에 파일 정보 저장`)
          pendingFileRef.current = { content, metadata, isBinary }
          if (!isBinary) {
            setCurrentContent(content)
            setOriginalContent(content)
          }
        }

        // URL 쿼리 파라미터 정리
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash
          window.history.replaceState({}, document.title, cleanUrl)
        }
      } catch (err: any) {
        console.error('[GoogleDriveSync] Deep-link 파일 로드 오류:', err)
        setDriveSyncError(err.message || 'Google Drive 파일을 불러오지 못했습니다.')
        
        // 오류 발생 시에도 웰컴 배너로 되돌아가지 않고, 에디터에 명확한 안내 화면 노출
        const errorMarkdown = `# ☁️ Google Drive 파일 로드 안내

Google Drive에서 요청하신 파일(ID: \`${targetFileId}\`)을 불러오는 중 인증 또는 권한 확인이 필요합니다.

> ⚠️ **안내**: ${err.message || 'Google Drive 접근 토큰이 만료되었거나 승인이 필요합니다.'}

### 💡 해결 방법
1. 상단 메뉴바의 계정 아이콘 또는 사이드바에서 **[Google 로그인]**을 진행해주세요.
2. 로그인 완료 후 문서를 다시 여시면 내용이 즉시 렌더링됩니다.
`
        setCurrentContent(errorMarkdown)
        if (editor) {
          editor.tryParseMarkdownToBlocks(errorMarkdown).then(blocks => {
            editor.replaceBlocks(editor.document, blocks)
          }).catch(() => {})
        }
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
