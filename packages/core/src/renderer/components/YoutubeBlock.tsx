/**
 * ============================================================================
 * @file YoutubeBlock.tsx
 * @description YoutubeBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './YoutubeBlock';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file YoutubeBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/YoutubeBlock.tsx
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

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useState, useEffect: 리액트 훅을 이용해 비디오 재생 및 메타데이터 동적 업데이트 상태를 관리하기 위해 리액트 라이브러리 임포트.
 * - createReactBlockSpec: BlockNote 라이브러리 상에서 커스텀 React 블록 스펙을 생성하기 위해 임포트.
 * - Video, Play, ExternalLink: 미디어 제어 및 링크 가시성을 표현하기 위해 Lucide React 아이콘 라이브러리 임포트.
 * - AmevaBlock, AmevaEditor: 에디터 스펙과 데이터 계약을 준수하기 위한 타입 정의를 임포트.
 */
// [외부 패키지 및 라이브러리 임포트: react]
import { useState, useEffect, useRef } from 'react'
// [외부 패키지 및 라이브러리 임포트: @blocknote/react]
import { createReactBlockSpec } from '@blocknote/react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Video, Play, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../editor/amevaBlockSchema]
import { type AmevaBlock, type AmevaEditor } from '../editor/amevaBlockSchema'

/**
 * YoutubeBlockComponentProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface YoutubeBlockComponentProps {
  block: AmevaBlock
  editor: AmevaEditor
}

/**
 * @component YoutubeBlockComponent
 * @description 유튜브 블록의 렌더링 및 비디오 재생 제어, 메타데이터 연동을 담당하는 React 컴포넌트.
 *              Rules of Hooks 규칙 준수를 위해 createReactBlockSpec.render 내부에서 분리 정의됨.
 */
export const YoutubeBlockComponent = ({ block, editor }: YoutubeBlockComponentProps) => {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: props
   * - 자료형 / 예상 값: { url: string, videoId: string, title: string, description: string, thumbnail: string }
   * - 시나리오: Block props 정보를 안전하게 가져와 비디오 재생 UI 구성에 소비.
   */
  const props = block.props as {
    url: string
    videoId: string
    title: string
    description: string
    thumbnail: string
  }
  const { videoId, url, title, description, thumbnail, width, height, memo, timeline, isTimelineFolded, isMemoFolded } = props

  const handleMemoBlur = (newMemo: string) => {
    editor.updateBlock(block, { props: { ...props, memo: newMemo } })
  }

  const toggleTimelineFold = () => {
    editor.updateBlock(block, { props: { ...props, isTimelineFolded: !isTimelineFolded } })
  }

  const toggleMemoFold = () => {
    editor.updateBlock(block, { props: { ...props, isMemoFolded: !isMemoFolded } })
  }

  // 타임라인 추가 함수
  const [timelineInputTime, setTimelineInputTime] = useState('')
  const [timelineInputNote, setTimelineInputNote] = useState('')

  const handleAddTimeline = () => {
    if (!timelineInputTime) return
    let currentTimeline = []
    try { 
      currentTimeline = typeof timeline === 'string' ? JSON.parse(timeline || '[]') : (timeline || [])
    } catch (e) {}
    const newTimeline = [...currentTimeline, { time: timelineInputTime, note: timelineInputNote }]
    // 시간순 정렬
    newTimeline.sort((a, b) => {
      const aSec = a.time.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
      const bSec = b.time.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
      return aSec - bSec
    })
    editor.updateBlock(block, { props: { ...props, timeline: JSON.stringify(newTimeline) } })
    setTimelineInputTime('')
    setTimelineInputNote('')
  }

  // 타임라인 클릭 이벤트 (postMessage로 seekTo 호출)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const handleSeek = (timeStr: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return
    // "03:00" -> 180초 계산
    const seconds = timeStr.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
    iframeRef.current.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [seconds, true]
    }), '*')
  }

  const handleDeleteTimeline = (index: number) => {
    let currentTimeline: any[] = []
    try { 
      currentTimeline = typeof timeline === 'string' ? JSON.parse(timeline || '[]') : (timeline || [])
    } catch (e) {}
    currentTimeline.splice(index, 1)
    editor.updateBlock(block, { props: { ...props, timeline: JSON.stringify(currentTimeline) } })
  }

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: isViewMode
   * - 자료형 / 예상 값: boolean (에디터가 편집 불가능한 뷰모드/미리보기 상태인지 여부)
   * - 시나리오: 에디터의 editable 권한 상태를 받아와 뷰모드일 때는 기본값을 true로 설정해 자동 재생을 제어함.
   */
  const isViewMode = !editor.isEditable

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: isPlaying / setIsPlaying
   * - 자료형 / 예상 값: boolean (비디오가 현재 iframe으로 활성화되어 재생 중인지 여부)
   * - 시나리오: 사용자가 재생 버튼 오버레이를 클릭하면 true로 상태 전이되어 유튜브 iframe을 렌더링함.
   */
  const [isPlaying, setIsPlaying] = useState(isViewMode)

  // 유튜브 IFrame API 연동 (현재 재생 시간 및 전체 길이 획득)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setCurrentTime(data.info.currentTime)
          if (data.info.duration !== undefined) setDuration(data.info.duration)
        }
      } catch (err) {}
    }
    window.addEventListener('message', handleMessage)
    
    // IFrame에 infoDelivery 이벤트를 쏘라고 반복 요청 (listening 모드 활성화)
    // isPlaying과 상관없이 한 번 로드된 iframe은 항상 리스닝하게 만듦
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({event: 'listening'}), '*')
      }
    }, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(interval)
    }
  }, [])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sec = parseInt(e.target.value)
    setCurrentTime(sec)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [sec, true]
      }), '*')
    }
  }

  const handleFetchCurrent = () => {
    const sec = Math.floor(currentTime)
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    setTimelineInputTime(`${m}:${s}`)
  }

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: localTitle / setLocalTitle
   * - 자료형 / 예상 값: string (현재 로컬에서 가공된 동영상 제목 버퍼)
   * - 시나리오: 초기 title 속성값을 들고 있다가, noembed API를 통해 실시간으로 Fetch된 실제 영상 제목으로 치환됨.
   */
  const [localTitle, setLocalTitle] = useState(title)

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: localThumbnail
   * - 자료형 / 예상 값: string (유튜브 썸네일 이미지 절대 주소)
   * - 시나리오: 전달된 썸네일이 없으면 videoId를 사용해 공식 hqdefault 이미지 주소를 생성하여 캐싱함.
   */
  const [localThumbnail] = useState(thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''))

  /*
   * [SIDE EFFECT - fetchVideoMetadata]
   * - Rationale: 동영상이 최초 삽입되어 기본 타이틀('YouTube Video')일 때 noembed 오픈 서비스를 호출하여 실제 동영상 제목 정보를 역획득하고 저장한다.
   */
  useEffect(() => {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: videoId && title === 'YouTube Video'
     * - 만족 시: 비디오 ID가 있고 타이틀이 기본값일 때 noembed API를 비동기 호출하여 실제 제목 정보를 가져와 동기화함.
     * - 불만족 시: 바이패스(Bypass)하여 이미 획득한 메타데이터 타이틀을 그대로 유지함.
     * - 예시: if (videoId && title === 'YouTube Video') { fetch('https://noembed.com/...')... }
     */
    if (videoId && title === 'YouTube Video') {
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then(res => res.json())
        .then(data => {
          /*
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: data.title
           * - 만족 시: 데이터에서 성공적으로 제목을 획득하면 로컬 상태를 바꾸고 에디터 문서 속성 정보로 영구 덮어씀.
           * - 불만족 시: 예외 상황으로 응답 제목이 비어있으면 기존 기본 타이틀을 유지함.
           * - 예시: if (data.title) { setLocalTitle(data.title); editor.updateBlock(...) }
           */
          if (data.title) {
            setLocalTitle(data.title)
            editor.updateBlock(block, { props: { ...block.props, title: data.title } })
          }
        })
        .catch(err => {
          console.error('[YoutubeBlockComponent] Failed to fetch video metadata:', err)
        })
    }
  }, [videoId, title, editor, block])

  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: !videoId
   * - 만족 시: 유튜브 비디오 고유 11자리 해시 ID가 없을 때 경고 박스를 렌더링하고 비정상 상태임을 알림.
   * - 불만족 시: 정상 흐름으로 폴백하여 플레이어 박스 레이아웃을 그림.
   * - 예시: if (!videoId) { return <div>유효하지 않은 링크...</div> }
   */
  if (!videoId) {
    return (
      <div style={{
        padding: '12px', backgroundColor: '#1c1c24', border: '1px dashed var(--border-muted)',
        borderRadius: '8px', color: 'var(--text-muted)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'
      }}>
        <Video size={16} />
        <span>유효하지 않은 YouTube 링크입니다. ({url})</span>
      </div>
    )
  }

  return (
    <div
      className="bn-block-content-wrapper ameva-resizable-block"
      onMouseUp={(e) => {
        const el = e.currentTarget
        if (el.style.width && el.style.width !== width) editor.updateBlock(block, { props: { ...props, width: el.style.width } })
        if (el.style.height && el.style.height !== height) editor.updateBlock(block, { props: { ...props, height: el.style.height } })
      }}
      style={{
        width: width || '100%',
        height: height || '315px',
        minWidth: '200px',
        minHeight: '120px',
        resize: 'both',
        position: 'relative',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-muted)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '12px',
        userSelect: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 헤더 바 */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid var(--border-muted)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Video size={14} style={{ color: '#ff0000' }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)' }}>YouTube Player</span>
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          {url} <ExternalLink size={10} />
        </a>
      </div>

      <div style={{ position: 'relative', width: '100%', flex: 1, backgroundColor: '#000' }}>
        {/*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: !isPlaying
         * - 만족 시: 아직 재생이 활성화되지 않은 상태이므로 클릭을 유도하는 커스텀 썸네일 오버레이 및 붉은색 재생 버튼을 그림.
         * - 불만족 시: 재생 상태이므로 보안 정책과 Electron 쿠키 차단을 회회하기 위한 youtube-nocookie.com iframe을 탑재함.
         * - 예시: {!isPlaying ? ( <div onClick={() => setIsPlaying(true)}... ) : ( <iframe ... /> )}
         */
        !isPlaying ? (
          <div 
            onClick={() => setIsPlaying(true)}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              background: `url(${localThumbnail}) center/cover no-repeat`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))'
            }} />
            <div style={{
              width: '60px', height: '40px', background: 'rgba(255, 0, 0, 0.9)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
              boxShadow: '0 4px 12px rgba(255,0,0,0.3)', transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <Play size={20} fill="#fff" color="#fff" />
            </div>
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 2 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{localTitle}</h3>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {description}
              </p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            /*
             * [FIX-YOUTUBE-001] youtube-nocookie.com 도메인 사용으로 Electron 내 X-Frame-Options 차단 우회.
             * - 기존 youtube.com/embed 은 Electron WebView 보안 정책에 의해 재생이 차단된다.
             * - youtube-nocookie.com 은 쿠키/추적 없는 프라이버시 임베드 도메인으로, CSP 제약 없이 렌더링된다.
             * - autoplay=1&mute=1: 클릭 시 즉시 자동재생, 브라우저 autoplay 정책 회피를 위해 mute=1로 시작.
             * - sandbox 속성은 명시하지 않아야 allow-scripts가 동작한다.
             */
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        )}
      </div>
      
      {/* 타임라인 및 메모 섹션 */}
      <div style={{
        borderTop: '1px solid var(--border-muted)',
        background: 'rgba(255,255,255,0.01)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 타임라인 영역 */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={toggleTimelineFold}
          >
            {isTimelineFolded ? <ChevronRight size={14} color="var(--text-main)" /> : <ChevronDown size={14} color="var(--text-main)" />}
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>⏱️ 타임라인</span>
            {!isTimelineFolded && <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>(시간을 클릭하면 영상이 이동합니다)</span>}
          </div>

          {!isTimelineFolded && (
            <>
              {/* 등록된 타임라인 리스트 */}
              {timeline && timeline !== '[]' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {((typeof timeline === 'string' ? JSON.parse(timeline || '[]') : timeline) as {time: string, note: string}[]).map((t, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', padding: '2px 6px',
                    }}>
                      <button
                        onClick={() => handleSeek(t.time)}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                      >
                        {t.time}
                      </button>
                      {t.note && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>- {t.note}</span>}
                      {editor.isEditable && (
                        <button onClick={() => handleDeleteTimeline(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', padding: '0 0 0 4px' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 타임라인 추가 폼 */}
              {editor.isEditable && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="03:00"
                      value={timelineInputTime}
                      onChange={e => setTimelineInputTime(e.target.value)}
                      style={{ width: '50px', background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', color: 'var(--text-main)', fontSize: '10px', padding: '4px 6px', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="타임라인 내용..."
                      value={timelineInputNote}
                      onChange={e => setTimelineInputNote(e.target.value)}
                      style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', color: 'var(--text-main)', fontSize: '10px', padding: '4px 6px', borderRadius: '4px' }}
                    />
                    <button
                      onClick={handleAddTimeline}
                      className="btn btn-primary"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                    >추가</button>
                  </div>

                  {/* 재생 중일 때만 슬라이더 및 현재 위치 지정 버튼 노출 */}
                  {duration > 0 && (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', width: '30px', textAlign: 'center' }}>
                        {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={Math.floor(duration)}
                        value={Math.floor(currentTime)}
                        onChange={handleSliderChange}
                        style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {Math.floor(duration / 60).toString().padStart(2, '0')}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={handleFetchCurrent}
                        className="btn btn-glass"
                        style={{ fontSize: '9.5px', padding: '2px 6px', color: '#38bdf8', fontWeight: 'bold' }}
                        title="현재 재생 중인 영상 위치를 가져옵니다"
                      >
                        📌 현재 위치
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 사용자 메모 영역 */}
        <div style={{ padding: '10px 14px', borderTop: '1px dashed var(--border-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={toggleMemoFold}
          >
            {isMemoFolded ? <ChevronRight size={14} color="var(--text-main)" /> : <ChevronDown size={14} color="var(--text-main)" />}
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>📝 사용자 메모</span>
          </div>

          {!isMemoFolded && (
            editor.isEditable ? (
              <textarea
                defaultValue={memo}
                onBlur={e => handleMemoBlur(e.target.value)}
                placeholder="영상에 관한 중요한 메모를 남기세요..."
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
    </div>
  )
}

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `YoutubeBlockSpec`
 * - 역할: 블록노트 커스텀 유튜브 블록 사양을 선언하고 컴포넌트를 연결함.
 * - 예시: `YoutubeBlockSpec(...)` 호출 시 에러가 없고, 렌더 호출에 컴포넌트 객체를 공급함.
 */
/**
 * YoutubeBlockSpec 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const YoutubeBlockSpec = createReactBlockSpec(
  {
    type: 'youtube',
    propSchema: {
      url: { default: '' },
      videoId: { default: '' },
      title: { default: 'YouTube Video' },
      description: { default: '동영상 설명을 불러오려면 클릭하세요.' },
      thumbnail: { default: '' },
      width: { default: '100%' },
      height: { default: '315px' },
      memo: { default: '' },
      timeline: { default: '[]' },
      isTimelineFolded: { default: false },
      isMemoFolded: { default: false }
    },
    content: 'none'
  },
  {
    render: ({ block, editor }) => {
      // 렌더 함수 내에 직접 훅을 쓰지 않고 별도의 YoutubeBlockComponent로 위임하여 rules-of-hooks 해결
      return <YoutubeBlockComponent block={block as AmevaBlock} editor={editor as AmevaEditor} />
    }
  }
)

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `YoutubeBlock`
 * - 역할: 유튜브 블록 사양 정의 인스턴스를 즉시 빌드함.
 * - 예시: `YoutubeBlock(...)` 호출 시 런타임 구성 갱신.
 */
/**
 * YoutubeBlock 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const YoutubeBlock = YoutubeBlockSpec()


