/**
 * ============================================================================
 * @file cWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/cWorker.ts
 * @role C & C++ Sandbox Web Worker
 * ============================================================================
 */

const logs: string[] = []

function transpileCToJs(cCode: string): string {
  let js = cCode

  // #include 문 제거
  js = js.replace(/#include\s*<[^>]+>/g, '')
  js = js.replace(/#include\s*"[^"]+"/g, '')
  js = js.replace(/using\s+namespace\s+std;/g, '')

  // C++ std::cout << a << std::endl; 변환
  js = js.replace(/(?:std::)?cout\s*<<\s*([^;]+);/g, (match, expr) => {
    const parts = expr.split('<<').map((p: string) => {
      const trimmed = p.trim()
      if (trimmed === 'std::endl' || trimmed === 'endl') return '"\\n"'
      return trimmed
    })
    return `cPrint(${parts.join(', ')});`
  })

  // C printf("...", args); 변환
  js = js.replace(/printf\s*\(\s*(".*?")\s*(?:,\s*([^)]*))?\);/g, (match, format, args) => {
    if (!args) {
      return `cPrintf(${format});`
    }
    return `cPrintf(${format}, ${args});`
  })

  // int main(...) { ... } -> async function main() { ... }
  js = js.replace(/int\s+main\s*\([^)]*\)\s*\{/g, 'async function main() {')

  // 기본 타입 선언 변환: int x = 10; / double y = 3.14; / char* str = "..."
  js = js.replace(/\b(?:int|long|float|double|char|short|unsigned|size_t|bool)\s*\*?\s*([a-zA-Z0-9_]+)\s*=/g, 'let $1 =')
  js = js.replace(/\b(?:int|long|float|double|char|short|unsigned|size_t|bool)\s*\*?\s*([a-zA-Z0-9_]+)\s*;/g, 'let $1;')

  // std::vector<int> v = {1, 2, 3}; -> let v = [1, 2, 3];
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s*([a-zA-Z0-9_]+)\s*=\s*\{([^}]+)\};/g, 'let $1 = [$2];')
  // std::accumulate(...)
  js = js.replace(/(?:std::)?accumulate\s*\(\s*([a-zA-Z0-9_]+)\.begin\(\)\s*,\s*\1\.end\(\)\s*,\s*(\d+)\)/g, '($1.reduce((a, b) => a + b, $2))')

  // return 0; 제거 또는 변환
  js = js.replace(/\breturn\s+0\s*;/g, 'return;')

  // main 호출
  js += '\n;if (typeof main === "function") { await main(); }\n'

  return js
}

self.onmessage = async function (e: MessageEvent) {
  logs.length = 0
  const rawCode = e.data || ''

  try {
    const jsExecutable = transpileCToJs(rawCode)

    const cPrint = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(''))
    }

    const cPrintf = (format: string, ...args: any[]) => {
      let i = 0
      const formatted = String(format).replace(/%[sdfncd%]/g, (match) => {
        if (match === '%%') return '%'
        if (match === '%n') return '\n'
        if (i < args.length) return String(args[i++])
        return match
      }).replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      logs.push(formatted)
    }

    const runner = new Function('cPrint', 'cPrintf', 'return (async () => { ' + jsExecutable + ' })()')
    await runner(cPrint, cPrintf)

    self.postMessage({
      success: true,
      output: logs.join('').trim() || (logs.length > 0 ? logs.join('') : '(실행 완료 - 출력 없음)')
    })
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: '[C/C++ Runtime Error] ' + (err.message || String(err))
    })
  }
}
