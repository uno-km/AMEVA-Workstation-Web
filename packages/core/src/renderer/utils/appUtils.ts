/**
 * @file appUtils.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/appUtils.ts
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
   * - 함수 명: `matchHotkey`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `matchHotkey(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const matchHotkey = (e: KeyboardEvent, hotkeyStr: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!hotkeyStr`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!hotkeyStr)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!hotkeyStr) return false
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parts`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parts = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const parts = hotkeyStr.toLowerCase().split('+')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `key`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const key = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const key = parts.pop()
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needCtrl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needCtrl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needCtrl = parts.includes('control') || parts.includes('ctrl')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needShift`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needShift = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needShift = parts.includes('shift')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needAlt`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needAlt = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needAlt = parts.includes('alt')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needMeta`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needMeta = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needMeta = parts.includes('meta') || parts.includes('cmd')
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasCtrl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasCtrl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hasCtrl = e.ctrlKey || e.metaKey
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasShift`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasShift = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hasShift = e.shiftKey
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasAlt`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasAlt = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hasAlt = e.altKey
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasMeta`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasMeta = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hasMeta = e.metaKey
  
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needCtrl && !hasCtrl`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needCtrl && !hasCtrl)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needCtrl && !hasCtrl) return false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needShift && !hasShift`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needShift && !hasShift)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needShift && !hasShift) return false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needAlt && !hasAlt`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needAlt && !hasAlt)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needAlt && !hasAlt) return false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needMeta && !hasMeta`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needMeta && !hasMeta)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needMeta && !hasMeta) return false
  
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!needCtrl && hasCtrl`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!needCtrl && hasCtrl)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!needCtrl && hasCtrl) return false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!needShift && hasShift`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!needShift && hasShift)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!needShift && hasShift) return false
  
  return e.key.toLowerCase() === key
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `reader`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const reader = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

