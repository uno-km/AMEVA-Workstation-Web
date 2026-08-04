/**
 * @file InlineYoutubeRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineYoutubeRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 ameva-youtube 인라인 세그먼트 전용 유튜브 뷰어로 소비.
 */

import React from 'react'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineYoutubeRenderer`
   * - 역할: ameva-youtube 마크다운 코드블록의 JSON 데이터를 파싱하여 공식 유튜브 우회 재생 프레임(iframe)을 반응형 플레이어로 렌더링함.
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
    data = JSON.parse(code)
  } catch (err) {
    console.error('[InlineYoutubeRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>동영상 정보를 해석할 수 없습니다.</div>
  }

  const url = data.url || ''
  const videoId = data.videoId || ''
  const title = data.title || 'YouTube Video'
  const description = data.description || '동영상 설명을 불러오려면 클릭하세요.'

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
            /*
             * [FIX-YOUTUBE-001] youtube-nocookie.com 도메인 사용으로 Electron 내 X-Frame-Options 차단 우회.
             * - 뷰모드(미리보기)에서는 클릭 이벤트 전파가 원활하지 않을 수 있으므로, 즉시 자동 재생 대기 iframe을 마운트함.
             */
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}
