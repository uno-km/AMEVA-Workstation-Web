/**
 * ============================================================================
 * @file useCurrentTheme.ts
 * @system AMEVA OS Desktop Workstation - Renderer Hook
 * @location packages/core/src/renderer/hooks/useCurrentTheme.ts
 * @role Real-time reactive theme observer hook for UI components and custom blocks
 * ============================================================================
 */

import { useState, useEffect } from 'react'

export type ActiveTheme = 'dark' | 'white' | 'retro'

export interface ThemeState {
  theme: string
  normalizedTheme: ActiveTheme
  isWhite: boolean
  isRetro: boolean
  isDark: boolean
}

function getActiveTheme(): ThemeState {
  if (typeof document === 'undefined') {
    return {
      theme: 'dark',
      normalizedTheme: 'dark',
      isWhite: false,
      isRetro: false,
      isDark: true,
    }
  }

  const rawTheme =
    document.documentElement.getAttribute('data-theme') ||
    document.body.getAttribute('data-theme') ||
    'dark'

  const isWhite = rawTheme === 'white' || rawTheme === 'light'
  const isRetro = rawTheme === 'retro' || rawTheme === 'win98'
  const isDark = !isWhite && !isRetro

  const normalizedTheme: ActiveTheme = isWhite ? 'white' : isRetro ? 'retro' : 'dark'

  return {
    theme: rawTheme,
    normalizedTheme,
    isWhite,
    isRetro,
    isDark,
  }
}

/**
 * useCurrentTheme
 * React hook that subscribes to document theme changes via MutationObserver
 * and custom storage events to guarantee instant reactive re-rendering.
 */
export function useCurrentTheme(): ThemeState {
  const [themeState, setThemeState] = useState<ThemeState>(getActiveTheme)

  useEffect(() => {
    const handleCheck = () => {
      const next = getActiveTheme()
      setThemeState((prev) => {
        if (
          prev.theme === next.theme &&
          prev.normalizedTheme === next.normalizedTheme
        ) {
          return prev
        }
        return next
      })
    }

    // 1. Initial sync
    handleCheck()

    // 2. MutationObserver on documentElement & body
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          handleCheck()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    }

    // 3. Storage event for multi-window / settings changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app-settings' || e.key === 'theme') {
        handleCheck()
      }
    }
    window.addEventListener('storage', onStorage)

    // 4. Custom theme change event dispatcher support
    const onCustomThemeChange = () => handleCheck()
    window.addEventListener('ameva:theme-change', onCustomThemeChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ameva:theme-change', onCustomThemeChange)
    }
  }, [])

  return themeState
}
