/**
 * ============================================================================
 * @file javaWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/javaWorker.ts
 * @role Isolated Java Virtual Machine & Execution Sandbox Web Worker
 * ============================================================================
 */

// I/O 로그 버퍼
const logs: string[] = []
const errors: string[] = []

// Java System.out / System.err 가상 I/O 스트림 버퍼
const System = {
  out: {
    print: function (...args: any[]) {
      const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      if (logs.length > 0 && !logs[logs.length - 1].endsWith('\n')) {
        logs[logs.length - 1] += text
      } else {
        logs.push(text)
      }
    },
    println: function (...args: any[]) {
      const text = args.length === 0 ? '' : args.map(a => typeof a === 'object' ? (a === null ? 'null' : JSON.stringify(a, null, 2)) : String(a)).join(' ')
      logs.push(text)
    },
    printf: function (format: string, ...args: any[]) {
      let i = 0
      const formatted = String(format).replace(/%[sdfn]/g, (match) => {
        if (match === '%n') return '\n'
        if (i < args.length) return String(args[i++])
        return match
      })
      logs.push(formatted)
    }
  },
  err: {
    print: function (...args: any[]) {
      const text = args.map(a => String(a)).join(' ')
      errors.push(text)
    },
    println: function (...args: any[]) {
      const text = args.length === 0 ? '' : args.map(a => String(a)).join(' ')
      errors.push(text)
    }
  },
  currentTimeMillis: function () { return Date.now() },
  nanoTime: function () { return Math.floor(performance.now() * 1000000) },
  arraycopy: function (src: any[], srcPos: number, dest: any[], destPos: number, length: number) {
    for (let i = 0; i < length; i++) {
      dest[destPos + i] = src[srcPos + i]
    }
  }
}

// Java 표준 기본 클래스 및 컬렉션 가상 에뮬레이션 계층
class ArrayList<T = any> extends Array<T> {
  add(item: T) { this.push(item); return true }
  get(index: number) { return this[index] }
  set(index: number, element: T) { const prev = this[index]; this[index] = element; return prev }
  remove(indexOrItem: number | T) {
    if (typeof indexOrItem === 'number') return this.splice(indexOrItem, 1)[0]
    const idx = this.indexOf(indexOrItem as T)
    if (idx >= 0) { this.splice(idx, 1); return true }
    return false
  }
  size() { return this.length }
  isEmpty() { return this.length === 0 }
  contains(item: T) { return this.includes(item) }
  clear() { this.length = 0 }
}

class HashMap<K = any, V = any> extends Map<K, V> {
  put(key: K, val: V) { this.set(key, val); return val }
  get(key: K) { return super.get(key) !== undefined ? (super.get(key) as V) : (null as unknown as V) }
  containsKey(key: K) { return this.has(key) }
  remove(key: K) { const v = this.get(key); this.delete(key); return v }
  size() { return super.size }
  isEmpty() { return super.size === 0 }
  keySet() { return Array.from(this.keys()) }
  values() { return Array.from(super.values()) }
}

class HashSet<T = any> extends Set<T> {
  add(val: T) { super.add(val); return this }
  contains(val: T) { return this.has(val) }
  remove(val: T) { return this.delete(val) }
  size() { return super.size }
  isEmpty() { return super.size === 0 }
}

class StringBuilder {
  private buffer: string[]
  constructor(str: any = '') { this.buffer = [String(str)] }
  append(val: any) { this.buffer.push(String(val)); return this }
  insert(offset: number, val: any) { const s = this.toString(); this.buffer = [s.slice(0, offset) + String(val) + s.slice(offset)]; return this }
  delete(start: number, end: number) { const s = this.toString(); this.buffer = [s.slice(0, start) + s.slice(end)]; return this }
  reverse() { const s = this.toString().split('').reverse().join(''); this.buffer = [s]; return this }
  length() { return this.toString().length }
  toString() { return this.buffer.join('') }
}

const Arrays = {
  toString: function (arr: any) { return JSON.stringify(arr) },
  sort: function (arr: any) { if (Array.isArray(arr)) arr.sort((a, b) => a - b); return arr },
  equals: function (a: any, b: any) { return JSON.stringify(a) === JSON.stringify(b) },
  fill: function (arr: any[], val: any) { if (Array.isArray(arr)) arr.fill(val); return arr }
}

const Collections = {
  sort: function (list: any[]) { if (Array.isArray(list)) list.sort((a, b) => (typeof a === 'string' ? a.localeCompare(b) : a - b)) },
  reverse: function (list: any[]) { if (Array.isArray(list)) list.reverse() },
  max: function (list: number[]) { return Math.max(...list) },
  min: function (list: number[]) { return Math.min(...list) }
}

// 보안 샌드박스 API 차단
const disableApi = (name: string) => {
  try {
    Object.defineProperty(self, name, {
      get() { throw new Error('[SECURITY ERROR] ' + name + ' 접근이 거부되었습니다.') },
      configurable: false
    })
  } catch {}
}
;['fetch', 'XMLHttpRequest', 'importScripts', 'WebSocket', 'EventSource'].forEach(disableApi)
if (self.navigator) {
  try { (self.navigator as any).sendBeacon = undefined } catch {}
}

// Java -> JS 실행 변환 트랜스파일러
function transpileJavaToJs(rawJava: string): string {
  let code = rawJava

  // 1. 패키지 및 import 문 제거
  code = code.replace(/\bpackage\s+[a-zA-Z0-9_.]+;/g, '')
  code = code.replace(/\bimport\s+[a-zA-Z0-9_.*]+;/g, '')

  // 2. 접근 제어자 및 static/final 키워드 정리
  code = code.replace(/\b(public|private|protected|final|abstract|synchronized|transient|volatile)\b/g, ' ')

  // 3. 예외 throw 변환
  code = code.replace(/throw\s+new\s+(?:RuntimeException|Exception|IllegalArgumentException|IllegalStateException|NullPointerException)\s*\(([^)]*)\)/g, 'throw new Error($1)')

  // 4. 배열 초기화 리터럴: int[] nums = {5, 2, 8, 1}; -> let nums = [5, 2, 8, 1];
  code = code.replace(/\b(?:int|long|double|float|boolean|char|byte|short|String|Object)\s*\[\s*\]\s*([a-zA-Z0-9_]+)\s*=\s*\{([^}]+)\};/g, 'let $1 = [$2];')
  code = code.replace(/new\s+(?:int|long|double|float|boolean|char|byte|short|String|Object)\s*\[\s*\]\s*\{([^}]+)\}/g, '[$1]')
  code = code.replace(/\bnew\s+(?:int|long|double|float|boolean|char|byte|short|String|Object)\s*\[\s*(\d+)\s*\]/g, 'new Array($1).fill(0)')

  // 5. 기본 데이터 타입 및 클래스 변수 선언 변환
  code = code.replace(/\b(?:int|long|double|float|boolean|char|byte|short|String|Integer|Double|Float|Long|Boolean|Character|Byte|Short|Object|var)\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =')
  code = code.replace(/\b(?:int|long|double|float|boolean|char|byte|short|String|Integer|Double|Float|Long|Boolean|Character|Byte|Short|Object|var)\s+([a-zA-Z0-9_]+)\s*;/g, 'let $1;')

  // 제네릭 및 객체 변수 선언: StringBuilder sb = new StringBuilder(); / List<String> list = new ArrayList<>();
  code = code.replace(/\b([A-Z][a-zA-Z0-9_]*)(?:<[^>]*>)?\s+([a-zA-Z0-9_]+)\s*=/g, 'let $2 =')
  code = code.replace(/\b([A-Z][a-zA-Z0-9_]*)(?:<[^>]*>)?\s+([a-zA-Z0-9_]+)\s*;/g, 'let $2;')
  code = code.replace(/\bnew\s+([A-Z][a-zA-Z0-9_]*)\s*<[^>]*>\s*\(/g, 'new $1(')

  // 6. 향상된 for문 (for-each): for (int x : list) -> for (let x of list)
  code = code.replace(/for\s*\(\s*(?:[a-zA-Z0-9_<>\[\]]+)\s+([a-zA-Z0-9_]+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)')

  // 7. 메서드 선언 변환
  // static 메서드 변환
  code = code.replace(/\bstatic\s+(?:void|[a-zA-Z0-9_<>\[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[^{]+)?\{/g, (match, fnName, args) => {
    if (['if', 'while', 'for', 'switch', 'catch'].includes(fnName)) return match
    const cleanArgs = args.split(',').map((a: string) => a.trim().split(/\s+/).pop()).filter(Boolean).join(', ')
    return 'static async ' + fnName + '(' + cleanArgs + ') {'
  })

  // 일반 인스턴스 메서드 변환 (단, static/class/async로 이미 변환된 것은 제외)
  code = code.replace(/(?<!static\s+|async\s+)\b(?:void|int|long|double|float|boolean|char|byte|short|String|Object|[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[^{]+)?\{/g, (match, fnName, args) => {
    if (['if', 'while', 'for', 'switch', 'catch', 'class', 'static', 'async'].includes(fnName)) return match
    const cleanArgs = args.split(',').map((a: string) => a.trim().split(/\s+/).pop()).filter(Boolean).join(', ')
    return 'async ' + fnName + '(' + cleanArgs + ') {'
  })

  // 8. equals, length(), size() 호환성 보정
  code = code.replace(/\.equals\(([^)]+)\)/g, ' === $1')
  code = code.replace(/\.length\(\)/g, '.length')

  // 9. 클래스 정의 내 main 자동 호출 추가
  code += '\n;if (typeof main === "function") { await main([]); } else if (typeof Main !== "undefined" && typeof Main.main === "function") { await Main.main([]); } else if (typeof Main !== "undefined") { const _inst = new Main(); if (typeof _inst.main === "function") await _inst.main([]); }\n'

  return code
}

self.onmessage = async function (e: MessageEvent) {
  logs.length = 0
  errors.length = 0
  const rawCode = e.data || ''

  try {
    const jsExecutable = transpileJavaToJs(rawCode)

    // 실행 컨텍스트에 Java 환경 주입
    const runner = new Function(
      'System', 'ArrayList', 'HashMap', 'HashSet', 'StringBuilder', 'Arrays', 'Collections',
      'return (async () => { ' + jsExecutable + ' })()'
    )

    await runner(System, ArrayList, HashMap, HashSet, StringBuilder, Arrays, Collections)

    const stdoutText = logs.join('\n')
    const stderrText = errors.join('\n')
    const combinedOutput = stderrText ? (stdoutText ? stdoutText + '\n' + stderrText : stderrText) : stdoutText

    self.postMessage({
      success: errors.length === 0,
      output: combinedOutput || (errors.length === 0 ? '(실행 완료 - 출력 없음)' : stderrText)
    })
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: '[Java Runtime Error] ' + (err.message || String(err))
    })
  }
}
