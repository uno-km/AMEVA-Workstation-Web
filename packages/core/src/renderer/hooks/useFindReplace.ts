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

import { useState, useEffect } from 'react'
import { type AmevaEditor } from '../editor/amevaBlockSchema'

export interface SearchMatch {
  blockId: string
  blockType: string
  text: string
  matchIndices: number[] // 블록 텍스트 내에서 매칭이 시작되는 문자열 오프셋 리스트
}

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
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor || !findQuery`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor || !findQuery)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor || !findQuery) {
      setMatches([])
      setCurrentMatchIndex(-1)
      return
    }

    const flatBlocks: any[] = []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `traverse`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const traverse = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const traverse = (blks: any[]) => {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const b of blks) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (const b of blks) {
        flatBlocks.push(b)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `b.children) traverse(b.children`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (b.children) traverse(b.children)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (b.children) traverse(b.children)
      }
    }
    traverse(editor.document)

    const newMatches: SearchMatch[] = []
    
    flatBlocks.forEach(block => {
      // 블록 내 텍스트 추출 (Rich Text의 텍스트만 합산)
      const text = getBlockPlainText(block)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!text`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!text)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!text) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `searchTarget`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const searchTarget = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let searchTarget = text
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
        searchTarget = text.toLowerCase()
        queryTarget = findQuery.toLowerCase()
      }

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
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `indices.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (indices.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
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
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `totalCount === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (totalCount === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (totalCount === 0) {
      setCurrentMatchIndex(-1)
    } else if (keepIndex) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `currentMatchIndex >= totalCount`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (currentMatchIndex >= totalCount)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (currentMatchIndex >= totalCount) {
        setCurrentMatchIndex(totalCount - 1)
      } else if (currentMatchIndex < 0) {
        setCurrentMatchIndex(0)
      }
    } else {
      setCurrentMatchIndex(0)
    }
  }

  // 블록에서 순수 텍스트 문자열 가져오기 (재귀 강화 버전)
  const getBlockPlainText = (block: any): string => {
    const parts: string[] = []

    // 1) block.content 처리 (기본 단락/제목 등)
    if (block.content) {
      if (typeof block.content === 'string') {
        parts.push(block.content)
      } else if (Array.isArray(block.content)) {
        for (const item of block.content) {
          if (!item) continue
          // InlineContent: { type: 'text', text: '...' } 또는 중첩 스타일
          if (item.text) {
            parts.push(item.text)
          } else if (item.type === 'text' && typeof item.text === 'string') {
            parts.push(item.text)
          } else if (Array.isArray(item.content)) {
            // 중첩 inline content (link 등)
            for (const sub of item.content) {
              if (sub?.text) parts.push(sub.text)
            }
          } else if (item.type === 'tableRow' || item.type === 'tableCell') {
            // table row/cell 재귀 탐색
            parts.push(getBlockPlainText(item))
          } else if (Array.isArray(item.cells)) {
            // 테이블 행의 cells
            for (const cell of item.cells) {
              if (Array.isArray(cell)) {
                for (const cellItem of cell) {
                  if (cellItem?.text) parts.push(cellItem.text)
                }
              }
            }
          }
        }
      }
    }

    // 2) block.rows 처리 (table 블록 전용)
    if (Array.isArray(block.rows)) {
      for (const row of block.rows) {
        if (Array.isArray(row.cells)) {
          for (const cell of row.cells) {
            if (Array.isArray(cell)) {
              for (const cellItem of cell) {
                if (cellItem?.text) parts.push(cellItem.text)
              }
            } else if (typeof cell === 'object' && cell !== null) {
              parts.push(getBlockPlainText(cell))
            }
          }
        }
      }
    }

    // 3) block.props에서 텍스트 성격 필드 추출 (map, linkPreview, youtube, excel 등)
    if (block.props && typeof block.props === 'object') {
      const textProps = ['locationName', 'destination', 'legend', 'memo', 'url', 'title', 'caption', 'alt']
      for (const key of textProps) {
        if (block.props[key] && typeof block.props[key] === 'string') {
          parts.push(block.props[key])
        }
      }
    }

    // 4) block.children 재귀 처리
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        const childText = getBlockPlainText(child)
        if (childText) parts.push(childText)
      }
    }

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

