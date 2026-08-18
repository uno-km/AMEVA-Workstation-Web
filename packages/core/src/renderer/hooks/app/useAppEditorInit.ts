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
import { Code, PenTool, Link, Video, Map, Presentation, Table, Kanban, FileText } from 'lucide-react'
import type { AmevaEditor as AppEditor } from '../../editor/amevaBlockSchema'
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

    // 동적 임포트로 초기 로딩 속도를 최적화
    const initEditorAsync = async () => {
      const { BlockNoteEditor } = await import('@blocknote/core')
      const { en: localeEn } = await import('@blocknote/core/locales')
      const { amevaSchema: schema } = await import('../../editor/amevaBlockSchema')

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
        }) as AppEditor
      }
      // 2. 단독 편집(Offline) 조건 시, 기본 스키마만 엮어 생성
      else {
        activeEditor = BlockNoteEditor.create({
          schema,
          dictionary: customDictionary,
          uploadFile: uploadFileHandler,
        }) as AppEditor
      }

      // 전역 상태에 에디터 이식
      setEditor(activeEditor)
      import('../../stores/useWorkspaceStore').then(({ useWorkspaceStore }) => {
        useWorkspaceStore.getState().setActiveEditorInstance(activeEditor);
      });
      import('../../features/ai-agent/adapters/EditorToolAdapter').then(({ editorToolAdapter }) => {
        editorToolAdapter.setEditor(activeEditor);
      });
    }

    initEditorAsync().catch(console.error)

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

> ⚠️ **웹 버전 제한 안내 및 데스크톱 앱 설치 권장**  
> 현재 접속하신 웹 버전에서는 **로컬 AI 모델 구동, 로컬 파일 시스템 직접 접근** 등 일부 네이티브 워크스테이션 기능이 제한됩니다.  
> AMEVA의 모든 강력한 기능을 제한 없이 사용하시려면 하단 상태바의 **Help (또는 About)** 메뉴에서 **[데스크톱 앱 설치/안내 보기]** 버튼을 클릭하여 데스크톱 앱을 설치해보세요!

---

### 🆕 [2026-08-18 메이저 업데이트] 🤖 AMEVA 로컬 AI 에이전트 & GraphRAG & 스마트 오피스 뷰어 전격 출시!
- **⚡ 100% 프라이빗 WebGPU 로컬 AI 에이전트 (\`Qwen2.5-3B-Instruct\`):**
  - 외부 클라우드 API 키나 유료 구독 없이, 사용자 PC 브라우저의 GPU(WebGPU)에서 **100% 로컬 프라이빗으로 동작**하는 초경량·고성능 AI 챗봇이 탑재되었습니다.
  - **4대 퀵 액션 버튼**: **\`📝 3줄 요약\`**, **\`✨ 문장/톤 개선\`**, **\`🔍 RAG 질의\`**, **\`📊 표 정리\`** 원클릭 실행.
  - **사고 과정(\`<think>\` CoT)** 시각화 및 에디터 **\`[✓ 에디터에 삽입]\`** 제안 카드 연동!
- **🕸️ 하이브리드 RAG & 지식 그래프 (GraphRAG):**
  - 단순 키워드 검색을 넘어, **Vector Cosine 유사도 + Reciprocal Rank Fusion (RRF)** 및 문서 내 엔티티 관계를 추출하는 **지식 그래프(GraphRAG)**를 융합하여 장문 보고서도 정확하게 분석합니다.
  - **초고속 시맨틱 캐시(Semantic Cache)**: 동일/유사 질문은 0.001초 만에 즉각 응답!
- **📑 차세대 오피스 & PDF A4 조판 뷰어 및 문서 검색 (\`Ctrl+Shift+F\`):**
  - Word(\`.docx\`), HWPX(\`.hwpx\`), Excel(\`.xlsx\`), PDF 파일을 마크다운 변환 시 깨짐 없이 **실제 인쇄용 A4 규격(\`📄 1 / 17 페이지\`) 및 목차(TOC)**로 완벽 렌더링합니다.
  - **\`[ 📑 A4 내장 뷰어 ] ↔ [ 🖥️ 브라우저 뷰어 ]\`** 실시간 듀얼 뷰어 모드 스위칭 지원.
  - **문서 내 실시간 단어 하이라이트 & 점프 탐색 (\`Ctrl+Shift+F\`)** 및 목차 클릭 시 해당 섹션 부드러운 스크롤 이동 지원.
- **🛡️ 리치 마크다운 블록(PDF, 지도, 칸반, 드로잉 등) 삭제 보호 모달:**
  - 작업 중 실수로 백스페이스나 삭제 버튼을 눌러 소중한 블록이 지워지지 않도록 **통합 컨펌 모달(ConfirmModal)**과 \`Enter\`(예)/\`Esc\`(아니오) 키보드 UX를 탑재했습니다.

---

### 🎬 인터랙티브 튜토리얼: AMEVA AI 에이전트 & 실시간 에디터 삽입 시뮬레이션
우측 상단의 **[✨ AI 에이전트]** 패널과 퀵 액션 기능이 어떻게 유기적으로 동작하는지 아래 인터랙티브 애니메이션으로 한눈에 확인해보세요!

\`\`\`html
<div class="ai-demo-wrapper">
  <!-- Left Side: Markdown Document Area -->
  <div class="ai-demo-editor">
    <div class="demo-win-header">
      <span class="doc-icon">📄</span>
      <span class="doc-title">2026_신규_사업기획서.md</span>
    </div>
    <div class="demo-doc-body">
      <div class="doc-h3">1. 프로젝트 개요 및 핵심 목표</div>
      <p class="doc-p">본 프로젝트는 외부 클라우드 의존 없이 브라우저 GPU 가속을 통해 완벽한 데이터 보안을 보장하는 차세대 로컬 AI 워크스테이션을 구축합니다.</p>
      
      <!-- AI Inserted Result Block (Appears after click) -->
      <div class="demo-ai-inserted">
        <div class="inserted-head">✨ AMEVA AI 3줄 핵심 요약</div>
        <div class="inserted-item">1. 🚀 <b>WebGPU 로컬 추론:</b> 100% 프라이빗 브라우저 GPU 가속</div>
        <div class="inserted-item">2. 🕸️ <b>하이브리드 GraphRAG:</b> Vector + 지식 그래프 결합 정밀 분석</div>
        <div class="inserted-item">3. 📑 <b>원클릭 에디터 주입:</b> AI 분석 결과를 문서 블록으로 즉시 삽입</div>
      </div>
    </div>
  </div>

  <!-- Right Side: AI Agent Chat Panel -->
  <div class="ai-demo-panel">
    <div class="panel-head">
      <div class="head-left">
        <span class="bot-icon">🤖</span>
        <span class="bot-title">AMEVA AI Agent</span>
      </div>
      <span class="engine-tag">⚡ WebGPU 3B</span>
    </div>

    <div class="qa-bar">
      <span class="qa-pill qa-highlight">📝 3줄 요약</span>
      <span class="qa-pill">✨ 문장 개선</span>
      <span class="qa-pill">🔍 RAG 질의</span>
      <span class="qa-pill">📊 표 정리</span>
    </div>

    <div class="chat-area">
      <div class="user-msg">이 기획서의 핵심 내용을 3줄로 요약해줘!</div>
      
      <div class="ai-msg-box">
        <div class="think-badge">💭 &lt;think&gt; GraphRAG 문서 청크 및 엔티티 분석 완료</div>
        <div class="ai-msg-text">
          문서의 3대 핵심 요약입니다:
          <div class="ai-summary-lines">
            • 🚀 WebGPU 기반 100% 로컬 프라이빗 AI<br/>
            • 🕸️ 하이브리드 RAG & 지식 그래프 결합<br/>
            • 📑 원클릭 에디터 삽입 및 A4 뷰어 지원
          </div>
        </div>
        <div class="card-action-box">
          <span class="btn-insert-demo">✓ 에디터에 삽입</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Animated Virtual Cursor -->
  <div class="ai-virtual-cursor"></div>
</div>

<style>
.ai-demo-wrapper {
  position: relative;
  width: 100%;
  height: 420px;
  background: #0f111a;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #e2e8f0;
  display: flex;
  box-shadow: 0 12px 36px rgba(0,0,0,0.6);
  box-sizing: border-box;
}

/* Left Document */
.ai-demo-editor {
  flex: 1.1;
  background: #141724;
  border-right: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
}
.demo-win-header {
  padding: 10px 14px;
  background: #1a1e2e;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}
.demo-doc-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}
.doc-h3 {
  font-size: 15px;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 4px;
}
.doc-p {
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
  margin: 0;
}
.demo-ai-inserted {
  margin-top: 8px;
  padding: 12px 14px;
  background: rgba(16, 185, 129, 0.08);
  border-left: 3px solid #10b981;
  border-radius: 6px;
  opacity: 0;
  transform: translateY(10px);
  animation: insertDocAnimation 10s infinite;
}
.inserted-head {
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  margin-bottom: 6px;
}
.inserted-item {
  font-size: 11.5px;
  line-height: 1.5;
  color: #e2e8f0;
}

/* Right AI Panel */
.ai-demo-panel {
  flex: 0.9;
  background: #0f111a;
  display: flex;
  flex-direction: column;
}
.panel-head {
  padding: 10px 14px;
  background: #181c2d;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bot-title {
  font-size: 12px;
  font-weight: 700;
  color: #a855f7;
}
.engine-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 4px;
}
.qa-bar {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.qa-pill {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: #94a3b8;
  cursor: pointer;
}
.qa-highlight {
  animation: qaClick 10s infinite;
}
.chat-area {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.user-msg {
  align-self: flex-end;
  background: #3b82f6;
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px 8px 0 8px;
  font-size: 11px;
  max-width: 85%;
  opacity: 0;
  transform: translateY(6px);
  animation: showUserMsg 10s infinite;
}
.ai-msg-box {
  background: #181c2d;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: 0;
  transform: translateY(8px);
  animation: showAiResponse 10s infinite;
}
.think-badge {
  font-size: 9.5px;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  align-self: flex-start;
}
.ai-msg-text {
  font-size: 11px;
  line-height: 1.4;
  color: #cbd5e1;
}
.ai-summary-lines {
  margin-top: 4px;
  color: #f1f5f9;
  font-size: 10.5px;
}
.card-action-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
.btn-insert-demo {
  padding: 4px 10px;
  background: #10b981;
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
  animation: pulseInsertBtn 10s infinite;
}

/* Virtual Mouse Cursor */
.ai-virtual-cursor {
  position: absolute;
  width: 22px;
  height: 22px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 50;
  animation: moveAiDemoCursor 10s infinite;
  filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6));
}

/* Keyframe Animations */
@keyframes moveAiDemoCursor {
  0% { top: 250px; left: 20%; transform: scale(1); }
  12% { top: 50px; left: 58%; transform: scale(1); } /* Move to 3줄 요약 pill */
  16% { top: 50px; left: 58%; transform: scale(0.9); } /* Click 3줄 요약 */
  20% { top: 50px; left: 58%; transform: scale(1); }
  65% { top: 275px; left: 88%; transform: scale(1); } /* Move to [✓ 에디터에 삽입] */
  70% { top: 275px; left: 88%; transform: scale(0.9); } /* Click insert button */
  75% { top: 275px; left: 88%; transform: scale(1); }
  90% { top: 320px; left: 40%; transform: scale(1); }
  100% { top: 250px; left: 20%; transform: scale(1); }
}

@keyframes qaClick {
  0%, 14% { background: rgba(255,255,255,0.06); color: #94a3b8; }
  16%, 30% { background: #3b82f6; color: #fff; box-shadow: 0 0 8px rgba(59,130,246,0.6); }
  32%, 100% { background: rgba(255,255,255,0.06); color: #94a3b8; }
}

@keyframes showUserMsg {
  0%, 16% { opacity: 0; transform: translateY(6px); }
  20%, 92% { opacity: 1; transform: translateY(0); }
  96%, 100% { opacity: 0; transform: translateY(6px); }
}

@keyframes showAiResponse {
  0%, 25% { opacity: 0; transform: translateY(8px); }
  30%, 92% { opacity: 1; transform: translateY(0); }
  96%, 100% { opacity: 0; transform: translateY(8px); }
}

@keyframes pulseInsertBtn {
  0%, 65% { transform: scale(1); }
  68%, 74% { transform: scale(1.08); background: #059669; }
  78%, 100% { transform: scale(1); background: #10b981; }
}

@keyframes insertDocAnimation {
  0%, 72% { opacity: 0; transform: translateY(10px); }
  76%, 92% { opacity: 1; transform: translateY(0); box-shadow: 0 0 16px rgba(16, 185, 129, 0.3); }
  96%, 100% { opacity: 0; transform: translateY(10px); }
}
</style>
\`\`\`

---

### 🆕 [2026-08-11 개선사항] 🚀 지도 및 미디어 컴포넌트 메이저 업데이트
- **🗺️ 지도 V3.5 (공유 & 스마트 검색):** 한국형 Vworld 검색엔진 탑재로 '교회, 상호명' 등 로컬 장소 검색 완벽 지원! 네이버/카카오/구글 지도 다이렉트 딥링크(공유하기) 기능 및 경로 상세 턴바이턴 안내가 추가되었습니다. (핀 및 경로 저장 버그 100% 수정 완료)
- **▶️ 유튜브 타임라인 안정화:** 에디터 및 미리보기 환경에서 \`01:00\` 등 유튜브 타임라인 텍스트 클릭 시, 즉시 해당 영상 위치로 점프하는 기능이 정교하게 개선되었습니다.

---

### 🆕 [2026-08-10 신기능] 🌟 AMEVA AI 어시스턴트: 스마트 문서 교정 및 번역
새로운 **AMEVA AI 어시스턴트**가 에디터에 직접 통합되었습니다! 텍스트를 드래그하고 마법 같은 AI 제안을 즉석에서 받아보세요. 

<details open>
<summary><b>🔥 AI 번역 (다국어 지원)</b></summary>
텍스트를 드래그하고 메뉴를 누르면 문서 문맥을 파악해 중국어, 일본어, 영어 등으로 자연스럽게 번역합니다.

\`\`\`diff
- 어제 말씀드린 프로젝트 기획서 초안입니다. 검토 부탁드립니다.
+ 这是昨天提到的项目策划书草案。请您审阅。
\`\`\`
</details>

<details>
<summary><b>✨ AI 톤 다듬기 (비즈니스 폼)</b></summary>
대충 쓴 메모를 즉시 세련되고 정중한 비즈니스 이메일 톤으로 교정해줍니다!

\`\`\`diff
- 이거 내일까지 빨리 좀 해줘. 안그러면 일정 밀림.
+ 요청드린 건에 대해 내일까지 처리 가능하신지 확인 부탁드립니다. 일정이 지연되지 않도록 협조 부탁드립니다.
\`\`\`
</details>

<details>
<summary><b>📝 AI 3줄 요약</b></summary>
길고 복잡한 회의록이나 장문의 글을 단 3줄의 요약본으로 깔끔하게 정리해 줍니다.
</details>

<br/>

### 💡 실제 사용 방법
1. **텍스트 선택**: 에디터 본문에서 번역, 요약, 또는 다듬고 싶은 **텍스트를 마우스로 드래그(블록 지정)** 합니다.
2. **우클릭 메뉴 호출**: 드래그한 영역 위에서 **마우스 오른쪽 버튼**을 클릭하여 컨텍스트 메뉴를 엽니다.
3. **AI 액션 선택**: 메뉴에 나타난 \`✨ AMEVA AI 번역 제안\`, \`✨ AMEVA AI 톤 다듬기\`, \`📝 AMEVA AI 요약\` 중 원하는 기능을 클릭합니다.
4. **결과 적용하기**: 텍스트 아래에 나타난 'AI 제안 박스(Diff Box)'를 확인하고, 결과가 마음에 들면 \`✓ 수락\`을, 원본과 함께 쓰고 싶다면 \`↓ 둘 다 쓰기\`를 클릭하세요!

---

### 🎬 인터랙티브 튜토리얼 (AI 톤 다듬기 시뮬레이션)
위의 실제 사용 방법이 어떻게 화면에 나타나는지 궁금하신가요? 아래 HTML 코드 블록 우측 상단의 **[▶ 실행]** 또는 **[미리보기]** 버튼을 클릭하여 애니메이션으로 직접 확인해보세요!

\`\`\`html
<div class="demo-container">
  <div class="editor-content">
    <div class="text-content">
      어제 말씀드린 프로젝트 기획서 초안입니다. <span class="highlight">검토 부탁드립니다.</span>
    </div>
    
    <div class="diff-block">
      <div class="diff-header">✨ AMEVA AI 톤 다듬기 제안</div>
      <div class="diff-body">
        <div class="diff-old">검토 부탁드립니다.</div>
        <div class="diff-new">요청드린 건에 대해 꼼꼼한 검토를 부탁드립니다.</div>
      </div>
      <div class="diff-actions">
        <span class="btn-accept">✓ 수락</span>
        <span class="btn-keep">↓ 둘 다 쓰기</span>
      </div>
    </div>
  </div>

  <div class="cursor"></div>
  
  <div class="context-menu">
    <div class="menu-item">✨ AMEVA AI 번역 제안</div>
    <div class="menu-item ai-hover">✨ AMEVA AI 톤 다듬기</div>
    <div class="menu-item">📝 AMEVA AI 요약</div>
  </div>
</div>

<style>
.demo-container {
  position: relative;
  width: 100%;
  height: 380px;
  background: #1e1e24;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Pretendard', sans-serif;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  box-sizing: border-box;
}
.editor-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}
.text-content {
  font-size: 16px;
  line-height: 1.6;
}
.highlight {
  position: relative;
  z-index: 1;
}
.highlight::before {
  content: '';
  position: absolute;
  top: 0; left: -2px; bottom: 0; right: 100%;
  background: rgba(59, 130, 246, 0.4);
  z-index: -1;
  animation: selectText 8s infinite;
}

/* Diff Block (Hidden initially, appears after click) */
.diff-block {
  background: rgba(24, 24, 27, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateY(-10px);
  animation: showDiff 8s infinite;
}
.diff-header {
  color: #a855f7;
  font-size: 12px;
  font-weight: 600;
}
.diff-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.diff-old {
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.05);
  border-left: 3px solid #ef4444;
  color: rgba(255,255,255,0.5);
  text-decoration: line-through;
  font-size: 14px;
}
.diff-new {
  padding: 6px 10px;
  background: rgba(16, 185, 129, 0.05);
  border-left: 3px solid #10b981;
  color: #fff;
  font-size: 14px;
}
.diff-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.btn-accept {
  padding: 4px 10px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}
.btn-keep {
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

/* Context Menu */
.context-menu {
  position: absolute;
  top: 60px;
  left: calc(50% + 40px);
  background: #2a2a35;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  opacity: 0;
  transform: scale(0.9);
  animation: showMenu 8s infinite;
  z-index: 5;
}
.menu-item {
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 4px;
  color: #ddd;
}
.ai-hover {
  animation: hoverMenu 8s infinite;
}

/* Mouse Cursor */
.cursor {
  position: absolute;
  width: 24px;
  height: 24px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 10;
  animation: moveCursor 8s infinite;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

/* Animations */
@keyframes selectText {
  0%, 10% { right: 100%; }
  20%, 90% { right: -2px; }
  100% { right: 100%; }
}
@keyframes showMenu {
  0%, 25% { opacity: 0; transform: scale(0.9); }
  27%, 45% { opacity: 1; transform: scale(1); }
  47%, 100% { opacity: 0; transform: scale(0.9); }
}
@keyframes hoverMenu {
  0%, 35% { background: transparent; }
  37%, 45% { background: #3b82f6; color: #fff; }
  47%, 100% { background: transparent; }
}
@keyframes showDiff {
  0%, 48% { opacity: 0; transform: translateY(-10px); }
  52%, 90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}
@keyframes moveCursor {
  0% { top: 200px; left: 30%; transform: scale(1); }
  10% { top: 45px; left: 55%; transform: scale(1); } /* Move to text start */
  20% { top: 45px; left: 75%; transform: scale(1); } /* Drag to select */
  25% { top: 45px; left: 75%; transform: scale(0.9); } /* Right click */
  27% { top: 45px; left: 75%; transform: scale(1); } 
  35% { top: 105px; left: calc(50% + 80px); transform: scale(1); } /* Move to menu item */
  42% { top: 105px; left: calc(50% + 80px); transform: scale(0.9); } /* Click menu item */
  45% { top: 105px; left: calc(50% + 80px); transform: scale(1); }
  60% { top: 190px; left: 70%; transform: scale(1); } /* Move to accept button */
  80% { top: 190px; left: 70%; transform: scale(1); } /* Wait */
  90% { top: 190px; left: 70%; transform: scale(0.9); } /* Click accept */
  100% { top: 250px; left: 30%; transform: scale(1); } /* Reset */
}
</style>
\`\`\`

---

### 🆕 [2026-08-05 신기능] 문서 속의 문서 (Doc in Doc)
이제 PDF, PPT, Word 문서를 마크다운 문서 내부에 직접 포함시키고 조회할 수 있습니다! 아래는 내장된 샘플 문서 예시입니다.

\`\`\`ameva-document
{"sourceUrl":"https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf","docType":"pdf","fileName":"AMEVA_Sample_Document.pdf","isExpanded":"true"}
\`\`\`

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


### 📺 YouTube 플레이어 & 스마트 타임라인 메모
유튜브 동영상을 문서 내에서 직접 재생하거나 플로팅 화면(PIP)으로 띄워놓고 작업할 수 있습니다.
**[신기능]** 영상 하단의 제어 바를 조작해 원하는 시점을 찾고, **타임라인 북마크**와 **메모**를 남겨보세요. 저장된 영상의 특정 시점과 코멘트 정보는 문서 자체 메타데이터에 안전하게 기록되므로, 팀원들과 문서를 공유할 때 더욱 직관적이고 강력한 협업이 가능해집니다!

\`\`\`ameva-youtube
{"url":"https://www.youtube.com/watch?v=UOxkGD8qRB4","videoId":"UOxkGD8qRB4","title":"Golden - HUNTR/X (K-Pop Demon Hunters OST)","description":"넷플릭스 애니메이션 영화 'K-Pop Demon Hunters (케데헌)'의 글로벌 히트곡 'Golden' 공식 리릭 비디오입니다!","thumbnail":"","timeline":[{"time":"01:00","note":"뭐 보러가기"},{"time":"01:30","note":"2절시작"}],"memo":"메모입니다! 즐감하세요!","isTimeLineFolded":false}
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

