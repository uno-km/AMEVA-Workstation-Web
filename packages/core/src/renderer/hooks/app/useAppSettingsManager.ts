/**
 * ============================================================================
 * @file useAppSettingsManager.ts
 * @description useAppSettingsManager.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { DEFAULT_SETTINGS, type AppSettings } from '../../components/SettingsModal'
import * as ipc from '../../services/ipc/electronApiAdapter'
import { useProcessStore } from '../../stores/useProcessStore'
import { safeJsonParse } from '../../utils/safeJson'

export function useAppSettingsManager(activeRightTab: string, setActiveRightTab: (tab: any) => void) {
  const { setEditorZoom, adjustEditorZoom, setBrowserZoom } = useProcessStore()

  const [settings, setSettings] = useState<AppSettings>(() => {
    const isAutoLoad = typeof localStorage !== 'undefined' && (localStorage.getItem('ameva_auto_load_llm') === 'true');
    const DEFAULT: AppSettings = {
      showPeersPointer: true, showPeersDrag: true, showCodeConsole: true, autoSnapshot: true,
      theme: 'dark', wordWrap: true, showMinimap: true, installedPlugins: [],
      autoLoadAI: isAutoLoad,
      hotkeys: {
        save: 'Control+s', open: 'Control+o', newFile: 'Control+n', pdfExport: 'Control+p',
        toggleAI: 'Control+\\', toggleMode: 'Control+e', zoomIn: 'Control+=', zoomOut: 'Control+-', zoomReset: 'Control+0'
      }
    }
    try {
      const stored = localStorage.getItem('app-settings')
      if (stored) {
        const parsed = safeJsonParse(stored, {})
        if (parsed.hotkeys && (parsed.hotkeys.toggleMode === 'Control+h' || parsed.hotkeys.toggleMode === 'Control+v')) {
          parsed.hotkeys.toggleMode = 'Control+e'
          localStorage.setItem('app-settings', JSON.stringify(parsed))
        }
        return { ...DEFAULT, ...parsed, autoLoadAI: parsed.autoLoadAI ?? isAutoLoad }
      }
    } catch {}
    return DEFAULT
  })

  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      try {
        localStorage.setItem('app-settings', JSON.stringify(updated))
        if (newSettings.autoLoadAI !== undefined) {
          localStorage.setItem('ameva_auto_load_llm', String(newSettings.autoLoadAI))
        }
      } catch {}
      return updated
    })
  }

  const handleInstallPlugin = async (id: string, scriptUrl: string) => {
    try {
      const isInternalPlugin = scriptUrl.endsWith('.tsx') || 
        ['google-maps', 'google-map', 'google-maps-view', 'map', 'GoogleMapsView'].includes(id)

      if (isInternalPlugin) {
        if (id === 'VoiceDictationPlugin' || id === 'voice-dictation') {
          if (window.electronAPI?.executeTerminal) {
            const cmd = `
              mkdir "C:\\ameva\\whisper" 2>NUL
              mkdir "C:\\ameva\\models\\stt" 2>NUL
              curl.exe -L -o "C:\\ameva\\whisper\\whisper.zip" "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip"
              tar.exe -xf "C:\\ameva\\whisper\\whisper.zip" -C "C:\\ameva\\whisper"
              curl.exe -L -o "C:\\ameva\\models\\stt\\ggml-small.bin" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
            `.trim().replace(/\s*\n\s*/g, ' && ');
            try {
              await window.electronAPI.executeTerminal(cmd);
            } catch (e) {
              console.error('Failed to install Whisper:', e);
            }
          }
        }
        setSettings(prev => {
          const current = prev.installedPlugins || []
          if (!current.includes(id)) {
            const next = { ...prev, installedPlugins: [...current, id] }
            localStorage.setItem('app-settings', JSON.stringify(next))
            try {
              const urlMap = safeJsonParse(localStorage.getItem('plugin-urls'), {})
              urlMap[id] = scriptUrl
              localStorage.setItem('plugin-urls', JSON.stringify(urlMap))
            } catch (e) {}
            return next
          }
          return prev
        })
        return
      }

      // [SEC-W-008] 외부 플러그인 URL 프로토콜 보안 검증 (http/https 전용)
      try {
        const parsedUrl = new URL(scriptUrl)
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          throw new Error('보안 허용되지 않은 프로토콜입니다. http/https 주소만 허용됩니다.')
        }
      } catch (e: any) {
        throw new Error('유효하지 않은 플러그인 URL 형식입니다: ' + (e.message || String(e)))
      }

      const existingScript = document.getElementById(`script-plugin-${id}`)
      if (!existingScript) {
        let res: Response
        try {
          res = await fetch(scriptUrl)
        } catch (netErr) {
          console.warn(`[handleInstallPlugin] 네트워크 연결 실패 (${id}):`, netErr)
          return
        }

        if (!res.ok) {
          console.warn(`[handleInstallPlugin] 플러그인 scriptUrl (${scriptUrl}) HTTP ${res.status} 응답. 내장/로컬 플러그인으로 등록 처리합니다.`)
          setSettings(prev => {
            const current = prev.installedPlugins || []
            if (!current.includes(id)) {
              const next = { ...prev, installedPlugins: [...current, id] }
              localStorage.setItem('app-settings', JSON.stringify(next))
              return next
            }
            return prev
          })
          return
        }

        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          throw new Error('플러그인 주소가 유효한 자바스크립트가 아닙니다 (HTML 응답됨). 404 에러일 수 있습니다.')
        }

        const scriptText = await res.text()
        if (scriptText.trim().startsWith('<!DOCTYPE') || scriptText.trim().startsWith('<html')) {
          throw new Error('유효하지 않은 스크립트 형식입니다 (HTML 내용 검출).')
        }

        const script = document.createElement('script')
        script.id = `script-plugin-${id}`
        script.text = scriptText
        document.body.appendChild(script)
      }

      return new Promise<void>((resolve, reject) => {
        let checkCount = 0
        const checkInterval = setInterval(() => {
          checkCount++
          if ((window as any).AMEVA_PLUGINS?.[id]) {
            clearInterval(checkInterval)
            const current = settings.installedPlugins || []
            if (!current.includes(id)) {
              setSettings(prev => {
                const next = { ...prev, installedPlugins: [...(prev.installedPlugins || []), id] }
                localStorage.setItem('app-settings', JSON.stringify(next))
                try {
                  const urlMap = safeJsonParse(localStorage.getItem('plugin-urls'), {})
                  urlMap[id] = scriptUrl
                  localStorage.setItem('plugin-urls', JSON.stringify(urlMap))
                } catch (e) {}
                return next
              })
            }
            resolve()
          } else if (checkCount > 50) {
            clearInterval(checkInterval)
            reject(new Error('플러그인 로드 타임아웃: window.AMEVA_PLUGINS에 등록되지 않았습니다.'))
          }
        }, 100)
      })
    } catch (e: any) {
      alert(e.message || '플러그인 설치 실패')
    }
  }

  const handleUninstallPlugin = (id: string) => {
    const script = document.getElementById(`script-plugin-${id}`)
    if (script) script.remove()
    if ((window as any).AMEVA_PLUGINS?.[id]) delete (window as any).AMEVA_PLUGINS[id]

    setSettings(prev => {
      const next = { ...prev, installedPlugins: (prev.installedPlugins || []).filter(p => p !== id) }
      localStorage.setItem('app-settings', JSON.stringify(next))
      return next
    })

    if ((id === 'outline' || id === 'calculator') && activeRightTab === id) {
      setActiveRightTab('ai')
    }
  }

  const handleOpenGithub = () => {
    if (ipc.isElectronEnv()) {
      ipc.openExternalLink('https://github.com/uno-km')
    } else {
      window.open('https://github.com/uno-km', '_blank', 'noopener,noreferrer')
    }
  }

  const handleCloseApp = () => {
    if (ipc.isElectronEnv()) {
      ipc.closeApp()
    }
  }

  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const handleZoomIn = () => adjustEditorZoom(0.1)
  const handleZoomOut = () => adjustEditorZoom(-0.1)
  const handleZoomReset = () => {
    setEditorZoom(1.0)
    if (ipc.isElectronEnv()) {
      ipc.setZoomFactor(1.0)
      setBrowserZoom(1.0)
    }
  }

  return {
    settings,
    setSettings,
    handleUpdateSettings,
    handleInstallPlugin,
    handleUninstallPlugin,
    handleOpenGithub,
    handleCloseApp,
    handleToggleFullscreen,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  }
}
