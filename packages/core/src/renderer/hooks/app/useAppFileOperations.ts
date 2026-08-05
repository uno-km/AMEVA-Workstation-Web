/**
 * @file useAppFileOperations.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/hooks/app/useAppFileOperations.ts
 * @role File Load, Save & Workspace tab Synchronization Hook
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 마크다운 파일의 디바이스 저장(`handleSaveFile`, `handleSaveAsFile`) 및 열기 대화상자(`handleOpenFile`)를 구동한다.
 * - 다중 문서 탭 개설(`openFileInTab`), 단락 뒤 이어 붙여 열기(`appendMarkdownIntoEditor`) 및 새 빈문서(`handleStartNewDocument`) 액션을 처리한다.
 * - [Performance Tuning - Chunked Parser Load]: 200줄을 초과하는 대용량 문서를 일시에 에디터에 밀어 넣으면,
 *   화면 렌더러와 텍스트 스트립에 과부하 렉이 발생한다.
 *   이를 막기 위해 **120줄 단위로 분할 청크 파싱(`firstChunk`, `remainingChunk`)**하고, 
 *   **350ms 프레임 지연 `setTimeout` 백그라운드 파이프라인**을 가동해 렉 없이 지연 적재 완료한다.
 * - 아메바 미디어 보존 전용 이진 포맷(.adc), Jupyter Notebook(.ipynb), 표준 Markdown(.md) 간의 직렬화 내보내기를 조율한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT bypass chunked load: 200줄 이상의 대형 파일 로드 시에는 반드시 120줄 선파싱 후, 
 *   나머지 350ms 프레임 비동기 지연 결합 처리 계약을 유지하여 타이핑/화면 전환 시 렉을 없앨 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useCallback: 파일 트랜잭션 콜백들의 렌더링 무결성을 보장하기 위한 React 코어 API.
 */
import { useCallback, useEffect, useRef } from 'react'

/* 
 * [ELECTRON IPC BRIDGE ADAPTER]
 * - ipc: OS 파일 다이얼로그(`openFile`, `saveFile`) 및 확인창(`showMessageBox`) 채널 어댑터.
 */
import * as ipc from '../../services/ipc/electronApiAdapter'
import { getPlatformAdapter } from '../../../shared/adapters/platformAdapter'

/* 
 * [UTILITIES & CONSTANTS]
 * - normalizeMarkdown: 윈도우 개행문자(CRLF -> LF) 통일 및 빈 문단 보정 유틸.
 * - cleanCodeBlocks: 에디터 내 코드 블록 스타일 복원 필터.
 * - ensureBlockIds: Yjs 협업 세션 충돌 방지를 위한 블록 고유 ID 누락 보정기.
 * - convertJupyterToCodeBlocks: Jupyter 노드를 마크다운 백틱 펜스로 역치환.
 */
import { normalizeMarkdown, cleanCodeBlocks, ensureBlockIds, convertJupyterToCodeBlocks, convertLocalPathsToMediaSchema, convertMediaSchemaToLocalPaths } from '../../utils/markdownUtils'

/* 
 * [ZUSTAND STORE]
 * - useWorkspaceStore: 파일 경로, 현재 버퍼, 탭 리스트 저장소.
 */
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'

/* 
 * [SHARED SCHEMAS & TYPES]
 * - AppEditor: 블록노트 커스텀 에디터 규격.
 * - AppPartialBlock: 일부 데이터 업데이트를 위한 블록 스펙.
 * - EditorMode: 웰컴/편집/미리보기 모드 타입 정의.
 */
import type { AmevaEditor as AppEditor, AmevaPartialBlock } from '../../editor/amevaBlockSchema'
import type { EditorMode } from '../../../shared/types'

/* 
 * [FILE TRANSLATORS & CONVERTERS]
 * - parseFileToMarkdown: 이진 파일(pdf, docx, hwpx 등)의 원시 마크다운 변환기.
 * - convertMarkdownToBinary: 마크다운 텍스트의 이진 오피스 파일 컴파일러.
 * - triggerBrowserDownload: 웹 환경 다운로드 파일 유도 유틸.
 * - arrayBufferToBase64: 이진 버퍼의 base64 텍스트 포맷터.
 * - convertMarkdownToIpynb: 마크다운 평문의 쥬피터 JSON 스펙 변환기.
 */
import {
  parseFileToMarkdown,
  convertMarkdownToBinary,
  triggerBrowserDownload,
  arrayBufferToBase64,
  convertMarkdownToIpynb
} from '../../utils/fileConverters'

/*
 * [ADC PACKAGER / SEC-W-024]
 * - packMarkdownToADC: 미디어가 내장된 adc 패키지 파일 압축 유틸.
 */
import { packMarkdownToADC } from '../../utils/adcPackager'

/**
 * @hook useAppFileOperations
 * @description 에디터 문서 로딩, 청크 파싱 분할, 저장 분기 및 ADC 미디어 변환 권장을 제어하는 훅.
 */
export function useAppFileOperations(
  /*
   * [HOOK CONFIG PARAMETERS]
   * - editor: BlockNote API 본체.
   * - setEditorMode: 화면 모드 갱신 세터.
   * - createSnapshot: 저장 시점 자동 히스토리 백업 콜백.
   */
  editor: AppEditor | null,
  setEditorMode: (mode: EditorMode) => void,
  createSnapshot: (name: string, content: string) => void
) {
  /*
   * [ZUSTAND WORKSPACE SELECTORS]
   * - filePath: 현재 작업 중인 물리 파일 경로.
   * - setFilePath: 파일 경로 갱신 세터.
   * - currentContent: 실시간 마크다운 본문 문자열.
   * - setCurrentContent: 본문 문자열 갱신 세터.
   * - originalContent: 저장 시점 비교용 원본 텍스트.
   * - setOriginalContent: 원본 텍스트 갱신 세터.
   * - lastSavedTime: 마지막 저장 시간 타임스탬프.
   * - setLastSavedTime: 저장 시간 갱신 세터.
   * - fileOpenMode: replace/append/tab 열기 옵션.
   * - appendedFiles: 한 화면 다중 문서 병합 위치 리스트.
   * - setAppendedFiles: 병합 리스트 갱신 세터.
   * - setActiveTabId: 활성 탭 키 지정 세터.
   * - activeTabId: 현재 활성 탭 키.
   * - updateActiveTab: 활성 탭 정보 필드 부분 업데이트 콜백.
   * - addTab: 신규 탭 추가 콜백.
   */
  const {
    filePath, setFilePath,
    currentContent, setCurrentContent,
    originalContent, setOriginalContent,
    lastSavedTime, setLastSavedTime,
    fileOpenMode,
    appendedFiles,
    setAppendedFiles,
    setActiveTabId,
    activeTabId,
    updateActiveTab,
    addTab,
    tabs,
    setPdfData,
    setPdfFileName,
  } = useWorkspaceStore()

  // Track the current file loading session to prevent race conditions during chunked parsing
  const loadSessionRef = useRef(0)

  /**
   * [CONTRACT - Load Markdown with Chunked Parser / Rationale]
   * - Rationale: 200줄이 넘는 긴 평문을 동기로 전부 얹으면 UI 프리징이 나므로, 120줄 선 마운트 후 350ms 지연 백그라운드 병합 처리를 수행한다.
   */
  const loadMarkdownIntoEditor = useCallback(async (targetEditor: AppEditor, rawContent: string, isBinary = false, path = '') => {
    setEditorMode('edit')
    
    // Increment session ID on each load call
    loadSessionRef.current += 1
    const currentSession = loadSessionRef.current
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const parsedResult = await parseFileToMarkdown(rawContent, path || filePath || '', isBinary)
    const isAdc = typeof parsedResult !== 'string' && parsedResult && 'markdown' in parsedResult
    const markdown = isAdc ? (parsedResult as any).markdown : parsedResult
    // sourceBlocks for potential direct restoration (if used)
    const sourceBlocks = isAdc ? (parsedResult as any).blocks : undefined

    // [FIX-PDF-001] PDF 파일은 텍스트 추출 대신 PdfViewer 전용 모드로 처리
    // rawContent(base64)를 pdfData에 분리 보존하여 모드 전환 시에도 데이터 보존
    const ext = (path || filePath || '').split('.').pop()?.toLowerCase()
    if (ext === 'pdf' && isBinary) {
      const fname = (path || filePath || 'document.pdf').split(/[\\/]/).pop() || 'document.pdf'
      setPdfData(rawContent)          // base64 원본 데이터를 pdfData에 저장
      setPdfFileName(fname)
      setCurrentContent('')           // currentContent는 비움로 유지
      setOriginalContent('')
      setLastSavedTime(null)
      setEditorMode('edit')
      return
    }

    // 바이너리 파일이 아닌 경우(md, docx 등) → pdfData 초기화
    setPdfData(null)
    setPdfFileName('')

    const converted = convertLocalPathsToMediaSchema(markdown)
    const normalized = normalizeMarkdown(converted)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const lines = normalized.split('\n')
    // 1) 200줄 초과 대형 마크다운 분할 파싱 분기
    if (lines.length > 200 && !isBinary) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `firstChunk`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const firstChunk = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const firstChunk = lines.slice(0, 120).join('\n')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `remainingChunk`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const remainingChunk = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const remainingChunk = lines.slice(120).join('\n')

      // 선두 120줄 파싱 및 에디터 즉시 대체
      const firstBlocks = await targetEditor.tryParseMarkdownToBlocks(firstChunk)
      cleanCodeBlocks(firstBlocks)
      ensureBlockIds(firstBlocks)
      targetEditor.replaceBlocks(targetEditor.document, firstBlocks)

      // 350ms 대기 후 나머지 잔여 청크를 하단에 끼워 넣음
      setTimeout(async () => {
        // 방어 로직: 대기 중 다른 파일이 열렸다면(세션 변경) 이전 파일 청크 삽입 취소
        if (loadSessionRef.current !== currentSession) {
          console.warn('[useAppFileOperations] 파일 로딩 취소됨 (Race Condition 방어)')
          return
        }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `remainingBlocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const remainingBlocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const remainingBlocks = await targetEditor.tryParseMarkdownToBlocks(remainingChunk)
        cleanCodeBlocks(remainingBlocks)
        ensureBlockIds(remainingBlocks)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `doc`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const doc = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const doc = targetEditor.document
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `doc.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (doc.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (doc.length > 0) {
          targetEditor.insertBlocks(remainingBlocks, doc[doc.length - 1], 'after')
        }
        
        // 최종 결합 완성본의 마크다운 직렬화 취합
        const derived = await targetEditor.blocksToMarkdownLossy(convertJupyterToCodeBlocks(targetEditor.document))
        setCurrentContent(derived)
      }, 350)
    } 
    // 2) 일반 파일 동기 즉시 마운트
    else {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const blocks = await targetEditor.tryParseMarkdownToBlocks(normalized)
      cleanCodeBlocks(blocks)
      ensureBlockIds(blocks)
      targetEditor.replaceBlocks(targetEditor.document, blocks)
    }

    setOriginalContent(converted)
    setCurrentContent(converted)
    setLastSavedTime(null)
  }, [filePath, setEditorMode, setOriginalContent, setCurrentContent, setLastSavedTime])

  /**
   * [CONTRACT - Append Markdown into Editor]
   * - Rationale: 가져온 파일 내용을 현재 편집실 맨 마지막 노드 뒤에 덧붙이고, appendedFiles 목록에 앵커를 추가한다.
   */
  const appendMarkdownIntoEditor = useCallback(async (targetEditor: AppEditor, rawContent: string, fileName: string, isBinary = false, path = '') => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const parsedResult = await parseFileToMarkdown(rawContent, path, isBinary)
    const isAdc = typeof parsedResult !== 'string' && parsedResult && 'markdown' in parsedResult
    const markdown = isAdc ? (parsedResult as any).markdown : parsedResult
    const sourceBlocks = isAdc ? (parsedResult as any).blocks : undefined
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `normalized`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const normalized = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const normalized = normalizeMarkdown(markdown)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newBlocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newBlocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newBlocks = sourceBlocks || await targetEditor.tryParseMarkdownToBlocks(normalized)
    cleanCodeBlocks(newBlocks)
    ensureBlockIds(newBlocks)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `doc`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const doc = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const doc = targetEditor.document
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `doc.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (doc.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (doc.length > 0) {
      targetEditor.insertBlocks(newBlocks, doc[doc.length - 1], 'after')
    } else {
      targetEditor.replaceBlocks(doc, newBlocks)
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `firstBlockId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const firstBlockId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const firstBlockId = newBlocks[0]?.id || ''
    setAppendedFiles([...appendedFiles, { id: `append-${Date.now()}`, filePath: fileName, startBlockId: firstBlockId }])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `derived`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const derived = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const derived = await targetEditor.blocksToMarkdownLossy(convertJupyterToCodeBlocks(targetEditor.document))
    setCurrentContent(derived)
  }, [appendedFiles, setAppendedFiles, setCurrentContent])

  /**
   * [CONTRACT - Open File in New Tab]
   * - Rationale: 기존 탭의 문서 변경 사항을 Zustand 탭 목록에 역매핑 저장하고, 새로운 고유 ID의 탭 레코드를 구성하여 교체 로드한다.
   */
  const openFileInTab = useCallback(async (targetEditor: AppEditor, fileContent: string, path: string, isBinary = false) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentBlocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentBlocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentBlocks = [...targetEditor.document]
    
    // 현재 열려있는 구 문서 탭 정보 갱신 저장
    const { pdfData: currentPdfData, pdfFileName: currentPdfFileName, setPdfData, setPdfFileName } = useWorkspaceStore.getState()
    updateActiveTab({ filePath, content: currentContent, blocks: currentBlocks, originalContent, lastSavedTime, pdfData: currentPdfData, pdfFileName: currentPdfFileName })

    const ext = path.split('.').pop()?.toLowerCase() || ''

    if (ext === 'pdf' && isBinary) {
      const newTabId = Math.random().toString(36).substring(2, 10)
      const pdfFileName = path.split('/').pop() || path.split('\\').pop() || 'document.pdf'
      const newTab = {
        id: newTabId,
        filePath: path,
        content: '',
        blocks: [],
        originalContent: '',
        lastSavedTime: null,
        pdfData: fileContent,
        pdfFileName
      }
      addTab(newTab)
      setActiveTabId(newTabId)
      setFilePath(path)
      setPdfData(fileContent)
      setPdfFileName(pdfFileName)
      setCurrentContent('')
      setOriginalContent('')
      setLastSavedTime(null)
      return
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const parsedResult = await parseFileToMarkdown(fileContent, path, isBinary)
    const isAdc = typeof parsedResult !== 'string' && parsedResult && 'markdown' in parsedResult
    const markdown = isAdc ? (parsedResult as any).markdown : parsedResult
    const sourceBlocks = isAdc ? (parsedResult as any).blocks : undefined
    const converted = convertLocalPathsToMediaSchema(markdown)
    const normalized = normalizeMarkdown(converted)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parsed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parsed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const parsed = sourceBlocks || await targetEditor.tryParseMarkdownToBlocks(normalized)
    cleanCodeBlocks(parsed)
    ensureBlockIds(parsed)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newTabId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newTabId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newTabId = Math.random().toString(36).substring(2, 10)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newTab`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newTab = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newTab = {
      id: newTabId,
      filePath: path,
      content: converted,
      blocks: parsed,
      originalContent: converted,
      lastSavedTime: null
    }

    addTab(newTab)
    setActiveTabId(newTabId)
    setFilePath(path)
    setOriginalContent(converted)
    setCurrentContent(converted)
    setLastSavedTime(null)
    setPdfData(null)
    setPdfFileName('')

    // 리액트 라이프사이클 안착 직후 블록 교체 실행
    setTimeout(() => {
      targetEditor.replaceBlocks(targetEditor.document, parsed)
    }, 0)
  }, [activeTabId, filePath, currentContent, originalContent, lastSavedTime, addTab, setActiveTabId, setFilePath, setOriginalContent, setCurrentContent, setLastSavedTime, updateActiveTab])

  /**
   * [CONTRACT - Start New Document]
   * - Rationale: 에디터 캔버스를 단일 빈 문단으로 덮어쓰고 파일 메타 상태를 초기화 리셋한다.
   */
  const handleStartNewDocument = useCallback(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (editor) {
      const newBlock: AmevaPartialBlock = {
        id: Math.random().toString(36).substring(2, 10),
        type: 'paragraph',
        content: [] as any
      }
      editor.replaceBlocks(editor.document, [newBlock])
    }
    setFilePath(null)
    setOriginalContent('')
    setCurrentContent('')
    setLastSavedTime(null)
    setEditorMode('edit')
  }, [editor, setFilePath, setOriginalContent, setCurrentContent, setLastSavedTime, setEditorMode])

  /**
   * [CONTRACT - Open File Dialog Trigger]
   * - Rationale: 플랫폼 환경(Electron/Browser) 분기에 부합하여 파일 다이얼로그를 트리거하고 선택 모드(replace/append/tab)에 맞추어 인서트한다.
   */
  const handleOpenFile = useCallback(async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
    
    // 1. 데스크톱 앱 내장 일렉트론 다이얼로그 활용
    if (ipc.isElectronEnv()) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `file`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const file = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const file = await ipc.openFile()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `file`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (file)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (file) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `fileOpenMode === 'append'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (fileOpenMode === 'append')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (fileOpenMode === 'append') {
          await appendMarkdownIntoEditor(editor, file.content, file.filePath.split(/[\\/]/).pop() || '파일', file.isBinary, file.filePath)
        } else if (fileOpenMode === 'tab') {
          await openFileInTab(editor, file.content, file.filePath, file.isBinary)
        } else {
          setFilePath(file.filePath)
          await loadMarkdownIntoEditor(editor, file.content, file.isBinary, file.filePath)
        }
      }
    } 
    // 1-2. 모바일 앱 환경
    else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `window.Capacitor && window.Capacitor.isNativePlatform()`
       * - 만족 시: 모바일에서는 주로 Intent를 통해 파일 진입이 일어납니다.
       */
      alert("모바일 기기에서는 파일 관리자에서 '.adc' 파일을 탭하여 AMEVA OS 앱으로 열어주세요.");
    }
    // 2. 크롬 웹 브라우저 가상 파일 인풋 활용
    else {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `input`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const input = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.txt,.docx,.hwpx,.pdf,.xlsx,.ipynb,.adc'
      input.onchange = async (e) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `file`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const file = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const file = (e.target as HTMLInputElement).files?.[0]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `file`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (file)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (file) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `reader`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const reader = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const reader = new FileReader()
          reader.onload = async (evt) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `content`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const content = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const content = evt.target?.result as string
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ext`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ext = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const ext = file.name.split('.').pop()?.toLowerCase() || ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isBinaryFile`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isBinaryFile = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const isBinaryFile = ['docx', 'pdf', 'hwpx', 'xlsx', 'xls', 'adc'].includes(ext)
            
            // 바이너리 오피스 문서인 경우 ArrayBuffer를 base64로 감싸서 처리
            if (isBinaryFile) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `binReader`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const binReader = ...` 형태로 안전 캐싱 후 가공 기동.
       */
              const binReader = new FileReader()
              binReader.onload = async (binEvt) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `arrBuffer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const arrBuffer = ...` 형태로 안전 캐싱 후 가공 기동.
       */

                const base64 = binEvt.target?.result as string
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `fileOpenMode === 'append'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (fileOpenMode === 'append')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
                if (fileOpenMode === 'append') {
                  await appendMarkdownIntoEditor(editor, base64, file.name, true, file.name)
                } else if (fileOpenMode === 'tab') {
                  await openFileInTab(editor, base64, file.name, true)
                } else {
                  setFilePath(file.name)
                  await loadMarkdownIntoEditor(editor, base64, true, file.name)
                }
              }
              binReader.readAsDataURL(file)
            } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `fileOpenMode === 'append'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (fileOpenMode === 'append')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (fileOpenMode === 'append') {
                await appendMarkdownIntoEditor(editor, content, file.name, false, file.name)
              } else if (fileOpenMode === 'tab') {
                await openFileInTab(editor, content, file.name, false)
              } else {
                setFilePath(file.name)
                await loadMarkdownIntoEditor(editor, content, false, file.name)
              }
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
    }
  }, [editor, fileOpenMode, loadMarkdownIntoEditor, appendMarkdownIntoEditor, openFileInTab, setFilePath])

  /**
   * [CONTRACT - File Save Manager / Rationale]
   * - Rationale: 문서 내 동영상/오디오 대용량 리소스가 발견되면 보안 및 최적화 차원(.adc 패키징)의 전용 포맷 변환을 권장 팝업하고,
   *   아니오 시 일반 마크다운/ipynb/오피스 이진 포맷 파일로 안전하게 컴파일 플러싱한다.
   */
  const handleSaveFile = useCallback(async () => {
    if (document.activeElement && (document.activeElement as HTMLElement).blur) {
      (document.activeElement as HTMLElement).blur()
      window.dispatchEvent(new CustomEvent('AMEVA_FORCE_SAVE_BLOCKS'))
      await new Promise(resolve => setTimeout(resolve, 150))
    }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `path`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const path = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const path = filePath || 'document.adc'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ext`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ext = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const ext = path.split('.').pop()?.toLowerCase() || 'md'
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rawBlocks`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rawBlocks = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const rawBlocks = convertJupyterToCodeBlocks(editor.document)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const rawMarkdown = await editor.blocksToMarkdownLossy(rawBlocks)
    const markdown = convertMediaSchemaToLocalPaths(rawMarkdown)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hasMedia`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hasMedia = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const hasMedia = 
      markdown.includes('data:video/') || 
      markdown.includes('data:audio/') || 
      markdown.includes('media://') || 
      markdown.includes('type: "presentation"') ||
      markdown.includes('type: "youtube"')
    
    // 1) 동영상/오디오 포함 시 아메바 .adc 패키징 강제/권장 팝업 조건 노드
    if (hasMedia && ['md', 'markdown', 'txt'].includes(ext)) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (ipc.isElectronEnv()) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `boxRes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const boxRes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const boxRes = await ipc.showMessageBox({
          type: 'question',
          buttons: ['예 (권장)', '아니오'],
          defaultId: 0,
          title: '아메바 문서 포맷 변환 권장',
          message: '문서에 대용량 미디어 파일(동영상/오디오)이 감지되었습니다.\n미디어 공유가 완벽하게 지원되고 용량이 절감되는 아메바 문서 포맷(.adc)으로 변환하여 저장하시겠습니까?\n\n(아니오를 선택하시면 일반 마크다운 형식으로 저장이 계속 진행됩니다.)',
        })
        
        // 예 선택 시 adc 패키지 변환 저장
        if (boxRes.response === 0) {
          // 기본 저장 파일명 뒤에 .adc 확장자를 미리 바인딩하여 다이얼로그의 디폴트 가이드로 제공
          const defaultAdcPath = filePath ? filePath.split('.').slice(0, -1).join('.') + '.adc' : 'document.adc'
          const saveResult = await ipc.saveFile('', defaultAdcPath)
          
          if (saveResult && saveResult.success && saveResult.filePath) {
            let savedPath = saveResult.filePath
            // [BUG-FIX] 사용자가 대화상자에서 확장자를 md 등으로 실수했어도, 팝업에서 예(adc로 저장)를 골랐으므로 무조건 .adc 강제 고정
            if (!savedPath.toLowerCase().endsWith('.adc')) {
              savedPath = savedPath.split('.').slice(0, -1).join('.') + '.adc'
            }

            const blob = await packMarkdownToADC(markdown, undefined, editor.document)
            const arrayBuffer = await blob.arrayBuffer()
            const contentToSave = await arrayBufferToBase64(arrayBuffer)

            // 보정된 경로로 최종 저장 기입 실행 (ADC 파일은 바이너리이므로 writeBinary 사용)
            if (window.electronAPI?.writeBinary) {
              await window.electronAPI.writeBinary(savedPath, contentToSave)
            } else {
              await ipc.saveFile(contentToSave, savedPath) // fallback
            }
            setFilePath(savedPath)
            setOriginalContent(rawMarkdown)
            setLastSavedTime(new Date())
            createSnapshot(`Ameva Document 저장본`, contentToSave)
            return
          } else {
            return
          }
        }
      } else {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `confirmSave`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const confirmSave = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const confirmSave = window.confirm("문서에 동영상 또는 오디오 파일이 포함되어 있습니다. 아메바 전용 포맷(.adc)으로 저장하시겠습니까?")
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `confirmSave`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (confirmSave)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (confirmSave) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `blob`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const blob = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const blob = await packMarkdownToADC(markdown, undefined, editor.document)
          triggerBrowserDownload(blob, (filePath ? filePath.split('.').slice(0, -1).join('.') : 'document') + '.adc')
          return
        }
      }
    }
    
    // 2) 일반 포맷 저장 진행
    const isBinarySave = ['docx', 'pdf', 'hwpx', 'xlsx', 'xls', 'adc'].includes(ext)
    
    let contentToSave: string
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ext === 'ipynb'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ext === 'ipynb')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ext === 'ipynb') {
      contentToSave = convertMarkdownToIpynb(markdown)
    } else if (isBinarySave) {
      contentToSave = await convertMarkdownToBinary(editor, path)
    } else {
      contentToSave = markdown
    }
    
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ipc.isElectronEnv()) {
      let savedPath = filePath
      
      // 파일 경로가 없으면(새 문서) 대화상자 호출
      if (!savedPath) {
        const promptResult = await ipc.saveFile('', undefined)
        if (promptResult && promptResult.success && promptResult.filePath) {
          savedPath = promptResult.filePath
        } else {
          return // 취소됨
        }
      }

      // 확장자가 없거나 틀린 경우 자동 보정 로직 (isBinarySave 중 adc 우선)
      if (ext === 'adc' && !savedPath.toLowerCase().endsWith('.adc')) {
        savedPath = savedPath.split('.').slice(0, -1).join('.') + '.adc'
      }

      // 최종 파일 쓰기 (바이너리 포맷이면 writeBinary 사용)
      let saveSuccess = false
      if (isBinarySave && window.electronAPI?.writeBinary) {
        const writeRes = await window.electronAPI.writeBinary(savedPath, contentToSave)
        saveSuccess = writeRes.success
      } else {
        const saveRes = await ipc.saveFile(contentToSave, savedPath)
        saveSuccess = saveRes.success
      }

      if (saveSuccess) {
        setFilePath(savedPath)
        setOriginalContent(rawMarkdown)
        setLastSavedTime(new Date())
        createSnapshot(`저장본 (${new Date().toLocaleTimeString()})`, contentToSave)
      }
    } else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `window.Capacitor && window.Capacitor.isNativePlatform()`
       * - 만족 시: 모바일 네이티브 쉘(Capacitor) 환경으로 작동하므로 모바일 전용 FileSystemAdapter를 통해 직접 저장합니다.
       * - 불만족 시: 일반 웹 브라우저 다운로드 파이프라인으로 폴백합니다.
       */
      try {
        const adapter = getPlatformAdapter();
        const targetPath = filePath || 'Documents/document.' + ext;
        await adapter.fs.writeFile(targetPath, contentToSave);
        setFilePath(targetPath);
        setOriginalContent(rawMarkdown);
        setLastSavedTime(new Date());
        createSnapshot(`모바일 저장본 (${new Date().toLocaleTimeString()})`, contentToSave);
      } catch (err: any) {
        console.error('[Mobile Save] 실패:', err);
        alert('모바일 문서 저장 실패: ' + err.message);
      }
    } else {
      if (ext === 'adc') {
        const blob = await packMarkdownToADC(markdown, undefined, editor?.document)
        const dlName = filePath ? (filePath.includes('.') ? filePath.split(/[\\/]/).pop()! : filePath.split(/[\\/]/).pop() + '.adc') : 'document.adc'
        triggerBrowserDownload(blob, dlName)
      } else {
        triggerBrowserDownload(contentToSave, filePath ? filePath.split(/[\\/]/).pop()! : 'document.' + ext)
      }
      createSnapshot('웹 브라우저 저장본', contentToSave)
    }
  }, [editor, filePath, setFilePath, setOriginalContent, setLastSavedTime, createSnapshot])

  /**
   * [CONTRACT - Save As File]
   * - Rationale: 현재 내용을 새로운 다른 이름의 파일 경로로 저장 대화상자를 열어 주입한다.
   */
  const handleSaveAsFile = useCallback(async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `markdown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const markdown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const rawMarkdown = await editor.blocksToMarkdownLossy(convertJupyterToCodeBlocks(editor.document))
    const markdown = convertMediaSchemaToLocalPaths(rawMarkdown)
    
    // 기본으로 adc 패키징하여 준비
    const blob = await packMarkdownToADC(markdown, undefined, editor.document)
    
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ipc.isElectronEnv()) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `saveResult`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const saveResult = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const arrayBuffer = await blob.arrayBuffer()
      const contentToSave = await arrayBufferToBase64(arrayBuffer)
      
      const saveResult = await ipc.saveFile('', undefined)
      if (saveResult && saveResult.success && saveResult.filePath) {
        let savedPath = saveResult.filePath
        if (!savedPath.toLowerCase().endsWith('.adc')) {
          savedPath = savedPath.split('.').slice(0, -1).join('.') + '.adc'
        }
        
        if (window.electronAPI?.writeBinary) {
          await window.electronAPI.writeBinary(savedPath, contentToSave)
        } else {
          await ipc.saveFile(contentToSave, savedPath)
        }
        
        setFilePath(savedPath)
        setOriginalContent(rawMarkdown)
        setLastSavedTime(new Date())
        createSnapshot('다른 이름으로 저장본', contentToSave)
      }
    } else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `window.Capacitor && window.Capacitor.isNativePlatform()`
       * - 만족 시: 모바일 환경에서 다른 이름으로 저장 동작을 실행하여, 물리 파일로 직접 기록합니다.
       * - 불만족 시: 일반 웹 브라우저 안내로 폴백합니다.
       */
      try {
        const adapter = getPlatformAdapter();
        const targetPath = prompt("저장할 파일 경로를 입력하세요:", filePath || 'Documents/document_new.adc');
        if (targetPath) {
          await adapter.fs.writeFile(targetPath, markdown);
          setFilePath(targetPath);
          setOriginalContent(markdown);
          setLastSavedTime(new Date());
          createSnapshot('모바일 다른 이름으로 저장본', markdown);
        }
      } catch (err: any) {
        console.error('[Mobile SaveAs] 실패:', err);
        alert('모바일 다른 이름 저장 실패: ' + err.message);
      }
    } else {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `wantOther`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const wantOther = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const wantOther = window.confirm(
        '브라우저에서는 파일 저장 대화상자가 지원되지 않습니다.\n' +
        'Markdown(.md) 파일로 다운로드하시겠습니까?\n' +
        '(Excel, PDF 등 다른 형식은 상단 [내보내기] 메뉴를 사용하세요)'
      )
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `wantOther`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (wantOther)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (wantOther) {
        triggerBrowserDownload(markdown, 'document_new.md')
      }
    }
  }, [editor, setFilePath, setOriginalContent, setLastSavedTime, createSnapshot])

  /*
   * [AUTO TABS SYNCHRONIZATION EFFECT]
   * - Rationale: AI 에이전트가 백그라운드 태스크 수행 중 VFS 파일 쓰기(write_file)를 성공하면,
   *   Zustand 탭 리스트를 뒤져 탭이 없으면 신설(openFileInTab)하고, 있으면 탭을 포커싱한 후 
   *   실시간 본문 렌더링(loadMarkdownIntoEditor)을 갱신하여 사용자 화면에 실시간 드로잉을 시각화한다.
   */
  useEffect(() => {
    if (!editor) return

    const handleAutoWrite = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail) return
      const filePathVal = detail.filePath || detail.path
      const contentVal = detail.content || ''
      if (!filePathVal) return
      
      const targetTab = tabs.find(t => t.filePath === filePathVal)
      
      if (!targetTab) {
        // .log 파일이나 /sys/ 파일인 경우 자동으로 새 탭을 열지 않음
        if (filePathVal.endsWith('.log') || filePathVal.startsWith('/sys/')) {
          return
        }
        // 새 탭 신설 및 활성화
        const newTabId = 'tab_' + Math.random().toString(36).substring(2, 9)
        const newTab = {
          id: newTabId,
          filePath: filePathVal,
          content: contentVal,
          blocks: [],
          originalContent: contentVal,
          lastSavedTime: new Date()
        }
        useWorkspaceStore.getState().addTab(newTab)
        setActiveTabId(newTabId)
        setEditorMode('edit')
        
        // 동기적으로 에디터에 로딩
        await openFileInTab(editor, contentVal, filePathVal, false)
      } else {
        // .log 파일이나 /sys/ 파일인 경우 활성 탭 전환 없이 내용만 조용히 업데이트
        if (filePathVal.endsWith('.log') || filePathVal.startsWith('/sys/')) {
          useWorkspaceStore.getState().updateTab(targetTab.id, { content: contentVal })
          if (activeTabId === targetTab.id) {
            await loadMarkdownIntoEditor(editor, contentVal, false, filePathVal)
          }
        } else {
          // 기존 탭 활성화 포커스
          setActiveTabId(targetTab.id)
          
          // 포커싱 후 본문 내용 동기화
          if (activeTabId === targetTab.id) {
            await loadMarkdownIntoEditor(editor, contentVal, false, filePathVal)
          } else {
            try {
              const parsed = await editor.tryParseMarkdownToBlocks(normalizeMarkdown(contentVal))
              useWorkspaceStore.getState().updateActiveTab({
                filePath: filePathVal,
                content: contentVal,
                blocks: parsed
              })
            } catch (err: unknown) {
              console.warn('[AutoUpdate] 비활성 탭 버퍼 동기화 오류:', err)
            }
          }
        }
      }
    }

    window.addEventListener('ameva:file-auto-write', handleAutoWrite)

    return () => {
      window.removeEventListener('ameva:file-auto-write', handleAutoWrite)
    }
  }, [editor, activeTabId, tabs, openFileInTab, loadMarkdownIntoEditor, setEditorMode, setActiveTabId])

  return {
    loadMarkdownIntoEditor,
    appendMarkdownIntoEditor,
    openFileInTab,
    handleStartNewDocument,
    handleOpenFile,
    handleSaveFile,
    handleSaveAsFile
  }
}

