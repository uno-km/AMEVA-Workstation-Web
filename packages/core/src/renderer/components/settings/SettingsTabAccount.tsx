/**
 * @file SettingsTabAccount.tsx
 * @system AMEVA Workstation - Client Settings Tab
 * @location src/renderer/components/settings/SettingsTabAccount.tsx
 * @role Google account centralized settings and integration view
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 오직 구글 인증(Google Login)을 통한 로그인만 허용하며, 타사 로그인 및 임의 수동 닉네임 수정을 통제한다.
 * - 구글 드라이브(Google Drive) 스코프 통합 여부를 체크박스를 통해 동의받아 연동 처리한다.
 * - 안전 키체인과 연동되는 영속성 로그인 세션의 기동 시점 체크 및 갱신 상태를 UI에 표시한다.
 */

import React, { useState, useEffect } from 'react'
import { Globe, LogOut, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAppContext } from '../../contexts/AppContext'

export interface SettingsTabAccountProps {
  activeTab: string
  tempName: string
  setTempName: (name: string) => void
  tempColor: string
  setTempColor: (color: string) => void
  handleSaveUser: () => void
}

export function SettingsTabAccount({
  activeTab,
  tempName,
  setTempName,
  tempColor,
  setTempColor,
  handleSaveUser,
}: SettingsTabAccountProps) {
  const { setUsername } = useAppContext()
  const [googleUser, setGoogleUser] = useState<any | null>(null)
  const [connectDrive, setConnectDrive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // 🦾 [SESSION AUTO-CONNECT] 설정 탭 활성화 시 암호화 보관소 자격 증명 상태 조회
  useEffect(() => {
    if (activeTab === 'Account' && !initialized) {
      checkLoginStatus()
    }
  }, [activeTab, initialized])

  const checkLoginStatus = async () => {
    if (!window.electronAPI?.googleAuthGetStatus) return
    try {
      const res = await window.electronAPI.googleAuthGetStatus()
      if (res.success && res.user) {
        setGoogleUser(res.user)
        setConnectDrive(res.user.isDriveConnected)
        setUsername(res.user.name)
        setTempName(res.user.name)
      } else {
        setGoogleUser(null)
      }
    } catch (err) {
      console.error('[AccountTab] 로그인 상태 검증 오류:', err)
    } finally {
      setInitialized(true)
    }
  };

  // 🦾 [GOOGLE OAUTH ACTION] 구글 로그인 시동
  const handleGoogleLogin = async () => {
    if (!window.electronAPI?.googleAuthLogin) return
    setLoading(true)
    try {
      const res = await window.electronAPI.googleAuthLogin(connectDrive)
      if (res.success && res.user) {
        setGoogleUser(res.user)
        setUsername(res.user.name)
        setTempName(res.user.name)
        alert('구글 계정 인증 및 연동이 성공적으로 완료되었습니다!')
      } else {
        alert(res.error || '구글 로그인에 실패했습니다. 다시 시도해 주세요.')
      }
    } catch (err: any) {
      alert(`로그인 오류: ${err.message}`)
    } finally {
      setLoading(false)
    }
  };

  // 🦾 [GOOGLE SIGN OUT ACTION] 구글 로그아웃 진행
  const handleGoogleLogout = async () => {
    if (!window.electronAPI?.googleAuthLogout) return
    if (!confirm('정말로 로그아웃하고 구글 계정 연결을 해제하시겠습니까?')) return
    setLoading(true)
    try {
      const res = await window.electronAPI.googleAuthLogout()
      if (res.success) {
        setGoogleUser(null)
        setUsername('')
        setTempName('')
        alert('성공적으로 로그아웃되었습니다.')
      }
    } catch (err: any) {
      alert(`로그아웃 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  };

  if (activeTab !== 'Account') return null

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>
        구글 계정 관리 (Google Account)
      </h3>
      <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
        AMEVA Workstation은 완벽한 보안 환경을 제공하기 위해 오직 Google 공식 OAuth 2.0 및 암호화 키체인을 통한 구글 단독 로그인만 허용합니다.
      </p>

      {googleUser ? (
        // 🦾 [CASE 1: LOGIN STATE] 로그인 되어 있는 상태
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-glass-subtle)',
              border: '1px solid var(--border-muted)',
              borderRadius: '8px',
            }}
          >
            {googleUser.picture ? (
              <img 
                src={googleUser.picture} 
                alt="Avatar" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-glow)' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: '#f97316', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '16px'
                }}
              >
                {googleUser.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{googleUser.name}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{googleUser.email}</div>
            </div>
          </div>

          {/* 구글 드라이브 연결 상태 정보 */}
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: googleUser.isDriveConnected ? 'rgba(52,168,83,0.06)' : 'rgba(234,67,53,0.06)',
              border: `1px solid ${googleUser.isDriveConnected ? 'rgba(52,168,83,0.2)' : 'rgba(234,67,53,0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {googleUser.isDriveConnected ? (
                <>
                  <CheckCircle2 size={14} style={{ color: '#34a853' }} />
                  <span style={{ fontSize: '11px', color: '#34a853', fontWeight: 600 }}>구글 드라이브 연결 완료 (Active)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} style={{ color: '#ea4335' }} />
                  <span style={{ fontSize: '11px', color: '#ea4335', fontWeight: 600 }}>구글 드라이브 연결 없음 (Disconnected)</span>
                </>
              )}
            </div>
            {!googleUser.isDriveConnected && (
              <button
                onClick={() => {
                  setConnectDrive(true)
                  setTimeout(() => handleGoogleLogin(), 100)
                }}
                style={{
                  padding: '4px 8px', borderRadius: '4px',
                  background: 'var(--primary)', border: 'none', color: '#fff',
                  fontSize: '9.5px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                드라이브 연결 추가
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={checkLoginStatus}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '6px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                color: 'var(--text-main)', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              동기화 확인
            </button>
            <button
              onClick={handleGoogleLogout}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <LogOut size={12} />
              계정 연결 해제 (Sign Out)
            </button>
          </div>
        </div>
      ) : (
        // 🦾 [CASE 2: LOGOUT STATE] 로그인 되지 않은 상태
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div 
            style={{
              padding: '16px',
              background: 'var(--bg-glass-subtle)',
              border: '1px solid var(--border-muted)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px'
            }}
          >
            <Globe size={32} style={{ color: '#4285f4', marginBottom: '4px' }} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>구글 통합 로그인으로 안전하게 협업하세요</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '280px' }}>
              사용자 구글 프로필은 로컬 장치의 안전 스토리지 키체인으로 엄격하게 암호화되어 보호됩니다.
            </div>
          </div>

          {/* 구글 드라이브 동의 체크박스 */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-muted)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setConnectDrive(!connectDrive)}
          >
            <input 
              type="checkbox" 
              checked={connectDrive}
              onChange={() => {}} // 부모 div 클릭으로 조절
              style={{ marginTop: '2px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 600 }}>Google Drive (구글 드라이브) 연결</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                체크 시 문서 백업 및 클라우드 동기화를 위한 드라이브 통합 권한을 승인합니다.
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: '#4285f4',
              color: '#fff',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#357ae8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#4285f4')}
          >
            <svg style={{ width: '15px', height: '15px', fill: '#fff' }} viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.445-2.89-6.445-6.445s2.89-6.445 6.445-6.445c1.554 0 2.97.553 4.076 1.472l3.19-3.19C19.26 1.839 15.932 1 12.24 1 5.866 1 .682 6.182.682 12.56S5.866 24.12 12.24 24.12c5.855 0 11.2-4.186 11.2-11.56 0-.742-.08-1.464-.22-2.164H12.24z"/>
            </svg>
            Google 계정으로 계속하기
          </button>
        </div>
      )}
    </>
  )
}
