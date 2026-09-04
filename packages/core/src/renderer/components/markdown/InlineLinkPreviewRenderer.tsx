/**
 * ============================================================================
 * @file InlineLinkPreviewRenderer.tsx
 * @description InlineLinkPreviewRenderer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './InlineLinkPreviewRenderer';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file InlineLinkPreviewRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineLinkPreviewRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 ameva-link 웹 링크 요약 세그먼트 전용 토글식 샌드박스 렌더러로 소비.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Globe } from 'lucide-react'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineLinkPreviewRenderer`
   * - 역할: ameva-link 가상 마크다운 코드블록의 JSON 데이터를 디코딩해 요약 카드 UI를 렌더링하고 토글식 샌드박스 미리보기 프레임을 관리함.
   */
/**
 * InlineLinkPreviewRenderer 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function InlineLinkPreviewRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `isExpanded`, `setIsExpanded`
   * - 자료형 / 예상 값: boolean
   * - 시나리오: 사용자가 '미리보기' 토글을 수행하면 iframe 샌드박스가 하단에 전개됨.
   */
  const [isExpanded, setIsExpanded] = useState(false)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loadingHtml, setLoadingHtml] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `data`
   * - 자료형 / 예상 값: { url: string, title: string, description: string, thumbnail: string }
   * - 시나리오: JSON 파싱된 메타데이터 정보 획득.
   */
  let data: any = null
  try {
    data = JSON.parse(code)
  } catch (err) {
    console.error('[InlineLinkPreviewRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>링크 정보를 해석할 수 없습니다.</div>
  }

  const { url, title, description, thumbnail } = data
  
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleOpenExternal`
   * - 역할: PC의 기본 웹 브라우저를 통해 링크를 새 창으로 열어 확장함.
   */
  const handleOpenExternal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (url && (window as any).electronAPI?.openExternalLink) {
      (window as any).electronAPI.openExternalLink(url)
    } else if (url) {
      window.open(url, '_blank')
    }
  }

  React.useEffect(() => {
    if (!isExpanded || !url) return
    let active = true
    setLoadingHtml(true)
    setFetchFailed(false)

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        if (!active) return
        const withBase = text.replace(/<head\b[^>]*>/i, `$&<base href="${url}">`)
        setHtmlContent(withBase)
        setLoadingHtml(false)
      })
      .catch((err) => {
        if (!active) return
        console.warn('[InlineLinkPreviewRenderer] fetch failed, falling back to direct iframe:', err)
        setHtmlContent(null)
        setLoadingHtml(false)
      })

    return () => { active = false }
  }, [isExpanded, url])

  const isFailed = title === '서버 코드: 404' || title?.startsWith('연결 실패') || title === '연결 시간 초과'
  const isLoading = title === 'Loading preview...'

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-muted)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: '12px',
        userSelect: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', width: '100%' }}>
        {thumbnail ? (
          <div style={{
            width: '160px',
            minWidth: '160px',
            height: '110px',
            background: `url(${thumbnail}) center/cover no-repeat`,
            borderRight: '1px solid var(--border-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-surface)'
          }} />
        ) : (
          <div style={{
            width: '100px',
            minWidth: '100px',
            height: '110px',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <Globe size={24} style={{ opacity: 0.5 }} />
          </div>
        )}

        <div style={{
          flex: 1,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: isFailed ? '#ef4444' : 'var(--text-main)',
              overflow: 'hidden',
            }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                {title}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {url && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                      background: 'rgba(59, 130, 246,0.15)',
                      border: '1.5px solid rgba(59, 130, 246,0.3)',
                      borderRadius: '6px',
                      color: '#38bdf8',
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.25s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246,0.3)'
                      e.currentTarget.style.borderColor = '#38bdf8'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246,0.3)'
                    }}
                  >
                    {isExpanded ? '접기 ▲' : '미리보기 ▶'}
                  </button>
                )}

                
                {url && (
                  <button
                    onClick={handleOpenExternal}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-muted)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.25s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-surface)'
                    }}
                  >
                    확장 ↗
                  </button>
                )}
              </div>
            </div>
            
            <div style={{
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'left'
            }}>
              {description || (isLoading ? '웹 페이지의 상세 설명을 가져오는 중입니다...' : '설명이 없는 페이지입니다.')}
            </div>
          </div>

          <div style={{
            fontSize: '9.5px',
            color: 'var(--primary)',
            opacity: 0.8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '4px',
            fontWeight: 500,
            textAlign: 'left'
          }}>
            {url}
          </div>
        </div>
      </div>

      {isExpanded && url && (
        <div style={{
          width: '100%',
          height: '420px',
          borderTop: '1px solid var(--border-muted)',
          backgroundColor: '#0a0d14',
          position: 'relative'
        }}>
          {loadingHtml ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '12px' }}>
              웹 페이지 로딩 중...
            </div>
          ) : (
            <iframe
              srcDoc={htmlContent || undefined}
              src={htmlContent ? undefined : url}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              title={`Preview: ${title}`}
            />
          )}
        </div>
      )}
    </div>
  )
}
