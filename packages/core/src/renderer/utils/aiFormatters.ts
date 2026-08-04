/**
 * @file aiFormatters.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/aiFormatters.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 관련 비즈니스 훅 내부 연산 시 순수 함수 유틸리티로 수입 소비.
 * - 소비처 B (src/renderer/components/): 렌더링 전 데이터 정제 단계에서 포맷터 유틸리티로 소비.
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
   * [FUNCTION CONTRACT]
   * - 함수 명: `formatBytes`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `formatBytes(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function formatBytes(bytes: number): string {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
}

export interface ThoughtNode {
  id: string
  title: string
  level: number
  isHeader: boolean
  children: ThoughtNode[]
  status: 'completed' | 'running' | 'pending'
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `parseThoughtText`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `parseThoughtText(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function parseThoughtText(text: string, isStreaming: boolean): ThoughtNode[] {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const lines = text.split('\n')
  const roots: ThoughtNode[] = []
  const stack: ThoughtNode[] = []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nodeIdCounter`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nodeIdCounter = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let nodeIdCounter = 0

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < lines.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < lines.length; i++) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `line`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const line = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const line = lines[i]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!line.trim()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!line.trim())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!line.trim()) continue

    // Detect indentation level (number of spaces or tabs)
    const leadingWhitespace = line.match(/^(\s*)/)?.[0] || ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `indentWidth`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const indentWidth = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const indentWidth = leadingWhitespace.replace(/\t/g, '    ').length

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `trimmed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const trimmed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const trimmed = line.trim()
    
    // Check if it's a section header, e.g. [Header Name]
    const headerMatch = trimmed.match(/^\[([^\]]+)\]$/)
    
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `headerMatch`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (headerMatch)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (headerMatch) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `title`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const title = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const title = headerMatch[1].trim()
      const node: ThoughtNode = {
        id: `thought_node_${nodeIdCounter++}`,
        title,
        level: 0,
        isHeader: true,
        children: [],
        status: 'completed',
      }
      roots.push(node)
      stack.length = 0 // Clear stack for new section
      stack.push(node)
    } else {
      // It's a step item
      // Clean bullet points: -, *, +, 1., 2. etc.
      const content = trimmed.replace(/^[-*+]\s+|^[0-9]+[.)]\s+/, '').trim()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!content`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!content)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!content) continue

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `level`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const level = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let level = 1
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `indentWidth > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (indentWidth > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (indentWidth > 0) {
        level = Math.floor(indentWidth / 2) + 1
      }

      const node: ThoughtNode = {
        id: `thought_node_${nodeIdCounter++}`,
        title: content,
        level,
        isHeader: false,
        children: [],
        status: 'completed',
      }

      // Find parent in stack
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `stack.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (stack.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node)
      } else {
        roots.push(node)
      }
      stack.push(node)
    }
  }

  // Adjust statuses if streaming
  if (isStreaming) {
    let lastLeaf: ThoughtNode | null = null
    
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `findLastLeaf`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `findLastLeaf(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
    function findLastLeaf(nodes: ThoughtNode[]) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `nodes.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (nodes.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (nodes.length === 0) return
      lastLeaf = nodes[nodes.length - 1]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `lastLeaf.children && lastLeaf.children.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (lastLeaf.children && lastLeaf.children.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (lastLeaf.children && lastLeaf.children.length > 0) {
        findLastLeaf(lastLeaf.children)
      }
    }
    
    findLastLeaf(roots)
    
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `lastLeaf`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (lastLeaf)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (lastLeaf) {
      (lastLeaf as ThoughtNode).status = 'running'
      
      // Mark parent chain as running
      function markParentChain(nodes: ThoughtNode[]): boolean {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasRunningChild`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasRunningChild = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        let hasRunningChild = false
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const node of nodes) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
        for (const node of nodes) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `childRunning`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const childRunning = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const childRunning = markParentChain(node.children)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `node.status === 'running' || childRunning`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (node.status === 'running' || childRunning)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (node.status === 'running' || childRunning) {
            node.status = 'running'
            hasRunningChild = true
          }
        }
        return hasRunningChild
      }
      markParentChain(roots)
    }
  }

  return roots
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `getThoughtSummary`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `getThoughtSummary(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function getThoughtSummary(text: string, isStreaming: boolean) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nodes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nodes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const nodes = parseThoughtText(text, isStreaming)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `totalSteps`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const totalSteps = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let totalSteps = 0
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `completedSteps`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const completedSteps = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let completedSteps = 0
  
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `count`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `count(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
  function count(items: ThoughtNode[]) {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const n of items) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const n of items) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!n.isHeader`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!n.isHeader)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!n.isHeader) {
        totalSteps++
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `n.status === 'completed'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (n.status === 'completed')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (n.status === 'completed') {
          completedSteps++
        }
      }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `n.children`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (n.children)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (n.children) {
        count(n.children)
      }
    }
  }
  count(nodes)
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `activeStep`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const activeStep = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const activeStep = isStreaming ? completedSteps + 1 : totalSteps
  return { totalSteps, completedSteps, activeStep }
}

