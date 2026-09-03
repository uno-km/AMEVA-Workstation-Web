/**
 * ============================================================================
 * @file test_java_runtime.ts
 * @description Java Code Runtime Verification Suite (SCRUM-JAVA-001)
 * ============================================================================
 */

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Java 트랜스파일러 및 가상 런타임 검증 함수 (Node.js 호환 검증)
function transpileJavaToJs(rawJava: string): string {
  let code = rawJava;

  // 1. 패키지 및 import 문 제거
  code = code.replace(/\bpackage\s+[a-zA-Z0-9_.]+;/g, '');
  code = code.replace(/\bimport\s+[a-zA-Z0-9_.*]+;/g, '');

  // 2. 접근 제어자 및 static/final 키워드 정리
  code = code.replace(/\b(public|private|protected|final|abstract|synchronized|transient|volatile)\b/g, ' ');

  // 3. 예외 throw 변환
  code = code.replace(/throw\s+new\s+(?:RuntimeException|Exception|IllegalArgumentException|IllegalStateException|NullPointerException)\s*\(([^)]*)\)/g, 'throw new Error($1)');

  // 3. 배열 초기화 리터럴: int[] nums = {5, 2, 8, 1}; -> let nums = [5, 2, 8, 1];
  code = code.replace(/\b(?:int|long|double|float|boolean|char|byte|short|String|Object)\s*\[\s*\]\s*([a-zA-Z0-9_]+)\s*=\s*\{([^}]+)\};/g, 'let $1 = [$2];');
  code = code.replace(/new\s+(?:int|long|double|float|boolean|char|byte|short|String|Object)\s*\[\s*\]\s*\{([^}]+)\}/g, '[$1]');
  code = code.replace(/\bnew\s+(?:int|long|double|float|boolean|char|byte|short|String|Object)\s*\[\s*(\d+)\s*\]/g, 'new Array($1).fill(0)');

  // 4. 기본 데이터 타입 및 클래스 변수 선언 변환
  code = code.replace(/\b(?:int|long|double|float|boolean|char|byte|short|String|Integer|Double|Float|Long|Boolean|Character|Byte|Short|Object|var)\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =');
  code = code.replace(/\b(?:int|long|double|float|boolean|char|byte|short|String|Integer|Double|Float|Long|Boolean|Character|Byte|Short|Object|var)\s+([a-zA-Z0-9_]+)\s*;/g, 'let $1;');

  // 제네릭 및 객체 변수 선언: StringBuilder sb = new StringBuilder(); / List<String> list = new ArrayList<>();
  code = code.replace(/\b([A-Z][a-zA-Z0-9_]*)(?:<[^>]*>)?\s+([a-zA-Z0-9_]+)\s*=/g, 'let $2 =');
  code = code.replace(/\b([A-Z][a-zA-Z0-9_]*)(?:<[^>]*>)?\s+([a-zA-Z0-9_]+)\s*;/g, 'let $2;');
  code = code.replace(/\bnew\s+([A-Z][a-zA-Z0-9_]*)\s*<[^>]*>\s*\(/g, 'new $1(');

  // 5. 향상된 for문 (for-each): for (int x : list) -> for (let x of list)
  code = code.replace(/for\s*\(\s*(?:[a-zA-Z0-9_<>\[\]]+)\s+([a-zA-Z0-9_]+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)');

  // 6. 메서드 선언 변환
  // static 메서드 변환
  code = code.replace(/\bstatic\s+(?:void|[a-zA-Z0-9_<>\[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[^{]+)?\{/g, (match, fnName, args) => {
    if (['if', 'while', 'for', 'switch', 'catch'].includes(fnName)) return match;
    const cleanArgs = args.split(',').map((a: string) => a.trim().split(/\s+/).pop()).filter(Boolean).join(', ');
    return 'static async ' + fnName + '(' + cleanArgs + ') {';
  });

  // 일반 인스턴스 메서드 변환 (단, static/class/async로 이미 변환된 것은 제외)
  code = code.replace(/(?<!static\s+|async\s+)\b(?:void|int|long|double|float|boolean|char|byte|short|String|Object|[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[^{]+)?\{/g, (match, fnName, args) => {
    if (['if', 'while', 'for', 'switch', 'catch', 'class', 'static', 'async'].includes(fnName)) return match;
    const cleanArgs = args.split(',').map((a: string) => a.trim().split(/\s+/).pop()).filter(Boolean).join(', ');
    return 'async ' + fnName + '(' + cleanArgs + ') {';
  });

  // 7. 접근 제어자 정리 (남은 public class 등)
  code = code.replace(/\b(public|private|protected|final|abstract|synchronized|transient|volatile)\b/g, ' ');

  // 8. equals, length(), size() 호환성 보정
  code = code.replace(/\.equals\(([^)]+)\)/g, ' === $1');
  code = code.replace(/\.length\(\)/g, '.length');

  // 9. 클래스 정의 내 main 자동 호출 추가
  code += `
;if (typeof main === "function") {
  await main([]);
} else if (typeof Main !== "undefined" && typeof Main.main === "function") {
  await Main.main([]);
} else if (typeof Main !== "undefined") {
  const _inst = new Main();
  if (typeof _inst.main === "function") await _inst.main([]);
}
`;

  return code;
}

// Java 런타임 환경 시뮬레이터
async function executeJavaSnippet(code: string): Promise<{ success: boolean; output: string }> {
  const logs: string[] = [];
  const errors: string[] = [];

  const System = {
    out: {
      print: (...args: any[]) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        if (logs.length > 0 && !logs[logs.length - 1].endsWith('\n')) {
          logs[logs.length - 1] += text;
        } else {
          logs.push(text);
        }
      },
      println: (...args: any[]) => {
        const text = args.length === 0 ? '' : args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        logs.push(text);
      },
      printf: (format: any, ...args: any[]) => {
        let i = 0;
        const formatted = String(format).replace(/%[sdfn]/g, (match) => {
          if (match === '%n') return '\n';
          if (i < args.length) return String(args[i++]);
          return match;
        });
        logs.push(formatted);
      }
    },
    err: {
      println: (...args: any[]) => {
        errors.push(args.map(a => String(a)).join(' '));
      }
    },
    currentTimeMillis: () => Date.now(),
    nanoTime: () => Math.floor(Date.now() * 1000000)
  };

  class ArrayList extends Array {
    add(item: any) { this.push(item); return true; }
    get(index: number) { return this[index]; }
    size() { return this.length; }
    isEmpty() { return this.length === 0; }
    contains(item: any) { return this.includes(item); }
  }

  class HashMap extends Map {
    put(key: any, val: any) { this.set(key, val); return val; }
    get(key: any) { return super.get(key) !== undefined ? super.get(key) : null; }
    size() { return super.size; }
    containsKey(key: any) { return this.has(key); }
  }

  class HashSet extends Set {
    add(val: any) { super.add(val); return true; }
    contains(val: any) { return this.has(val); }
  }

  class StringBuilder {
    buffer: string[];
    constructor(str = '') { this.buffer = [String(str)]; }
    append(val: any) { this.buffer.push(String(val)); return this; }
    toString() { return this.buffer.join(''); }
  }

  const Arrays = {
    toString: (arr: any) => JSON.stringify(arr),
    sort: (arr: any) => { if (Array.isArray(arr)) arr.sort((a, b) => a - b); return arr; }
  };

  const Collections = {
    sort: (list: any) => { if (Array.isArray(list)) list.sort((a, b) => a - b); },
    max: (list: any) => Math.max(...list),
    min: (list: any) => Math.min(...list)
  };

  try {
    const jsExecutable = transpileJavaToJs(code);
    const runner = new Function(
      'System', 'ArrayList', 'HashMap', 'HashSet', 'StringBuilder', 'Arrays', 'Collections',
      'return (async () => { ' + jsExecutable + ' })()'
    );
    await runner(System, ArrayList, HashMap, HashSet, StringBuilder, Arrays, Collections);
    const out = logs.join('\n');
    const err = errors.join('\n');
    return {
      success: errors.length === 0,
      output: err ? (out ? out + '\n' + err : err) : out
    };
  } catch (err: any) {
    return {
      success: false,
      output: '[Java Error] ' + err.message
    };
  }
}

async function runJavaTestSuite() {
  console.log('===============================================================');
  console.log('☕ Running AMEVA-Workstation-Web Java Runtime Verification Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✓ [PASS] ${name}`);
    } catch (e: any) {
      console.error(`  ✕ [FAIL] ${name}: ${e.message}`);
    }
  }

  // 1. Basic System.out.println
  await test('Test 1: Basic System.out.println and arithmetic', async () => {
    const code = `
      int a = 15;
      int b = 25;
      System.out.println("Result = " + (a + b));
    `;
    const res = await executeJavaSnippet(code);
    assert(res.success === true, 'Execution should succeed');
    assert(res.output.includes('Result = 40'), `Output should contain Result = 40, got: ${res.output}`);
  });

  // 2. Loop and Conditionals
  await test('Test 2: For loop and conditional branch', async () => {
    const code = `
      int sum = 0;
      for (int i = 1; i <= 5; i++) {
        sum += i;
      }
      System.out.println("Total sum: " + sum);
    `;
    const res = await executeJavaSnippet(code);
    assert(res.success === true, 'Execution should succeed');
    assert(res.output.includes('Total sum: 15'), `Output should contain Total sum: 15, got: ${res.output}`);
  });

  // 3. Collections (ArrayList, HashMap)
  await test('Test 3: Java Collections (ArrayList & HashMap)', async () => {
    const code = `
      ArrayList<String> fruits = new ArrayList<>();
      fruits.add("Apple");
      fruits.add("Banana");
      fruits.add("Cherry");

      HashMap<String, Integer> scores = new HashMap<>();
      scores.put("Alice", 95);
      scores.put("Bob", 88);

      System.out.println("Fruits count: " + fruits.size());
      System.out.println("Alice score: " + scores.get("Alice"));
    `;
    const res = await executeJavaSnippet(code);
    assert(res.success === true, 'Collections test should succeed');
    assert(res.output.includes('Fruits count: 3'), 'Fruits count must match');
    assert(res.output.includes('Alice score: 95'), 'Alice score must match');
  });

  // 4. StringBuilder & Arrays
  await test('Test 4: StringBuilder and Arrays utility', async () => {
    const code = `
      StringBuilder sb = new StringBuilder();
      sb.append("AMEVA-");
      sb.append("Java-");
      sb.append(2026);
      System.out.println(sb.toString());

      int[] nums = {5, 2, 8, 1};
      Arrays.sort(nums);
      System.out.println(Arrays.toString(nums));
    `;
    const res = await executeJavaSnippet(code);
    assert(res.success === true, 'StringBuilder test should succeed');
    assert(res.output.includes('AMEVA-Java-2026'), 'StringBuilder output must match');
    assert(res.output.includes('[1,2,5,8]'), 'Sorted array output must match');
  });

  // 5. Full OOP Class declaration with main()
  await test('Test 5: Full Class declaration with public static void main', async () => {
    const code = `
      public class Main {
        public static void main(String[] args) {
          System.out.println("Hello from Full Java Class!");
        }
      }
    `;
    const res = await executeJavaSnippet(code);
    assert(res.success === true, 'Full class execution should succeed');
    assert(res.output.includes('Hello from Full Java Class!'), 'Full class output must match');
  });

  // 6. Exception handling
  await test('Test 6: Exception trapping and error output', async () => {
    const code = `
      throw new Error("Simulated Java Exception");
    `;
    const res = await executeJavaSnippet(code);
    assert(res.success === false, 'Exception should result in success = false');
    assert(res.output.includes('Simulated Java Exception'), 'Error message must be captured');
  });

  console.log(`\n===============================================================`);
  console.log(`📊 JAVA RUNTIME VERIFICATION RESULT: ${passed}/${total} PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`===============================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runJavaTestSuite();
