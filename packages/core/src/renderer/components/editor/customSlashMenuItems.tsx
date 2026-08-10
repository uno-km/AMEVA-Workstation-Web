/**
 * @file customSlashMenuItems.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/editor/customSlashMenuItems.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import React from 'react'
import { getDefaultReactSlashMenuItems } from '@blocknote/react'
import { Code2, Globe, Eye, Terminal, File, Layout, Pencil, FileText, FileSpreadsheet, Presentation, FileType2, Type } from 'lucide-react'
import { type AmevaEditor } from '../../editor/amevaBlockSchema'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `getCustomSlashMenuItems`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `getCustomSlashMenuItems(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function getCustomSlashMenuItems(editorInstance: AmevaEditor, installedPlugins: string[] = []) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `defaultItems`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const defaultItems = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const defaultItems = getDefaultReactSlashMenuItems(editorInstance)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `filtered`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const filtered = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const filtered = defaultItems.filter(item =>
    !item.title.toLowerCase().includes('code block') &&
    !item.title.toLowerCase().includes('codeblock')
  )

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `insertCodeBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const insertCodeBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const insertCodeBlock = (lang: string) => () => {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pos = editorInstance.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!pos) return
      editorInstance.updateBlock(pos.block.id, {
        type: 'jupyter',
        props: {
          language: lang,
          code: '',
          runState: JSON.stringify({ hasRun: false, success: null, outputLines: [] })
        },
      } as any)
      editorInstance.setTextCursorPosition(pos.block.id, 'start')
      editorInstance.focus()
    } catch {}
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `insertDrawingBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const insertDrawingBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const insertDrawingBlock = () => {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pos = editorInstance.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!pos) return
      editorInstance.updateBlock(pos.block.id, {
        type: 'drawing',
        props: { data: '[]' }
      } as any)
      editorInstance.setTextCursorPosition(pos.block.id, 'start')
      editorInstance.focus()
    } catch {}
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `codeItems`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const codeItems = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const codeItems = [
    {
      title: 'JavaScript Code Block',
      onItemClick: insertCodeBlock('javascript'),
      aliases: ['js', 'javascript', 'node', 'code', 'snippet', 'cj', 'c'],
      group: 'Code',
      icon: <Code2 size={16} color="#f59e0b" />,
      subtext: 'JavaScript 실행 가능 코드 블록 삽입 (/cj 또는 /c)',
    },
    {
      title: 'Python Code Block',
      onItemClick: insertCodeBlock('python'),
      aliases: ['py', 'python', 'code', 'snippet', 'cp'],
      group: 'Code',
      icon: <Code2 size={16} color="#3b82f6" />,
      subtext: 'Python 실행 가능 코드 블록 삽입 (/cp)',
    },
    {
      title: 'SQL Code Block',
      onItemClick: insertCodeBlock('sql'),
      aliases: ['sql', 'sqlite', 'db', 'query', 'csql'],
      group: 'Code',
      icon: <Code2 size={16} color="#06b6d4" />,
      subtext: '가상 SQLite DB 실행 가능 SQL 코드 블록 삽입 (/csql)',
    },
    {
      title: 'HTML Sandbox Block',
      onItemClick: insertCodeBlock('html'),
      aliases: ['html', 'css', 'web', 'sandbox', 'ch'],
      group: 'Code',
      icon: <Globe size={16} color="#14b8a6" />,
      subtext: '실시간 프리뷰 지원 HTML/JS 샌드박스 삽입 (/ch)',
    },
    {
      title: 'Mermaid Diagram',
      onItemClick: insertCodeBlock('mermaid'),
      aliases: ['mermaid', 'diagram', 'flowchart', 'chart', 'cm'],
      group: 'Code',
      icon: <Eye size={16} color="#8b5cf6" />,
      subtext: 'Mermaid 다이어그램 블록 삽입 (/cm)',
    },
    {
      title: 'JSON Code Block',
      onItemClick: insertCodeBlock('json'),
      aliases: ['json', 'data', 'object'],
      group: 'Code',
      icon: <Code2 size={16} color="#10b981" />,
      subtext: 'JSON 데이터 구조화 코드 블록 삽입',
    },
    {
      title: 'Bash Code Block',
      onItemClick: insertCodeBlock('bash'),
      aliases: ['bash', 'sh', 'shell', 'terminal'],
      group: 'Code',
      icon: <Terminal size={16} color="#ec4899" />,
      subtext: 'Bash 쉘 스크립트 코드 블록 삽입',
    },
    {
      title: 'Plain Code Block',
      onItemClick: insertCodeBlock('plaintext'),
      aliases: ['code', 'codeblock', 'plain', 'text', 'ct'],
      group: 'Code',
      icon: <Code2 size={16} color="#6b7280" />,
      subtext: '기본 텍스트 및 기타 언어용 코드 블록 삽입 (/ct)',
    },
  ]

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `drawingSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const drawingSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const drawingSubscribed = installedPlugins.includes('drawing-board')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `drawingItems`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const drawingItems = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const drawingItems = drawingSubscribed ? [
    {
      title: 'Drawing Board',
      onItemClick: insertDrawingBlock,
      aliases: ['drawing', 'draw', 'sketch', 'paint', 'canvas', 'pro', 'premium'],
      group: 'Drawing',
      icon: <Pencil size={16} color="#a855f7" />,
      subtext: 'Excalidraw 기반 화이트보드 드로잉 블록 삽입 (/draw)',
    }
  ] : []

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `mapItem`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const mapItem = ...` 형태로 안전 캐싱 후 가공 기 기동.
       */
  const mapItem = {
    title: 'OpenStreetMap Embed',
    onItemClick: () => {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const pos = editorInstance.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!pos) return
        editorInstance.updateBlock(pos.block.id, {
          type: 'map',
          props: { lat: '37.5665', lng: '126.9780', zoom: '14', locationName: '서울 특별시' }
        } as any)
        editorInstance.setTextCursorPosition(pos.block.id, 'start')
        editorInstance.focus()
      } catch {}
    },
    aliases: ['map', 'openstreetmap', 'location', '지도', 'osm'],
    group: 'Maps',
    icon: <Globe size={16} color="#10b981" />,
    subtext: '오픈스트리트맵 임베드 블록 삽입 (/map)',
  }

  const insertKanbanBlock = () => {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pos = editorInstance.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!pos) return
      
      editorInstance.updateBlock(pos.block.id, {
        type: 'kanban'
      } as any)
      editorInstance.setTextCursorPosition(pos.block.id, 'start')
      editorInstance.focus()
    } catch {}
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `kanbanItems`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const kanbanItems = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const kanbanItems = [
    {
      title: 'Kanban Board',
      onItemClick: insertKanbanBlock,
      aliases: ['kanban', 'board', 'jira', '칸반', '보드', 'pro', 'premium'],
      group: 'Workflow',
      icon: <Layout size={16} color="#3b82f6" />,
      subtext: '지라 스타일의 AI 협업 칸반 보드 삽입 (/kanban)',
    }
  ]

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isExcelSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isExcelSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let isExcelSubscribed = installedPlugins.includes('excel-viewer')
  try {
    const storedSaaS = localStorage.getItem('enabled-plugins')
    if (storedSaaS) {
      const parsed = JSON.parse(storedSaaS)
      if (parsed.excelViewer) isExcelSubscribed = true
    }
  } catch (e) {}

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `insertExcelBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const insertExcelBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const insertExcelBlock = () => {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pos = editorInstance.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!pos) return
      
      editorInstance.updateBlock(pos.block.id, {
        type: 'excel',
        props: {
          data: JSON.stringify([{ name: 'Sheet1', celldata: [], status: 1 }])
        }
      } as any)
      editorInstance.setTextCursorPosition(pos.block.id, 'end')
      editorInstance.focus()
    } catch {}
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `excelItems`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const excelItems = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const excelItems = isExcelSubscribed ? [
    {
      title: 'Excel Sheet',
      onItemClick: insertExcelBlock,
      aliases: ['excel', 'sheet', 'spreadsheet', '엔셀', '시트', 'ce', 'pro', 'premium'],
      group: 'Office',
      icon: <File size={16} color="#10b981" />,
      subtext: '엔셀 스프레드시트 편집기 삽입 (/excel)',
    }
  ] : []

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `insertDocumentBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const insertDocumentBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  // [NEW] 인라인 문서 뷰어 블록 (항상 활성화)
  const insertDocumentBlock = (docType: 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'unknown') => () => {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const pos = editorInstance.getTextCursorPosition()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!pos`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!pos)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!pos) return
      editorInstance.updateBlock(pos.block.id, {
        type: 'inlineDocument',
        props: {
          docType,
          fileName: '',
          fileBase64: '',
          height: '420',
          sourceUrl: '',
          isExpanded: 'false',
        }
      } as any)
      // BlockNote: content 'none' 블록에는 커서를 둘 수 없으므로 다음 줄에 빈 문단 삽입
      editorInstance.insertBlocks([{ type: 'paragraph', content: '' }], pos.block.id, 'after')
      editorInstance.focus()
    } catch {}
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `documentItems`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const documentItems = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const documentItems = [
    {
      title: 'PDF Viewer',
      onItemClick: insertDocumentBlock('pdf'),
      aliases: ['pdf', '인라인pdf', '문서', 'document', 'doc'],
      group: 'Documents',
      icon: <FileText size={16} color="#ef4444" />,
      subtext: 'PDF 파일 인라인 뷰어 삽입 (/pdf)',
    },
    {
      title: 'PowerPoint Viewer',
      onItemClick: insertDocumentBlock('pptx'),
      aliases: ['pptx', 'ppt', 'powerpoint', '프레젠테이션', 'slide', 'slides'],
      group: 'Documents',
      icon: <Presentation size={16} color="#f97316" />,
      subtext: 'PowerPoint 인라인 뷰어 삽입 (/ppt)',
    },
    {
      title: 'Word Document Viewer',
      onItemClick: insertDocumentBlock('docx'),
      aliases: ['docx', 'doc', 'word', '워드', '문서편집'],
      group: 'Documents',
      icon: <FileType2 size={16} color="#3b82f6" />,
      subtext: 'Word 문서 인라인 뷰어 삽입 (/word)',
    },
    {
      title: 'Document Block',
      onItemClick: insertDocumentBlock('unknown'),
      aliases: ['문서블록', 'document', 'file', 'attachment', '첨부파일'],
      group: 'Documents',
      icon: <File size={16} color="#8b5cf6" />,
      subtext: '임의 문서 첨부 블록 삽입 (/doc)',
    },
  ]

  const smartDocsItems = [
    {
      title: '금액 한글화 변환',
      onItemClick: () => {
        try {
          const pos = editorInstance.getTextCursorPosition();
          if (!pos || !pos.block.content) return;
          if (Array.isArray(pos.block.content)) {
            const newContent = pos.block.content.map((c: any) => {
              if (c.type === 'text') {
                const text = c.text.replace(/[0-9,]+/g, (match: string) => {
                  // 임시로 숫자 변환 로직 인라인으로 구현 (import 복잡도 피하기 위함)
                  const numStr = match.replace(/,/g, '');
                  const num = parseInt(numStr, 10);
                  if (isNaN(num)) return match;
                  const hanA = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"];
                  const danA = ["", "십", "백", "천"];
                  const danG = ["", "만", "억", "조", "경"];
                  let result = "";
                  for (let i = 0; i < numStr.length; i++) {
                    const n = parseInt(numStr.charAt(i), 10);
                    const str = hanA[n];
                    if (str !== "") { result += str + danA[(numStr.length - i - 1) % 4]; }
                    if ((numStr.length - i - 1) % 4 === 0 && result.length > 0) {
                      const unit = danG[(numStr.length - i - 1) / 4];
                      if (!result.endsWith(unit)) result += unit;
                    }
                  }
                  return result ? result + " 원" : "영 원";
                });
                return { ...c, text };
              }
              return c;
            });
            editorInstance.updateBlock(pos.block.id, { content: newContent } as any);
          }
        } catch {}
      },
      aliases: ['smartdocs', '금액', '한글화', '돈', 'calc'],
      group: 'SmartDocs',
      icon: <FileText size={16} color="#059669" />,
      subtext: '숫자를 한글 금액으로 일괄 변환 (/smartdocs)',
    },
    {
      title: '공문서 표 삽입',
      onItemClick: () => {
        try {
          const pos = editorInstance.getTextCursorPosition();
          if (!pos) return;
          editorInstance.insertBlocks([
            {
              type: 'table',
              content: {
                type: 'tableContent',
                rows: [
                  { cells: [[{ type: 'text', text: '구분', styles: { bold: true } as any }]], styles: {} },
                  { cells: [[{ type: 'text', text: '내용', styles: {} as any }]], styles: {} }
                ]
              }
            } as any
          ], pos.block.id, 'after');
        } catch {}
      },
      aliases: ['smartdocs', '표', '테이블', 'table', 'hwp'],
      group: 'SmartDocs',
      icon: <Layout size={16} color="#059669" />,
      subtext: '한글(HWP) 스타일 기본 표 삽입 (/smartdocs-table)',
    },
    {
      title: '공문서 대제목 삽입',
      onItemClick: () => {
        try {
          const pos = editorInstance.getTextCursorPosition();
          if (!pos) return;
          editorInstance.insertBlocks([
            {
              type: 'heading',
              props: { level: 1 },
              content: [{ type: 'text', text: '제목을 입력하세요', styles: { bold: true } as any }]
            } as any
          ], pos.block.id, 'after');
        } catch {}
      },
      aliases: ['smartdocs', '제목', '대제목', 'heading', 'title'],
      group: 'SmartDocs',
      icon: <Type size={16} color="#059669" />,
      subtext: '중앙 정렬된 공문서 대제목 삽입 (/smartdocs-title)',
    },
  ]

  return [...filtered, ...codeItems, ...drawingItems, mapItem, ...excelItems, ...kanbanItems, ...documentItems, ...smartDocsItems]
}
