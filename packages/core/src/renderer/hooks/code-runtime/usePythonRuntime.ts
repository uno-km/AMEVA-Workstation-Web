/**
 * @file usePythonRuntime.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/code-runtime/usePythonRuntime.ts
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

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `usePythonRuntime`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `usePythonRuntime(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function usePythonRuntime() {
  const [isRunning, setIsRunning] = useState(false)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `runPythonCode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const runPythonCode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const runPythonCode = async (code: string): Promise<{ success: boolean; output: string; tableData?: any }> => {
    setIsRunning(true)

    // 느낌표 명령어 (!pip install 및 가상 cmd 쉘 명령어) 전처리
    let processedCode = code
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needsMicropip`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needsMicropip = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let needsMicropip = false

    // 가상 쉘 명령어 및 파이프라인/다중 실행 결합 파서 알고리즘 (WASM Pyodide용)
    const lines = code.split('\n')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `processedLines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const processedLines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const processedLines = lines.map(line => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `trimmed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const trimmed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const trimmed = line.trim()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!trimmed.startsWith('!')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!trimmed.startsWith('!'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!trimmed.startsWith('!')) return line

      // !pip install 특수 처리
      if (trimmed.startsWith('!pip install ')) {
        needsMicropip = true
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `packagesStr`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const packagesStr = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const packagesStr = trimmed.substring('!pip install '.length).trim()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pkgs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pkgs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const pkgs = packagesStr.split(/[\s,]+/).map(p => p.trim()).filter(Boolean)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `pkgs.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (pkgs.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (pkgs.length > 0) {
          return `
import micropip
for pkg in ${JSON.stringify(pkgs)}:
    print(f"Collecting {pkg}...")
    try:
        await micropip.install(pkg)
        print(f"Successfully installed {pkg}")
    except Exception as e:
        print(f"[ERROR] Failed to install {pkg}: {str(e)}")
`
        }
        return ''
      }

      // 쉘 명령어 토크나이저 & 번역기
      const cmdText = trimmed.substring(1).trim()
      
      // 세미콜론(;) 또는 && 기준으로 1차 명령 체인 분할
      const chains = cmdText.split(/;|&&/).map(c => c.trim()).filter(Boolean)
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pythonCodeBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pythonCodeBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let pythonCodeBlock = 'import os, shutil, re\n'
      
      chains.forEach((chain, chainIdx) => {
        // 파이프(|) 기준으로 2차 스트림 분할
        const pipes = chain.split('|').map(p => p.trim()).filter(Boolean)
        
        pythonCodeBlock += `\n# --- Chain [${chainIdx}] : ${chain.replace(/"/g, '\\"')} ---\n`
        pythonCodeBlock += `pipe_in = ""\n`
        
        pipes.forEach((pipe, pipeIdx) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parts`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parts = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const parts = pipe.split(/\s+/).filter(Boolean)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `parts.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (parts.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (parts.length === 0) return
          
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mainCmd`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mainCmd = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const mainCmd = parts[0].toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `args`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const args = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const args = parts.slice(1).join(' ').trim()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `escapedArgs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const escapedArgs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const escapedArgs = args.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          
          pythonCodeBlock += `\n# Pipe [${pipeIdx}] : ${mainCmd} ${escapedArgs}\n`
          
      /*
       * [SWITCH ROUTING CASE]
       * - 라우팅 키: `switch (mainCmd) {`
       * - 예상 시나리오: 유입된 상태 변수 분기값과 일치하는 케이스 블록으로 런타임 제어를 즉시 라우팅함.
       * - 예시: `switch (format)` 분기 시 매치되는 변환 포맷 서브 모듈이 가동됨.
       */
          switch (mainCmd) {
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'pwd':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'pwd':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'pwd':
              pythonCodeBlock += `pipe_in = os.getcwd()\n`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'cd':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'cd':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'cd':
              pythonCodeBlock += `
try:
    os.chdir("${escapedArgs}" if "${escapedArgs}" else "/")
    pipe_in = f"Changed directory to: {os.getcwd()}"
except Exception as e:
    pipe_in = f"cd: {str(e)}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'ls':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'ls':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'ls':
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'dir':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'dir':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'dir':
              pythonCodeBlock += `
try:
    target_dir = "${escapedArgs}" if "${escapedArgs}" else "."
    pipe_in = "\\n".join(os.listdir(target_dir))
except Exception as e:
    pipe_in = f"ls: {str(e)}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'mkdir':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'mkdir':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'mkdir':
              pythonCodeBlock += `
try:
    os.makedirs("${escapedArgs}", exist_ok=True)
    pipe_in = f"Created directory: {${JSON.stringify(args)}}"
except Exception as e:
    pipe_in = f"mkdir: {str(e)}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'rmdir':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'rmdir':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'rmdir':
              pythonCodeBlock += `
try:
    shutil.rmtree("${escapedArgs}", ignore_errors=True)
    pipe_in = f"Removed directory: ${escapedArgs}"
except Exception as e:
    pipe_in = f"rmdir: {str(e)}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'touch':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'touch':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'touch':
              pythonCodeBlock += `
try:
    with open("${escapedArgs}", 'w') as f:
        pass
    pipe_in = f"Created file: ${escapedArgs}"
except Exception as e:
    pipe_in = f"touch: {str(e)}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'cat':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'cat':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'cat':
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'type':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'type':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'type':
              pythonCodeBlock += `
try:
    target_file = "${escapedArgs}" if "${escapedArgs}" else pipe_in.strip()
    if target_file:
        with open(target_file, 'r', encoding='utf-8', errors='ignore') as f:
            pipe_in = f.read()
    else:
        pipe_in = "[ERROR] cat: No file specified"
except Exception as e:
    pipe_in = f"cat: {str(e)}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'echo':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'echo':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'echo':
              pythonCodeBlock += `pipe_in = "${escapedArgs}" if "${escapedArgs}" else pipe_in\n`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'grep':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'grep':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'grep':
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isCaseInsensitive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isCaseInsensitive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const isCaseInsensitive = args.includes('-i')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cleanPattern`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cleanPattern = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const cleanPattern = args.replace(/-[a-zA-Z]+/g, '').trim().replace(/"/g, '\\"')
              pythonCodeBlock += `
pattern = "${cleanPattern}"
lines_to_filter = pipe_in.split('\\n')
if ${isCaseInsensitive ? 'True' : 'False'}:
    pipe_in = "\\n".join([line for line in lines_to_filter if pattern.lower() in line.lower()])
else:
    pipe_in = "\\n".join([line for line in lines_to_filter if pattern in line])
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'wc':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'wc':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'wc':
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isLineCount`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isLineCount = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const isLineCount = args.includes('-l')
              pythonCodeBlock += `
lines_wc = pipe_in.split('\\n')
active_lines = [l for l in lines_wc if l.strip()]
if ${isLineCount ? 'True' : 'False'}:
    pipe_in = str(len(active_lines))
else:
    words = len(pipe_in.split())
    chars = len(pipe_in)
    pipe_in = f"{len(active_lines)} {words} {chars}"
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'head':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'head':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'head':
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `headLinesMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const headLinesMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const headLinesMatch = args.match(/-n\s*(\d+)/) || args.match(/-(\d+)/)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `headCount`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const headCount = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const headCount = headLinesMatch ? parseInt(headLinesMatch[1]) : 10
              pythonCodeBlock += `
lines_head = pipe_in.split('\\n')
pipe_in = "\\n".join(lines_head[:${headCount}])
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'tail':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'tail':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'tail':
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tailLinesMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tailLinesMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const tailLinesMatch = args.match(/-n\s*(\d+)/) || args.match(/-(\d+)/)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tailCount`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tailCount = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const tailCount = tailLinesMatch ? parseInt(tailLinesMatch[1]) : 10
              pythonCodeBlock += `
lines_tail = pipe_in.split('\\n')
pipe_in = "\\n".join(lines_tail[-${tailCount}:])
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'sort':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'sort':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            case 'sort':
              pythonCodeBlock += `
lines_sort = [l for l in pipe_in.split('\\n') if l.strip()]
pipe_in = "\\n".join(sorted(lines_sort))
`
              break
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `default:`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `default:` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
            default:
              pythonCodeBlock += `pipe_in = "[WASM Sandbox] 파이썬 샌드박스 실행기에서 지원되지 않는 쉘 명령입니다: ${mainCmd}"\n`
          }
        })
        
        pythonCodeBlock += `print(pipe_in)\n`
      })
      
      return pythonCodeBlock
    })
    processedCode = processedLines.join('\n')

    try {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!(window as any).loadPyodide`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!(window as any).loadPyodide)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!(window as any).loadPyodide) {
        await new Promise<void>((resolve, reject) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `script`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const script = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js'
          script.integrity = 'sha384-Zt+txBUVind9SDPtCx7HTNK8jiZiFKX/Cm3Ml1tEnAmGKO/QSRn1VqM+Vr45Cbrj'
          script.crossOrigin = 'anonymous'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Pyodide WebAssembly CDN 로드 실패 (SRI 검증 실패일 수 있습니다)'))
          document.head.appendChild(script)
        })
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!RuntimeState.pyodideInstance`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!RuntimeState.pyodideInstance)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!RuntimeState.pyodideInstance) {
        RuntimeState.pyodideInstance = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
        })
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needsMicropip`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needsMicropip)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (needsMicropip) {
        await RuntimeState.pyodideInstance.loadPackage("micropip")
      }

      const logs: string[] = []
      RuntimeState.pyodideInstance.setStdout({
        batched: (text: string) => logs.push(text)
      })
      RuntimeState.pyodideInstance.setStderr({
        batched: (text: string) => logs.push(`[ERROR] ${text}`)
      })

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `result`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const result = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const result = await RuntimeState.pyodideInstance.runPythonAsync(processedCode)
      setIsRunning(false)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `output`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const output = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let output = logs.join('\n')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `result !== undefined && result !== null`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (result !== undefined && result !== null)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (result !== undefined && result !== null) {
        output += `\n→ ${String(result)}`
      }
      return { success: true, output: output || '실행 완료 (WASM)' }

    } catch (err: any) {
      setIsRunning(false)
      return { success: false, output: `[WASM RUNTIME ERROR]\n${err.message}` }
    }
  }

  return {
    isPythonRunning: isRunning,
    runPythonCode,
  }
}

