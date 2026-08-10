/**
 * ============================================================================
 * @file InlineYoutubeRenderer.tsx
 * @description InlineYoutubeRenderer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './InlineYoutubeRenderer';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file InlineYoutubeRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineYoutubeRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 ameva-youtube 인라인 세그먼트 전용 유튜브 뷰어로 소비.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useRef } from 'react'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineYoutubeRenderer`
   * - 역할: ameva-youtube 마크다운 코드블록의 JSON 데이터를 파싱하여 공식 유튜브 우회 재생 프레임(iframe)을 반응형 플레이어로 렌더링함.
   */
/**
 * InlineYoutubeRenderer 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function InlineYoutubeRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `data`
   * - 자료형 / 예상 값: { url, videoId, title, description, thumbnail }
   * - 시나리오: JSON 파싱된 유튜브 메타데이터 객체 데이터 획득.
   */
  let data: any = null
  try {
    data = typeof code === 'string' ? JSON.parse(code) : code
  } catch (err) {
    console.error('[InlineYoutubeRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>동영상 정보를 해석할 수 없습니다.</div>
  }

  const url = data.url || ''
  const videoId = data.videoId || ''
  const title = data.title || 'YouTube Video'
  const description = data.description || '동영상 설명을 불러오려면 클릭하세요.'

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleSeek = (timeStr: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return
    const seconds = timeStr.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
    iframeRef.current.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [seconds, true]
    }), '*')
  }

  return (
    <div style={{ margin: '16px 0', width: '100%' }}>
      <div
        className="bn-block-content-wrapper"
        style={{
          width: '100%',
          backgroundColor: '#18181c',
          border: '1px solid var(--border-muted)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}
      >
        {/* 헤더 바 */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#121215',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#ff0000' }}>📹</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>YouTube Player</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '9.5px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none'
            }}
          >
            {url}
          </a>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
          <iframe
            ref={iframeRef}
            /*
             * [FIX-YOUTUBE-001] youtube-nocookie.com 도메인 사용으로 Electron 내 X-Frame-Options 차단 우회.
             * - 뷰모드(미리보기)에서는 클릭 이벤트 전파가 원활하지 않을 수 있으므로, 즉시 자동 재생 대기 iframe을 마운트함.
             */
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* 타임라인 메타데이터 표시 (읽기 전용) */}
      {data.timeline && data.timeline.length > 0 && (
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-muted)',
          background: 'var(--bg-glass)',
          borderTop: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>⏱️ 타임라인</span>
            <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>(시간을 클릭하면 영상이 이동합니다)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {data.timeline.map((t: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '4px', padding: '2px 6px',
              }}>
                <button
                  onClick={() => handleSeek(t.time)}
                  style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                >
                  {t.time}
                </button>
                {t.note && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>- {t.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메모 표시 (읽기 전용) */}
      {data.memo && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--bg-glass)',
          borderTop: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>📝 사용자 메모</span>
          </div>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
            borderRadius: '4px', padding: '8px', fontSize: '11px', color: 'var(--text-main)',
            whiteSpace: 'pre-wrap', lineHeight: '1.4'
          }}>
            {data.memo}
          </div>
        </div>
      )}
    </div>
  )
}
