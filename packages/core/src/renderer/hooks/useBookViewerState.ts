/**
 * @file useBookViewerState.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @role 다중 페이지(1장/2장/3장/연속/페이지나누기) 책보기 모드 및 3종 스킨 상태 관리 훅
 */

import { useState, useCallback, useMemo } from 'react'

export type PageViewMode = 'continuous' | 'single' | 'dual' | 'triple' | 'page-break'
export type ViewerSkin = 'dark' | 'white' | 'retro'

export interface BookViewerOptions {
  initialMode?: PageViewMode
  initialSkin?: ViewerSkin
  hasCoverPage?: boolean
}

export function useBookViewerState(totalPages: number, options: BookViewerOptions = {}) {
  const [viewMode, setViewMode] = useState<PageViewMode>(options.initialMode || 'continuous')
  const [skin, setSkin] = useState<ViewerSkin>(options.initialSkin || 'dark')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hasCoverPage, setHasCoverPage] = useState<boolean>(options.hasCoverPage ?? true)
  const [zoom, setZoom] = useState<number>(100)

  const slotsPerPage = useMemo(() => {
    switch (viewMode) {
      case 'single':
        return 1
      case 'dual':
        return 2
      case 'triple':
        return 3
      case 'continuous':
      case 'page-break':
      default:
        return 1
    }
  }, [viewMode])

  const visiblePages = useMemo(() => {
    if (viewMode === 'continuous' || viewMode === 'page-break') {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (viewMode === 'single') {
      return [Math.min(Math.max(1, currentPage), totalPages)]
    }

    if (viewMode === 'dual') {
      if (hasCoverPage && currentPage === 1) {
        return [1]
      }
      const p1 = hasCoverPage ? (currentPage % 2 === 0 ? currentPage : currentPage - 1) : currentPage
      const p2 = p1 + 1
      const pages: number[] = []
      if (p1 >= 1 && p1 <= totalPages) pages.push(p1)
      if (p2 <= totalPages) pages.push(p2)
      return pages.length > 0 ? pages : [1]
    }

    if (viewMode === 'triple') {
      const p1 = currentPage
      const pages: number[] = []
      for (let i = 0; i < 3; i++) {
        const p = p1 + i
        if (p <= totalPages) pages.push(p)
      }
      return pages.length > 0 ? pages : [1]
    }

    return [1]
  }, [viewMode, currentPage, totalPages, hasCoverPage])

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => {
      if (viewMode === 'single') {
        return Math.min(prev + 1, totalPages)
      }
      if (viewMode === 'dual') {
        if (hasCoverPage && prev === 1) return 2
        return Math.min(prev + 2, totalPages)
      }
      if (viewMode === 'triple') {
        return Math.min(prev + 3, totalPages)
      }
      return Math.min(prev + 1, totalPages)
    })
  }, [viewMode, totalPages, hasCoverPage])

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => {
      if (viewMode === 'single') {
        return Math.max(prev - 1, 1)
      }
      if (viewMode === 'dual') {
        if (hasCoverPage && prev <= 3) return 1
        return Math.max(prev - 2, 1)
      }
      if (viewMode === 'triple') {
        return Math.max(prev - 3, 1)
      }
      return Math.max(prev - 1, 1)
    })
  }, [viewMode, hasCoverPage])

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, page), totalPages)
      setCurrentPage(clamped)
    },
    [totalPages]
  )

  const toggleMode = useCallback(() => {
    const modes: PageViewMode[] = ['continuous', 'single', 'dual', 'triple', 'page-break']
    setViewMode((prev) => {
      const idx = modes.indexOf(prev)
      return modes[(idx + 1) % modes.length]
    })
  }, [])

  return {
    viewMode,
    setViewMode,
    skin,
    setSkin,
    currentPage,
    setCurrentPage,
    totalPages,
    hasCoverPage,
    setHasCoverPage,
    zoom,
    setZoom,
    slotsPerPage,
    visiblePages,
    nextPage,
    prevPage,
    goToPage,
    toggleMode,
  }
}
