/**
 * ============================================================================
 * @file luaWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/luaWorker.ts
 * @role Lightweight Lua 5.3 Sandbox Web Worker
 * ============================================================================
 */

const logs: string[] = []

function transpileLuaToJs(luaCode: string): string {
  let js = luaCode

  // 1. 주석 치환: -- comment -> // comment
  js = js.replace(/--\[\[[\s\S]*?\]\]/g, '')
  js = js.replace(/--.*$/gm, '')

  // 2. 문자열 연결 연산자: a .. b -> a + b
  js = js.replace(/\s*\.\.\s*/g, ' + ')

  // 3. print(...) 치환
  js = js.replace(/\bprint\s*\(([\s\S]*?)\)/g, 'luaPrint($1)')

  // 4. local 변수 선언: local x = 10 -> let x = 10
  js = js.replace(/\blocal\s+([a-zA-Z0-9_,\s]+)=/g, 'let $1 =')
  js = js.replace(/\blocal\s+([a-zA-Z0-9_]+)\b/g, 'let $1')

  // 5. nil / ~= / and / or / not
  js = js.replace(/\bnil\b/g, 'null')
  js = js.replace(/~=/g, '!==')
  js = js.replace(/\band\b/g, '&&')
  js = js.replace(/\bor\b/g, '||')
  js = js.replace(/\bnot\b/g, '!')

  // 6. Table 정의: {10, 20, 30} 또는 {a=1, b=2}
  js = js.replace(/\{([^{}]*)\}/g, (match, inner) => {
    if (inner.includes('=')) {
      const fixed = inner.replace(/([a-zA-Z0-9_]+)\s*=/g, '"$1":')
      return `{ ${fixed} }`
    }
    return `[${inner}]`
  })

  // 7. for _, v in ipairs(t) do
  js = js.replace(/for\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s+in\s+ipairs\(([^)]+)\)\s+do/g, 'for (const [$1, $2] of ($3).entries()) {')
  js = js.replace(/for\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s+in\s+pairs\(([^)]+)\)\s+do/g, 'for (const [$1, $2] of Object.entries($3)) {')

  // 8. for i = 1, 10 do -> for (let i = 1; i <= 10; i++) {
  js = js.replace(/for\s+([a-zA-Z0-9_]+)\s*=\s*([^,]+),\s*([^,\s]+)(?:,\s*([^,\s]+))?\s+do/g, (match, varName, start, end, step) => {
    const s = step || '1'
    return `for (let ${varName} = ${start}; ${varName} <= ${end}; ${varName} += ${s}) {`
  })

  // 9. if ... then -> if (...) {
  js = js.replace(/\bif\s+(.+?)\s+then/g, 'if ($1) {')
  js = js.replace(/\belseif\s+(.+?)\s+then/g, '} else if ($1) {')
  js = js.replace(/\belse\b/g, '} else {')

  // 10. function name(...) -> function name(...) {
  js = js.replace(/\bfunction\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g, 'function $1($2) {')

  // 11. end -> }
  js = js.replace(/\bend\b/g, '}')

  return js
}

self.onmessage = async function (e: MessageEvent) {
  logs.length = 0
  const rawCode = e.data || ''

  try {
    const jsExecutable = transpileLuaToJs(rawCode)

    const luaPrint = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join('\t'))
    }

    const math = Math
    const string = {
      len: (s: string) => String(s).length,
      sub: (s: string, start: number, end?: number) => String(s).slice(start - 1, end),
      upper: (s: string) => String(s).toUpperCase(),
      lower: (s: string) => String(s).toLowerCase(),
    }
    const table = {
      insert: (t: any[], v: any) => { if (Array.isArray(t)) t.push(v) },
      concat: (t: any[], sep = '') => (Array.isArray(t) ? t.join(sep) : ''),
    }

    const runner = new Function('luaPrint', 'math', 'string', 'table', jsExecutable)
    runner(luaPrint, math, string, table)

    self.postMessage({
      success: true,
      output: logs.join('\n') || '(실행 완료 - 출력 없음)'
    })
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: '[Lua Runtime Error] ' + (err.message || String(err))
    })
  }
}
