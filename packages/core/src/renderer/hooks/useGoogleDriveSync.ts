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

export function useGoogleDriveSync() {
  const {
    currentContent,
    setCurrentContent,
    setOriginalContent,
    setFilePath,
    setLastSavedTime
  } = useWorkspaceStore()

  const [activeDriveFile, setActiveDriveFile] = useState<GoogleDriveFileMetadata | null>(null)
  const [isDriveLoading, setIsDriveLoading] = useState(false)
  const [isDriveSaving, setIsDriveSaving] = useState(false)
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null)
  const initializedRef = useRef(false)

  // 1. Google Drive Open-with URL State 파싱 및 자동 파일 로딩
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
        // 인증 상태 확인 후 다운로드
        const { content, metadata } = await googleDriveService.readFileContent(targetFileId)
        
        setCurrentContent(content)
        setOriginalContent(content)
        setFilePath(`gdrive://${metadata.id}/${metadata.name}`)
        setLastSavedTime(new Date())
        setActiveDriveFile(metadata)

        // 브라우저 탭 타이틀 변경
        if (typeof document !== 'undefined') {
          document.title = `${metadata.name} - AMEVA Workstation`
        }

        // URL 쿼리 파라미터 깔끔하게 정리 (새로고침 시 중복 로드 방지)
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash
          window.history.replaceState({}, document.title, cleanUrl)
        }
      } catch (err: any) {
        console.error('[GoogleDriveSync] Deep-link file load error:', err)
        setDriveSyncError(err.message || 'Google Drive 파일을 불러오지 못했습니다.')
      } finally {
        setIsDriveLoading(false)
      }
    }

    handleDeepLink()
  }, [setCurrentContent, setOriginalContent, setFilePath, setLastSavedTime])

  // 2. Google Drive로 현재 문서 저장 함수
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

  // 3. Google Drive에 새 문서 생성 및 연결 함수
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
