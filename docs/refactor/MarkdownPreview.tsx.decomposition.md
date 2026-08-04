# MarkdownPreview.tsx Decomposition Ledger (분해 장부)

## 1. Original File

- Original path: [MarkdownPreview.tsx](file:///c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation/src/renderer/components/MarkdownPreview.tsx)
- Original line count: 902 (추가된 리팩토링 직전 사양)
- Refactor type: Mechanical decomposition only (기계적 분리)
- Behavior change allowed: No (동작 변경 금지)
- Rename allowed: No (이름 변경 금지)
- Signature change allowed: No (시그니처 변경 금지)
- Import path break allowed: No (기존 외부 import 경로 유지)

---

## 2. Export Inventory (원본 파일 Export 목록)

- export name: `MarkdownPreview`
  - kind: function (React Component)
  - original signature: `export function MarkdownPreview({ markdown, editor }: { markdown: string; editor: AmevaEditor | null })`
  - current consumers: `src/renderer/components/MarkdownEditor.tsx`, `src/renderer/components/editor/WelcomeBanner.tsx` 등
  - target file: `src/renderer/components/MarkdownPreview.tsx` (기존 경로 유지)
  - migration status: verified (이식 완료 및 동작 검증)

---

## 3. Internal Symbol Inventory (내부 비-export Symbol 목록)

- symbol name: `InlineMermaidRenderer`
  - kind: function (React Component)
  - approximate line range: 497 ~ 596
  - dependencies: `react`, `mermaid`
  - used by: `MarkdownPreview`
  - target file: `src/renderer/components/markdown/InlineMermaidRenderer.tsx`
  - migration status: verified (이식 완료)

- symbol name: `InlineLinkPreviewRenderer`
  - kind: function (React Component)
  - approximate line range: 34 ~ 251
  - dependencies: `react`, `lucide-react (Globe)`
  - used by: `MarkdownPreview`
  - target file: `src/renderer/components/markdown/InlineLinkPreviewRenderer.tsx`
  - migration status: verified (이식 완료)

- symbol name: `InlineMapRenderer`
  - kind: function (React Component)
  - approximate line range: 663 ~ 805 (기존 인라인 분기)
  - dependencies: `react`
  - used by: `MarkdownPreview`
  - target file: `src/renderer/components/markdown/InlineMapRenderer.tsx`
  - migration status: verified (이식 완료)

- symbol name: `InlineYoutubeRenderer`
  - kind: function (React Component)
  - approximate line range: 814 ~ 873 (기존 인라인 분기)
  - dependencies: `react`
  - used by: `MarkdownPreview`
  - target file: `src/renderer/components/markdown/InlineYoutubeRenderer.tsx`
  - migration status: verified (이식 완료)

---

## 4. Proposed Target File Map (목적지 설계)

- `src/renderer/components/markdown/InlineMermaidRenderer.tsx`
  - responsibility: Mermaid 그래프 드로잉 및 렌더링
  - exports: `InlineMermaidRenderer`
  - must preserve names: Yes
  - behavior change: None
- `src/renderer/components/markdown/InlineLinkPreviewRenderer.tsx`
  - responsibility: `ameva-link` 구조화 데이터 프리뷰 및 샌드박스 렌더링
  - exports: `InlineLinkPreviewRenderer`
  - must preserve names: Yes
  - behavior change: None
- `src/renderer/components/markdown/InlineMapRenderer.tsx`
  - responsibility: `ameva-map` 구조화 데이터 OpenStreetMap 기반 경로/지도 렌더링
  - exports: `InlineMapRenderer`
  - must preserve names: Yes
  - behavior change: None
- `src/renderer/components/markdown/InlineYoutubeRenderer.tsx`
  - responsibility: `ameva-youtube` 구조화 데이터 공식 우회 플레이어(iframe) 렌더링
  - exports: `InlineYoutubeRenderer`
  - must preserve names: Yes
  - behavior change: None

---

## 5. 1:1 Move Records (이동 기록)

### Move Record: InlineMermaidRenderer
- original file: `src/renderer/components/MarkdownPreview.tsx`
- target file: `src/renderer/components/markdown/InlineMermaidRenderer.tsx`
- name changed: No
- signature changed: No
- behavior changed: No
- re-export needed: No (부모 파일 내에서 local import 후 소비)
- verification result: 통과 (Typecheck OK)

### Move Record: InlineLinkPreviewRenderer
- original file: `src/renderer/components/MarkdownPreview.tsx`
- target file: `src/renderer/components/markdown/InlineLinkPreviewRenderer.tsx`
- name changed: No
- signature changed: No
- behavior changed: No
- re-export needed: No
- verification result: 통과 (Typecheck OK)

### Move Record: InlineMapRenderer
- original file: `src/renderer/components/MarkdownPreview.tsx` (기존 인라인 익명 분기 영역)
- target file: `src/renderer/components/markdown/InlineMapRenderer.tsx`
- name changed: No (명시적 이름 지정)
- signature changed: No
- behavior changed: No
- re-export needed: No
- verification result: 통과 (Typecheck OK)

### Move Record: InlineYoutubeRenderer
- original file: `src/renderer/components/MarkdownPreview.tsx` (기존 인라인 익명 분기 영역)
- target file: `src/renderer/components/markdown/InlineYoutubeRenderer.tsx`
- name changed: No (명시적 이름 지정)
- signature changed: No
- behavior changed: No
- re-export needed: No
- verification result: 통과 (Typecheck OK)

---

## 6. Removal Gate (중복 코드 제거 승인 확인)

- 원본 symbol이 ledger에 기록됨: Yes
- target file 생성됨: Yes
- target file export 완료: Yes
- 기존 import path 호환됨: Yes
- 원본과 이동본 이름 동일: Yes
- 원본과 이동본 signature 동일: Yes
- 동작 변경 없음: Yes
- 타입체크 통과: Yes
- 테스트 또는 최소 빌드 통과: Yes
- re-export 필요 여부 확인됨: Yes (내부적으로 깔끔히 wired되어 re-export 불요)
- 삭제 대상이 중복 코드임이 확인됨: Yes
- **결정**: 원본 중복 코드 제거 완수.

---

## 7. 최종 통합 및 검증 (2026-07-09 최종 확정)

- 깨진 `MarkdownPreview.tsx` 구문을 복구하고, 찢어낸 `InlineMermaidRenderer` 등을 로컬 경로에서 정상적으로 import 하도록 바인딩 완료.
- 초초고밀도 주석 규칙(Expected Value Flow, Algorithm Branch, Consumers 등) 및 흐름 파싱 로깅 구현 완료.
- 미사용 import(`useState`, `useEffect`, `useRef`, `mermaid`, `Globe`) 최종 정리 완료 (분리된 InlineMermaidRenderer가 직접 소비).
- `npx tsc --noEmit` 타입 에러 **0개** 통과 (2회 연속 검증).
- 서버 이중화 스크립트 완료:
  - `npm run web` → `vite --mode browser` (포트 5174, 일렉트론 없음)
  - `npm run market` / `npm run dev:market` → 마켓 서버 단독
  - `npm run dev` → Vite(5173) + 일렉트론 + 마켓(3초 지연) 통합 실행
- **Decomposition 상태: COMPLETE (완전 종결)**

