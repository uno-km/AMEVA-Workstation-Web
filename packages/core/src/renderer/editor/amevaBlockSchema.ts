/**
 * ============================================================================
 * @file amevaBlockSchema.ts
 * @description amevaBlockSchema.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './amevaBlockSchema';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file amevaBlockSchema.ts
 * @system AMEVA OS Desktop Workstation - Editor Core
 * @location src/renderer/editor/amevaBlockSchema.ts
 * @role Editor Custom Block Spec Schema definition
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - BlockNote WYSIWYG 에디터가 인식할 수 있는 커스텀 블록 사양(Jupyter, Drawing, LinkPreview, Youtube, Map)을 기본 사양에 병합 정의한다.
 * - 프로젝트 전역에서 공유할 에디터 타입(`AmevaEditor`), 블록 타입(`AmevaBlock`), 부분 블록 타입(`AmevaPartialBlock`)의 타입 별칭을 엑스포트 제공한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 커스텀 블록들의 렌더링 세부 뷰 구현 (각 블록 컴포넌트 내부에서 담당).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 커스텀 블록 타입(AmevaBlock, AmevaPartialBlock)의 제네릭 매핑 사양을 흐리거나 변경하지 말 것.
 *   타입이 흐려지면 `MarkdownEditor` 및 `useAppAISuggestions` 등의 인라인 제안 이식 구문에서 심각한 TS 컴파일 에러를 뿜음.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - BlockNoteSchema: 기본 블록 스펙에 커스텀 사양을 가미하기 위한 스키마 생성 팩토리.
 * - defaultBlockSpecs: 문단, 헤더, 리스트, 인용구 등 BlockNote 순정 기본 블록 스펙.
 * - BlockNoteEditor: 제네릭 스펙이 가미될 에디터 본체 인프라 타입.
 * - Block, PartialBlock: 블록 정보 조작 및 부분 변경용 core 타입.
 * - BlockSchemaFromSpecs, InlineContentSchemaFromSpecs, StyleSchemaFromSpecs: 스펙 레코드로부터 타입을 역추출하기 위한 유틸리티 제네릭.
 */
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  BlockNoteEditor,
  type Block,
  type PartialBlock,
  type BlockSchemaFromSpecs,
  type InlineContentSchemaFromSpecs,
  type StyleSchemaFromSpecs
} from '@blocknote/core'

/* 
 * [CUSTOM BLOCK SPEC COMPONENT IMPORTS]
 * - JupyterBlock: SQL/JavaScript/Python 코드 실행 및 실시간 ASCII/HTML 콘솔 테이블 출력 블록.
 * - DrawingBlock: Excalidraw 기반 백터 그래픽 스케치 및 펜 그리기 블록.
 * - LinkPreviewBlock: 외부 웹 URL 기재 시 카드 형태 메타데이터 표출 블록.
 * - YoutubeBlock: 유튜브 동영상 임베딩 및 플로팅 PIP 플레이어 연동 블록.
 * - MapBlock: 가상 맵/위치 데이터 오버레이 정보 뷰 블록.
 */
// [내부 프로젝트 의존성 모듈 임포트: ../components/JupyterBlock]
import { JupyterBlock } from '../components/JupyterBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/DrawingBlock]
import { DrawingBlock } from '../components/DrawingBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/LinkPreviewBlock]
import { LinkPreviewBlock } from '../components/LinkPreviewBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/YoutubeBlock]
import { YoutubeBlock } from '../components/YoutubeBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/MapBlock]
import { MapBlock } from '../components/MapBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/PresentationBlock]
import { PresentationBlock } from '../components/PresentationBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/ExcelBlock]
import { ExcelBlock } from '../components/ExcelBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/KanbanBlock]
import { KanbanBlock } from '../components/KanbanBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/InlineDocumentBlock]
import { InlineDocumentBlock } from '../components/InlineDocumentBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/ChartBlock]
import { ChartBlock } from '../components/ChartBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../components/AiDiffBlock]
import { AiDiffBlock } from '../components/AiDiffBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../features/media-editor/MediaCutEditorBlock]
import { MediaCutEditorBlock } from '../features/media-editor/MediaCutEditorBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../features/knowledge-graph/KnowledgeGraphBlock]
import { KnowledgeGraphBlock } from '../features/knowledge-graph/KnowledgeGraphBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../features/mini-colab/MiniColabBlock]
import { MiniColabBlock } from '../features/mini-colab/MiniColabBlock'

// [내부 프로젝트 의존성 모듈 임포트: ../config/features]
import { FEATURE_FLAGS } from '../config/features'
// SmartDocs 플러그인 컴포넌트 동적 로딩 (토글 분리)
import { SmartDocsTableBlock } from '../plugins/smartdocs/components/SmartDocsTableBlock'

export const customSpecs = {
  jupyter: JupyterBlock,
  drawing: DrawingBlock,
  linkPreview: LinkPreviewBlock,
  youtube: YoutubeBlock,
  map: MapBlock,
  presentation: PresentationBlock,
  excel: ExcelBlock,
  kanban: KanbanBlock,
  inlineDocument: InlineDocumentBlock,
  chart: ChartBlock,
  aiDiff: AiDiffBlock,
  'media-editor': MediaCutEditorBlock,
  'knowledge-graph': KnowledgeGraphBlock,
  'mini-colab': MiniColabBlock,
  ...(FEATURE_FLAGS.ENABLE_SMARTDOCS ? { smartDocsTable: SmartDocsTableBlock } : {}),
}

const validCustomSpecs = Object.fromEntries(
  Object.entries(customSpecs).filter(([key, value]) => {
    if (!value || typeof value !== 'object' || Object.keys(value).length === 0) {
      console.error(`[AMEVA SCHEMA ERROR] Block spec for '${key}' is invalid/empty! Removing from schema.`);
      return false;
    }
    return true;
  })
)

/**
 * amevaSchema 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const amevaSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ...validCustomSpecs
  }
})

/*
 * [TYPE ALIAS PERSISTENCE CONTRACT]
 * - AmevaSchemaType: 병합 스키마의 타이핑.
 * - AmevaEditor: AMEVA 전용 스펙이 적용된 에디터 인스턴스 타입.
 * - AmevaBlock: 스키마가 적용된 개별 단락 블록 노드 타입.
 * - AmevaPartialBlock: 부분 업데이트 및 갱신 패킷 전달용 블록 타입.
 */
/**
 * AmevaSchemaType 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type AmevaSchemaType = typeof amevaSchema
/**
 * AmevaEditor 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type AmevaEditor = BlockNoteEditor<
  BlockSchemaFromSpecs<typeof amevaSchema.blockSpecs>,
  InlineContentSchemaFromSpecs<typeof amevaSchema.inlineContentSpecs>,
  StyleSchemaFromSpecs<typeof amevaSchema.styleSpecs>
>
/**
 * AmevaBlock 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type AmevaBlock = Block<
  BlockSchemaFromSpecs<typeof amevaSchema.blockSpecs>,
  InlineContentSchemaFromSpecs<typeof amevaSchema.inlineContentSpecs>,
  StyleSchemaFromSpecs<typeof amevaSchema.styleSpecs>
>
/**
 * AmevaPartialBlock 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type AmevaPartialBlock = PartialBlock<
  BlockSchemaFromSpecs<typeof amevaSchema.blockSpecs>,
  InlineContentSchemaFromSpecs<typeof amevaSchema.inlineContentSpecs>,
  StyleSchemaFromSpecs<typeof amevaSchema.styleSpecs>
>

