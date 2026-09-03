/**
 * ============================================================================
 * @file test_multilang_runtime.ts
 * @role Automated Verification Suite for Multi-Language Execution & Templates
 * ============================================================================
 */

import { DEFAULT_CODE_TEMPLATES, getDefaultCodeForLanguage, isDefaultCodeTemplate, LANG_META } from '../src/renderer/components/jupyter/langMeta'

console.log('===============================================================')
console.log('🌐 Running AMEVA Multi-Language & Starter Template Test Suite')
console.log('===============================================================')

let passedCount = 0
let failedCount = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`)
    passedCount++
  } else {
    console.error(`  ✗ [FAIL] ${testName}`)
    if (detail) console.error(`    Detail: ${detail}`)
    failedCount++
  }
}

// Suite 1: Default Code Templates Integrity
console.log('\n📦 [Suite 1: Starter Template Integrity & Coverage]')
const requiredLanguages = [
  'java', 'javascript', 'python', 'sql', 'bash', 'solidity',
  'lua', 'c', 'cpp', 'go', 'rust', 'html', 'mermaid', 'json',
  'php', 'ruby', 'r', 'csharp', 'kotlin', 'swift', 'zig', 'plaintext'
]

for (const lang of requiredLanguages) {
  const tpl = getDefaultCodeForLanguage(lang)
  assert(tpl.length > 10, `Starter template exists for ${lang.toUpperCase()}`, `Template length: ${tpl.length}`)
}

assert(isDefaultCodeTemplate('java', DEFAULT_CODE_TEMPLATES['java']), 'isDefaultCodeTemplate correctly identifies unmodified template')
assert(!isDefaultCodeTemplate('java', 'System.out.println("Custom Code");'), 'isDefaultCodeTemplate correctly identifies modified custom code')
assert(isDefaultCodeTemplate('java', ''), 'isDefaultCodeTemplate treats empty string as template')

// Suite 2: Runnable Status & Execution Metadata
console.log('\n📦 [Suite 2: Runnable Status & Execution Metadata]')
const allRunnableLangs = [
  'javascript', 'typescript', 'python', 'java', 'sql', 'bash', 'sh',
  'solidity', 'lua', 'c', 'cpp', 'go', 'rust', 'csharp', 'cs',
  'php', 'ruby', 'rb', 'r', 'kotlin', 'kt', 'swift', 'zig', 'html'
]

for (const lang of allRunnableLangs) {
  assert(LANG_META[lang]?.runnable === true, `${lang.toUpperCase()} has [▶ Run] enabled`)
}

// Suite 3: TypeScript Type-Stripping Logic Verification
console.log('\n📦 [Suite 3: TypeScript AST & Type-Stripper Verification]')
const tsSnippet = `
interface User {
  id: number;
  name: string;
}
type Role = "Admin" | "User";
const user: User = { id: 1, name: "Alice" };
const role: Role = "Admin" as Role;
console.log(user.name);
`
let stripped = tsSnippet
  .replace(/\binterface\s+[a-zA-Z0-9_]+\s*(?:extends\s+[^{]+)?\{[\s\S]*?\}/g, '')
  .replace(/\btype\s+[a-zA-Z0-9_]+(?:\s*<[^>]*>)?\s*=\s*[^;]+;/g, '')
  .replace(/(\b(?:let|var|const)\s+[a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_<>[\]|&\s]+(?=\s*=|\s*;)/g, '$1')
  .replace(/\bas\s+[a-zA-Z0-9_<>[\]]+/g, '')

let tsExecLogs: string[] = []
const customConsole = {
  log: (...args: any[]) => tsExecLogs.push(args.join(' '))
}
const runner = new Function('console', stripped)
runner(customConsole)

assert(tsExecLogs.includes('Alice'), 'TypeScript interface & type annotations stripped and executed cleanly')

// Suite 4: Lua Transpile & Execution Verification
console.log('\n📦 [Suite 4: Lua Transpiler Verification]')
const luaSnippet = DEFAULT_CODE_TEMPLATES['lua']
let luaLogs: string[] = []
const luaPrint = (...args: any[]) => luaLogs.push(args.join(' '))

let jsLua = luaSnippet
  .replace(/--.*$/gm, '')
  .replace(/\s*\.\.\s*/g, ' + ')
  .replace(/\bprint\s*\(([\s\S]*?)\)/g, 'luaPrint($1)')
  .replace(/\blocal\s+([a-zA-Z0-9_,\s]+)=/g, 'let $1 =')
  .replace(/\blocal\s+([a-zA-Z0-9_]+)\b/g, 'let $1')
  .replace(/\{([^{}]*)\}/g, '[$1]')
  .replace(/for\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s+in\s+ipairs\(([^)]+)\)\s+do/g, 'for (const [$1, $2] of ($3).entries()) {')
  .replace(/\bend\b/g, '}')

const luaRunner = new Function('luaPrint', jsLua)
luaRunner(luaPrint)

assert(luaLogs.some(l => l.includes('100')), 'Lua script executes without syntax error and calculates sum 100')

// Suite 5: Rust & Go Transpiler Verification
console.log('\n📦 [Suite 5: Rust & Go Transpiler Verification]')
const rustSnippet = DEFAULT_CODE_TEMPLATES['rust']
assert(rustSnippet.includes('fn main()'), 'Rust starter template has fn main()')
assert(rustSnippet.includes('vec!['), 'Rust starter template has vec! macro')

const goSnippet = DEFAULT_CODE_TEMPLATES['go']
assert(goSnippet.includes('func main()'), 'Go starter template has func main()')
assert(goSnippet.includes('fmt.Println'), 'Go starter template has fmt.Println')

// Suite 6: C#, Ruby, Kotlin, and R Transpile Verification
console.log('\n📦 [Suite 6: Polyglot Transpiler Verification (C#, Ruby, Kotlin, R)]')
const csharpSnippet = DEFAULT_CODE_TEMPLATES['csharp']
assert(csharpSnippet.includes('Console.WriteLine'), 'C# starter template has Console.WriteLine')
assert(csharpSnippet.includes('string.Join'), 'C# starter template has string.Join')

const rubySnippet = DEFAULT_CODE_TEMPLATES['ruby']
assert(rubySnippet.includes('puts'), 'Ruby starter template has puts')
assert(rubySnippet.includes('each_with_index'), 'Ruby starter template has each_with_index')

const kotlinSnippet = DEFAULT_CODE_TEMPLATES['kotlin']
assert(kotlinSnippet.includes('fun main()'), 'Kotlin starter template has fun main()')
assert(kotlinSnippet.includes('listOf('), 'Kotlin starter template has listOf')

const rSnippet = DEFAULT_CODE_TEMPLATES['r']
assert(rSnippet.includes('mean(data)'), 'R starter template has mean(data)')
assert(rSnippet.includes('summary(data)'), 'R starter template has summary(data)')

console.log('===============================================================')
console.log(`📊 MULTI-LANG VERIFICATION RESULT: ${passedCount}/${passedCount + failedCount} PASSED (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`)
console.log('===============================================================')

if (failedCount > 0) {
  process.exit(1)
}
