/**
 * @file useJSRuntime.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/code-runtime/useJSRuntime.ts
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

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `getOrCreateJSWorker`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `getOrCreateJSWorker(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function getOrCreateJSWorker() {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `RuntimeState.persistentWorker`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (RuntimeState.persistentWorker)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (RuntimeState.persistentWorker) return RuntimeState.persistentWorker

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `workerBlobCode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const workerBlobCode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const workerBlobCode = `
    const logs = [];
    const customConsole = {
      log: function(...args) {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      },
      error: function(...args) {
        logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      warn: function(...args) {
        logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      info: function(...args) {
        logs.push('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      table: function(data) {
        logs.push(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
      }
    };
    
    self.console = customConsole;

    // [SEC-W-006] 네트워크 접근 차단 — Worker에서 외부 통신 불가
    const BLOCKED_PATTERNS = ['fetch(', 'XMLHttpRequest', 'importScripts', 'WebSocket', 'navigator.sendBeacon'];

    self.onmessage = function(e) {
      let codeToRun = e.data || '';

      // 금지 패턴 사전 검사
      for (const pattern of BLOCKED_PATTERNS) {
        if (codeToRun.includes(pattern)) {
          postMessage({ success: false, logs: ['[SECURITY] 네트워크 접근 코드는 실행이 차단되었습니다: ' + pattern] });
          return;
        }
      }

      // const, let을 var로 치환하여 eval 시 글로벌 스코프(self)에 영구 안착하도록 보정
      // 주의: 문자열 리터럴 안의 const/let은 교체되지 않도록 간단한 보정
      codeToRun = codeToRun.replace(/\\bconst\\b(?=[^'"]*(?:['"][^'"]*['"][^'"]*)*$)/gm, 'var')
                            .replace(/\\blet\\b(?=[^'"]*(?:['"][^'"]*['"][^'"]*)*$)/gm, 'var');

      logs.length = 0; // 누적 로그 비우기
      try {
        // eval을 사용하여 워커 전역 네임스페이스 상에서 코드를 순차 누적 실행 (변수 상태 완벽 세션 보존)
        const result = self.eval(codeToRun);
        if (result !== undefined) {
          logs.push('→ ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)));
        }
        postMessage({ success: true, logs });
      } catch (err) {
        postMessage({ success: false, logs: logs.concat('[RUNTIME ERROR] ' + err.message) });
      }
    };
  `

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blob`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blob = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const blob = new Blob([workerBlobCode], { type: 'application/javascript' })
  RuntimeState.persistentWorker = new Worker(URL.createObjectURL(blob))
  return RuntimeState.persistentWorker
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useJSRuntime`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useJSRuntime(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useJSRuntime() {
  const [isRunning, setIsRunning] = useState(false)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `runJSCode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const runJSCode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const runJSCode = (code: string): Promise<{ success: boolean; output: string; tableData?: any }> => {
    return new Promise((resolve) => {
      setIsRunning(true)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `worker`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const worker = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const worker = getOrCreateJSWorker()

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `timeoutId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const timeoutId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const timeoutId = setTimeout(() => {
        worker.terminate()
        RuntimeState.persistentWorker = null
        setIsRunning(false)
        resolve({ success: false, output: '[TIMEOUT] 실행 시간이 5초를 초과하여 강제 종료되었습니다. 상태 세션이 초기화되었습니다.' })
      }, 5000)

      worker.onmessage = (e) => {
        clearTimeout(timeoutId)
        setIsRunning(false)
        const { success, logs } = e.data
        resolve({ success, output: (logs as string[]).join('\n') })
      }

      worker.onerror = (err) => {
        clearTimeout(timeoutId)
        setIsRunning(false)
        resolve({ success: false, output: `[RUNTIME ERROR] ${err.message}` })
      }

      worker.postMessage(code)
    })
  }

  return {
    isJSRunning: isRunning,
    runJSCode,
  }
}

