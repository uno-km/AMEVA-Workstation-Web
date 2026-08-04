/**
 * @file useEditorDragDrop.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @location src/renderer/hooks/editor/useEditorDragDrop.ts
 * @role Editor Drag & Drop URL Media interceptor Hook
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 에디터 영역 내의 외부 텍스트/URL 드롭 이벤트(`onDropCapture`)를 가로채어 적절한 미디어 블록으로 자동 파싱 인서트한다.
 * - [FIX-YT-001] YouTube 일반 비디오, 임베드 링크, 실시간 스트리밍 및 Shorts URL 패턴을 감지하여 고유 `youtube` 커스텀 블록을 삽입한다.
 * - 일반 웹 사이트 URL 드롭 시, `linkPreview` 임시 로딩 블록을 선 삽입 후, 백그라운드에서 **CORS 프록시(allorigins.win)**를 이용해 OpenGraph 메타 타이틀/디스크립션/이미지를 fetch하여 해당 블록을 동적 업데이트한다.
 * - 외부 윈도우 채널(Youtube PIP 모드 등)에서 전파되는 커스텀 이벤트 `app:insert-youtube` 수신 시 비디오 블록을 즉시 파킹한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 이미지/파일 드래그 시 로컬 업로드 처리 (useNativeUploadIntercept 훅이 담당).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT cause sync block: 외부 URL 메타 정보 Fetch 비동기 연산 중에는 메인 렌더 스레드가 중단되지 않도록,
 *   반드시 async/await 비동기 격리 락 구조를 유지하고 catch 예외 로그를 콘솔에 정확히 기재할 것.
 * - MUST: `app:insert-youtube` 전역 윈도우 이벤트 감청 등록 시, 훅 소멸 단계(`cleanup`)에서 리스너를 완전히 제거(`removeEventListener`)할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useCallback: 드롭 감지 핸들러 재생성을 차단하여 자식 에디터 컴포넌트의 렉을 방지하기 위한 메모이즈 훅.
 * - useEffect: 유튜브 인서트 전역 이벤트를 수신 등록하기 위한 라이프사이클 훅.
 */
import { useCallback, useEffect } from 'react'

/* 
 * [SHARED SCHEMAS]
 * - AmevaEditor: 블록노트 기반 커스텀 렌더 스키마 에디터 타입.
 * - EditorMode: 웰컴/편집/미리보기 모드 타입 지표.
 */
import type { AmevaEditor } from '../../editor/amevaBlockSchema'
import type { EditorMode } from '../../../shared/types'

/**
 * @hook useEditorDragDrop
 * @description 드래그 드롭 이벤트를 분석하여 최적의 유튜브 혹은 링크 프리뷰 카드 블록을 자동 삽입해 주는 훅.
 */
export function useEditorDragDrop(
  /*
   * [HOOK CONFIG PARAMETERS]
   * - editor: BlockNote API 본체.
   * - editorMode: 에디터 렌더 화면 모드.
   */
  editor: AmevaEditor | null, 
  editorMode: EditorMode
) {
  /**
   * [CONTRACT - Drag Drop Event Capture Handler]
   * - Rationale: e.dataTransfer 객체로부터 드롭된 문자열을 추출하여 정규식 패턴 분석 후 비동기 Fetch 처리를 유도한다.
   */
  const onDropCapture = useCallback(async (e: React.DragEvent) => {
    // 편집 모드가 아니거나 에디터 기동 전인 경우 즉각 이벤트를 흘려보냄
    if (!editor || editorMode !== 'edit') return
    
    // 드롭된 문자열 획득 (uri-list 우선, 없으면 일반 text 추출)
    let url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!url`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!url)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!url) return
    url = url.trim()

    // 0. Stock Snapshot Drag & Drop markdown parsing check
    if (url.startsWith('### 📊') && url.includes('시세 스냅샷')) {
      e.preventDefault()
      e.stopPropagation()
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(url)
        editor.insertBlocks(blocks, editor.getTextCursorPosition().block, 'after')
      } catch (err) {
        console.error('Failed to parse stock snapshot drop:', err)
      }
      return
    }

    // 1. YouTube Shorts, Live 및 일반 주소 통합 감지 정규식
    const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube\.com\/live\/)?([\w-]{11})(?:[?&][^\s]*)?$/
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ytMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ytMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const ytMatch = url.match(ytRegex)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `shortsMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const shortsMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]{11})/)
    
    // 일반 URL 패턴 감지 정규식
    const urlRegex = /^https?:\/\/[^\s]+$/
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isUrl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isUrl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isUrl = urlRegex.test(url)

    // 유튜브 동영상 주소 감지 조건 노드
    if (ytMatch || shortsMatch) {
      e.preventDefault()
      e.stopPropagation()
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `videoId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const videoId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const videoId = shortsMatch?.[1] || ytMatch?.[1] || ''
      editor.insertBlocks([{
        type: 'youtube',
        props: { url, videoId }
      }], editor.getTextCursorPosition().block, 'after')
    } 
    // 일반 웹페이지 URL 감지 조건 노드 (Link Preview Card 빌드 시작)
    else if (isUrl) {
      e.preventDefault()
      e.stopPropagation()
      
      // 1) Loading 상태의 임시 링크 프리뷰 블록 먼저 삽입 (Race Condition 방지)
      const newBlock = {
        type: 'linkPreview',
        props: { url, title: 'Loading preview...', description: '웹 페이지 정보를 불러오는 중입니다...', thumbnail: '' }
      }
      editor.insertBlocks([newBlock as any], editor.getTextCursorPosition().block, 'after')

      // 2) 백그라운드 OpenGraph Fetch 시도 (CORS 프록시 우회 사용)
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `res`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const res = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `res.ok`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (res.ok)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (res.ok) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `data`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const data = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const data = await res.json()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const html = data.contents
          
          // HTML 마크업 내부의 title 및 OpenGraph 메타 태그 정규식 매칭 추출
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ogTitleMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ogTitleMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ogDescMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ogDescMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `descMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const descMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ogImageMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ogImageMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
          
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `title`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const title = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const title = ogTitleMatch?.[1] || titleMatch?.[1] || url
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `description`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const description = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const description = ogDescMatch?.[1] || descMatch?.[1] || '설명이 제공되지 않는 웹페이지입니다.'
          
          // 상대 경로 이미지인 경우 도메인 주소를 접합하여 절대 경로로 보정
          let thumbnail = ogImageMatch?.[1] || ''
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `thumbnail && thumbnail.startsWith('/')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (thumbnail && thumbnail.startsWith('/'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (thumbnail && thumbnail.startsWith('/')) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `urlObj`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const urlObj = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const urlObj = new URL(url)
            thumbnail = `${urlObj.protocol}//${urlObj.host}${thumbnail}`
          }

          // 현재 커서 뒤에 삽입되었던 target 임시 블록 노드를 식별하여 교체 덮어쓰기
          const currentBlock = editor.getTextCursorPosition().block
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nextBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nextBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const nextBlock = editor.getTextCursorPosition().nextBlock
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `targetBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const targetBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const targetBlock = (nextBlock?.type === 'linkPreview' && nextBlock.props.url === url) ? nextBlock : 
                              (currentBlock?.type === 'linkPreview' && currentBlock.props.url === url) ? currentBlock : null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `targetBlock`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (targetBlock)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (targetBlock) {
            editor.updateBlock(targetBlock, { props: { ...targetBlock.props, title, description, thumbnail } as any })
          }
        }
      } catch (err) {
        console.error('Failed to fetch link preview:', err)
      }
    } 
    // 계산기 문자열 포맷(예: 3 + 5 = 8) 감지 시, 인용구 스타일 우회 삽입 노드
    else if (url.includes('=') && /[0-9+\-*/().\s]+=/.test(url) && url.length < 100) {
      e.preventDefault()
      e.stopPropagation()
      editor.insertBlocks([
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: [{ type: 'text', text: '🧮 계산 결과: ', styles: { bold: true } as any }, { type: 'text', text: url, styles: { textColor: 'blue' } as any }] }
      ], editor.getTextCursorPosition().block, 'after')
    }
  }, [editor, editorMode])

  /**
   * [SIDE EFFECT - Global Youtube Insert Signal Listener]
   * - Rationale: 유튜브 PIP 창에서 에디터로 동영상을 직접 전송하는 `app:insert-youtube` 이벤트를 가로챈다.
   */
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor || editorMode !== 'edit'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor || editorMode !== 'edit')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor || editorMode !== 'edit') return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleInsertYoutube`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleInsertYoutube = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    // (1) 유튜브 삽입 이벤트 핸들러
    const handleInsertYoutube = (e: Event) => {
      const customEvent = e as CustomEvent
      const videoId = customEvent.detail?.videoId
      if (videoId) {
        editor.insertBlocks([{
          type: 'youtube',
          props: { url: `https://youtube.com/watch?v=${videoId}`, videoId }
        }], editor.getTextCursorPosition().block, 'after')
      }
    }

    // (2) [FIX-MAP-INSERT-001] 지도 삽입 이벤트 핸들러
    // - 사이드바 지도 탭(GoogleMapsView)에서 발송되는 app:insert-map 이벤트를 가로채어,
    //   현재 커서 위치 바로 아래에 신규 MapBlock을 생성/인서트한다.
    // - 전달받은 lat, lng, zoom, locationName, destination, legend, memo 속성을 완벽히 병합 전달한다.
    const handleInsertMap = (e: Event) => {
      const customEvent = e as CustomEvent
      const { lat, lng, destLat, destLng, zoom, locationName, destination, legend, memo, routeType } = customEvent.detail || {}
      if (lat != null && lng != null) {
        editor.insertBlocks([{
          type: 'map',
          props: {
            lat: String(lat),
            lng: String(lng),
            destLat: destLat != null ? String(destLat) : '',
            destLng: destLng != null ? String(destLng) : '',
            zoom: String(zoom || '14'),
            locationName: locationName || '지정된 위치',
            destination: destination || '',
            legend: legend || '',
            memo: memo || '',
            routeType: routeType || 'none'
          }
        } as any], editor.getTextCursorPosition().block, 'after')
      }
    }

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `handleInsertJson`
     * - 자료형 / 예상 값: (e: Event) => void
     * - 시나리오: REST API 클라이언트 플러그인(RestClientPlugin)에서 발송되는 커스텀 이벤트를 감지하여,
     *   현재 커서 포커스 위치 바로 아래에 JSON 코드 블록(codeBlock)을 생성하고 삽입한다.
     */
    const handleInsertJson = (e: Event) => {
      const customEvent = e as CustomEvent
      const jsonText = customEvent.detail?.jsonText
      
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `jsonText`가 비어있지 않은 적격 문자열인 경우에만 블록 인서트를 진행
       */
      if (jsonText) {
        editor.insertBlocks([{
          type: 'codeBlock',
          props: { language: 'json' },
          content: [{ type: 'text', text: jsonText, styles: {} }]
        } as any], editor.getTextCursorPosition().block, 'after')
      }
    }

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `handleInsertMarkdown`
     * - 자료형 / 예상 값: (e: Event) => Promise<void>
     * - 시나리오: 웹 브라우저 플러그인(AmevaBrowserView)에서 수집한 웹 페이지 스크랩 마크다운 데이터를 전달받아,
     *   에디터 블록 형식으로 파싱 후 현재 포커스 커서 위치 바로 아래에 삽입한다.
     */
    const handleInsertMarkdown = async (e: Event) => {
      const customEvent = e as CustomEvent
      const markdownText = customEvent.detail?.markdownText
      
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `markdownText`가 부재하지 않은 경우에만 에디터 내 파싱 및 삽입 연산을 기동한다.
       */
      if (markdownText) {
        const blocks = await editor.tryParseMarkdownToBlocks(markdownText)
        editor.insertBlocks(blocks, editor.getTextCursorPosition().block, 'after')
      }
    }
    
    // 리스너 등록
    window.addEventListener('app:insert-youtube', handleInsertYoutube)
    window.addEventListener('app:insert-map', handleInsertMap)
    window.addEventListener('app:insert-json', handleInsertJson)
    window.addEventListener('app:insert-markdown', handleInsertMarkdown)
    
    // CONTRACT: 리스너 누수 제거 클린업 이행
    return () => {
      window.removeEventListener('app:insert-youtube', handleInsertYoutube)
      window.removeEventListener('app:insert-map', handleInsertMap)
      window.removeEventListener('app:insert-json', handleInsertJson)
      window.removeEventListener('app:insert-markdown', handleInsertMarkdown)
    }
  }, [editor, editorMode])

  return { onDropCapture }
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 신규 미디어 호스트(예: Vimeo, DailyMotion 등) 지원을 추가하고 싶을 때:
 *    - `onDropCapture` 정규식 조건 노드에 해당 호스트 분석용 분기 구문을 삽입할 것.
 * ============================================================================
 */

