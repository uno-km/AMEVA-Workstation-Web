/**
 * @file googleDriveService.ts
 * @system AMEVA Workstation - Web & Cloud Integration
 * @location src/renderer/services/googleDriveService.ts
 * @role Google Identity Services (GIS) OAuth 2.0 & Google Drive REST API v3 Integration
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - Google Identity Services(GIS) 클라이언트 SDK를 통한 Web OAuth 2.0 토큰 라이프사이클 관리.
 * - Google Drive "연결할 앱(Open with)" deep-link URL `state` 파싱 및 대상 파일 다운로드/마운트.
 * - Google Drive API v3 (files.get, files.update, files.create) 양방향 동기화 처리.
 * - Electron 환경(Desktop)과 Web 브라우저 환경 간 일관된 인증/스토리지 추상화 계층 제공.
 */

export interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
  accessToken: string
  expiresAt: number
  isDriveConnected: boolean
}

export interface GoogleDriveFileMetadata {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
}

export interface DriveStatePayload {
  fileIds: string[]
  action: 'open' | 'create' | string
  userId?: string
}

const STORAGE_KEY = 'ameva_google_user'
const DEFAULT_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '784272924846-8cf6so3bir6etotoihjtqk3hsrj43bhq.apps.googleusercontent.com'

class GoogleDriveService {
  private clientId: string = DEFAULT_CLIENT_ID
  private tokenClient: any = null
  private gisLoadedPromise: Promise<void> | null = null

  constructor() {
    // URL state 체크 및 저장된 세션 복원
    this.restoreSession()
  }

  public setClientId(clientId: string) {
    this.clientId = clientId
    this.tokenClient = null
  }

  public getClientId(): string {
    return this.clientId
  }

  /**
   * GIS (Google Identity Services) 스크립트 동적 로드
   */
  public async loadGisScript(): Promise<void> {
    if (typeof window === 'undefined') return
    if ((window as any).google?.accounts?.oauth2) {
      return Promise.resolve()
    }
    if (this.gisLoadedPromise) {
      return this.gisLoadedPromise
    }

    this.gisLoadedPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', (e) => reject(e))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = (e) => reject(new Error(`Failed to load Google Identity Services: ${e}`))
      document.head.appendChild(script)
    })

    return this.gisLoadedPromise
  }

  /**
   * 로컬 스토리지에서 인증 세션 복원
   */
  public getStoredUser(): GoogleUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const user: GoogleUser = JSON.parse(raw)
      // 토큰 만료 여부 검사 (5분 버퍼)
      if (user.expiresAt && Date.now() > user.expiresAt - 5 * 60 * 1000) {
        return { ...user, accessToken: '' } // 만료됨
      }
      return user
    } catch {
      return null
    }
  }

  private saveStoredUser(user: GoogleUser | null) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    }
  }

  private restoreSession() {
    const user = this.getStoredUser()
    if (user && user.accessToken) {
      // 세션 유효
    }
  }

  /**
   * Google OAuth 2.0 로그인 및 Access Token 발급 (Web GIS)
   */
  public async login(connectDrive = true): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
    try {
      await this.loadGisScript()
      const google = (window as any).google
      if (!google?.accounts?.oauth2) {
        return { success: false, error: 'Google Identity Services SDK 초기화에 실패했습니다.' }
      }

      const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        ...(connectDrive ? ['https://www.googleapis.com/auth/drive.file'] : [])
      ].join(' ')

      return new Promise((resolve) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: scopes,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              resolve({ success: false, error: tokenResponse.error_description || tokenResponse.error })
              return
            }

            try {
              const accessToken = tokenResponse.access_token
              const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600
              const expiresAt = Date.now() + expiresIn * 1000

              // 사용자 프로필 수신
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              })
              const profile = await profileRes.json()

              const user: GoogleUser = {
                id: profile.sub || profile.id,
                name: profile.name || profile.email?.split('@')[0] || 'Google User',
                email: profile.email || '',
                picture: profile.picture || '',
                accessToken,
                expiresAt,
                isDriveConnected: connectDrive
              }

              this.saveStoredUser(user)
              resolve({ success: true, user })
            } catch (err: any) {
              resolve({ success: false, error: `프로필 정보 획득 실패: ${err.message}` })
            }
          },
          error_callback: (err: any) => {
            resolve({ success: false, error: err.message || 'OAuth 팝업이 닫혔거나 취소되었습니다.' })
          }
        })

        client.requestAccessToken({ prompt: '' })
      })
    } catch (err: any) {
      return { success: false, error: err.message || 'Google 로그인 중 오류가 발생했습니다.' }
    }
  }

  /**
   * Google 로그아웃
   */
  public async logout(): Promise<{ success: boolean }> {
    const user = this.getStoredUser()
    if (user?.accessToken && (window as any).google?.accounts?.oauth2) {
      try {
        (window as any).google.accounts.oauth2.revoke(user.accessToken, () => {})
      } catch (err) {
        console.warn('[googleDrive] Token revoke error:', err)
      }
    }
    this.saveStoredUser(null)
    return { success: true }
  }

  /**
   * 현재 로그인 세션 상태 반환
   */
  public async getStatus(): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
    const user = this.getStoredUser()
    if (!user) {
      return { success: false, error: '로그인되어 있지 않습니다.' }
    }
    if (!user.accessToken) {
      return { success: false, user, error: '토큰이 만료되었습니다. 재로그인이 필요합니다.' }
    }
    return { success: true, user }
  }

  /**
   * 유효한 Access Token 획득 (만료 시 자동 재로그인 트리거)
   */
  public async getValidAccessToken(): Promise<string> {
    const user = this.getStoredUser()
    if (user && user.accessToken && Date.now() < user.expiresAt - 60 * 1000) {
      return user.accessToken
    }
    const res = await this.login(true)
    if (res.success && res.user?.accessToken) {
      return res.user.accessToken
    }
    throw new Error(res.error || 'Google Drive 접근 토큰을 획득할 수 없습니다.')
  }

  /**
   * Google Drive Open-with URL State 파서
   * Google Drive에서 "연결할 앱" 선택 시 들어오는 URL 쿼리 해석
   * 예: ?state={"ids":["0B-xxxx"],"action":"open","userId":"10xxxx"}
   */
  public parseUrlState(): DriveStatePayload | null {
    if (typeof window === 'undefined') return null
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const stateRaw = urlParams.get('state')
      if (stateRaw) {
        const parsed = JSON.parse(stateRaw)
        if (parsed && Array.isArray(parsed.ids) && parsed.ids.length > 0) {
          return {
            fileIds: parsed.ids,
            action: parsed.action || 'open',
            userId: parsed.userId
          }
        }
      }

      // 폴백 쿼리 파라미터 체크: ?fileId=... or ?driveId=...
      const directFileId = urlParams.get('fileId') || urlParams.get('driveId') || urlParams.get('id')
      if (directFileId) {
        return {
          fileIds: [directFileId],
          action: 'open'
        }
      }
    } catch (err) {
      console.warn('[googleDrive] State 파싱 오류:', err)
    }
    return null
  }

  /**
   * Google Drive 파일 메타데이터 조회
   */
  public async getFileMetadata(fileId: string, accessToken?: string): Promise<GoogleDriveFileMetadata> {
    const token = accessToken || (await this.getValidAccessToken())
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Google Drive 파일 정보 조회 실패 (${res.status}): ${errBody}`)
    }
    return await res.json()
  }

  /**
   * Google Drive 파일 내용 다운로드 (Raw text)
   */
  public async readFileContent(fileId: string, accessToken?: string): Promise<{ content: string; metadata: GoogleDriveFileMetadata }> {
    const token = accessToken || (await this.getValidAccessToken())
    const metadata = await this.getFileMetadata(fileId, token)

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Google Drive 파일 다운로드 실패 (${res.status}): ${errBody}`)
    }
    const content = await res.text()
    return { content, metadata }
  }

  /**
   * Google Drive 파일 내용 업데이트 (양방향 실시간 저장)
   */
  public async saveFileContent(fileId: string, content: string, accessToken?: string, mimeType = 'text/markdown; charset=UTF-8'): Promise<GoogleDriveFileMetadata> {
    const token = accessToken || (await this.getValidAccessToken())
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType
      },
      body: content
    })
    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Google Drive 파일 저장 실패 (${res.status}): ${errBody}`)
    }
    return await res.json()
  }

  /**
   * Google Drive에 신규 파일 생성
   */
  public async createFile(name: string, content: string, accessToken?: string, mimeType = 'text/markdown'): Promise<GoogleDriveFileMetadata> {
    const token = accessToken || (await this.getValidAccessToken())
    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metadata = {
      name,
      mimeType
    }

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Google Drive 파일 생성 실패 (${res.status}): ${errBody}`)
    }

    return await res.json()
  }
}

export const googleDriveService = new GoogleDriveService()
