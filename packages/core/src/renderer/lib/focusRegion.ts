/**
 * @file focusRegion.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/lib/focusRegion.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

/**
 * focusRegion.ts
 * ──────────────────────────────────────────────────────────────
 * 전역 포커스 영역 관리 모듈 (React 의존 없음)
 *
 * 사용법:
 *   HTML 요소에 data-focus-region="region-id" 속성을 추가하면 자동 동작.
 *   클릭 시 해당 요소에 CSS class "focus-region-active" 가 토글됨.
 *
 * 확장:
 *   - 새 패널/모달 추가 시 data-focus-region="my-panel" 만 추가하면 됨.
 *   - subscribe() 로 활성 region 변경을 구독할 수 있음 (React 훅 등).
 *   - activate() 로 프로그래매틱하게 활성화 가능.
 *
 * 내부 동작:
 *   document mousedown (capture phase) 에서 closest('[data-focus-region]') 탐색.
 *   이전 active 제거 → 새 active 부여 → 구독자에게 알림.
 * ──────────────────────────────────────────────────────────────
 */

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `FOCUS_REGION_ATTR`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `FOCUS_REGION_ATTR(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const FOCUS_REGION_ATTR = 'data-focus-region'
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `FOCUS_REGION_CLASS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `FOCUS_REGION_CLASS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const FOCUS_REGION_CLASS = 'focus-region-active'

// ── 구독자 타입 ─────────────────────────────────────────────────
type Listener = (activeId: string | null) => void

// ── 모듈 상태 ───────────────────────────────────────────────────
let currentActiveId: string | null = null
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `listeners`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const listeners = ...` 형태로 안전 캐싱 후 가공 기동.
       */
const listeners = new Set<Listener>()

// ── 내부 헬퍼 ───────────────────────────────────────────────────
function notify() {
  listeners.forEach(l => l(currentActiveId))
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `applyClass`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `applyClass(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function applyClass(id: string | null, add: boolean) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!id`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!id)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!id) return
  document.querySelectorAll(`[${FOCUS_REGION_ATTR}="${id}"]`).forEach(el => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `add`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (add)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (add) {
      el.classList.add(FOCUS_REGION_CLASS)
    } else {
      el.classList.remove(FOCUS_REGION_CLASS)
    }
  })
}

// ── 공개 API ─────────────────────────────────────────────────────

/**
 * 특정 region을 활성화합니다.
 * null 전달 시 현재 active region 비활성화.
 */
export function activate(id: string | null): void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `id === currentActiveId`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (id === currentActiveId)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (id === currentActiveId) return

  // 이전 active 제거
  applyClass(currentActiveId, false)

  currentActiveId = id

  // 새 active 부여
  applyClass(currentActiveId, true)

  notify()
}

/**
 * 현재 활성화된 region ID를 반환합니다.
 */
export function getActiveId(): string | null {
  return currentActiveId
}

/**
 * region 변경 구독 (언구독 함수 반환)
 * @example
 *   const unsub = subscribe(id => console.log('active:', id))
 *   // 나중에:
 *   unsub()
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ── 전역 mousedown delegation ─────────────────────────────────────
// 문서 어디를 클릭하든 가장 가까운 [data-focus-region] 조상을 찾아 활성화
// capture phase 사용: 이벤트가 innermost 요소로 내려가기 전에 감지

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleGlobalMouseDown`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `handleGlobalMouseDown(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function handleGlobalMouseDown(e: MouseEvent): void {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `target`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const target = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const target = e.target as Element | null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!target`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!target)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!target) {
    activate(null)
    return
  }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `regionEl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const regionEl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const regionEl = target.closest(`[${FOCUS_REGION_ATTR}]`)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `id`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const id = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const id = regionEl?.getAttribute(FOCUS_REGION_ATTR) ?? null
  activate(id)
}

// 모듈 로드 시 단 한 번 등록 (싱글턴)
document.addEventListener('mousedown', handleGlobalMouseDown, true)

// ── 접근성: 키보드 Tab 이동도 추적 ──────────────────────────────
// Tab 키로 포커스가 이동하면 해당 region도 활성화
function handleGlobalFocusIn(e: FocusEvent): void {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `target`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const target = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const target = e.target as Element | null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!target`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!target)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!target) return
  // 이미 mousedown에서 처리됐으면 불필요하지만, 키보드 전용 이동 감지를 위해 유지
  const regionEl = target.closest(`[${FOCUS_REGION_ATTR}]`)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!regionEl`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!regionEl)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!regionEl) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `id`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const id = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const id = regionEl.getAttribute(FOCUS_REGION_ATTR)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `id && id !== currentActiveId) activate(id`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (id && id !== currentActiveId) activate(id)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (id && id !== currentActiveId) activate(id)
}

document.addEventListener('focusin', handleGlobalFocusIn, true)

