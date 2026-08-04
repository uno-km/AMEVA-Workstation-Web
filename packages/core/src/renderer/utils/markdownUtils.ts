/**
 * @file markdownUtils.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/markdownUtils.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 관련 비즈니스 훅 내부 연산 시 순수 함수 유틸리티로 수입 소비.
 * - 소비처 B (src/renderer/components/): 렌더링 전 데이터 정제 단계에서 포맷터 유틸리티로 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `convertJupyterToCodeBlocks`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `convertJupyterToCodeBlocks(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function convertJupyterToCodeBlocks(blocks: any[]): any[] {
  return blocks.map(block => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `copy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const copy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const copy = { ...block }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `copy.type === 'jupyter'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (copy.type === 'jupyter')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (copy.type === 'jupyter') {
      copy.type = 'codeBlock'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const lang = copy.props?.language || 'javascript'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `finalCodeText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const finalCodeText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const finalCodeText = copy.props?.code || ''
      copy.content = [{ type: 'text', text: finalCodeText, styles: {} }]
      copy.props = {
        language: lang
      }
    } else if (copy.type === 'drawing') {
      copy.type = 'codeBlock'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dataText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dataText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const dataText = copy.props?.data || '[]'
      copy.content = [{ type: 'text', text: dataText, styles: {} }]
      copy.props = {
        language: 'ameva-drawing'
      }
    } else if (copy.type === 'map') {
      // [FIX-MAP-SERIALIZATION-001] map 커스텀 블록을 ameva-map 언어를 사용하는 가짜 코드 블록으로 패킹 직렬화
      copy.type = 'codeBlock'
      const mapData = JSON.stringify({
        lat: copy.props?.lat || '37.5665',
        lng: copy.props?.lng || '126.9780',
        destLat: copy.props?.destLat || '',
        destLng: copy.props?.destLng || '',
        zoom: copy.props?.zoom || '14',
        locationName: copy.props?.locationName || '서울시',
        destination: copy.props?.destination || '',
        legend: copy.props?.legend || '',
        memo: copy.props?.memo || '',
        routeType: copy.props?.routeType || 'none',
        routingEngine: copy.props?.routingEngine || 'osrm'
      })
      copy.content = [{ type: 'text', text: mapData, styles: {} }]
      copy.props = {
        language: 'ameva-map'
      }
    } else if (copy.type === 'youtube') {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `copy.type === 'youtube'`
       * - 만족 시: ameva-youtube 코드 블록 형태로 변환 직렬화하여 유튜브 메타데이터 유실 방지.
       * - 불만족 시: 바이패스하여 하위 자식 노드를 순차 탐색함.
       * - 예시: `if (copy.type === 'youtube')` 만족 시 codeBlock 변환 시작.
       */
      copy.type = 'codeBlock'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ytData`
       * - 자료형 / 예상 값: string (JSON 문자열)
       * - 시나리오: url, videoId, title, description, thumbnail 등 유튜브 구성 속성들을 JSON으로 팩킹하여 콘텐츠로 저장.
       */
      const ytData = JSON.stringify({
        url: copy.props?.url || '',
        videoId: copy.props?.videoId || '',
        title: copy.props?.title || 'YouTube Video',
        description: copy.props?.description || '동영상 설명을 불러오려면 클릭하세요.',
        thumbnail: copy.props?.thumbnail || ''
      })
      copy.content = [{ type: 'text', text: ytData, styles: {} }]
      copy.props = {
        language: 'ameva-youtube'
      }
    } else if (copy.type === 'linkPreview') {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `copy.type === 'linkPreview'`
       * - 만족 시: ameva-link 코드 블록 형태로 변환 직렬화하여 링크 메타데이터 유실 방지.
       */
      copy.type = 'codeBlock'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `linkData`
       * - 자료형 / 예상 값: string (JSON 문자열)
       * - 시나리오: url, title, description, thumbnail 등 링크 프리뷰 구성 속성들을 JSON으로 패킹하여 콘텐츠로 저장.
       */
      const linkData = JSON.stringify({
        url: copy.props?.url || '',
        title: copy.props?.title || 'Link Preview',
        description: copy.props?.description || '',
        thumbnail: copy.props?.thumbnail || ''
      })
      copy.content = [{ type: 'text', text: linkData, styles: {} }]
      copy.props = {
        language: 'ameva-link'
      }
    } else if (copy.type === 'presentation') {
      copy.type = 'codeBlock'
      const presentationData = JSON.stringify({
        pptxPath: copy.props?.pptxPath || '',
        slides: copy.props?.slides || '',
        fallback: copy.props?.fallback || false,
        slidesText: copy.props?.slidesText || '[]'
      })
      copy.content = [{ type: 'text', text: presentationData, styles: {} }]
      copy.props = {
        language: 'ameva-presentation'
      }
    } else if (copy.type === 'excel') {
      copy.type = 'codeBlock'
      const excelData = copy.props?.data || '[]'
      copy.content = [{ type: 'text', text: excelData, styles: {} }]
      copy.props = {
        language: 'ameva-excel'
      }
    } else if (copy.type === 'kanban') {
      copy.type = 'codeBlock'
      const kanbanData = copy.props?.data || '{}'
      copy.content = [{ type: 'text', text: kanbanData, styles: {} }]
      copy.props = {
        language: 'ameva-kanban'
      }
    } else if (copy.children) {
      copy.children = convertJupyterToCodeBlocks(copy.children)
    }
    return copy
  })
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `normalizeMarkdown`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `normalizeMarkdown(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function normalizeMarkdown(raw: string): string {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `content`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const content = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let content = raw.replace(/\r\n/g, '\n')
  content = content.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parts`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parts = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const parts = content.split('```')
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 1; i < parts.length; i += 2) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 1; i < parts.length; i += 2) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `parts[i]`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (parts[i])` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (parts[i]) {
      parts[i] = parts[i].replace(/\n\s*\n/g, '\n\u200B\n')
      parts[i] = parts[i].replace(/</g, '__LT_TEMP__')
      parts[i] = parts[i].replace(/>/g, '__GT_TEMP__')
    }
  }
  content = parts.join('```')
  
  content = content.replace(/\n*```([a-zA-Z0-9_-]+)[^\n]*\n+/g, (_, lang) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `l`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const l = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const l = lang.toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mapped`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mapped = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const mapped = l === 'js' ? 'javascript' : l === 'ts' ? 'typescript' : l === 'py' ? 'python' : l
    return `\n\n\`\`\`${mapped}\n`
  })
  content = content.replace(/\n*```[ \t]*\n+/g, '\n```\n\n')
  content = content.replace(/\n{3,}/g, '\n\n')
  return content.trim()
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `cleanCodeBlocks`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `cleanCodeBlocks(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function cleanCodeBlocks(blocks: any[]) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `supportedLangs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const supportedLangs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const supportedLangs = ['python', 'py', 'javascript', 'js', 'html', 'css', 'c', 'cpp', 'java', 'xml', 'json', 'text', 'txt', 'plaintext', 'mermaid', 'bash', 'sh', 'typescript', 'ts', 'sql', 'ameva-drawing', 'ameva-map', 'ameva-youtube', 'ameva-link', 'ameva-presentation', 'ameva-excel', 'ameva-kanban']
  blocks.forEach(block => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.type === 'codeBlock'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.type === 'codeBlock')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (block.type === 'codeBlock') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `text`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const text = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const text = block.content ? block.content.map((c: any) => c.text).join('') : ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cleaned`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cleaned = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let cleaned = text.replace(/\u200B/g, '').replace(/__LT_TEMP__/g, '<').replace(/__GT_TEMP__/g, '>')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const lines = cleaned.split('\n')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `firstLine`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const firstLine = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const firstLine = lines[0]?.trim()
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let lang = 'javascript'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `finalCode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const finalCode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let finalCode = cleaned
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `amevaLangMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const amevaLangMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const amevaLangMatch = firstLine ? firstLine.match(/^(?:\/\/#|--|<!--)\s*\[AMEVA_LANG:([a-zA-Z0-9_-]+)\](?:\s*-->)?/) || firstLine.match(/^(?:\/\/|#|--)\s*\[AMEVA_LANG:([a-zA-Z0-9_-]+)\]/) : null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `amevaLangMatch`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (amevaLangMatch)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (amevaLangMatch) {
        lang = amevaLangMatch[1].toLowerCase()
        finalCode = lines.slice(1).join('\n')
      } 
      else if (firstLine && (
        supportedLangs.includes(firstLine.toLowerCase()) ||
        (block.props?.language && firstLine.toLowerCase() === block.props.language.toLowerCase()) ||
        (block.props?.language && firstLine.toLowerCase() === 'py' && block.props.language.toLowerCase() === 'python') ||
        (block.props?.language && firstLine.toLowerCase() === 'js' && block.props.language.toLowerCase() === 'javascript') ||
        (block.props?.language && firstLine.toLowerCase() === 'ts' && block.props.language.toLowerCase() === 'typescript')
      )) {
        lang = firstLine.toLowerCase() === 'py' ? 'python' : firstLine.toLowerCase() === 'js' ? 'javascript' : firstLine.toLowerCase() === 'ts' ? 'typescript' : firstLine.toLowerCase()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.props?.language && !supportedLangs.includes(firstLine.toLowerCase())`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.props?.language && !supportedLangs.includes(firstLine.toLowerCase()))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (block.props?.language && !supportedLangs.includes(firstLine.toLowerCase())) {
          lang = block.props.language.toLowerCase()
        }
        finalCode = lines.slice(1).join('\n')
      } 
      else {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rawLang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rawLang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const rawLang = (block.props?.language || 'javascript').toLowerCase()
        lang = rawLang === 'js' ? 'javascript' : rawLang === 'ts' ? 'typescript' : rawLang === 'py' ? 'python' : rawLang
      }
      
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `lang === 'ameva-drawing'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (lang === 'ameva-drawing')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (lang === 'ameva-drawing') {
        block.type = 'drawing'
        block.props = {
          data: finalCode
        }
        block.content = undefined
        return
      }
      
      // [FIX-MAP-DESERIALIZATION-002] ameva-map 코드 블록을 감지하면 원래의 map 커스텀 블록으로 복구 역직렬화
      if (lang === 'ameva-map') {
        block.type = 'map'
        try {
          const parsed = JSON.parse(finalCode)
          block.props = {
            lat: parsed.lat || '37.5665',
            lng: parsed.lng || '126.9780',
            destLat: parsed.destLat || '',
            destLng: parsed.destLng || '',
            zoom: parsed.zoom || '14',
            locationName: parsed.locationName || '서울시',
            destination: parsed.destination || '',
            legend: parsed.legend || '',
            memo: parsed.memo || '',
            routeType: parsed.routeType || 'none',
            routingEngine: parsed.routingEngine || 'osrm'
          }
        } catch (err) {
          console.error('[cleanCodeBlocks] Failed to parse ameva-map json:', err)
          block.props = { lat: '37.5665', lng: '126.9780', zoom: '14', locationName: '서울시' }
        }
        block.content = undefined
        return
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `lang === 'ameva-youtube'`
       * - 만족 시: 백킹 스토어의 ameva-youtube 가짜 코드 블록 데이터를 원래의 youtube 커스텀 미디어 블록으로 완벽히 복원 역직렬화.
       * - 불만족 시: 바이패스하여 jupyter 코드 블록 기본 사양으로 폴백 처리함.
       * - 예시: `if (lang === 'ameva-youtube')` 만족 시 youtube 블록 복구 시작.
       */
      if (lang === 'ameva-youtube') {
        block.type = 'youtube'
        try {
          /*
           * [RUN-TIME STATE / INVARIANT]
           * - 변수 명: `parsed`
           * - 자료형 / 예상 값: Object (유튜브 블록 메타데이터 파싱 정보)
           * - 시나리오: JSON 문자열로 인코딩된 finalCode 텍스트를 디코딩하여 개별 미디어 속성들을 획득.
           */
          const parsed = JSON.parse(finalCode)
          block.props = {
            url: parsed.url || '',
            videoId: parsed.videoId || '',
            title: parsed.title || 'YouTube Video',
            description: parsed.description || '동영상 설명을 불러오려면 클릭하세요.',
            thumbnail: parsed.thumbnail || ''
          }
        } catch (err) {
          console.error('[cleanCodeBlocks] Failed to parse ameva-youtube json:', err)
          block.props = { url: '', videoId: '', title: 'YouTube Video', description: '동영상 설명을 불러오려면 클릭하세요.', thumbnail: '' }
        }
        block.content = undefined
        return
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `lang === 'ameva-link'`
       * - 만족 시: 백킹 스토어의 ameva-link 가짜 코드 블록 데이터를 원래의 linkPreview 커스텀 블록으로 완벽히 복원 역직렬화.
       * - 불만족 시: 바이패스하여 jupyter 코드 블록 기본 사양으로 폴백 처리함.
       */
      if (lang === 'ameva-link') {
        block.type = 'linkPreview'
        try {
          /*
           * [RUN-TIME STATE / INVARIANT]
           * - 변수 명: `parsed`
           * - 자료형 / 예상 값: Object (링크 블록 메타데이터 파싱 정보)
           * - 시나리오: JSON 문자열로 인코딩된 finalCode 텍스트를 디코딩하여 개별 링크 속성들을 획득.
           */
          const parsed = JSON.parse(finalCode)
          block.props = {
            url: parsed.url || '',
            title: parsed.title || 'Link Preview',
            description: parsed.description || '',
            thumbnail: parsed.thumbnail || ''
          }
        } catch (err) {
          console.error('[cleanCodeBlocks] Failed to parse ameva-link json:', err)
          block.props = { url: '', title: 'Link Preview', description: '', thumbnail: '' }
        }
        block.content = undefined
        return
      }

      if (lang === 'ameva-presentation') {
        block.type = 'presentation'
        try {
          const parsed = JSON.parse(finalCode)
          block.props = {
            pptxPath: parsed.pptxPath || '',
            slides: parsed.slides || '',
            fallback: parsed.fallback || false,
            slidesText: parsed.slidesText || '[]'
          }
        } catch (err) {
          console.error('[cleanCodeBlocks] Failed to parse ameva-presentation json:', err)
          block.props = { pptxPath: '', slides: '', fallback: false, slidesText: '[]' }
        }
        block.content = undefined
        return
      }

      if (lang === 'ameva-excel') {
        block.type = 'excel'
        block.props = {
          data: finalCode
        }
        block.content = undefined
        return
      }

      if (lang === 'ameva-kanban') {
        block.type = 'kanban'
        block.props = {
          data: finalCode
        }
        block.content = undefined
        return
      }

      block.type = 'jupyter'
      block.props = {
        language: lang,
        code: finalCode,
        runState: JSON.stringify({ hasRun: false, success: null, outputLines: [] })
      }
      block.content = undefined
    }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.type === 'image' && block.props?.url`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.type === 'image' && block.props?.url)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (block.type === 'image' && block.props?.url) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `url`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const url = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const url = block.props.url.toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isVideo`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isVideo = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const isVideo = url.endsWith('.mp4') || 
                      url.endsWith('.webm') || 
                      url.endsWith('.mov') || 
                      url.endsWith('.ogg') ||
                      url.startsWith('data:video/')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isVideo`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isVideo)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (isVideo) {
        block.type = 'video'
      }
    }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.children`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.children)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (block.children) {
      cleanCodeBlocks(block.children)
    }
  })
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `ensureBlockIds`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `ensureBlockIds(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function ensureBlockIds(blocks: any[]) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `generateId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const generateId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const generateId = () => Math.random().toString(36).substring(2, 10)
  blocks.forEach(block => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!block.id`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!block.id)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!block.id) {
      block.id = generateId()
    }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.children`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.children)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (block.children) {
      ensureBlockIds(block.children)
    }
  })
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `cleanMarkdownCodeBlocks`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `cleanMarkdownCodeBlocks(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function cleanMarkdownCodeBlocks(markdown: string): string {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `norm`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const norm = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const norm = (l: string) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `low`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const low = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const low = l.toLowerCase()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `low === 'js'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (low === 'js')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (low === 'js') return 'javascript'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `low === 'ts'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (low === 'ts')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (low === 'ts') return 'typescript'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `low === 'py'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (low === 'py')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (low === 'py') return 'python'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `low === 'txt'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (low === 'txt')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (low === 'txt') return 'text'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `low === 'sh'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (low === 'sh')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (low === 'sh') return 'bash'
    return low
  }
  return markdown.replace(/```([a-zA-Z0-9_-]+)\n\s*([a-zA-Z0-9_-]+)\n/g, (match, lang1, lang2) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `norm(lang1) === norm(lang2)`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (norm(lang1) === norm(lang2))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (norm(lang1) === norm(lang2)) {
      return `\`\`\`${lang1}\n`
    }
    return match
  })
}

/**
 * [FUNCTION CONTRACT - Resolve Local Media URL]
 * - 역할: 로컬 파일 경로(절대 경로, file:/// 등)를 Electron의 커스텀 프로토콜 media:// 로 매핑 변환합니다.
 * - 예시: `resolveLocalMediaUrl("C:\\video.mp4")` -> `"media://C:/video.mp4"`
 */
export function resolveLocalMediaUrl(url: string): string {
  if (!url) return url
  // 만약 이미 http, https, data: 등 원격/인라인 리소스라면 그대로 반환
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  // file:/// 로 시작하는 경우
  if (url.startsWith('file:///')) {
    return url.replace('file:///', 'media://')
  }
  // Windows 절대 경로 (예: C:\Users\...) 또는 Unix 절대 경로 (예: /Users/...)
  if (/^[a-zA-Z]:\\/.test(url) || url.startsWith('\\\\') || url.startsWith('/')) {
    const normalized = url.replace(/\\/g, '/')
    return `media://${normalized}`
  }
  return url
}

/**
 * [FUNCTION CONTRACT - Convert Local Paths to Media Schema]
 * - 역할: 텍스트 내에 기재된 로컬 경로들을 media:// 스키마로 치환합니다.
 * - 예시: `convertLocalPathsToMediaSchema(...)` 호출 시 로드된 본문의 절대경로를 통일 치환.
 */
export function convertLocalPathsToMediaSchema(text: string): string {
  if (!text) return text
  let result = text
  
  // 1) file:/// -> media:// 변환
  result = result.replace(/file:\/\/\//g, 'media://')

  // 2) 마크다운 구문 속 윈도우 절대 경로 변환
  result = result.replace(/(!\[[^\]]*\]\()([a-zA-Z]:\\[^\)]+)(\))/g, (match, prefix, winPath, suffix) => {
    const normalized = winPath.replace(/\\/g, '/')
    return `${prefix}media://${normalized}${suffix}`
  })

  // 3) HTML src 구문 속 윈도우 절대 경로 변환
  result = result.replace(/(src=")([a-zA-Z]:\\[^"]+)(")/g, (match, prefix, winPath, suffix) => {
    const normalized = winPath.replace(/\\/g, '/')
    return `${prefix}media://${normalized}${suffix}`
  })

  return result
}

/**
 * [FUNCTION CONTRACT - Convert Media Schema to Local Paths]
 * - 역할: 텍스트 내의 media:// 스키마들을 원래 로컬 경로(file:///) 형식으로 복원하여 저장합니다.
 * - 예시: `convertMediaSchemaToLocalPaths(...)` 호출 시 media:// 스키마가 복원된 순수 마크다운 생성.
 */
export function convertMediaSchemaToLocalPaths(text: string): string {
  if (!text) return text
  return text.replace(/media:\/\//g, 'file:///')
}

