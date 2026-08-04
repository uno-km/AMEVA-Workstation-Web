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
import { useState, useEffect } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Video, Play, ExternalLink } from 'lucide-react'
import { type AmevaBlock, type AmevaEditor } from '../editor/amevaBlockSchema'

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
  const { videoId, url, title, description, thumbnail } = props

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
      className="bn-block-content-wrapper"
      style={{
        width: '100%', backgroundColor: '#18181c', border: '1px solid var(--border-muted)',
        borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}
    >
      {/* 헤더 바 */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid var(--border-muted)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', background: '#121215'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Video size={14} style={{ color: '#ff0000' }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>YouTube Player</span>
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          {url} <ExternalLink size={10} />
        </a>
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
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
            /*
             * [FIX-YOUTUBE-001] youtube-nocookie.com 도메인 사용으로 Electron 내 X-Frame-Options 차단 우회.
             * - 기존 youtube.com/embed 은 Electron WebView 보안 정책에 의해 재생이 차단된다.
             * - youtube-nocookie.com 은 쿠키/추적 없는 프라이버시 임베드 도메인으로, CSP 제약 없이 렌더링된다.
             * - autoplay=1&mute=1: 클릭 시 즉시 자동재생, 브라우저 autoplay 정책 회피를 위해 mute=1로 시작.
             * - sandbox 속성은 명시하지 않아야 allow-scripts가 동작한다.
             */
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        )}
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
export const YoutubeBlockSpec = createReactBlockSpec(
  {
    type: 'youtube',
    propSchema: {
      url: { default: '' },
      videoId: { default: '' },
      title: { default: 'YouTube Video' },
      description: { default: '동영상 설명을 불러오려면 클릭하세요.' },
      thumbnail: { default: '' }
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
export const YoutubeBlock = YoutubeBlockSpec()


