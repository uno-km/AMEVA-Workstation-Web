/**
 * @file useAppEditorInit.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/hooks/app/useAppEditorInit.ts
 * @role Editor instance lifecycle factory & Welcome document injector Hook
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - BlockNoteEditor 스펙에 맞게 WYSIWYG 에디터 인스턴스(activeEditor)를 실시간 빌드 기동한다.
 * - 협업 세션 조건(`ydoc`, `provider`, `isActive`) 충족 시, Yjs CRDT XMLFragment 프레임과 캐럿 정보(username, color)를 엮은 협업용 에디터로 자동 맵 구성한다.
 * - 최초 부팅 시, 예시 데이터가 포함된 화려한 가이드 마크다운(`welcomeMD`) 본문을 로컬 문서 탭 영역에 기본 주입한다.
 * - 에디터 준비 완료 후 Electron 주 프로세스로 메인 윈도우 팝업 완료 신호(`ipc.appReady()`)를 방출한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 에디터 파일 이미지 업로드 시 로컬 VFS 스토리지 복사 (useNativeUploadIntercept가 담당).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT load welcome template repeatedly: 탭이 이동되거나 리액트 상태가 바뀔 때 웰컴 마크다운이 반복 유입되는 것을 가드하기 위해,
 *   반드시 `isInitialLoad.current` 레퍼런스를 락 플래그로 활용하여 평생 단 1회만 초기 웰컴 가이드가 들어가도록 통제할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useEffect: 에디터 팩토리 빌드를 최초 1회 트리거하기 위한 라이프사이클 훅.
 * - useRef: 웰컴 문서 중복 인젝션을 차단(isInitialLoad)하기 위한 Mutable 참조 훅.
 */
import { useEffect, useRef } from 'react'

/* 
 * [BLOCKNOTE CORE BUILDER]
 * - BlockNoteEditor: 블록노트 WYSIWYG 에디터를 기동 생성하기 위한 코어 팩토리.
 */
import { BlockNoteEditor } from "@blocknote/core"

/* 
 * [CUSTOM BLOCK SCHEMAS]
 * - schema: Jupyter 코드블록, Live HTML Sandbox, Drawing 캔버스를 포함한 AMEVA 커스텀 스키마.
 * - AppEditor: 스키마가 반영된 최종 에디터 타입 시그니처.
 */
import { en as localeEn } from '@blocknote/core/locales'
import { Code, PenTool, Link, Video, Map, Presentation, Table, Kanban, FileText } from 'lucide-react'
import { amevaSchema as schema, type AmevaEditor as AppEditor } from '../../editor/amevaBlockSchema'

// 커스텀 블록 Dictionary 확장을 통해 드래그 핸들(::) 메뉴 렌더링 시 React #130 에러(아이콘 undefined) 방지
const customDictionary = {
  ...localeEn,
  slash_menu: {
    ...localeEn.slash_menu,
    jupyter: { title: 'Jupyter Code', subtext: 'Interactive code block', aliases: ['jupyter', 'code'], group: 'AMEVA', icon: Code },
    drawing: { title: 'Drawing Canvas', subtext: 'Excalidraw canvas', aliases: ['drawing', 'canvas'], group: 'AMEVA', icon: PenTool },
    linkPreview: { title: 'Link Preview', subtext: 'URL preview card', aliases: ['link', 'url'], group: 'AMEVA', icon: Link },
    youtube: { title: 'YouTube Video', subtext: 'Embed YouTube video', aliases: ['youtube', 'video'], group: 'AMEVA', icon: Video },
    map: { title: 'Interactive Map', subtext: 'OpenStreetMap embed', aliases: ['map', 'location'], group: 'AMEVA', icon: Map },
    presentation: { title: 'Presentation', subtext: 'Slide deck', aliases: ['pptx', 'slides'], group: 'AMEVA', icon: Presentation },
    excel: { title: 'Excel Table', subtext: 'Spreadsheet', aliases: ['excel', 'table'], group: 'AMEVA', icon: Table },
    kanban: { title: 'Kanban Board', subtext: 'Task board', aliases: ['kanban', 'board'], group: 'AMEVA', icon: Kanban },
    inlineDocument: { title: 'Inline Document', subtext: 'PDF/Word viewer', aliases: ['pdf', 'document'], group: 'AMEVA', icon: FileText },
  }
} as any
import * as ipc from '../../services/ipc/electronApiAdapter'
import { resolveLocalMediaUrl } from '../../utils/markdownUtils'

/**
 * 웰컴 카드 뷰 포화 시 출력할 기본 프론트 페이지 헤더 마크다운 리터럴.
 */
const DEFAULT_WELCOME_TEXT = `# 🚀 AMEVA Workstation

(AMEVA-OS WebAssembly Kernel & AI Hub)

이곳에서 문서 작성, 코드 실행, 파일 시스템 탐색을 할 수 있습니다.`;

/**
 * @hook useAppEditorInit
 * @description 에디터 빌드 팩토리 및 협업 세션 바인딩, 웰컴 가이드 문서 이식을 총 조율하는 훅.
 */
export function useAppEditorInit({
  /*
   * [HOOK CONFIG PARAMETERS]
   * - ydoc: Yjs CRDT 공유 문서 인스턴스.
   * - provider: WebSocket/WebRTC 동시 편집 채널 제공자.
   * - isActive: 현재 협업 방 가동 여부 플래그.
   * - username: 로컬 유저 닉네임.
   * - userColor: 유저 캐럿 식별 색상.
   * - setEditor: 에디터 인스턴스 보존용 세터.
   * - setCurrentContent: 원문 버퍼 갱신용 세터.
   */
  ydoc,
  provider,
  isActive,
  username,
  userColor,
  setEditor,
  setCurrentContent,
}: {
  ydoc: any
  provider: any
  isActive: boolean
  username: string
  userColor: string
  setEditor: (editor: AppEditor | null) => void
  setCurrentContent: (content: string) => void
}): { DEFAULT_WELCOME_TEXT: string } {
  /*
   * [INVARIANT - Welcome Load Lock Reference]
   * - isInitialLoad: 웰컴 마크다운 중복 인젝션을 차단하여 사용자 수정본이 덮어씌워지는 참사를 막기 위한 락 레퍼런스.
   */
  const isInitialLoad = useRef(true)

  /**
   * [SIDE EFFECT - Build Editor Instance]
   * - Rationale: 협업 플래그 활성화 유무에 따라 인스턴스를 다르게 분기 생성하고, 초기 마운트 시 웰컴 문서를 세팅한다.
   */
  useEffect(() => {
    console.log("useAppEditorInit: initializing editor", { ydoc, provider, isActive, username, userColor })
    /*
     * [LOCAL VARIABLES]
     * - activeEditor: 빌드 완료된 에디터 인스턴스 임시 보존 변수.
     */
    let activeEditor: AppEditor

    // 파일 업로드 요청 시 브라우저 FileReader API를 통해 base64 DataURL로 변환해 리턴하는 이너 헬퍼
    const uploadFileHandler = async (file: File): Promise<string> => {
      // [FEAT-PPTX-COMPILER] PPTX 파일 업로드 인터셉트 처리
      if (file && (file as any).path && (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt'))) {
        const pptxPath = (file as any).path

        if (typeof window !== 'undefined' && window.electronAPI?.processPptx) {
          // 백그라운드 컴파일 트리거
          window.electronAPI.processPptx(pptxPath).then((res) => {
            if (res.success && activeEditor) {
              const currentBlock = activeEditor.getTextCursorPosition()
              activeEditor.insertBlocks(
                [
                  {
                    type: 'presentation',
                    props: {
                      pptxPath: pptxPath.replace(/\\/g, '/'),
                      slides: res.slides.map((s: string) => `media://${s}`).join(','),
                      fallback: res.fallback,
                      slidesText: JSON.stringify(res.slides_text || [])
                    }
                  } as any
                ],
                currentBlock as any,
                'after'
              )
            } else if (!res.success) {
              console.error('[PPTX 컴파일 실패]:', res.error)
              if (window.electronAPI?.showMessageBox) {
                window.electronAPI.showMessageBox({
                  type: 'error',
                  title: 'PPTX 변환 실패',
                  message: `프레젠테이션 컴파일 중 오류가 발생했습니다.\n${res.error}`
                })
              }
            }
          }).catch(e => {
            console.error('[PPTX 컴파일 오류]:', e)
          })
        }

        // 순정 미디어 블록 삽입을 우회하기 위한 특수 식별자 반환
        return 'media://presentation-placeholder'
      }

      // [FEAT-MEDIA-UPLOAD-PATH] Electron 환경이고, file.path(실제 물리 경로)가 제공되는 경우 로컬 프로토콜로 직접 바인딩
      // DataURL로 대용량 미디어를 변환할 경우 렉 유발 및 Chromium 재생 제한이 발생하므로 이를 우회함
      if (file && (file as any).path) {
        const resolved = resolveLocalMediaUrl((file as any).path)
        return resolved
      }

      return new Promise((resolve, reject) => {
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `reader`
         * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
         * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
         * - 예시 코드: `const reader = ...` 형태로 안전 캐싱 후 가공 기동.
         */
        const reader = new FileReader()
        reader.onload = () => {
          /*
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: `typeof reader.result === 'string') resolve(reader.result`
           * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
           * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
           * - 예시: `if (typeof reader.result === 'string') resolve(reader.result)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
           */
          if (typeof reader.result === 'string') resolve(reader.result)
          else reject(new Error('파일 읽기 실패'))
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
    }

    // 1. 실시간 Yjs 협업 구동 조건 시, collaboration 프롭스를 포함하여 인스턴스 생성
    if (ydoc && provider && isActive) {
      activeEditor = BlockNoteEditor.create({
        schema,
        dictionary: customDictionary,
        collaboration: {
          provider,
          fragment: ydoc.getXmlFragment('document-store'),
          user: { name: username, color: userColor },
        },
        uploadFile: uploadFileHandler,
      })
    }
    // 2. 단독 편집(Offline) 조건 시, 기본 스키마만 엮어 생성
    else {
      activeEditor = BlockNoteEditor.create({
        schema,
        dictionary: customDictionary,
        uploadFile: uploadFileHandler,
      })
    }

    // 전역 상태에 에디터 이식
    setEditor(activeEditor)

    // 3. 최초 부팅 단계인 경우 가이드 웰컴 마크다운(welcomeMD) 주입
    if (isInitialLoad.current && (!isActive || !provider)) {
      isInitialLoad.current = false
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `welcomeMD`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const welcomeMD = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const welcomeMD = `# 🚀 AMEVA Workstation

차세대 AI 기반 통합 협업 워크스테이션에 오신 것을 환영합니다!

## ✨ 주요 기능

1. **AI 어시스턴트**: 우측 상단 ✨ 버튼으로 로컬 LLM AI 패널을 열어보세요.
2. **실시간 협업**: 사이드바 협업 탭에서 서버를 시작하고 동료와 함께 편집하세요.
3. **실시간 채팅**: 협업 연결 후 채팅 탭에서 실시간 메시지를 주고받을 수 있습니다.
4. **코드 실행**: 코드 블록에서 JavaScript, Python, SQL, HTML을 직접 실행할 수 있습니다.
5. **포맷 변환**: PDF, Word, Excel, PPT, 한글 HWPX 등으로 내보낼 수 있습니다.

---

### 🗄️ 가상 SQLite WASM 데이터베이스 예시
일렉트론 메모리상에 상주하는 가상 SQLite DB입니다. SELECT 실행 시 예쁜 반응형 그리드 테이블로 즉시 표출됩니다!

\`\`\`sql
-- 임시 테이블 생성 및 가상 데이터 삽입
CREATE TABLE IF NOT EXISTS developers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  role TEXT,
  level TEXT
);
DELETE FROM developers;

INSERT INTO developers (name, role, level) VALUES 
('Antigravity', 'AI Assistant', 'Legendary'),
('User', 'Fullstack Developer', 'Senior'),
('Explorer', 'WASM Specialist', 'Junior');

-- 데이터 쿼리 조회 (결과가 표로 렌더링됩니다!)
SELECT * FROM developers;
\`\`\`

---

### 📝 다채로운 서식 도구들 (Basic Blocks)
AMEVA 에디터는 단순한 텍스트 편집을 넘어 다양한 서식을 제공합니다. 슬래시(\`/\`) 키를 눌러 메뉴를 열어보세요.

> **인용구 (Quote)**: 중요한 문구나 강조하고 싶은 텍스트를 인용구 블록으로 표시할 수 있습니다. 템플릿이나 캔버스 등 다른 서식과 조합해 더욱 다채롭게 작성해보세요!

- [x] 할 일 관리 (Check List) 1단계 완료
- [ ] 다음 목표: 프리미엄 플러그인 구독 활성화
- [ ] Kanban & Excel 연동 확인하기

---

### 📈 칸반 보드 (Kanban Board)
지라(Jira) 스타일의 AI 협업 칸반 보드를 삽입하여 팀의 워크플로우를 시각화하고 업무를 관리할 수 있습니다.

\`\`\`ameva-kanban
{"columns":[{"id":"col-1","title":"To Do","cards":[{"id":"card-1","title":"기획안 작성"},{"id":"card-2","title":"디자인 시안 검토"}]},{"id":"col-2","title":"In Progress","cards":[{"id":"card-3","title":"프론트엔드 개발"}]},{"id":"col-3","title":"Done","cards":[{"id":"card-4","title":"서버 인프라 구축"}]}]}
\`\`\`

### 📊 엑셀 시트 (Excel Spreadsheet)
강력한 스프레드시트 편집기를 문서 내에 삽입하여 재무 관리, 데이터 분석, 표 작업을 수행할 수 있습니다.

\`\`\`ameva-excel
[{"name":"Sheet1","celldata":[{"r":0,"c":0,"v":{"v":"종목명","m":"종목명"}},{"r":0,"c":1,"v":{"v":"현재가","m":"현재가"}},{"r":0,"c":2,"v":{"v":"등락률","m":"등락률"}},{"r":1,"c":0,"v":{"v":"AMEVA","m":"AMEVA"}},{"r":1,"c":1,"v":{"v":"150000","m":"150000"}},{"r":1,"c":2,"v":{"v":"+5.2%","m":"+5.2%"}}],"status":1}]
\`\`\`

---

### 🎨 Live HTML 샌드박스 렌더러 예시
HTML/CSS/JS로 만든 화려한 웹 컴포넌트 프리뷰를 격리된 샌드박스 안에서 즉시 실시간 렌더링하여 확인합니다.

\`\`\`html
<div style="
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 12px;
  color: white;
  text-align: center;
  font-family: sans-serif;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
">
  <h2 style="margin:0 0 10px 0;">🎉 AMEVA Live Sandbox</h2>
  <p style="opacity:0.9; margin: 0 0 20px 0;">격리된 iframe 위에서 HTML/CSS가 실시간 작동합니다!</p>
  <button onclick="alert('반갑습니다! 실시간 샌드박스 버튼입니다.')" style="
    background: white;
    color: #764ba2;
    border: none;
    padding: 10px 24px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  ">클릭해 보세요</button>
</div>
\`\`\`

### 💻 JavaScript 실행 예시

\`\`\`javascript
// JavaScript 실행 테스트
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('합계:', sum)
console.log('평균:', sum / nums.length)
\`\`\`

### 📊 Mermaid 다이어그램

\`\`\`mermaid
graph TD
    A[사용자] --> B[AMEVA Workstation]
    B --> C[AI 어시스턴트]
    B --> D[실시간 협업]
    B --> E[문서 변환]
    C --> F[로컬 LLM]
    D --> G[Y.js CRDT]
\`\`\`

### 🗺️ 인터랙티브 지도 (OpenStreetMap)
문서 내에 실제 지도를 삽입하고 위치 정보를 기록 및 공유할 수 있습니다. 성남장안초등학교 위치가 찍힌 예시입니다.

\`\`\`ameva-map
{"lat":"37.4042","lng":"127.1472","zoom":"17","locationName":"성남장안초등학교","memo":"이곳이 성남장안초등학교입니다."}
\`\`\`

### 📺 YouTube 플레이어
유튜브 동영상을 문서 내에서 직접 재생하거나 플로팅 화면(PIP)으로 띄워놓고 작업할 수 있습니다.

\`\`\`ameva-youtube
{"url":"https://www.youtube.com/watch?v=UOxkGD8qRB4","videoId":"UOxkGD8qRB4","title":"Golden - HUNTR/X (K-Pop Demon Hunters OST)","description":"넷플릭스 애니메이션 영화 'K-Pop Demon Hunters (케데헌)'의 글로벌 히트곡 'Golden' 공식 리릭 비디오입니다!","thumbnail":""}
\`\`\`

### 🔗 링크 미리보기 (Link Preview)
웹사이트 링크를 깔끔한 카드 형태로 렌더링하여 보여줍니다. (프레젠테이션 모드에서는 팝업 iframe 창으로 사이트를 함께 띄워줍니다!)

\`\`\`ameva-link
{"url":"https://uno-km.github.io/AMEVA-Workstation/","title":"AMEVA Workstation 공식 사이트","description":"차세대 AI 기반 통합 협업 워크스테이션 AMEVA의 공식 소개 페이지입니다.","thumbnail":""}
\`\`\`
`
      setCurrentContent(welcomeMD)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (ipc.isElectronEnv()) {
        ipc.appReady()
      }
    } else {
      // 웰컴 인젝션을 스킵하더라도, 앱 로딩이 완료되었음을 Electron에 통보
      if (ipc.isElectronEnv()) {
        ipc.appReady()
      }
    }
  }, [ydoc, provider, isActive, username, userColor, setCurrentContent, setEditor])

  return { DEFAULT_WELCOME_TEXT }
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 기본 웰컴 가이드 마크다운을 개편하거나 변경하고자 할 때:
 *    - `welcomeMD` 마크다운 템플릿 문자열을 개정할 것.
 *    - 코드블록 내의 이스케이프 백틱 구문 형식을 해치지 않도록 각별히 유의할 것.
 * ============================================================================
 */

