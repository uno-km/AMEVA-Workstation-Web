/**
 * @file tryHealJSON.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/agent/tryHealJSON.ts
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

/**
 * 🤖 [JSON Parser Healer]
 * 소형 모델이 생성 도중 출력을 갑자기 끊거나 따옴표/괄호를 누락하는 경우,
 * 문자열을 분석하여 강제로 유효한 JSON 포맷으로 문법 규격을 복원/닫아주는 스마트 구출 함수입니다.
 */
export function tryHealJSON(jsonStr: string): string {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `healed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const healed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let healed = jsonStr.trim();

  // 1. 닫히지 않은 따옴표 강제 폐합
  let inString = false;
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `quoteChar`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const quoteChar = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let quoteChar = null;
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `escapeActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const escapeActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let escapeActive = false;

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < healed.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < healed.length; i++) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `char`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const char = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const char = healed[i];
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `char === '\\'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (char === '\\')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (char === '\\') {
      escapeActive = !escapeActive;
    } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `(char === '"' || char === "'") && !escapeActive`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if ((char === '"' || char === "'") && !escapeActive)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if ((char === '"' || char === "'") && !escapeActive) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!inString`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!inString)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!inString) {
          inString = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inString = false;
          quoteChar = null;
        }
      }
      escapeActive = false;
    }
  }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `inString && quoteChar`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (inString && quoteChar)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (inString && quoteChar) {
    healed += quoteChar; // 따옴표 강제 종결
  }

  // 2. 트레일링 쉼표 제거 (예: {"a": 1,} -> {"a": 1})
  healed = healed.replace(/,\s*([}\]])/g, '$1');

  // 3. 중괄호 및 대괄호 균형 추적하여 누락된 괄호 강제 주입
  const stack: string[] = [];
  inString = false;
  quoteChar = null;
  escapeActive = false;

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < healed.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < healed.length; i++) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `char`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const char = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const char = healed[i];
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `char === '\\'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (char === '\\')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (char === '\\') {
      escapeActive = !escapeActive;
    } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `(char === '"' || char === "'") && !escapeActive`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if ((char === '"' || char === "'") && !escapeActive)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if ((char === '"' || char === "'") && !escapeActive) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!inString`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!inString)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!inString) {
          inString = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inString = false;
          quoteChar = null;
        }
      }
      escapeActive = false;

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!inString`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!inString)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!inString) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `char === '{' || char === '['`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (char === '{' || char === '[')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (char === '{' || char === '[') {
          stack.push(char === '{' ? '}' : ']');
        } else if (char === '}' || char === ']') {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `stack.length > 0 && stack[stack.length - 1] === char`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (stack.length > 0 && stack[stack.length - 1] === char)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
        }
      }
    }
  }

  // 스택에 남은 닫는 괄호들을 역순으로 덧붙여 강제 규격 완결
  while (stack.length > 0) {
    healed += stack.pop();
  }

  return healed;
}

