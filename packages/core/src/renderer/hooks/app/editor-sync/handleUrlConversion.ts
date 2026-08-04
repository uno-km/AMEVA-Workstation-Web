/**
 * @file handleUrlConversion.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @location src/renderer/hooks/app/editor-sync/handleUrlConversion.ts
 * @role Editor paragraph URL plain text to Media card converter pipeline handler
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 문서 작성 중 사용자가 평문 단락에 외부 웹 주소를 붙여넣거나 입력했을 때,
 *   그것을 링크 텍스트가 아닌 'youtube 동영상 임베드' 혹은 'linkPreview 메타 카드' 블록으로 자동 전환하여 문서 시각성을 높인다.
 * - 단, 동일 블록에 대해 연속적으로 메타데이터를 재요청하는 브라우저 네트워크 부하를 막기 위해
 *   **`processedUrlsRef` (블록 ID 해시 셋)**을 도입하여 평생 단 1회만 변환 파이프라인이 기동되도록 통제 차단한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 텍스트 입력 단락에 단일 URL 문자열이 감지되는지 정규식 검사를 수행한다.
 * - [FIX-YT-001] 일반/Shorts/Live/임베드 유튜브 주소에서 11자리 비디오 ID를 발라내어 전용 유튜브 블록을 구성한다.
 * - Electron IPC(`electronAPI.fetchUrlMetadata`) API를 호출하여 OpenGraph 정보를 비동기로 로드하고 카드 블록 속성을 갱신한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT swallow API failures: 메타데이터 Fetch 실패 혹은 VFS/블록 업데이트 에러 발생 시,
 *   유저가 상태를 직관적으로 파악할 수 있도록 '연결 실패' 안내 메타데이터를 주입하고, `console.error`로 예외 원인을 상세 로깅할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [SHARED SCHEMAS]
 * - AppEditor: 블록노트 커스텀 렌더 에디터 타입.
 */
import type { AmevaEditor as AppEditor } from '../../../editor/amevaBlockSchema'

/**
 * @function handleUrlConversion
 * @description 에디터 입력 시 URL 문자열 형태를 감지하여 유튜브 미디어 블록 혹은 링크 카드 프리뷰로 자동 격상하는 함수.
 */
export function handleUrlConversion(
  /*
   * [PARAMETER CONTRACTS]
   * - editor: BlockNote API 본체.
   * - processedUrlsRef: 중복 변환 요청을 차단하기 위한 처리 완료 블록 ID 보관 Set 레퍼런스.
   */
  editor: AppEditor,
  processedUrlsRef: React.MutableRefObject<Set<string>>
) {
  try {
    // 1. 에디터 캔버스의 현재 텍스트 커서 위치 캡처
    const cursor = editor.getTextCursorPosition()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `activeBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const activeBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const activeBlock = cursor?.block
    
    // 2. 현재 포커스된 블록이 paragraph이고 단일 텍스트 구조 노드인 경우에만 감지 가동
    if (activeBlock && activeBlock.type === 'paragraph') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `contentArr`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const contentArr = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const contentArr = activeBlock.content as any[]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `contentArr && contentArr.length === 1 && contentArr[0].type === 'text'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (contentArr && contentArr.length === 1 && contentArr[0].type === 'text')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (contentArr && contentArr.length === 1 && contentArr[0].type === 'text') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `textVal`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const textVal = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const textVal = contentArr[0].text.trim()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `urlPattern`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const urlPattern = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const urlPattern = /^(https?:\/\/[^\s]+)$/i
        
        // 정규식 통과 분기 노드
        if (urlPattern.test(textVal)) {
          // 중복 처리 캐시 락 검사
          if (!processedUrlsRef.current.has(activeBlock.id)) {
            processedUrlsRef.current.add(activeBlock.id)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const blockId = activeBlock.id
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `videoId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const videoId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let videoId = ''
            
            // 3. YouTube Shorts, Live, 일반 형태별 11자리 비디오 ID 추출 분기식
            if (textVal.includes('youtube.com/watch?v=')) {
              videoId = textVal.split('watch?v=')[1].split('&')[0]
            } else if (textVal.includes('youtu.be/')) {
              videoId = textVal.split('youtu.be/')[1].split('?')[0]
            } else if (textVal.includes('youtube.com/shorts/')) {
              videoId = textVal.split('/shorts/')[1].split('?')[0]
            } else if (textVal.includes('youtube.com/live/')) {
              videoId = textVal.split('/live/')[1].split('?')[0]
            }

            // 유튜브 비디오 블록으로 다이렉트 자동 변환 적용
            if (videoId) {
              editor.updateBlock(blockId, {
                type: 'youtube',
                props: { url: textVal, videoId: videoId }
              })
            } 
            // 4. 일반 웹 주소인 경우 linkPreview 메타 카드 변환 파이프라인 구동
            else {
              editor.updateBlock(blockId, {
                type: 'linkPreview',
                props: {
                  url: textVal,
                  title: 'Loading preview...',
                  description: 'URL 프리뷰 데이터를 페치하고 있습니다...',
                  thumbnail: ''
                }
              })

              // Electron 주 프로세스의 Node.js 기반 메타 크롤러 연동 시도
              if ((window as any).electronAPI?.fetchUrlMetadata) {
                (window as any).electronAPI.fetchUrlMetadata(textVal).then((metadata: any) => {
                  try {
                    // 수집된 OpenGraph 메타 데이터로 프리뷰 카드 완성
                    editor.updateBlock(blockId, {
                      type: 'linkPreview',
                      props: {
                        url: textVal,
                        title: metadata.title || 'Untitled Page',
                        description: metadata.description || '',
                        thumbnail: metadata.image || ''
                      }
                    })
                  } catch (updateErr) {
                    console.error('Failed to update LinkPreview block with metadata:', updateErr)
                  }
                }).catch((fetchErr: any) => {
                  // CONTRACT: 연결 실패 복원 데이터 주입 보장
                  try {
                    editor.updateBlock(blockId, {
                      type: 'linkPreview',
                      props: {
                        url: textVal,
                        title: '연결 실패',
                        description: `메타데이터 수집 오류: ${fetchErr.message}`,
                        thumbnail: ''
                      }
                    })
                  } catch {}
                })
              }
            }
          }
        }
      }
    }
  } catch (urlErr) {
    console.error('[URL Auto-Convert Failed]', urlErr)
  }
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. linkPreview 카드 UI 내의 썸네일 자동 다운로드 및 VFS 내장 캐시 연동 필요 시:
 *    - `fetchUrlMetadata` 호출 성공 노드에 VFS 로컬 복사 API를 체인 호출할 것.
 * ============================================================================
 */

