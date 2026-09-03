/**
 * ============================================================================
 * @file runtimeState.ts
 * @description runtimeState.ts 시스템 모듈 구성요소로, 멀티 런타임 인스턴스 및 워커 생명주기를 관리합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

export const RuntimeState = {
  pyodideInstance: null as any,
  persistentWorker: null as Worker | null,
  sqliteDatabaseInstance: null as any,
  javaRuntimeInstance: null as any,
  javaWorker: null as Worker | null,
  bashWorker: null as Worker | null,
  luaWorker: null as Worker | null,
  solidityWorker: null as Worker | null,
  cWorker: null as Worker | null,
  goWorker: null as Worker | null,
  rustWorker: null as Worker | null,
  polyglotWorker: null as Worker | null,
}

// [SEC-W-014] 외부에서 런타임 리소스를 정리할 수 있는 함수
export function cleanupCodeRuntime() {
  const workers = [
    RuntimeState.persistentWorker,
    RuntimeState.javaWorker,
    RuntimeState.bashWorker,
    RuntimeState.luaWorker,
    RuntimeState.solidityWorker,
    RuntimeState.cWorker,
    RuntimeState.goWorker,
    RuntimeState.rustWorker,
    RuntimeState.polyglotWorker,
  ]

  for (const w of workers) {
    if (w) {
      try { w.terminate() } catch {}
    }
  }

  RuntimeState.persistentWorker = null
  RuntimeState.javaWorker = null
  RuntimeState.bashWorker = null
  RuntimeState.luaWorker = null
  RuntimeState.solidityWorker = null
  RuntimeState.cWorker = null
  RuntimeState.goWorker = null
  RuntimeState.rustWorker = null
  RuntimeState.polyglotWorker = null

  RuntimeState.pyodideInstance = null
  RuntimeState.sqliteDatabaseInstance = null
  RuntimeState.javaRuntimeInstance = null
}
