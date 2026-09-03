/**
 * ============================================================================
 * @file useJSRuntime.ts
 * @description useJSRuntime.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useJSRuntime';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

// [외부 패키지 및 라이브러리 임포트: react]
import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateJSWorker() {
  if (RuntimeState.persistentWorker) return RuntimeState.persistentWorker

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

    // [SEC-W-006] 네트워크 및 위험 API 사전 무효화 (샌드박싱)
    const disableApi = (name) => {
      try {
        Object.defineProperty(self, name, {
          get() { throw new Error('[SECURITY ERROR] ' + name + ' 접근이 거부되었습니다.'); },
          configurable: false
        });
      } catch {}
    };

    ['fetch', 'XMLHttpRequest', 'importScripts', 'WebSocket', 'EventSource'].forEach(disableApi);
    if (self.navigator) {
      try { self.navigator.sendBeacon = undefined; } catch {}
    }

    const BLOCKED_PATTERNS = ['fetch', 'XMLHttpRequest', 'importScripts', 'WebSocket', 'sendBeacon', 'process.env'];

    self.onmessage = function(e) {
      let codeToRun = e.data || '';

      for (const pattern of BLOCKED_PATTERNS) {
        if (codeToRun.includes(pattern)) {
          postMessage({ success: false, logs: ['[SECURITY] 네트워크 접근 코드는 실행이 차단되었습니다: ' + pattern] });
          return;
        }
      }

      // TypeScript 인터페이스, 타입 별칭 및 타입 어노테이션 제거
      codeToRun = codeToRun.replace(/\binterface\s+[a-zA-Z0-9_]+\s*(?:extends\s+[^{]+)?\{[\s\S]*?\}/g, '')
      codeToRun = codeToRun.replace(/\btype\s+[a-zA-Z0-9_]+(?:\s*<[^>]*>)?\s*=\s*[^;]+;/g, '')
      codeToRun = codeToRun.replace(/(\b(?:let|var|const)\s+[a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_<>[\]|&\s]+(?=\s*=|\s*;)/g, '$1')
      codeToRun = codeToRun.replace(/\bas\s+[a-zA-Z0-9_<>[\]]+/g, '')

      codeToRun = codeToRun.replace(/\bconst\b(?=[^'"]*(?:['"][^'"]*['"][^'"]*)*$)/gm, 'var')
                            .replace(/\blet\b(?=[^'"]*(?:['"][^'"]*['"][^'"]*)*$)/gm, 'var');

      logs.length = 0;
      try {
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

  const blob = new Blob([workerBlobCode], { type: 'application/javascript' })
  RuntimeState.persistentWorker = new Worker(URL.createObjectURL(blob))
  return RuntimeState.persistentWorker
}

export function stripTypeScript(code: string): string {
  let js = code
  // 1. interface 블록 제거
  js = js.replace(/\binterface\s+[a-zA-Z0-9_]+\s*(?:extends\s+[^{]+)?\{[\s\S]*?\}/g, '')
  // 2. type 별칭 제거
  js = js.replace(/\btype\s+[a-zA-Z0-9_]+(?:\s*<[^>]*>)?\s*=\s*[^;]+;/g, '')
  // 3. 변수/상수 타입 어노테이션 제거: const user: User = ... -> const user = ...
  js = js.replace(/(\b(?:const|let|var)\s+[a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_<>[\]|&\s]+(?=\s*=|\s*;)/g, '$1')
  // 4. as Type 캐스팅 제거
  js = js.replace(/\bas\s+[a-zA-Z0-9_<>[\]]+/g, '')
  return js
}

export function useJSRuntime() {
  const [isRunning, setIsRunning] = useState(false)

  const runJSCode = (rawCode: string): Promise<{ success: boolean; output: string; tableData?: any }> => {
    return new Promise((resolve) => {
      setIsRunning(true)
      const code = stripTypeScript(rawCode)
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

