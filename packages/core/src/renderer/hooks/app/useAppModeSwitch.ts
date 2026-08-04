/**
 * @file useAppModeSwitch.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useAppModeSwitch.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import { normalizeMarkdown, cleanCodeBlocks, ensureBlockIds, cleanMarkdownCodeBlocks, convertJupyterToCodeBlocks } from '../../utils/markdownUtils'
import { type AmevaEditor as AppEditor } from '../../editor/amevaBlockSchema'
import { type EditorMode } from '../../../shared/types'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useAppModeSwitch`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useAppModeSwitch(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useAppModeSwitch({
  editor,
  editorMode,
  setEditorMode,
  currentContent,
  setCurrentContent,
  setOriginalContent,
  loadMarkdownIntoEditor,
  DEFAULT_WELCOME_TEXT,
}: {
  editor: AppEditor | null
  editorMode: EditorMode
  setEditorMode: (mode: EditorMode) => void
  currentContent: string
  setCurrentContent: (content: string) => void
  setOriginalContent: (content: string) => void
  loadMarkdownIntoEditor: (editor: AppEditor, content: string, isBinary?: boolean, filePath?: string) => Promise<void>
  DEFAULT_WELCOME_TEXT: string
}) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleRollback`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleRollback = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleRollback = async (rollbackContent: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
    await loadMarkdownIntoEditor(editor, rollbackContent)
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleSwitchMode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleSwitchMode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleSwitchMode = async (mode: EditorMode) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editorMode === 'edit' && (mode === 'preview' || mode === 'raw') && editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editorMode === 'edit' && (mode === 'preview' || mode === 'raw') && editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (editorMode === 'edit' && (mode === 'preview' || mode === 'raw') && editor) {
      if (document.activeElement && (document.activeElement as HTMLElement).blur) {
        (document.activeElement as HTMLElement).blur()
        window.dispatchEvent(new CustomEvent('AMEVA_FORCE_SAVE_BLOCKS'))
        await new Promise(resolve => setTimeout(resolve, 150))
      }
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `latest`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const latest = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        let latest = await editor.blocksToMarkdownLossy(convertJupyterToCodeBlocks(editor.document))

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blocks = editor.document as any[]
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mermaidBlocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mermaidBlocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const mermaidBlocks = blocks.filter(
          b => b.type === 'codeBlock' &&
          (b.props?.language || '').toLowerCase() === 'mermaid'
        )

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `mermaidBlocks.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (mermaidBlocks.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (mermaidBlocks.length > 0) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasMermaidFence`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasMermaidFence = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const hasMermaidFence = latest.includes('```mermaid')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!hasMermaidFence`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!hasMermaidFence)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (!hasMermaidFence) {
            const lines: string[] = []
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const block of blocks) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
            for (const block of blocks) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const lang = (block.props?.language || '').toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `code`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const code = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const code = Array.isArray(block.content)
                ? block.content.map((c: any) => c.text ?? '').join('')
                : typeof block.content === 'string' ? block.content : ''

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.type === 'codeBlock'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.type === 'codeBlock')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (block.type === 'codeBlock') {
                lines.push(`\`\`\`${lang}`)
                lines.push(code)
                lines.push('```')
                lines.push('')
              } else if (block.type === 'heading') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hashes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hashes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
                const hashes = '#'.repeat(Math.min(6, Math.max(1, Number(block.props?.level) || 1)))
                lines.push(`${hashes} ${code}`)
                lines.push('')
              } else if (block.type === 'paragraph') {
                lines.push(code || '')
                lines.push('')
              } else if (block.type === 'bulletListItem') {
                lines.push(`- ${code}`)
              } else if (block.type === 'numberedListItem') {
                lines.push(`1. ${code}`)
              } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `code) { lines.push(code); lines.push(''`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (code) { lines.push(code); lines.push('')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
                if (code) { lines.push(code); lines.push('') }
              }
            }
            latest = lines.join('\n')
          }
        }

        latest = cleanMarkdownCodeBlocks(latest)
        setCurrentContent(latest)
      } catch (err) {
        console.error('[handleSwitchMode] markdown 변환 실패:', err)
      }
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `mode === 'edit' && editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (mode === 'edit' && editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (mode === 'edit' && editor) {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `normalized`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const normalized = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const normalized = normalizeMarkdown(useWorkspaceStore.getState().currentContent)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const blocks = await editor.tryParseMarkdownToBlocks(normalized)
        cleanCodeBlocks(blocks)
        ensureBlockIds(blocks)
        editor.replaceBlocks(editor.document, blocks)
      } catch (err) {
        console.error('[handleSwitchMode] editor blocks 로드 실패:', err)
      }
    }

    setEditorMode(mode)
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleStartWelcomeEdit`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleStartWelcomeEdit = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleStartWelcomeEdit = async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `normalized`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const normalized = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const normalized = normalizeMarkdown(currentContent || DEFAULT_WELCOME_TEXT)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const blocks = await editor.tryParseMarkdownToBlocks(normalized)
      cleanCodeBlocks(blocks)
      ensureBlockIds(blocks)
      editor.replaceBlocks(editor.document, blocks)
      setCurrentContent(currentContent || DEFAULT_WELCOME_TEXT)
      setOriginalContent(currentContent || DEFAULT_WELCOME_TEXT)
      setEditorMode('edit')
    } catch (err) {
      console.error('웰컴 편집 로드 실패:', err)
      setEditorMode('edit')
    }
  }

  return {
    handleRollback,
    handleSwitchMode,
    handleStartWelcomeEdit,
  }
}

