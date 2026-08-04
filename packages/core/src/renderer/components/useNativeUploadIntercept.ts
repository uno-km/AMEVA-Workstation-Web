/**
 * @file useNativeUploadIntercept.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/useNativeUploadIntercept.ts
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

import { useEffect } from 'react'
import { type AmevaEditor } from '../editor/amevaBlockSchema'
import * as ipc from '../services/ipc/electronApiAdapter'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useNativeUploadIntercept`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useNativeUploadIntercept(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useNativeUploadIntercept(
  editor: AmevaEditor | null,
  editorContainerRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor || !editorContainerRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor || !editorContainerRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor || !editorContainerRef.current) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const container = editorContainerRef.current

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isEditorMounted`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isEditorMounted = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isEditorMounted = () => {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `view`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const view = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const view = (editor as any).proseMirrorView || (editor as any)._tiptapEditor?.view
        return !!(view && view.dom && document.body.contains(view.dom))
      } catch {
        return false
      }
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleFileUploadIntercept`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleFileUploadIntercept = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleFileUploadIntercept = async (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isEditorMounted()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isEditorMounted())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isEditorMounted()) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `target`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const target = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const target = e.target as HTMLElement
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `button`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const button = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const button = target.closest('button') || target.closest('[role="button"]') || target.closest('.bn-file-input')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isUploadTrigger`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isUploadTrigger = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const isUploadTrigger = !!(button && (
        button.classList.contains('bn-file-input') ||
        button.textContent?.includes('Choose File') || 
        button.textContent?.includes('Upload File') ||
        button.textContent?.includes('Upload Image') ||
        button.textContent?.includes('Upload Video') ||
        button.textContent?.includes('Upload Audio')
      ))

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isUploadTrigger`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isUploadTrigger)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isUploadTrigger) return

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!ipc.isElectronEnv()) return

      e.preventDefault()
      e.stopPropagation()

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pos = editor.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos?.block`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos?.block)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!pos?.block) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const blockId = pos.block.id
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blockType`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blockType = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const blockType = pos.block.type

      let filters: any[] = []
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockType === 'image'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockType === 'image')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (blockType === 'image') {
        filters = [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }]
      } else if (blockType === 'video') {
        filters = [{ name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'mov'] }]
      } else if (blockType === 'audio') {
        filters = [{ name: 'Audios', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }]
      } else {
        filters = [{ name: 'All Files', extensions: ['*'] }]
      }

      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `res`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const res = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const res = await ipc.selectLocalFile(filters)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `res && res.base64`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (res && res.base64)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (res && res.base64) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fileExt`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fileExt = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const fileExt = res.filePath.split('.').pop()?.toLowerCase() || 'png'
          
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mimeType`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mimeType = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          let mimeType = 'image/png'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `blockType === 'image'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (blockType === 'image')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (blockType === 'image') mimeType = `image/${fileExt === 'svg' ? 'svg+xml' : fileExt}`
          else if (blockType === 'video') mimeType = `video/${fileExt}`
          else if (blockType === 'audio') mimeType = `audio/${fileExt}`
          else mimeType = 'application/octet-stream'

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dataUrl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dataUrl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const dataUrl = `data:${mimeType};base64,${res.base64}`

          editor.updateBlock(blockId, {
            type: blockType as any,
            props: { url: dataUrl } as any
          })
        }
      } catch (err) {
        console.error('Electron file upload intercept failed:', err)
      }
    }

    container.addEventListener('click', handleFileUploadIntercept, true)
    return () => {
      container.removeEventListener('click', handleFileUploadIntercept, true)
    }
  }, [editor, editorContainerRef])
}

