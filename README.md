# 🌟 AMEVA Workstation: Next-Gen AI-Powered Integrated Media Workspace

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_in_Browser-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://ameva-workstation-web-core.vercel.app/)
[![Landing Page](https://img.shields.io/badge/🌐_Showcase-Official_Landing-0ea5e9?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ameva-workstation-web-core.vercel.app/promo/index.html)
[![GitHub Stars](https://img.shields.io/github/stars/uno-km/AMEVA-Workstation-Web?style=for-the-badge&color=f59e0b&logo=github)](https://github.com/uno-km/AMEVA-Workstation-Web/stargazers)
![Release](https://img.shields.io/badge/Release-v0.8.19-0ea5e9?style=for-the-badge&logo=electron&logoColor=white)
![WebGPU](https://img.shields.io/badge/WebGPU-On--Device%20AI-10b981?style=for-the-badge&logo=webgpu&logoColor=white)
![Security](https://img.shields.io/badge/Privacy-100%25%20Zero--Leakage-8b5cf6?style=for-the-badge)

<br/>

### 🔗 **[👉 브라우저에서 즉시 체험하기 (Live Web App)](https://ameva-workstation-web-core.vercel.app/)** | **[🌐 공식 쇼케이스 랜딩 페이지](https://ameva-workstation-web-core.vercel.app/promo/index.html)**

**서버비 $0 & 기업 기밀 유출 0% — 브라우저 WebGPU 가속 로컬 AI 에이전트와 올인원 멀티미디어(동영상·이미지·오디오) 스튜디오, 대용량 문서 맵리듀스 인텔리전스, 인터랙티브 지오매핑을 단 하나의 마크다운 런타임으로 통합한 차세대 지식 워크스테이션**

[🌐 라이브 앱](https://ameva-workstation-web-core.vercel.app/) • [✨ 쇼케이스 웹사이트](https://ameva-workstation-web-core.vercel.app/promo/index.html) • [📑 12-Slide Pitch Deck](docs/IR_PITCH_DECK.md) • [🏛️ PSST 사업계획서](docs/GOV_STARTUP_BUSINESS_PLAN_PSST.md) • [🎬 핵심 기능 매뉴얼](#-16대-핵심-기능-상세-매뉴얼-full-feature-matrix)

</div>

---

## 🧭 16대 핵심 기능 상세 매뉴얼 (Full Feature Matrix)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               AMEVA Core Engine Matrix                                 │
├─────────────────────────┬─────────────────────────┬────────────────────────────────────┤
│ 🎬 Multi-Media Studio   │ 📑 Doc Intelligence     │ ⚡ WebGPU Engine & Compute         │
│ • Video Timeline Trim   │ • PDF/DOCX/PPTX/HWPX    │ • Qwen2.5 0.5B/1.5B/7B WebLLM      │
│ • Image Canvas & BG-Rem │ • 3s Fast-Pass Summary  │ • Mini-Colab WGSL Shader PyTorch   │
│ • Audio Waveform Cut    │ • 3-Stage Map-Reduce    │ • Local RAG & Vector Embeddings    │
│ • ⚡ Silence Auto-Purge │ • Multi-Card Deck View  │ • Contextual Neural Translation    │
├─────────────────────────┼─────────────────────────┼────────────────────────────────────┤
│ 🗺️ Geo-Mapping & Route  │ 📊 Advanced Block Suite │ 🛡️ Enterprise Security & Arch     │
│ • OpenStreetMap Search  │ • FortuneSheet Excel    │ • 100% On-Device Zero-Server Leak  │
│ • Multi-Pin Annotations │ • Excalidraw Whiteboard │ • Encrypted VFS & `.adc` Packager  │
│ • OSRM Dynamic Routing  │ • Interactive Kanban    │ • Y.js P2P/Relay CRDT Sync         │
│ • Markdown Persistence  │ • Python WASM & Mermaid │ • 8-Format Native Lossless Export  │
└─────────────────────────┴─────────────────────────┴────────────────────────────────────┘
```

---

### 1. 🎬 멀티미디어 인앱 저작 스튜디오 (Video / Image / Audio)
* **🎥 동영상 타임라인 컷편집 & 8방향 리사이저 (`/video`)**:
  * 타임라인 슬라이더를 잡고 초 단위로 시작/종료 구간을 자르면 원본 손상 없이 마크다운에 즉시 반영.
  * 8방향 비례 리사이즈 핸들 지원, 미리보기(Preview) 모드 시 클린 플레이어 렌더링.
* **🖼️ 이미지 갤러리 & Fabric.js 캔버스 스튜디오 (`/image`)**:
  * 격자(Grid) 및 가로 스크롤 캐러셀(Carousel) 다중 사진 갤러리.
  * **개별 사진 8방향 크기조절 (`ResizableImageCard`)**: 사진마다 실시간 해상도 툴팁과 함께 개별 치수 조절 및 영구 저장.
  * **AI 1초 배경 제거 (Remove BG)**: 인물/사물 사진 배경을 1초 만에 깔끔한 투명 PNG로 분리.
  * **인앱 캔버스 드로잉/크롭/필터**: 포토샵 없이 에디터 내부에서 즉시 이미지 가공.
* **🎙️ 오디오 파형 스튜디오 & ⚡ 무음존 자동 삭제 (`/audio`)**:
  * 실시간 주파수 진폭 파형(Waveform) 시각화.
  * **⚡ 무음존 자동 감지 및 1-클릭 일괄 삭제 (Silence Detection & Removal)**: 녹음된 음성의 불필요한 공백 구간을 알고리즘이 자동 식별하여 단 1초 만에 일괄 컷팅 압축.

---

### 2. 📑 온디바이스 WebGPU 문서 인텔리전스 & 맵리듀스 요약 덱 (`/doc`)
* **지원 포맷**: **PDF**(`.pdf`), **MS Word**(`.docx`), **PowerPoint**(`.pptx`), **한글**(`.hwpx`) 뷰어 및 분석.
* **⚡ 3초 Fast-Pass 고속 요약**: 1~3페이지 소형 문서는 3~4초 만에 즉시 종합 요약 리포트 추출.
* **대용량 3단계 맵리듀스 (Map-Reduce)**: 수십~수백 페이지 대형 문서를 챕터별로 클러스터링하여 **다단계 요약 카드 덱(Document Summaries Deck)** 생성 및 본문 1-클릭 블록 삽입.

---

### 3. ⚡ Mini-Colab & 브라우저 WebGPU 텐서 연산 셰이더 (`/colab`)
* **브라우저 네이티브 WGSL 셰이더 브릿지 (`gpuCore.ts`)**:
  * 파이썬 서버 없이도 브라우저 내부에서 WebGPU 셰이더(`matmul.wgsl`, `elementwise.wgsl`)를 직접 컴파일하여 초고속 대규모 행렬곱 및 딥러닝 텐서 연산 수행.

---

### 4. 🧠 Knowledge Graph 3D/2D 지식 관계망 시각화 뷰어 (`/graph`)
* **인터랙티브 포스-지향 지식 그래프 (Force-Directed Graph)**:
  * 문서 내 키워드, 태그, 섹션 간의 유기적 관계를 3D/2D 인터랙티브 그래프 노드로 렌더링.
  * 백그라운드 웹 워커(`graphWorker.ts`) 기반으로 수천 개 노드도 60fps로 매끄럽게 탐색.

---

### 5. 📊 FortuneSheet 완전 호환 인앱 엑셀 스프레드시트 (`/excel`)
* **MS Excel `.xlsx` 무손실 임포트/익스포트**:
  * 엑셀 파일을 에디터로 드래그하면 시트 서식, 함수 수식(SUM, AVERAGE 등), 스타일이 유지된 채 스프레드시트 블록으로 즉시 렌더링.

---

### 6. 🎨 Excalidraw 완전 내장 화이트보드 드로잉 (`/drawing`)
* 자유형 손그림 스케치, 시스템 아키텍처 다이어그램, UI 와이어프레임 작성을 위한 Excalidraw 엔진 내장.

---

### 7. 🃏 인라인 인터랙티브 칸반 보드 (`/kanban`)
* 마크다운 본문 내부에서 드래그 앤 드롭으로 To Do, In Progress, Done 카드를 이동 관리할 수 있는 인터랙티브 태스크 보드.

---

### 8. 🗺️ 인터랙티브 지오매핑 & 최적 경로 탐색 시스템 (`/map`)
* **장소/주소 실시간 검색**: OpenStreetMap 지오코딩 엔진 연동.
* **📍 다중 핀 꽂기 & 🗺️ 최적 경로 탐색 (OSRM Navigation)**:
  * 여러 지점에 마커를 꽂고 출발지-도착지 추천 이동 경로 라인을 지도 위에 시각화.
  * 현장 종합 메모와 좌표 데이터가 마크다운 파일에 안전하게 직렬화 저장.

---

### 9. 🐍 파이썬 WASM 샌드박스 & HTML 라이브 런타임 (`/jupyter`, `/code`)
* **Pyodide WASM 파이썬 엔진**: 별도 설치 없이 브라우저 내에서 NumPy, Pandas, Matplotlib 코드 실행 및 데이터 시각화.
* **HTML/JS/CSS Live Sandbox**: 웹 컴포넌트 실시간 프리뷰 샌드박스.

---

### 10. 📊 Mermaid 다이어그램 지능형 문법 자동 보정기 (`/mermaid`)
* Flowchart 작성 시 흔히 발생하는 콜론 문법 오류(`A --> B: 라벨`)나 세미콜론 줄바꿈 누락을 내부 파서(`sanitizeMermaidCode`)가 감지하여 올바른 표준 문법(`A -->|라벨| B`)으로 자동 치환 렌더링.

---

### 11. 🌐 신경망 실시간 번역 & 4대 맞춤형 문체 다듬기
* **온디바이스 신경망 번역 (Neural Translation)**: 한국어 ⇄ 영/일/중/스페인/프랑스/독일어 100% 로컬 WebGPU 번역.
* **4대 문체 변환**: 학술/논문체, 비즈니스 격식체, 친근한 캐주얼체, 개발자/기술 문서체.
* **실시간 AI Diff 비교 뷰어**: 인라인 대조 확인 후 1-클릭 적용.

---

### 12. 🤖 차세대 자율 AI 에이전트 & 로컬 RAG 패널 (`Cmd/Ctrl + L`)
* Qwen2.5 온디바이스 가속 추론, 로컬 벡터 스토어 RAG, **에디터 도구 자율 호출 (Tool Calling)**을 통해 표 생성, 수식 계산, 코드 디버깅 수행.

---

### 13. 📺 유튜브 타임스탬프 & 스마트 링크 프리뷰 (`/youtube`, `/link`)
* 유튜브 영상 특정 시간대 메모 재생 및 웹 URL 입력 시 실시간 오픈그래프 카드 렌더링.

---

### 14. 🖥️ Presentation 모드 (1-클릭 슬라이드 쇼 변환)
* 마크다운 문서 내용을 클릭 한 번으로 미려한 풀스크린 발표용 슬라이드로 전환.

---

### 15. 🗄️ 8대 포맷 네이티브 무손실 내보내기 (Export Hub)
* **지원 내보내기 규격**: `.docx`, `.pptx`, `.hwpx`, `.xlsx`, `.pdf`, `.html`, `.xml`, `.adc` (통합 아카이브).

---

### 16. 🧩 인앱 확장 마켓플레이스 & 실시간 문서 미니맵 (Minimap)
* 커스텀 블록, AI 프롬프트 템플릿 마켓플레이스 및 대용량 문서 레이더 탐색 미니맵 내장.

---

## 🏛️ 투자 및 엔터프라이즈 리소스 (Investor Resources)

* 📑 **[실리콘밸리 YC / VC 표준 12슬라이드 IR Pitch Deck](docs/IR_PITCH_DECK.md)**
* 🏛️ **[정부지원사업(예창패/초창패/TIPS) 100% 합격용 표준 PSST 사업계획서](docs/GOV_STARTUP_BUSINESS_PLAN_PSST.md)**
* 🌐 **[공식 쇼케이스 랜딩 페이지 (Showcase Landing)](https://ameva-workstation-web-core.vercel.app/promo/index.html)**
* 📧 **투자 및 B2B 도입 문의**: team@ameva.io

---

## 🚀 빠른 시작 가이드 (Quick Start)

```bash
# 1. 저장소 클론
git clone https://github.com/uno-km/AMEVA-Workstation-Web.git
cd AMEVA-Workstation-Web

# 2. 패키지 설치
npm install

# 3. 개발 서버 구동 (포트 8888)
npm run dev

# 4. 프로덕션 빌드
npm run build
```

---

<div align="center">

**AMEVA Workstation** • *Crafted with Precision by uno-km*  
Released under **MIT License** • **v0.8.19**

</div>
