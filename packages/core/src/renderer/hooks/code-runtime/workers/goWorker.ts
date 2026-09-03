/**
 * ============================================================================
 * @file goWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/goWorker.ts
 * @role Go (Golang) Virtual Sandbox Web Worker
 * ============================================================================
 */

const logs: string[] = []

function transpileGoToJs(goCode: string): string {
  let js = goCode

  // 1. package 및 import 문 제거
  js = js.replace(/\bpackage\s+[a-zA-Z0-9_]+;/g, '')
  js = js.replace(/\bpackage\s+[a-zA-Z0-9_]+/g, '')
  js = js.replace(/\bimport\s*\([\s\S]*?\)/g, '')
  js = js.replace(/\bimport\s+"[^"]+"/g, '')

  // 2. func main() -> async function main()
  js = js.replace(/\bfunc\s+main\s*\(\s*\)\s*\{/g, 'async function main() {')
  js = js.replace(/\bfunc\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:[a-zA-Z0-9_*<>[\]\s,()]+)?\{/g, (match, fnName, args) => {
    const cleanArgs = args.split(',').map((a: string) => a.trim().split(/\s+/)[0]).filter(Boolean).join(', ')
    return `async function ${fnName}(${cleanArgs}) {`
  })

  // 3. fmt.Printf / fmt.Println / fmt.Print
  js = js.replace(/\bfmt\.Printf\s*\(\s*(".*?")\s*(?:,\s*([^)]*))?\);?/g, (match, format, args) => {
    if (!args) return `goPrintf(${format});`
    return `goPrintf(${format}, ${args});`
  })
  js = js.replace(/\bfmt\.Println\s*\(([^)\r\n]*)\);?/g, 'goPrintln($1);')
  js = js.replace(/\bfmt\.Print\s*\(([^)\r\n]*)\);?/g, 'goPrint($1);')

  // 4. 슬라이스 / 맵 리터럴: []string{"A", "B"} -> ["A", "B"]
  js = js.replace(/\[\][a-zA-Z0-9_]+\s*\{([^}]*)\}/g, '[$1]')
  js = js.replace(/map\[[a-zA-Z0-9_]+\][a-zA-Z0-9_]+\s*\{([^}]*)\}/g, '{$1}')

  // 5. for range (반드시 := 변수 치환 전에 선행 실행되어야 함)
  js = js.replace(/for\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*:=\s*range\s+([a-zA-Z0-9_.]+)\s*\{/g, 'for (const [$1, $2] of ($3).entries()) {')
  js = js.replace(/for\s+([a-zA-Z0-9_]+)\s*:=\s*range\s+([a-zA-Z0-9_.]+)\s*\{/g, 'for (const $1 of ($2).keys()) {')

  // 6. 변수 선언: x := 10 -> let x = 10 / var x int = 10 -> let x = 10
  js = js.replace(/\b([a-zA-Z0-9_]+)\s*:=\s*/g, 'let $1 = ')
  js = js.replace(/\bvar\s+([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_*<>[\]]+\s*=\s*/g, 'let $1 = ')
  js = js.replace(/\bvar\s+([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_*<>[\]]+/g, 'let $1')

  // 7. main 실행
  js += '\n;if (typeof main === "function") { await main(); }\n'

  return js
}

self.onmessage = async function (e: MessageEvent) {
  logs.length = 0
  const rawCode = e.data || ''

  try {
    const jsExecutable = transpileGoToJs(rawCode)

    const goPrint = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    }
    const goPrintln = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    }
    const goPrintf = (format: string, ...args: any[]) => {
      let i = 0
      const formatted = String(format).replace(/%[vTtsdfqcxXb%]/g, (match) => {
        if (match === '%%') return '%'
        if (i < args.length) return String(args[i++])
        return match
      }).replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      logs.push(formatted)
    }

    const runner = new Function('goPrint', 'goPrintln', 'goPrintf', 'return (async () => { ' + jsExecutable + ' })()')
    await runner(goPrint, goPrintln, goPrintf)

    self.postMessage({
      success: true,
      output: logs.join('').trim() || (logs.length > 0 ? logs.join('\n') : '(실행 완료 - 출력 없음)')
    })
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: '[Go Runtime Error] ' + (err.message || String(err))
    })
  }
}
