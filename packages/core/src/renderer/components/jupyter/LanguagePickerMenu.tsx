/**
 * ============================================================================
 * @file LanguagePickerMenu.tsx
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/components/jupyter/LanguagePickerMenu.tsx
 * @role Cascading language picker with Quick Access and Categorized Submenus
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Search, Check, Layers } from 'lucide-react'
import {
  PRIMARY_LANGUAGES,
  LANGUAGE_CATEGORIES,
  getLangMeta,
  type LanguageItem
} from './langMeta'

interface LanguagePickerMenuProps {
  currentLanguage: string
  onSelectLanguage: (languageId: string) => void
}

export function LanguagePickerMenu({ currentLanguage, onSelectLanguage }: LanguagePickerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(LANGUAGE_CATEGORIES[0].id)
  const [searchQuery, setSearchQuery] = useState('')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const meta = getLangMeta(currentLanguage)

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsSubmenuOpen(false)
        setSearchQuery('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (langId: string) => {
    onSelectLanguage(langId)
    setIsOpen(false)
    setIsSubmenuOpen(false)
    setSearchQuery('')
  }

  // 검색 시 전체 카테고리 통합 필터링
  const allLanguages: (LanguageItem & { categoryName: string })[] = LANGUAGE_CATEGORIES.flatMap(cat =>
    cat.languages.map(l => ({ ...l, categoryName: cat.name }))
  )

  const filteredLanguages = searchQuery.trim()
    ? allLanguages.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const currentCategoryObj = LANGUAGE_CATEGORIES.find(c => c.id === activeCategory) || LANGUAGE_CATEGORIES[0]

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* 1. 트리거 버튼 */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
          setIsSubmenuOpen(false)
        }}
        title="언어 변경"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: meta.color,
          border: 'none',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '11.5px',
          fontWeight: 700,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: 'Consolas, "JetBrains Mono", monospace',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'transparent'
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: meta.color,
            display: 'inline-block',
            boxShadow: `0 0 6px ${meta.color}88`,
          }}
        />
        <span>{meta.label}</span>
        <ChevronDown size={13} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {/* 2. 메인 드롭다운 팝오버 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            width: '210px',
            background: '#12151e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255,255,255,0.05)',
            padding: '6px',
            backdropFilter: 'blur(12px)',
            fontFamily: 'Pretendard, -apple-system, sans-serif',
            userSelect: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 검색창 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '5px',
              marginBottom: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="언어 검색 (/go, /sol...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f1f5f9',
                fontSize: '11px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* 검색 모드인 경우 */}
          {searchQuery.trim() ? (
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {filteredLanguages.length === 0 ? (
                <div style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                  일치하는 언어가 없습니다
                </div>
              ) : (
                filteredLanguages.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => handleSelect(lang.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent')
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lang.color }} />
                      <span>{lang.name}</span>
                    </div>
                    <span style={{ fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase' }}>{lang.categoryName}</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* 일반 모드: 자주 쓰는 언어 + 기타 언어 서브메뉴 */
            <div>
              <div style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>
                QUICK ACCESS (기본)
              </div>
              {PRIMARY_LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleSelect(lang.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: currentLanguage.toLowerCase() === lang.id ? '#60a5fa' : '#e2e8f0',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent')
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lang.color }} />
                    <span>{lang.name}</span>
                  </div>
                  {currentLanguage.toLowerCase() === lang.id && <Check size={12} color="#60a5fa" />}
                </button>
              ))}

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '5px 0' }} />

              {/* 기타 언어 보기 (서브메뉴 트리거) */}
              <div
                onMouseEnter={() => setIsSubmenuOpen(true)}
                style={{ position: 'relative' }}
              >
                <button
                  onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 8px',
                    background: isSubmenuOpen ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    border: 'none',
                    borderRadius: '4px',
                    color: isSubmenuOpen ? '#93c5fd' : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.18)')}
                  onMouseLeave={(e) => {
                    if (!isSubmenuOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={13} color="#38bdf8" />
                    <span>기타 언어 보기...</span>
                  </div>
                  <ChevronRight size={13} style={{ opacity: 0.8 }} />
                </button>

                {/* 3. 사이드 서브메뉴 (Cascading Flyout Submenu) */}
                {isSubmenuOpen && (
                  <div
                    onMouseEnter={() => setIsSubmenuOpen(true)}
                    style={{
                      position: 'absolute',
                      top: '-60px',
                      left: 'calc(100% + 8px)',
                      width: '320px',
                      background: '#12151e',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255,255,255,0.06)',
                      padding: '8px',
                      zIndex: 10000,
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* 카테고리 탭 선택 바 */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto' }}>
                      {LANGUAGE_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '10.5px',
                            fontWeight: activeCategory === cat.id ? 700 : 500,
                            background: activeCategory === cat.id ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                            color: activeCategory === cat.id ? '#ffffff' : '#94a3b8',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                          }}
                        >
                          {cat.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    {/* 현재 선택된 카테고리의 언어 목록 */}
                    <div style={{ padding: '0 4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
                        {currentCategoryObj.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>
                        {currentCategoryObj.description}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        {currentCategoryObj.languages.map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => handleSelect(lang.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              background: currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                              border: currentLanguage.toLowerCase() === lang.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '5px',
                              color: currentLanguage.toLowerCase() === lang.id ? '#93c5fd' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.1s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)'
                              e.currentTarget.style.borderColor = currentLanguage.toLowerCase() === lang.id ? 'rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lang.color, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
