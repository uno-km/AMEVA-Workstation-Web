/**
 * @file InlineLinkPreviewRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineLinkPreviewRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 ameva-link 웹 링크 요약 세그먼트 전용 토글식 샌드박스 렌더러로 소비.
 */

import React, { useState } from 'react'
import { Globe } from 'lucide-react'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineLinkPreviewRenderer`
   * - 역할: ameva-link 가상 마크다운 코드블록의 JSON 데이터를 디코딩해 요약 카드 UI를 렌더링하고 토글식 샌드박스 미리보기 프레임을 관리함.
   */
export function InlineLinkPreviewRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `isExpanded`, `setIsExpanded`
   * - 자료형 / 예상 값: boolean
   * - 시나리오: 사용자가 '미리보기' 토글을 수행하면 iframe 샌드박스가 하단에 전개됨.
   */
  const [isExpanded, setIsExpanded] = useState(false)

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

  const isFailed = title === '서버 코드: 404' || title?.startsWith('연결 실패') || title === '연결 시간 초과'
  const isLoading = title === 'Loading preview...'

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'rgba(30, 30, 40, 0.45)',
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
            backgroundColor: '#16161d'
          }} />
        ) : (
          <div style={{
            width: '100px',
            minWidth: '100px',
            height: '110px',
            backgroundColor: 'rgba(255,255,255,0.02)',
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
                      background: 'rgba(139,92,246,0.15)',
                      border: '1.5px solid rgba(139,92,246,0.3)',
                      borderRadius: '6px',
                      color: '#a78bfa',
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.25s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.3)'
                      e.currentTarget.style.borderColor = '#a78bfa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
                    }}
                  >
                    {isExpanded ? '접기 ▲' : '미리보기 ▶'}
                  </button>
                )}

                
                {url && (
                  <button
                    onClick={handleOpenExternal}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.25s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
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
          backgroundColor: '#ffffff',
          position: 'relative'
        }}>
          <iframe
            src={url}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={`Preview: ${title}`}
          />
        </div>
      )}
    </div>
  )
}
