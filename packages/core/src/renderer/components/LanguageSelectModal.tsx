/**
 * ============================================================================
 * @file LanguageSelectModal.tsx
 * @description 25대 프로그래밍 언어 인터랙티브 선택 팔레트 모달 컴포넌트입니다.
 * @usage 슬래시 메뉴(/)의 More Code Languages... 또는 에디터 언어 변경 시 호출됩니다.
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Code2, Search, X } from 'lucide-react'
import { LANGUAGE_CATEGORIES, LANG_META } from './jupyter/langMeta'
import { useUIStore } from '../stores/useUIStore'
import { useTranslation } from '../i18n/useTranslation'

interface LanguageSelectModalProps {
  onSelect?: (lang: string) => void
}

export function LanguageSelectModal({ onSelect }: LanguageSelectModalProps) {
  const { isLanguageSelectOpen, setIsLanguageSelectOpen, languageSelectCallback } = useUIStore()
  const { isKorean } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 전체 언어 리스트 수집
  const allLanguages = useMemo(() => {
    const list: { id: string; name: string; color: string; runnable?: boolean; previewable?: boolean; categoryId: string; categoryName: string }[] = []
    LANGUAGE_CATEGORIES.forEach(cat => {
      cat.languages.forEach(lang => {
        const meta = LANG_META[lang.id] || {}
        list.push({
          ...lang,
          runnable: meta.runnable ?? lang.runnable,
          previewable: meta.previewable ?? lang.previewable,
          categoryId: cat.id,
          categoryName: cat.name,
        })
      })
    })
    return list
  }, [])

  // 검색 및 카테고리 필터링
  const filteredLanguages = useMemo(() => {
    return allLanguages.filter(lang => {
      const matchCategory = selectedCategory === 'all' || lang.categoryId === selectedCategory
      const query = search.toLowerCase().trim()
      const matchSearch = !query ||
        lang.id.toLowerCase().includes(query) ||
        lang.name.toLowerCase().includes(query) ||
        lang.categoryName.toLowerCase().includes(query)
      return matchCategory && matchSearch
    })
  }, [allLanguages, selectedCategory, search])

  // 모달 열릴 때 포커스 및 초기화
  useEffect(() => {
    if (isLanguageSelectOpen) {
      setSearch('')
      setSelectedCategory('all')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isLanguageSelectOpen])

  const handleSelectLanguage = (langId: string) => {
    if (onSelect) {
      onSelect(langId)
    } else if (languageSelectCallback) {
      languageSelectCallback(langId)
    }
    setIsLanguageSelectOpen(false)
  }

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLanguageSelectOpen) return

      if (e.key === 'Escape') {
        setIsLanguageSelectOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (filteredLanguages.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredLanguages.length) % (filteredLanguages.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredLanguages[selectedIndex]) {
          handleSelectLanguage(filteredLanguages[selectedIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLanguageSelectOpen, filteredLanguages, selectedIndex])

  if (!isLanguageSelectOpen) return null

  const categories = [
    { id: 'all', name: isKorean ? '전체 언어 (25+)' : 'All Languages (25+)' },
    { id: 'web-scripting', name: isKorean ? '웹 & 스크립팅' : 'Web & Scripting' },
    { id: 'systems-native', name: isKorean ? '시스템 & 네이티브' : 'Systems & Native' },
    { id: 'enterprise-oop', name: isKorean ? '엔터프라이즈 & OOP' : 'Enterprise & OOP' },
    { id: 'blockchain-data', name: isKorean ? '블록체인 & 데이터' : 'Blockchain & Data' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={() => setIsLanguageSelectOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-main)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 헤더 & 검색바 */}
        <div style={{ padding: '18px 20px 14px 20px', borderBottom: '1px solid var(--border-muted)', background: 'var(--bg-panel)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code2 size={16} color="#38bdf8" />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  {isKorean ? '코드 실행 언어 선택 팔레트' : 'Select Code Language Palette'}
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  {isKorean ? '25대 프로그래밍 언어 중 원하는 언어를 선택하여 코드 블록을 생성합니다.' : 'Choose from 25+ programming languages to insert an executable code block.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsLanguageSelectOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 검색 입력창 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
              placeholder={isKorean ? '언어 이름 또는 확장자 검색 (예: rust, solidity, go, c, py, lua)...' : 'Search by language or extension (e.g., rust, solidity, go, cpp, ts)...'}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '8px',
                border: '1px solid var(--border-muted)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-muted)'}
            />
          </div>

          {/* 카테고리 칩 필터 */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedIndex(0); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--border-muted)',
                  background: selectedCategory === cat.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 언어 카드 그리드 본문 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: '10px',
            maxHeight: '440px',
          }}
        >
          {filteredLanguages.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {isKorean ? '일치하는 언어가 없습니다.' : 'No matching languages found.'}
            </div>
          ) : (
            filteredLanguages.map((lang, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isSelected ? lang.color : 'var(--border-muted)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-panel)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 12px ${lang.color}33` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: lang.color,
                          display: 'inline-block',
                          boxShadow: `0 0 6px ${lang.color}`,
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {lang.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      /{lang.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {lang.categoryName}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {lang.runnable && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          RUN
                        </span>
                      )}
                      {lang.previewable && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          VIEW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 하단 푸터 가이드 */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-muted)', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>
            {isKorean ? '💡 ↑↓ 방향키로 이동, Enter로 선택, ESC로 닫기' : '💡 Use ↑↓ arrows to navigate, Enter to select, ESC to cancel'}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
            AMEVA Polyglot 25+ Runtimes
          </span>
        </div>
      </div>
    </div>
  )
}
