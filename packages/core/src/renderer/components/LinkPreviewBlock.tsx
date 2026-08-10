/**
 * ============================================================================
 * @file LinkPreviewBlock.tsx
 * @description LinkPreviewBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './LinkPreviewBlock';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState } from 'react'
// [외부 패키지 및 라이브러리 임포트: @blocknote/react]
import { createReactBlockSpec } from '@blocknote/react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Globe, ChevronDown, ChevronRight } from 'lucide-react'

/*
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - LinkPreviewBlockSpec 내 render 함수에서 컴포넌트 훅 세션 분리형 렌더러로 위임되어 소비됨.
 */
/**
 * LinkPreviewComponent 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function LinkPreviewComponent({ block, editor }: { block: any, editor: any }) {
  const { url, title, description, thumbnail, width, height, memo, isMemoFolded } = block.props

  const handleMemoBlur = (newMemo: string) => {
    if (editor) {
      editor.updateBlock(block, { props: { ...block.props, memo: newMemo } })
    }
  }

  const toggleMemoFold = () => {
    if (editor) {
      editor.updateBlock(block, { props: { ...block.props, isMemoFolded: !isMemoFolded } })
    }
  }
  
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
      className="bn-block-content-wrapper ameva-resizable-block"
      onMouseUp={(e) => {
        const el = e.currentTarget
        if (el.style.width && el.style.width !== width) editor.updateBlock(block, { props: { ...block.props, width: el.style.width } })
        if (el.style.height && el.style.height !== height) editor.updateBlock(block, { props: { ...block.props, height: el.style.height } })
      }}
      style={{
        width: width || '100%',
        height: height || '120px',
        minWidth: '200px',
        minHeight: '80px',
        resize: 'both',
        backgroundColor: 'rgba(30, 30, 40, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-muted)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: '12px',
        userSelect: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'relative'
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
      
      {/* [NEW] 사용자 메모 영역 */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border-muted)',
        background: 'rgba(255,255,255,0.01)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'default'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          onClick={toggleMemoFold}
        >
          {isMemoFolded ? <ChevronRight size={14} color="var(--text-main)" /> : <ChevronDown size={14} color="var(--text-main)" />}
          <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>📝 사용자 메모</span>
          {!isMemoFolded && <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>(입력 후 다른 곳을 클릭하면 본문에 영구 저장됩니다)</span>}
        </div>
        
        {!isMemoFolded && (
          editor.isEditable ? (
            <textarea
              defaultValue={memo}
              onBlur={e => handleMemoBlur(e.target.value)}
              placeholder="이 웹사이트에 관한 중요한 메모를 남기세요..."
              style={{
                width: '100%', minHeight: '45px', padding: '6px 10px', borderRadius: '6px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                color: 'var(--text-main)', fontSize: '11px', lineHeight: '1.4',
                resize: 'vertical', outline: 'none', cursor: 'text'
              }}
            />
          ) : memo ? (
            <div style={{
              width: '100%', padding: '8px 12px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
              color: 'var(--text-main)', fontSize: '11px', lineHeight: '1.5',
              whiteSpace: 'pre-wrap', textAlign: 'left'
            }}>
              {memo}
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'left' }}>
              남겨진 메모가 없습니다.
            </div>
          )
        )}
      </div>
    </div>
  )
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `LinkPreviewBlockSpec`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `LinkPreviewBlockSpec(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * LinkPreviewBlockSpec 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const LinkPreviewBlockSpec = createReactBlockSpec(
  {
    type: 'linkPreview',
    propSchema: {
      url: { default: '' },
      title: { default: 'Loading preview...' },
      description: { default: '' },
      thumbnail: { default: '' },
      width: { default: '100%' },
      height: { default: '120px' },
      memo: { default: '' },
      isMemoFolded: { default: false }
    },
    content: 'none'
  },
  {
    render: ({ block, editor }) => {
      return <LinkPreviewComponent block={block} editor={editor} />
    }
  }
)

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `LinkPreviewBlock`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `LinkPreviewBlock(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * LinkPreviewBlock 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const LinkPreviewBlock = LinkPreviewBlockSpec()

