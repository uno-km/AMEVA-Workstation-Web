/**
 * ============================================================================
 * @file polyglotWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/polyglotWorker.ts
 * @role Polyglot Sandbox Web Worker for C#, Swift, Kotlin, Zig, Ruby, PHP, and R
 * ============================================================================
 */

const logs: string[] = []

function transpilePolyglotToJs(language: string, rawCode: string): string {
  const lang = language.toLowerCase()
  let js = rawCode

  switch (lang) {
    case 'csharp':
    case 'cs': {
      js = js.replace(/using\s+[a-zA-Z0-9_.]+;/g, '')
      js = js.replace(/string\.Join\s*\(\s*(".*?")\s*,\s*([^)]+)\)/g, '($2).join($1)')
      js = js.replace(/\bConsole\.WriteLine\b/g, 'polyglotPrintln')
      js = js.replace(/\bConsole\.Write\b/g, 'polyglotPrint')
      js = js.replace(/\b(?:var|string|int|long|double|float|bool|List<[^>]+>)\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =')
      js = js.replace(/new\s+List<[^>]+>\s*\{([^}]*)\}/g, '[$1]')
      js = js.replace(/public\s+class\s+[a-zA-Z0-9_]+\s*\{/g, '')
      js = js.replace(/public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/g, 'async function main() {')
      const lastBraceIdx = js.lastIndexOf('}')
      if (lastBraceIdx !== -1) {
        js = js.substring(0, lastBraceIdx) + js.substring(lastBraceIdx + 1)
      }
      js += '\n;if (typeof main === "function") { await main(); }\n'
      break
    }

    case 'swift': {
      js = js.replace(/import\s+[a-zA-Z0-9_]+/g, '')
      js = js.replace(/\bprint\s*\(([\s\S]*?)\)/g, (match, inner) => {
        const converted = inner.replace(/\\\\\(([^)]+)\)/g, '${$1}').replace(/\\\(([^)]+)\)/g, '${$1}')
        if (converted.includes('${')) {
          return `polyglotPrintln(\`${converted.replace(/^"|"$/g, '')}\`);`
        }
        return `polyglotPrintln(${converted});`
      })
      js = js.replace(/for\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*in\s*([a-zA-Z0-9_.]+)\.enumerated\(\)\s*\{/g, 'for (const [$1, $2] of ($3).entries()) {')
      js = js.replace(/\blet\s+([a-zA-Z0-9_]+)\s*=/g, 'const $1 =')
      js = js.replace(/\bvar\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =')
      break
    }

    case 'kotlin':
    case 'kt': {
      js = js.replace(/fun\s+main\s*\([^)]*\)\s*\{/g, 'async function main() {')
      js = js.replace(/\.filter\s*\{\s*it\s*%\s*2\s*==\s*0\s*\}/g, '.filter(it => it % 2 === 0)')
      js = js.replace(/\blistOf\s*\(([^)]*)\)/g, '[$1]')
      js = js.replace(/\bval\s+([a-zA-Z0-9_]+)\s*=/g, 'const $1 =')
      js = js.replace(/\bprintln\b/g, 'polyglotPrintln')
      js = js.replace(/\bprint\b/g, 'polyglotPrint')
      js += '\n;if (typeof main === "function") { await main(); }\n'
      break
    }

    case 'zig': {
      js = js.replace(/const\s+std\s*=\s*@import\("std"\);?/g, '')
      js = js.replace(/std\.debug\.print\s*\(\s*(".*?")\s*,\s*\.\{([^}]*)\}\s*\);?/g, (match, format, args) => {
        return `polyglotPrint(${format});`
      })
      js = js.replace(/pub\s+fn\s+main\s*\(\s*\)\s*(?:void)?\s*\{/g, 'async function main() {')
      js += '\n;if (typeof main === "function") { await main(); }\n'
      break
    }

    case 'ruby':
    case 'rb': {
      js = js.replace(/^\s*#.*$/gm, '')
      js = js.replace(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm, 'let $1 =')
      js = js.replace(/#\{([^}]+)\}/g, '${$1}')
      js = js.replace(/\bputs\s+"([^"]+)"/gm, 'polyglotPrintln(`$1`);')
      js = js.replace(/\bputs\s+(.+?)$/gm, 'polyglotPrintln($1);')
      js = js.replace(/([a-zA-Z0-9_]+)\.each_with_index\s+do\s+\|([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\|\s*/g, '$1.forEach(($2, $3) => {')
      js = js.replace(/([a-zA-Z0-9_]+)\.each\s+do\s+\|([a-zA-Z0-9_]+)\|\s*/g, '$1.forEach(($2) => {')
      js = js.replace(/\bend\b/g, '});')
      break
    }

    case 'php': {
      js = js.replace(/<\?php/g, '')
      js = js.replace(/\?>/g, '')
      js = js.replace(/\becho\s+(.+?);/g, 'polyglotPrint($1);')
      js = js.replace(/\bprint_r\s*\(([^)]*)\);/g, 'polyglotPrintln(JSON.stringify($1, null, 2));')
      js = js.replace(/\$([a-zA-Z0-9_]+)/g, '$1')
      break
    }

    case 'r': {
      // R Environment helper definitions injected before execution
      const rPreamble = `
function c(...args) { return args.flat(); }
function mean(x) { if (!Array.isArray(x) || x.length === 0) return 0; return x.reduce((a, b) => a + b, 0) / x.length; }
function median(x) { if (!Array.isArray(x) || x.length === 0) return 0; const s = [...x].sort((a,b)=>a-b); const m = Math.floor(s.length/2); return s.length % 2 ? s[m] : (s[m-1]+s[m])/2; }
function sd(x) { if (!Array.isArray(x) || x.length <= 1) return 0; const m = mean(x); return Math.sqrt(x.reduce((a,b)=>a+Math.pow(b-m,2),0)/(x.length-1)); }
function summary(x) {
  if (!Array.isArray(x)) return String(x);
  const s = [...x].sort((a,b)=>a-b);
  const min = Math.min(...s);
  const max = Math.max(...s);
  const m = mean(s);
  const med = median(s);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  return '   Min. 1st Qu.  Median    Mean 3rd Qu.    Max. \\n' +
         '  ' + min.toFixed(2).padStart(5) + ' ' + q1.toFixed(2).padStart(7) + ' ' + med.toFixed(2).padStart(7) + ' ' + m.toFixed(2).padStart(7) + ' ' + q3.toFixed(2).padStart(7) + ' ' + max.toFixed(2).padStart(7);
}
function cat(...args) {
  const formatted = args.map(a => typeof a === 'number' ? a.toString() : String(a)).join(' ');
  polyglotPrint(formatted.replace(/\\\\n/g, '\\n'));
}
function print(x) {
  if (typeof x === 'object' && x !== null && !Array.isArray(x)) {
    polyglotPrintln(JSON.stringify(x, null, 2));
  } else {
    polyglotPrintln(String(x));
  }
}
`;
      // Clean comments and assignments
      let rLines = rawCode.split('\n');
      let convertedLines: string[] = [];

      for (let line of rLines) {
        let trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed.length === 0) continue;
        // Convert assignment: var <- val or var = val
        line = line.replace(/^\s*([a-zA-Z0-9_.]+)\s*<-\s*/, 'let $1 = ');
        line = line.replace(/<-/g, '=');
        convertedLines.push(line);
      }

      js = rPreamble + '\n' + convertedLines.join('\n');
      break
    }

    default:
      break
  }

  return js
}

self.onmessage = async function (e: MessageEvent) {
  logs.length = 0
  const { language, code } = e.data || { language: 'plaintext', code: '' }

  try {
    const jsExecutable = transpilePolyglotToJs(language, code)

    const polyglotPrintln = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
    }
    const polyglotPrint = (...args: any[]) => {
      const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      if (logs.length > 0 && !logs[logs.length - 1].endsWith('\n')) {
        logs[logs.length - 1] += text
      } else {
        logs.push(text)
      }
    }

    const runner = new Function('polyglotPrintln', 'polyglotPrint', 'return (async () => { ' + jsExecutable + ' })()')
    await runner(polyglotPrintln, polyglotPrint)

    self.postMessage({
      success: true,
      output: logs.join('\n').replace(/\\n/g, '\n') || '(실행 완료 - 출력 없음)'
    })
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: `[${language.toUpperCase()} Runtime Error] ` + (err.message || String(err))
    })
  }
}
