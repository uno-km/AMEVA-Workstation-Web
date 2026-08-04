/**
 * @file useAppTabs.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useAppTabs.ts
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

import { useCallback } from 'react'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { type AmevaEditor, type AmevaPartialBlock } from '../../editor/amevaBlockSchema'
import { normalizeMarkdown, cleanCodeBlocks, ensureBlockIds } from '../../utils/markdownUtils'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useAppTabs`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useAppTabs(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useAppTabs(
  editor: AmevaEditor | null,
  filePath: string | null,
  setFilePath: (path: string | null) => void,
  currentContent: string,
  setCurrentContent: (content: string) => void,
  originalContent: string,
  setOriginalContent: (content: string) => void,
  lastSavedTime: Date | null,
  setLastSavedTime: (time: Date | null) => void
) {
  const {
    tabs,
    setTabs,
    addTab,
    removeTab,
    activeTabId,
    setActiveTabId,
    updateActiveTab,
  } = useWorkspaceStore()

  // 탭 생성
  const handleNewTab = useCallback(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
    
    // 현재 탭의 변경 사항 저장
    const currentBlocks = [...editor.document]
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newTabId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newTabId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newTabId = Math.random().toString(36).substring(2, 10)
    const newTabBlocks: AmevaPartialBlock[] = [
      {
        id: Math.random().toString(36).substring(2, 10),
        type: 'paragraph',
        content: []
      }
    ]
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newTab`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newTab = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newTab = {
      id: newTabId,
      filePath: null,
      content: '',
      blocks: newTabBlocks,
      originalContent: '',
      lastSavedTime: null
    }

    updateActiveTab({ filePath, content: currentContent, blocks: currentBlocks, originalContent, lastSavedTime })
    addTab(newTab)

    setActiveTabId(newTabId)
    setFilePath(null)
    setCurrentContent('')
    setOriginalContent('')
    setLastSavedTime(null)
    
    setTimeout(() => {
      editor.replaceBlocks(editor.document, newTab.blocks)
    }, 0)
  }, [editor, activeTabId, filePath, currentContent, originalContent, lastSavedTime, addTab, updateActiveTab, setFilePath, setCurrentContent, setOriginalContent, setLastSavedTime, setActiveTabId])

  // 탭 직접 선택 전환
  const handleSelectTab = useCallback(async (tabId: string) => {
    if (!editor) return
    if (document.activeElement && (document.activeElement as HTMLElement).blur) {
      (document.activeElement as HTMLElement).blur()
      window.dispatchEvent(new CustomEvent('AMEVA_FORCE_SAVE_BLOCKS'))
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    const currentBlocks = [...editor.document]
    
    updateActiveTab({ filePath, content: currentContent, blocks: currentBlocks, originalContent, lastSavedTime })
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `targetTab`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const targetTab = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const targetTab = tabs.find(t => t.id === tabId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `targetTab`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (targetTab)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (targetTab) {
      setTimeout(async () => {
        setFilePath(targetTab.filePath)
        setCurrentContent(targetTab.content)
        setOriginalContent(targetTab.originalContent !== undefined ? targetTab.originalContent : targetTab.content)
        setLastSavedTime(targetTab.lastSavedTime !== undefined ? targetTab.lastSavedTime : null)
        
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `targetTab.blocks && targetTab.blocks.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (targetTab.blocks && targetTab.blocks.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (targetTab.blocks && targetTab.blocks.length > 0) {
          ensureBlockIds(targetTab.blocks)
          editor.replaceBlocks(editor.document, targetTab.blocks)
        } else {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `normalized`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const normalized = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const normalized = normalizeMarkdown(targetTab.content || '')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parsed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parsed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const parsed = await editor.tryParseMarkdownToBlocks(normalized)
          cleanCodeBlocks(parsed)
          ensureBlockIds(parsed)
          editor.replaceBlocks(editor.document, parsed)
        }
      }, 0)
    }
    
    setActiveTabId(tabId)
  }, [
    editor, activeTabId, filePath, currentContent, originalContent, lastSavedTime, tabs,
    updateActiveTab, setFilePath, setCurrentContent, setOriginalContent, setLastSavedTime, setActiveTabId
  ])

  // 탭 닫기
  const handleCloseTab = useCallback((tabId: string) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `remaining`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const remaining = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const remaining = tabs.filter(t => t.id !== tabId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `remaining.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (remaining.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (remaining.length === 0) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `defaultTab`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const defaultTab = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const defaultTab = { id: 'default', filePath: null, content: '', blocks: [], originalContent: '', lastSavedTime: null }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (editor) {
        editor.replaceBlocks(editor.document, [])
      }
      setFilePath(null)
      setCurrentContent('')
      setOriginalContent('')
      setLastSavedTime(null)
      setActiveTabId('default')
      setTabs([defaultTab])
      return
    }
    
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeTabId === tabId`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeTabId === tabId)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (activeTabId === tabId) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nextTab`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nextTab = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const nextTab = remaining[0]
      setActiveTabId(nextTab.id)
      setFilePath(nextTab.filePath)
      setCurrentContent(nextTab.content)
      setOriginalContent(nextTab.originalContent !== undefined ? nextTab.originalContent : nextTab.content)
      setLastSavedTime(nextTab.lastSavedTime !== undefined ? nextTab.lastSavedTime : null)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (editor) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `nextTab.blocks && nextTab.blocks.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (nextTab.blocks && nextTab.blocks.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (nextTab.blocks && nextTab.blocks.length > 0) {
          editor.replaceBlocks(editor.document, nextTab.blocks)
        } else {
          editor.replaceBlocks(editor.document, [])
        }
      }
    }
    setTabs(remaining)
  }, [
    editor, activeTabId, tabs, setFilePath, setCurrentContent, setOriginalContent,
    setLastSavedTime, setActiveTabId, setTabs
  ])

  return {
    handleNewTab,
    handleSelectTab,
    handleCloseTab,
  }
}

