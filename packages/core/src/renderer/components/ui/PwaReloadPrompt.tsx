import React from 'react'
// @ts-ignore: vite-plugin-pwa virtual module
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from '../../i18n/useTranslation'

export function PwaReloadPrompt() {
  const { t } = useTranslation()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered:', r)
      // 1시간 단위로 백그라운드 폴링 (서버의 sw.js가 변경되었는지 1KB 핑 체크)
      if (r) {
        setInterval(() => {
          console.log('Checking for new SW version...')
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // 팝업이 뜰 조건이 아니면 렌더링 안함
  if (!offlineReady && !needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: 99999,
      background: 'var(--bg-panel, #1e1e24)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '320px',
      color: 'var(--text-main, #f3f4f6)'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {offlineReady ? (
          <>
            <span>✅</span>
            <span>{t.pwa.offlineReady}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '16px' }}>🚀</span>
            <span>{t.pwa.newRelease}</span>
          </>
        )}
      </div>
      
      {!offlineReady && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)' }}>
          {t.pwa.newReleaseDesc}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              background: 'var(--primary, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary, #3b82f6)'}
          >
            {t.pwa.updateBtn}
          </button>
        )}
        <button
          onClick={close}
          style={{
            background: 'transparent',
            color: 'var(--text-muted, #9ca3af)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {t.pwa.dismissBtn}
        </button>
      </div>
    </div>
  )
}
