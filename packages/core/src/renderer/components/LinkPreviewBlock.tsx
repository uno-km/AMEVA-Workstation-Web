/**
 * @file LinkPreviewBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/LinkPreviewBlock.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import React, { useState } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Globe } from 'lucide-react'

/*
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - LinkPreviewBlockSpec 내 render 함수에서 컴포넌트 훅 세션 분리형 렌더러로 위임되어 소비됨.
 */
function LinkPreviewComponent({ block }: { block: any }) {
  const { url, title, description, thumbnail } = block.props
  
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `isExpanded`, `setIsExpanded`
   * - 자료형 / 예상 값: boolean
   * - 시나리오: 사용자가 '미리보기' 버튼을 누르면 카드가 아래로 펼쳐지면서 해당 URL을 iframe 샌드박스로 로드함.
   */
  const [isExpanded, setIsExpanded] = useState(false)

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleOpenExternal`
   * - 역할: 크롬, 엣지 등 호스트 PC의 기본 브라우저를 구동하여 외부 링크를 띄움.
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
      className="bn-block-content-wrapper"
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
      {/* 카드 정보 영역 */}
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
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </span>
              
              {/* 확장(새창열기) 및 미리보기 버튼 */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
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
                    <span>확장 ↗</span>
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

      {/* 샌드박스 미리보기 iframe 컨테이너 */}
      {isExpanded && url && (
        <div style={{
          width: '100%',
          height: '420px',
          borderTop: '1px solid var(--border-muted)',
          backgroundColor: '#ffffff',
          position: 'relative'
        }}>
          <webview
            src={url}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={`Preview: ${title}`}
          />
        </div>
      )}
    </div>
  )
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `LinkPreviewBlockSpec`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `LinkPreviewBlockSpec(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const LinkPreviewBlockSpec = createReactBlockSpec(
  {
    type: 'linkPreview',
    propSchema: {
      url: { default: '' },
      title: { default: 'Loading preview...' },
      description: { default: '' },
      thumbnail: { default: '' }
    },
    content: 'none'
  },
  {
    render: ({ block }) => {
      return <LinkPreviewComponent block={block} />
    }
  }
)

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `LinkPreviewBlock`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `LinkPreviewBlock(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const LinkPreviewBlock = LinkPreviewBlockSpec()

