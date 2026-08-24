/**
 * @file welcomeDocs.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/config/welcomeDocs.ts
 * @role Multilingual welcome markdown guide book templates
 */

export const WELCOME_MARKDOWN_KO = `# 🚀 AMEVA Workstation

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

### 🗄️ 가상 SQLite WASM 데이터베이스 예시
일렉트론 및 웹 브라우저 메모리상에 상주하는 가상 SQLite DB입니다. SELECT 실행 시 예쁜 반응형 그리드 테이블로 즉시 표출됩니다!

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
`;

export const WELCOME_MARKDOWN_EN = `# 🚀 AMEVA Workstation

Welcome to the next-generation AI-powered unified collaborative workstation!

## ✨ Key Features

1. **AI Assistant**: Click the ✨ button in the top right to open the local LLM AI panel.
2. **Real-Time Collaboration**: Start a server in the Sidebar Collaboration tab to co-edit with peers.
3. **Live Chat**: Exchange instant messages with collaborators in the Chat tab.
4. **Code Execution**: Run JavaScript, Python, SQL, and HTML directly inside interactive code blocks.
5. **Format Conversion**: Seamlessly export documents to PDF, Word, Excel, PPT, HWPX, and Markdown.

> ⚠️ **Web Version Notice & Desktop App Recommendation**  
> Certain native capabilities such as **local on-device AI models and direct local file system access** are limited in the web version.  
> To unlock all workstation features without restrictions, click **[Desktop App Guide / Download]** from the **Help (or About)** menu in the status bar!

---

### 🆕 [2026-08-18 Major Update] 🤖 AMEVA Local AI Agent & GraphRAG & Smart Office Viewer Released!
- **⚡ 100% Private WebGPU Local AI Agent (\`Qwen2.5-3B-Instruct\`):**
  - High-performance, lightweight AI chatbot running **100% private and on-device** via browser WebGPU acceleration with zero cloud API keys or subscriptions required.
  - **4 Quick Action Buttons**: One-click execution for **\`📝 3-Bullet Summary\`**, **\`✨ Polish Writing\`**, **\`🔍 RAG Query\`**, and **\`📊 Organize Table\`**.
  - **Chain-of-Thought (\`<think>\`)** visualization and **\`[✓ Insert into Editor]\`** proposal card integration!
- **🕸️ Hybrid RAG & Knowledge Graph (GraphRAG):**
  - Combines **Vector Cosine Similarity + Reciprocal Rank Fusion (RRF)** with **Knowledge Graph (GraphRAG)** entity relationship extraction for deep report analysis.
  - **Sub-millisecond Semantic Cache**: Instant responses in 0.001s for frequent queries.
- **📑 Next-Gen Office & PDF A4 Typesetting Viewer (\`Ctrl+Shift+F\`):**
  - Pixel-perfect rendering of Word (\`.docx\`), HWPX (\`.hwpx\`), Excel (\`.xlsx\`), and PDF into standard **Print A4 layout (\`📄 Page 1 / 17\`) & Table of Contents (TOC)**.
  - Real-time dual mode switching: **\`[ 📑 A4 Native Viewer ] ↔ [ 🖥️ Browser Viewer ]\`**.
  - **Real-time Keyword Highlighting & Jump Navigation (\`Ctrl+Shift+F\`)** with smooth scrolling TOC navigation.
- **🛡️ Rich Markdown Block Deletion Guard Modal:**
  - Built-in **ConfirmModal** with \`Enter\` (Yes) / \`Esc\` (No) keyboard navigation prevents accidental deletion of diagrams, whiteboards, maps, and spreadsheets.

---

### 🗄️ Virtual SQLite WASM Database Example
Virtual SQLite DB running inside browser WebAssembly memory. Executing SELECT queries instantly renders interactive tables!

\`\`\`sql
-- Create temporary table and insert mock data
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

-- Query data (Rendered in beautiful interactive table)
SELECT * FROM developers;
\`\`\`

---

### 📝 Versatile Formatting Tools (Basic Blocks)
AMEVA Editor goes beyond simple text editing by supporting rich block formatting. Type \`/\` (slash) anywhere to open the command palette.

> **Quote Block**: Highlight critical insights or announcements with customized quote containers.

- [x] Check List: Step 1 completed
- [ ] Next Target: Activate premium plugins
- [ ] Verify Kanban & Excel integration
`;
