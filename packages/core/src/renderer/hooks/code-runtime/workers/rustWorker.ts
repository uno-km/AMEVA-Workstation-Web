/**
 * ============================================================================
 * @file rustWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/rustWorker.ts
 * @role Rust Virtual Sandbox Web Worker
 * ============================================================================
 */

const logs: string[] = []

function transpileRustToJs(rustCode: string): string {
  let js = rustCode

  // 1. fn main() -> async function main()
  js = js.replace(/\bfn\s+main\s*\(\s*\)\s*\{/g, 'async function main() {')
  js = js.replace(/\bfn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:->\s*[^{]+)?\{/g, (match, fnName, args) => {
    const cleanArgs = args.split(',').map((a: string) => a.trim().split(':')[0]).filter(Boolean).join(', ')
    return `async function ${fnName}(${cleanArgs}) {`
  })

  // 2. println! / print! 매크로 변환
  js = js.replace(/\bprintln!\s*\(\s*(".*?")\s*(?:,\s*([^)]*))?\);?/g, (match, format, args) => {
    if (!args) return `rustPrintln(${format});`
    return `rustPrintln(${format}, ${args});`
  })
  js = js.replace(/\bprint!\s*\(\s*(".*?")\s*(?:,\s*([^)]*))?\);?/g, (match, format, args) => {
    if (!args) return `rustPrint(${format});`
    return `rustPrint(${format}, ${args});`
  })

  // 3. vec![...] -> [...]
  js = js.replace(/\bvec!\s*\[([^\]]*)\]/g, '[$1]')

  // 4. let mut / let 변수 선언: let mut numbers: Vec<i32> = ... -> let numbers = ...
  js = js.replace(/\blet\s+(?:mut\s+)?([a-zA-Z0-9_]+)(?:\s*:\s*[a-zA-Z0-9_<>[\]&]+)?\s*=/g, 'let $1 =')

  // 5. Iterator 유틸리티: .iter().sum::<i32>() -> .reduce((a, b) => a + b, 0)
  js = js.replace(/\.iter\(\)\.sum(?:::<[^>]*>)?\(\)/g, '.reduce((a, b) => a + b, 0)')
  js = js.replace(/\.len\(\)/g, '.length')

  // 6. for num in list -> for (let num of list)
  js = js.replace(/\bfor\s+([a-zA-Z0-9_]+)\s+in\s+([^{]+)\{/g, 'for (const $1 of $2) {')

  // 7. main 실행
  js += '\n;if (typeof main === "function") { await main(); }\n'

  return js
}

self.onmessage = async function (e: MessageEvent) {
  logs.length = 0
  const rawCode = e.data || ''

  try {
    const jsExecutable = transpileRustToJs(rawCode)

    const formatRustString = (format: string, ...args: any[]) => {
      let i = 0
      return String(format).replace(/\{(?::[^}]*)?\}/g, () => {
        if (i < args.length) return typeof args[i] === 'object' ? JSON.stringify(args[i++]) : String(args[i++])
        return '{}'
      })
    }

    const rustPrintln = (format: string, ...args: any[]) => {
      logs.push(formatRustString(format, ...args))
    }
    const rustPrint = (format: string, ...args: any[]) => {
      const text = formatRustString(format, ...args)
      if (logs.length > 0 && !logs[logs.length - 1].endsWith('\n')) {
        logs[logs.length - 1] += text
      } else {
        logs.push(text)
      }
    }

    const runner = new Function('rustPrintln', 'rustPrint', 'return (async () => { ' + jsExecutable + ' })()')
    await runner(rustPrintln, rustPrint)

    self.postMessage({
      success: true,
      output: logs.join('\n') || '(실행 완료 - 출력 없음)'
    })
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: '[Rust Runtime Error] ' + (err.message || String(err))
    })
  }
}
