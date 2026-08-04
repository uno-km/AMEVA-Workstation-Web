# AMEVA OS Archive Notes

본 문서는 리팩토링 및 감사 과정에서 컴파일 제외 처리되고 보관(Archive) 처리된 임시 스크립트 및 구버전 파일들을 기록합니다.

## 1. 아카이브 대상 및 위치
모든 아카이브 대상은 프로젝트 저장소의 `scripts/archive/` 디렉토리로 안전하게 격리 이동됩니다.

### 임시 마이그레이션 및 패치 스크립트 (.cjs)
- 위치: `scripts/archive/` (이동 완료)
- 대상 파일 목록 (24개):
  - `addExport.cjs`
  - `audit.cjs`
  - `audit2.cjs`
  - `fixAdapter2.cjs`
  - `fixAdapter3.cjs`
  - `fixApp.cjs`
  - `fixAppB2.cjs`
  - `fixAppB2_2.cjs`
  - `fixAppExport.cjs`
  - `fixAppFinal.cjs`
  - `fixAux.cjs`
  - `fixAux2.cjs`
  - `fixMain.cjs`
  - `fixMessageBubble.cjs`
  - `fixMore.cjs`
  - `fixOptionalChain.cjs`
  - `fixSyntax.cjs`
  - `fixSyntax2.cjs`
  - `fixUndef.cjs`
  - `fix_encoding.cjs`
  - `patchApp.cjs`
  - `scanApp2.cjs`
  - `scanApp3.cjs`
  - `scanAppStates.cjs`
  - `testBlockNote.cjs`

### 구버전 백업 파일
- 위치: `scripts/archive/useAI.backup.ts` (이동 완료)
- 원래 위치: `src/renderer/hooks/deprecated/useAI.backup.ts`
- 이동 사유: 더 이상 사용되지 않으나 과거 대형 AI 훅의 히스토리 보관을 위해 repo 내부에 보관하고 TypeScript 컴파일 대상에서 완벽히 격리.

## 2. 격리 정책
- `tsconfig.json` 파일의 `exclude` 항목에 `scripts/archive/**/*` 또는 해당 아카이브 폴더 전체를 지정하여 tsc 컴파일러 빌드 타겟 및 타입 검사 대상에서 제외합니다.
