/**
 * ============================================================================
 * @file useFindReplace.ts
 * @description useFindReplace.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useFindReplace';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file useFindReplace.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/useFindReplace.ts
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

// [외부 패키지 및 라이브러리 임포트: react]
import { useState, useEffect } from 'react'
// [내부 프로젝트 의존성 모듈 임포트: ../editor/amevaBlockSchema]
import { type AmevaEditor } from '../editor/amevaBlockSchema'

/**
 * SearchMatch 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface SearchMatch {
  blockId: string
  blockType: string
  text: string
  matchIndices: number[] // 블록 텍스트 내에서 매칭이 시작되는 문자열 오프셋 리스트
}

/**
 * UseFindReplaceProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface UseFindReplaceProps {
  isOpen: boolean
  editor: AmevaEditor | null
  onScrollToBlock: (blockId: string) => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useFindReplace`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useFindReplace(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * useFindReplace 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function useFindReplace({ isOpen, editor, onScrollToBlock }: UseFindReplaceProps) {
  const [findQuery, setFindQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1) // 전체 매칭 중 현재 인덱스

  // 검색 쿼리가 변경되거나 대소문자 구분 변경 시 검색 즉시 수행
  useEffect(() => {
    performSearch()
  }, [findQuery, matchCase])

  // 에디터의 문서가 바뀌었을 때 검색 결과 업데이트를 위한 폴백
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen || !editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen || !editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isOpen || !editor) return
    
    // 에디터 블록 변경 감지용 간단한 폴링 또는 이벤트 연동 (가벼운 간격 체크)
    const interval = setInterval(() => {
      performSearch(true) // 인덱스 유지하며 갱신
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isOpen, editor, findQuery, matchCase])

  // 전체 매칭 리스트의 총 개수 계산
  const totalMatchesCount = matches.reduce((acc, m) => acc + m.matchIndices.length, 0)

  // 현재 매칭의 글로벌 순서 번호와 구체적인 { blockId, charOffset } 알아내기
  const getCurrentActiveMatch = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `currentMatchIndex < 0 || matches.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (currentMatchIndex < 0 || matches.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (currentMatchIndex < 0 || matches.length === 0) return null
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `count`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const count = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let count = 0
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let mIdx = 0; mIdx < matches.length; mIdx++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (let mIdx = 0; mIdx < matches.length; mIdx++) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `match`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const match = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const match = matches[mIdx]
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let iIdx = 0; iIdx < match.matchIndices.length; iIdx++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (let iIdx = 0; iIdx < match.matchIndices.length; iIdx++) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `count === currentMatchIndex`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (count === currentMatchIndex)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (count === currentMatchIndex) {
          return {
            match,
            blockId: match.blockId,
            charOffset: match.matchIndices[iIdx],
            matchLength: findQuery.length
          }
        }
        count++
      }
    }
    return null
  }

  // 실질적인 검색 매칭 탐색 로직
  const performSearch = (keepIndex = false) => {
    if (!editor || !findQuery) {
      setMatches([])
      setCurrentMatchIndex(-1)
      return
    }

    const flatBlocks: any[] = []
    const traverse = (blks: any[]) => {
      if (!Array.isArray(blks)) return
      for (const b of blks) {
        flatBlocks.push(b)
        if (b.children) traverse(b.children)
      }
    }
    traverse(editor.document)

    const newMatches: SearchMatch[] = []

    flatBlocks.forEach(block => {
      // 1) 블록 AST 및 DOM 텍스트 통합 추출
      let text = getBlockPlainText(block)
      
      // 만약 AST에서 텍스트를 못 찾았더라도 DOM에 해당 블록 텍스트가 있다면 결합
      if (block.id) {
        const domEl = document.querySelector(`[data-id="${block.id}"], [data-block-id="${block.id}"]`)
        if (domEl) {
          const domText = (domEl.textContent || '').replace(/\s+/g, ' ').trim()
          if (domText && !text.includes(domText)) {
            text = text ? `${text} ${domText}` : domText
          }
        }
      }

      if (!text) return

      let searchTarget = text
      let queryTarget = findQuery
      if (!matchCase) {
        searchTarget = text.toLowerCase()
        queryTarget = findQuery.toLowerCase()
      }

      const indices: number[] = []
      let startIdx = searchTarget.indexOf(queryTarget)
      while (startIdx !== -1) {
        indices.push(startIdx)
        startIdx = searchTarget.indexOf(queryTarget, startIdx + queryTarget.length)
      }

      if (indices.length > 0) {
        newMatches.push({
          blockId: block.id,
          blockType: block.type,
          text,
          matchIndices: indices
        })
      }
    })

    setMatches(newMatches)

    // 인덱스 보정
    const totalCount = newMatches.reduce((acc, m) => acc + m.matchIndices.length, 0)
    if (totalCount === 0) {
      setCurrentMatchIndex(-1)
    } else if (keepIndex) {
      if (currentMatchIndex >= totalCount) {
        setCurrentMatchIndex(totalCount - 1)
      } else if (currentMatchIndex < 0) {
        setCurrentMatchIndex(0)
      }
    } else {
      setCurrentMatchIndex(0)
      if (newMatches.length > 0) {
        onScrollToBlock(newMatches[0].blockId)
      }
    }
  }

  // 블록에서 순수 텍스트 문자열 가져오기 (완벽 재귀 범용 추출기: Table, Props, Rows, Cells, Nested)
  const getBlockPlainText = (block: any): string => {
    if (!block) return ''
    if (typeof block === 'string') return block
    if (typeof block === 'number' || typeof block === 'boolean') return String(block)

    const parts: string[] = []

    const extractText = (val: any) => {
      if (!val) return
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed) parts.push(trimmed)
        return
      }
      if (typeof val === 'number') {
        parts.push(String(val))
        return
      }
      if (Array.isArray(val)) {
        for (const item of val) extractText(item)
        return
      }
      if (typeof val === 'object') {
        // inline text
        if (val.text && typeof val.text === 'string') {
          parts.push(val.text)
        }
        // tableContent / rows
        if (val.rows && Array.isArray(val.rows)) {
          for (const row of val.rows) extractText(row)
        }
        // table cells
        if (val.cells && Array.isArray(val.cells)) {
          for (const cell of val.cells) extractText(cell)
        }
        // nested content
        if (val.content) {
          extractText(val.content)
        }
        // props
        if (val.props && typeof val.props === 'object') {
          for (const [k, v] of Object.entries(val.props)) {
            if (k !== 'fileBase64' && k !== 'sourceUrl') {
              extractText(v)
            }
          }
        }
        // children
        if (Array.isArray(val.children)) {
          for (const child of val.children) extractText(child)
        }
      }
    }

    extractText(block)
    return parts.filter(Boolean).join(' ')
  }

  // 이전/다음 이동 핸들러
  const handleNavigate = (direction: 'next' | 'prev') => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `matches.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (matches.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (matches.length === 0) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `totalCount`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const totalCount = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const totalCount = totalMatchesCount
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nextIdx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nextIdx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let nextIdx = currentMatchIndex
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `direction === 'next'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (direction === 'next')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (direction === 'next') {
      nextIdx = (currentMatchIndex + 1) % totalCount
    } else {
      nextIdx = (currentMatchIndex - 1 + totalCount) % totalCount
    }
    
    setCurrentMatchIndex(nextIdx)
    
    // 현재 포커스 매칭 알아내고 스크롤 이동
    let count = 0
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const match of matches) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const match of matches) {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < match.matchIndices.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (let i = 0; i < match.matchIndices.length; i++) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `count === nextIdx`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (count === nextIdx)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (count === nextIdx) {
          onScrollToBlock(match.blockId)
          return
        }
        count++
      }
    }
  }

  // 1개 단어 바꾸기 (Replace)
  const handleReplace = async () => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `active`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const active = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const active = getCurrentActiveMatch()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!active || !editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!active || !editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!active || !editor) return

    const { blockId, charOffset, matchLength } = active
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `block`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const block = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const block = findBlockById(editor.document, blockId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!block`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!block)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!block) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentText = getBlockPlainText(block)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `before`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const before = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const before = currentText.substring(0, charOffset)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `after`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const after = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const after = currentText.substring(charOffset + matchLength)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `replacedText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const replacedText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const replacedText = before + replaceQuery + after

    // 블록 텍스트 업데이트 (Rich Text 형식 호환 유지를 위한 가공)
    await updateBlockText(blockId, replacedText)
    
    // 검색 다시 돌리고 현재 매칭 번호 유지
    performSearch(true)
  }

  // 전체 바꾸기 (Replace All)
  const handleReplaceAll = async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `matches.length === 0 || !editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (matches.length === 0 || !editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (matches.length === 0 || !editor) return

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const match of matches) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const match of matches) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `block`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const block = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const block = findBlockById(editor.document, match.blockId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!block`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!block)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!block) continue

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const currentText = getBlockPlainText(block)
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `searchTarget`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const searchTarget = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let searchTarget = currentText
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `queryTarget`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const queryTarget = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let queryTarget = findQuery
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!matchCase`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!matchCase)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!matchCase) {
        searchTarget = currentText.toLowerCase()
        queryTarget = findQuery.toLowerCase()
      }

      // 비대소문자 구분을 유지한 상태에서 모든 매칭 오프셋을 역순으로 변경해야 인덱스가 꼬이지 않음
      const indices: number[] = []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `startIdx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const startIdx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let startIdx = searchTarget.indexOf(queryTarget)
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `while (startIdx !== -1) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      while (startIdx !== -1) {
        indices.push(startIdx)
        startIdx = searchTarget.indexOf(queryTarget, startIdx + queryTarget.length)
      }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let newText = currentText
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = indices.length - 1; i >= 0; i--) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (let i = indices.length - 1; i >= 0; i--) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `offset`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const offset = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const offset = indices[i]
        newText = newText.substring(0, offset) + replaceQuery + newText.substring(offset + findQuery.length)
      }

      await updateBlockText(match.blockId, newText)
    }

    performSearch(false)
  }

  // 블록 ID 기반 블록 탐색 헬퍼
  const findBlockById = (blks: any[], id: string): any => {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const b of blks) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const b of blks) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `b.id === id`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (b.id === id)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (b.id === id) return b
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `b.children`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (b.children)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (b.children) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `found`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const found = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const found = findBlockById(b.children, id)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `found`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (found)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (found) return found
      }
    }
    return null
  }

  // 에디터 블록 텍스트 교체 처리
  const updateBlockText = async (blockId: string, newText: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `block`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const block = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const block = findBlockById(editor.document, blockId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!block`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!block)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!block) return

    // 에디터의 기존 content 형식이 Array(Rich Text)인지 String인지 체크 후 빌드
    if (Array.isArray(block.content)) {
      // 기존 스타일이 있는 첫 번째 객체를 기반으로 텍스트 교체 처리 (스타일 보존)
      const firstChunk = block.content[0] || { type: 'text', styles: {} }
      editor.updateBlock(blockId, {
        content: [{ ...firstChunk, text: newText }]
      })
    } else {
      editor.updateBlock(blockId, {
        content: newText
      })
    }
  }

  return {
    findQuery,
    setFindQuery,
    replaceQuery,
    setReplaceQuery,
    matchCase,
    setMatchCase,
    currentMatchIndex,
    totalMatchesCount,
    handleNavigate,
    handleReplace,
    handleReplaceAll,
    performSearch
  }
}

