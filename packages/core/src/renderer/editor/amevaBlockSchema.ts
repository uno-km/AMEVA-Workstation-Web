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
import { JupyterBlock } from '../components/JupyterBlock'
import { DrawingBlock } from '../components/DrawingBlock'
import { LinkPreviewBlock } from '../components/LinkPreviewBlock'
import { YoutubeBlock } from '../components/YoutubeBlock'
import { MapBlock } from '../components/MapBlock'
import { PresentationBlock } from '../components/PresentationBlock'
import { ExcelBlock } from '../components/ExcelBlock'
import { KanbanBlock } from '../components/KanbanBlock'
import { InlineDocumentBlock } from '../components/InlineDocumentBlock'
import { SmartDocsTableBlock } from '../components/SmartDocsTableBlock'
import { ChartBlock } from '../components/ChartBlock'

/**
 * [CONTRACT - Root Custom Schema Configuration]
 * - amevaSchema: 커스텀 사양이 병합된 중앙 스키마 인스턴스.
 * - Rationale: 이 사양에 선언된 키값(jupyter, drawing 등)으로 마크다운 파서 및 플러그인이 동작한다.
 */
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
  smartDocsTable: SmartDocsTableBlock,
  chart: ChartBlock,
}

Object.entries(customSpecs).forEach(([key, value]) => {
  if (!value) {
    console.error(`[AMEVA SCHEMA ERROR] Block spec for '${key}' is undefined! This indicates a missing export or circular dependency.`);
  }
})

export const amevaSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ...customSpecs
  }
})

/*
 * [TYPE ALIAS PERSISTENCE CONTRACT]
 * - AmevaSchemaType: 병합 스키마의 타이핑.
 * - AmevaEditor: AMEVA 전용 스펙이 적용된 에디터 인스턴스 타입.
 * - AmevaBlock: 스키마가 적용된 개별 단락 블록 노드 타입.
 * - AmevaPartialBlock: 부분 업데이트 및 갱신 패킷 전달용 블록 타입.
 */
export type AmevaSchemaType = typeof amevaSchema
export type AmevaEditor = BlockNoteEditor<
  BlockSchemaFromSpecs<typeof amevaSchema.blockSpecs>,
  InlineContentSchemaFromSpecs<typeof amevaSchema.inlineContentSpecs>,
  StyleSchemaFromSpecs<typeof amevaSchema.styleSpecs>
>
export type AmevaBlock = Block<
  BlockSchemaFromSpecs<typeof amevaSchema.blockSpecs>,
  InlineContentSchemaFromSpecs<typeof amevaSchema.inlineContentSpecs>,
  StyleSchemaFromSpecs<typeof amevaSchema.styleSpecs>
>
export type AmevaPartialBlock = PartialBlock<
  BlockSchemaFromSpecs<typeof amevaSchema.blockSpecs>,
  InlineContentSchemaFromSpecs<typeof amevaSchema.inlineContentSpecs>,
  StyleSchemaFromSpecs<typeof amevaSchema.styleSpecs>
>

