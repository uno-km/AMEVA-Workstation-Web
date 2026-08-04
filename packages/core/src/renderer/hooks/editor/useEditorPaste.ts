/**
 * @file useEditorPaste.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @location src/renderer/hooks/editor/useEditorPaste.ts
 * @role Editor Paste Event clipboard URL parser Hook
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 사용자의 에디터 캔버스 영역 내 붙여넣기(`onPasteCapture`) 동작을 인터셉트하여, 클립보드에 들고 온 텍스트 포맷을 정밀 분석한다.
 * - [FIX-YT-001] 붙여넣은 텍스트가 YouTube Shorts, Live 또는 일반 주소일 때, 텍스트가 날것으로 노출되는 대신 `youtube` 렌더 블록으로 즉각 치환 인서트한다.
 * - 일반 웹페이지 URL 붙여넣기 시, 임시 로더 블록(`linkPreview`)을 끼워 넣고, 백그라운드 OpenGraph Fetch 파이프라인을 구동하여 카드 UI로 자동 치환한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 클립보드 원시 이미지 파일 복사 및 VFS 업로드 (useEditorPaste와 독립적인 업로드 인터셉터에서 관리).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT block rendering thread: 백그라운드 OpenGraph Fetch 비동기 연산 중에는 메인 렌더 스레드가 중단되지 않도록,
 *   반드시 async/await 비동기 격리 구조를 적용하고 catch 예외 발생 시 에러 로그를 명확히 출력할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useCallback: 붙여넣기 인터셉터 함수가 리렌더마다 재생성되어 타이핑 렉을 유발하지 않도록 하는 리액트 기본 API.
 */
import { useCallback } from 'react'

/* 
 * [SHARED SCHEMAS]
 * - AmevaEditor: 블록노트 기반 커스텀 렌더 스키마 에디터 타입.
 * - EditorMode: 웰컴/편집/미리보기 모드 타입 지표.
 */
import type { AmevaEditor } from '../../editor/amevaBlockSchema'
import type { EditorMode } from '../../../shared/types'

/**
 * @hook useEditorPaste
 * @description 클립보드 텍스트 붙여넣기 시, 유튜브 링크나 일반 웹 주소를 미디어/프리뷰 블록으로 자동 변환 처리하는 훅.
 */
export function useEditorPaste(
  /*
   * [HOOK CONFIG PARAMETERS]
   * - editor: BlockNote API 본체.
   * - editorMode: 에디터 렌더 화면 모드.
   */
  editor: AmevaEditor | null, 
  editorMode: EditorMode
) {
  /**
   * [CONTRACT - Clipboard Paste Event Capture Handler]
   * - Rationale: e.clipboardData 객체로부터 붙여넣은 문자열을 추출하여, 정규식 패턴 분석 후 비동기 Fetch 처리를 유도한다.
   */
  const onPasteCapture = useCallback(async (e: React.ClipboardEvent) => {
    // 편집 모드가 아니거나 에디터 기동 전인 경우 즉각 이벤트를 흘려보냄
    if (!editor || editorMode !== 'edit') return
    
    // 클립보드 텍스트 평문 데이터 획득
    let text = e.clipboardData.getData('text/plain')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!text`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!text)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!text) return
    text = text.trim()

    // 1. YouTube Shorts, Live 및 일반 주소 통합 감지 정규식
    const shortsMatch = text.match(/youtube\.com\/shorts\/([\w-]{11})/)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ytRegex`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ytRegex = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ytMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ytMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const ytMatch = text.match(ytRegex)
    
    // 일반 URL 패턴 감지 정규식
    const isUrl = /^https?:\/\/[^\s]+$/.test(text)

    // 유튜브 동영상 주소 감지 조건 노드
    if (shortsMatch || ytMatch) {
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
      editor.insertBlocks(
        [{ type: 'youtube', props: { url: text, videoId } }],
        editor.getTextCursorPosition().block,
        'after'
      )
    } 
    // 일반 웹페이지 URL 감지 조건 노드 (Link Preview Card 빌드 시작)
    else if (isUrl) {
      e.preventDefault()
      e.stopPropagation()
      
      // 1) Loading 상태의 임시 링크 프리뷰 블록 먼저 삽입 (Race Condition 방지)
      const newBlock = {
        type: 'linkPreview',
        props: { url: text, title: 'Loading preview...', description: '웹 페이지 정보를 불러오는 중입니다...', thumbnail: '' }
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
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(text)}`)
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
          const title = ogTitleMatch?.[1] || titleMatch?.[1] || text
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
            const urlObj = new URL(text)
            thumbnail = `${urlObj.protocol}//${urlObj.host}${thumbnail}`
          }

          // 현재 커서 뒤에 삽입되었던 target 임시 블록 노드를 식별하여 교체 덮어쓰기
          const nextBlock = editor.getTextCursorPosition().nextBlock
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `nextBlock && nextBlock.type === 'linkPreview' && nextBlock.props.url === text`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (nextBlock && nextBlock.type === 'linkPreview' && nextBlock.props.url === text)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (nextBlock && nextBlock.type === 'linkPreview' && nextBlock.props.url === text) {
            editor.updateBlock(nextBlock, { props: { ...nextBlock.props, title, description, thumbnail } as any })
          }
        }
      } catch (err) {
        console.error('linkPreview fetch failed:', err)
      }
    } 
    // 계산기 문자열 포맷(예: 3 + 5 = 8) 감지 시, 인용구 스타일 우회 삽입 노드
    else if (text.includes('=') && /[0-9+\-*/().\s]+=/.test(text) && text.length < 100) {
      e.preventDefault()
      e.stopPropagation()
      editor.insertBlocks([
        { type: 'paragraph', content: '' },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '🧮 계산 결과: ', styles: { bold: true } as any },
            { type: 'text', text, styles: { textColor: 'blue' } as any }
          ]
        }
      ], editor.getTextCursorPosition().block, 'after')
    }
  }, [editor, editorMode])

  return { onPasteCapture }
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 클립보드 내보내기 마임 타입(예: HTML, RTF 등) 가공이 필요한 경우:
 *    - `e.clipboardData.getData(...)` 호출에 해당 마임 타입을 타깃하여 데이터 분석 논리를 추가할 것.
 * ============================================================================
 */

