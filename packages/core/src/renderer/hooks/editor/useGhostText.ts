/**
 * ============================================================================
 * @file useGhostText.ts
 * @description useGhostText.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useGhostText';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file useGhostText.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/hooks/editor/useGhostText.ts
 * @role Ghost Text 자동완성 LLM 오케스트레이션 훅
 *
 * [책임 범위 - RESPONSIBILITY]
 * - GhostTextPlugin을 BlockNote(TipTap) 에디터에 주입한다.
 * - Adaptive Debounce 스케줄러로 LLM 추론 시점을 제어한다.
 * - WebLLM 스트림을 비동기 실행하고, 50ms Throttle로 Decoration을 갱신한다.
 * - Plugin에서 오는 onAccept/onDismiss 콜백을 처리하여 stream을 abort한다.
 * - 에디터 라이프사이클에 따라 모든 이벤트 리스너와 타이머를 정리한다.
 *
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - Decoration 렌더링 (GhostTextPlugin 담당)
 * - Tab/Escape 키 이벤트 감지 (GhostTextPlugin 담당)
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - requestId는 전역 변수가 아닌 useRef로 에디터 인스턴스 단위로 격리한다.
 * - 모든 invalidation은 반드시 clearAndAbort()를 거친다. 직접 dispatch하지 않는다.
 * - beforeinput과 editor.on('update')의 역할을 명확히 분리하여 중복 invalidation을 방지한다.
 *   - beforeinput → clearAndAbort() 후 schedule
 *   - editor.on('update') → Ghost meta tr이 아닌 경우에만 clearAndAbort()
 * - callbacksRef를 통해 항상 최신 콜백을 호출하여 stale closure를 방지한다.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import { useEffect, useRef, useCallback, useMemo } from 'react';
// [외부 패키지 및 라이브러리 임포트: lodash/throttle]
import throttle from 'lodash/throttle';
import {
  ghostTextKey,
  createGhostTextPlugin,
  postProcessSuggestion,
  buildSystemPrompt,
  getTextAfterCursor,
  getTextBeforeCursor,
  type GhostTextCallbacks,
} from '../../services/llm/ghostText/GhostTextPlugin';

// RAG 인덱스 DB 디스크 I/O 병목 해소를 위한 메모리 TTL 캐시 (30초)
let cachedRAGChunks: any[] | null = null;
let lastRAGChunksFetchTime = 0;
const RAG_CACHE_TTL = 30000;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * UseGhostTextParams 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface UseGhostTextParams {
  /** BlockNote 에디터 인스턴스 */
  editor: any;
  /** useWebLLM의 generateStream 함수 */
  generateStream: (
    systemPrompt: string,
    userPrompt: string,
    options?: { signal?: AbortSignal; max_tokens?: number; temperature?: number; stop?: string[] }
  ) => AsyncGenerator<string, void, unknown>;
  /** WebLLM 모델이 로드 완료되었는지 여부 */
  isLLMReady: boolean;
  /** Ghost Text 기능 ON/OFF 토글 */
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────
// Helpers (hook 외부 순수 함수)
// ─────────────────────────────────────────────────────────────

/**
 * scheduleGhost 실행 가능 여부를 판단하는 Guard 함수.
 * 모든 전제 조건이 충족되어야만 LLM 추론을 시작할 수 있다.
 */
function canSchedule(view: any, isComposing: boolean): boolean {
  if (!view || !view.editable)          return false; // 에디터 비활성/읽기전용
  if (typeof view.hasFocus === 'function' && !view.hasFocus()) return false; // 포커스 없음
  if (!view.state.selection.empty)      return false; // 텍스트 선택 상태
  if (isComposing || view.composing)    return false; // IME 조합 중
  // 커서 앞 최소 3자 이상 있어야 의미 있는 컨텍스트로 판단
  const pos = view.state.selection.from;
  const before = view.state.doc.textBetween(Math.max(0, pos - 50), pos, '');
  if (before.trim().length < 3)         return false;
  return true;
}

/**
 * show dispatch 직전 최종 유효성 검사.
 * runGeneration 시작 시점의 pos/requestId가 현재도 유효한지 확인한다.
 */
function canShow(
  view: any,
  pos: number,
  currentId: number,
  requestIdRef: React.MutableRefObject<number>,
  isComposingRef: React.MutableRefObject<boolean>
): boolean {
  if (!view?.hasFocus?.())              return false;
  if (view.composing || isComposingRef.current) return false;
  if (!view.state.selection.empty)      return false;
  if (view.state.selection.from !== pos) return false;
  if (pos > view.state.doc.content.size) return false;
  if (currentId !== requestIdRef.current) return false; // Stale guard
  return true;
}

/**
 * 컨텍스트 키 생성. 동일 컨텍스트에서의 중복 요청을 방지하기 위해 사용한다.
 * pos + blockType + before 400자 + after 100자 기반으로 구성한다.
 */
function buildContextKey(view: any, pos: number): string {
  const state = view.state;
  const before = state.doc.textBetween(Math.max(0, pos - 400), pos, '\n');
  const after  = state.doc.textBetween(pos, Math.min(state.doc.content.size, pos + 100), '\n');
  const blockType = state.selection.$from?.parent?.type?.name ?? 'paragraph';
  return `${blockType}::${pos}::${before.slice(-200)}::${after.slice(0, 50)}`;
}

/**
 * LLM에 전달할 문서 컨텍스트를 커서 전후에서 추출한다.
 * - Before: 최대 1500자
 * - After:  최대 300자
 */
function extractContext(view: any, pos: number): string {
  const state = view.state;
  const before = state.doc.textBetween(Math.max(0, pos - 1500), pos, '\n');
  const after  = state.doc.textBetween(pos, Math.min(state.doc.content.size, pos + 300), '\n');
  return `BEFORE:\n${before}\n\nAFTER:\n${after}`;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

/**
 * useGhostText 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function useGhostText({
  editor,
  generateStream,
  isLLMReady,
  enabled,
}: UseGhostTextParams) {

  // ── Refs: 에디터 인스턴스 단위로 격리 (전역 변수 사용 절대 금지) ──
  /** Stale response 차단용. clearAndAbort 시 항상 먼저 증가한다. */
  const requestIdRef       = useRef(0);
  /** 현재 진행 중인 LLM 스트림의 AbortController */
  const abortControllerRef = useRef<AbortController | null>(null);
  /** Adaptive debounce 타이머 핸들 */
  const debounceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** IME 조합 중 여부 */
  const isComposingRef     = useRef(false);
  /**
   * 마지막 요청의 컨텍스트 키. 동일 컨텍스트 중복 요청 방지용.
   * clearAndAbort 시에는 리셋하지 않고, Accept 시에만 리셋한다.
   * (dismiss 후 동일 컨텍스트 재발동 방지 유지)
   */
  const lastContextKeyRef  = useRef('');
  /** throttledUpdate 함수 참조 (cancel을 위해 보관) */
  const throttleRef        = useRef<ReturnType<typeof throttle> | null>(null);

  /**
   * [Plugin Callback Bridge]
   * callbacksRef: Plugin 생성 시 주입되는 콜백을 감싸는 Ref.
   *
   * [Stale Closure 방지 핵심]
   * Plugin은 생성 시점에 콜백을 클로저로 캡처하는 대신,
   * callbacksRef.current를 호출하여 항상 최신 함수를 참조한다.
   * 이로써 Plugin이 재생성 없이도 최신 hook 상태와 통신할 수 있다.
   */
  const callbacksRef = useRef<GhostTextCallbacks>({
    onAccept: () => {},
    onDismiss: () => {},
  });

  // ─────────────────────────────────────────────────────────────
  // clearAndAbort: 모든 Invalidation의 단일 진입점
  // ─────────────────────────────────────────────────────────────

  /**
   * Ghost Text와 LLM stream을 원자적으로 무효화한다.
   * 모든 clear/dismiss/abort는 반드시 이 함수를 거쳐야 한다.
   *
   * 실행 순서 (순서 중요):
   * 1. requestId 먼저 증가 → 이미 진행 중인 stream의 stale guard를 논리적으로 차단
   * 2. abort → GPU/JS 레벨 취소 신호 (best-effort, 늦을 수 있음)
   * 3. timer clear
   * 4. throttle cancel
   * 5. Ghost Plugin state clear (isActive일 때만 dispatch하여 불필요한 tr 방지)
   */
  const clearAndAbort = useCallback((view?: any) => {
    // 1. requestId 증가 (논리적 stale 차단 — abort보다 반드시 먼저)
    requestIdRef.current += 1;

    // 2. LLM stream abort
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // 3. debounce timer 중단
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 4. throttle cancel (flush 없이 취소)
    throttleRef.current?.cancel();
    throttleRef.current = null;

    // 5. Plugin state clear — isActive 또는 text가 있을 때만 dispatch (불필요한 tr 방지)
    // beforeinput 등 브라우저 네이티브 이벤트 도중 동기적인 dispatch는 PM DOM sync를 유발하므로 마이크로태스크로 지연
    if (view) {
      const ghost = ghostTextKey.getState(view.state);
      if (ghost?.isActive || ghost?.text) {
        queueMicrotask(() => {
          // 마이크로태스크 실행 시점의 최신 상태 재확인
          const currentGhost = ghostTextKey.getState(view.state);
          if (currentGhost?.isActive || currentGhost?.text) {
            const tr = view.state.tr.setMeta(ghostTextKey, { type: 'clear' });
            tr.setMeta('addToHistory', false);
            view.dispatch(tr);
          }
        });
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // runGeneration: LLM 스트림 실행
  // ─────────────────────────────────────────────────────────────

  const runGeneration = useCallback(async (view: any, pos: number, context: string) => {
    // 새 요청 시작: requestId 증가 및 이전 stream abort
    requestIdRef.current += 1;
    const currentId = requestIdRef.current;

    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    // 청크 누적 버퍼 (throttle로 Decoration 갱신 횟수를 제한)
    let buffer = '';

    /**
     * [Throttled Dispatch: 50ms 주기]
     * 초당 수십 번의 청크를 매번 dispatch하면 PM transaction 비용 폭주.
     * 50ms throttle로 Decoration 갱신 횟수를 제한한다.
     * 각 호출 내부에서 canShow guard로 stale/invalid 상태를 재확인한다.
     */
    const throttledShow = throttle((text: string, reqId: number) => {
      if (!canShow(view, pos, reqId, requestIdRef, isComposingRef)) return;
      const tr = view.state.tr.setMeta(ghostTextKey, {
        type: 'show', text, pos, requestId: reqId,
      });
      tr.setMeta('addToHistory', false);
      view.dispatch(tr);
    }, 50);
    throttleRef.current = throttledShow;

    try {
      // [RAG Smart Copilot Context Lookup with TTL Cache]
      let referenceContext = '';
      try {
        const now = Date.now();
        if (!cachedRAGChunks || now - lastRAGChunksFetchTime > RAG_CACHE_TTL) {
          const { loadAllChunks } = await import('../../features/rag-embedding/vectorStore');
          cachedRAGChunks = await loadAllChunks();
          lastRAGChunksFetchTime = now;
        }
        if (cachedRAGChunks && cachedRAGChunks.length > 0) {
          const { searchKeywordOnly } = await import('../../features/rag-embedding/vectorStore');
          const beforeTextSample = getTextBeforeCursor(view.state, pos, 60);
          const matched = searchKeywordOnly(beforeTextSample, 1, cachedRAGChunks);
          if (matched.length > 0 && (matched[0].score || 0) > 10) {
            const topChunk = matched[0];
            const headingPrefix = topChunk.heading ? `[${topChunk.heading}] ` : '';
            referenceContext = `${headingPrefix}${topChunk.text.slice(0, 150)}`;
          }
        }
      } catch {
        // RAG 저장소 조회 실패 시 기존 컨텍스트로 무중단 진행
      }

      const stream = generateStream(
        buildSystemPrompt(referenceContext),
        `[CONTEXT]\n${context}`,
        {
          signal: ac.signal,
          max_tokens: 32,
          temperature: 0.2,
          stop: ['\n\n', '```', '---'],
        }
      );

      for await (const chunk of stream) {
        // Stale Guard: requestId가 바뀌었으면 이미 abort됐어도 즉시 탈출
        if (currentId !== requestIdRef.current) break;
        buffer += chunk;
        const beforeText = getTextBeforeCursor(view.state, pos, 50);
        const processed = postProcessSuggestion(buffer, '', beforeText);
        if (processed) throttledShow(processed, currentId);
      }

      // 스트림 정상 종료: throttle cancel 후 최종 버퍼를 1회 dispatch
      throttledShow.cancel();
      throttleRef.current = null;

      if (currentId === requestIdRef.current && buffer) {
        const afterText = getTextAfterCursor(view.state, pos, 100);
        const beforeText = getTextBeforeCursor(view.state, pos, 50);
        const finalText = postProcessSuggestion(buffer, afterText, beforeText);
        if (finalText && canShow(view, pos, currentId, requestIdRef, isComposingRef)) {
          const tr = view.state.tr.setMeta(ghostTextKey, {
            type: 'show', text: finalText, pos, requestId: currentId,
          });
          tr.setMeta('addToHistory', false);
          view.dispatch(tr);
        }
      }
    } catch (err: any) {
      // AbortError는 정상 취소이므로 무시
      if (err?.name !== 'AbortError') {
        console.error('[useGhostText] LLM stream error:', err);
        clearAndAbort(view);
      }
    } finally {
      // ac 참조 해제 (메모리 릭 방지)
      if (abortControllerRef.current === ac) {
        abortControllerRef.current = null;
      }
    }
  }, [generateStream, clearAndAbort]);

  // ─────────────────────────────────────────────────────────────
  // scheduleGhost: Adaptive Debounce 스케줄러
  // ─────────────────────────────────────────────────────────────

  const scheduleGhost = useCallback((view: any, delay: number, force: boolean = false) => {
    if (!isLLMReady || !enabled) return;

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // 1. 조건 검사 (force가 true면 canSchedule 무시 - 단축키 등 명시적 의도)
      if (!force && !canSchedule(view, isComposingRef.current)) return;

      // 타이머 만료 시점에 다시 guard 재확인
      if (!canSchedule(view, isComposingRef.current)) return;

      const pos    = view.state.selection.from;
      const ctxKey = buildContextKey(view, pos);

      // 동일 컨텍스트 중복 요청 방지
      if (ctxKey === lastContextKeyRef.current) return;
      lastContextKeyRef.current = ctxKey;

      const context = extractContext(view, pos);
      runGeneration(view, pos, context);
    }, delay);
  }, [isLLMReady, enabled, runGeneration]);

  // ─────────────────────────────────────────────────────────────
  // Plugin 주입 및 이벤트 리스너 등록
  // ─────────────────────────────────────────────────────────────

  /**
   * [Plugin 주입 방식]
   * BlockNote는 내부적으로 TipTap을 사용한다.
   * TipTap editor는 `editor.registerPlugin(plugin)` API를 공개하므로,
   * 이를 통해 런타임에 GhostTextPlugin을 안전하게 삽입한다.
   * - `editor._tiptapEditor`를 직접 건드리는 방식보다 공식 API 우선 사용.
   * - view는 `proseMirrorView` (BlockNote 공개 필드) → `_tiptapEditor.view` fallback 순으로 접근.
   */
  useEffect(() => {
    if (!editor || !isLLMReady || !enabled) return;

    // BlockNote 에디터에서 ProseMirror view 획득 및 마운트 상태 안전 가드
    let view: any = null;
    try {
      if ((editor as any).proseMirrorView) {
        view = (editor as any).proseMirrorView;
      } else if ((editor as any)._tiptapEditor && !(editor as any)._tiptapEditor.isDestroyed) {
        try {
          view = (editor as any)._tiptapEditor.view;
        } catch {
          view = null;
        }
      }
    } catch {
      view = null;
    }

    if (!view) return;
    let dom: HTMLElement | null = null;
    try {
      dom = view.dom;
    } catch {
      dom = null;
    }
    if (!dom) return;

    // ── onAccept/onDismiss 콜백 설정 (callbacksRef.current 갱신) ──

    callbacksRef.current = {
      /**
       * Tab Accept 처리.
       * Plugin이 의도를 감지해 이 함수를 호출하며, React가 원자적으로 처리한다.
       */
      onAccept: (text: string, pos: number, isPartial?: boolean) => {
        // isPartial이면 단어 하나(띄어쓰기 포함)만 잘라낸다.
        let word = text;
        if (isPartial) {
          const match = text.match(/^(\S+\s*)/);
          if (match) word = match[1];
        }

        clearAndAbort(view);
        
        const tr = view.state.tr.insertText(word, pos);
        view.dispatch(tr);

        // 부분 수락의 경우 바로 이어서 다음 텍스트 생성을 강제 요청
        if (isPartial) {
          setTimeout(() => scheduleGhost(view, 0, true), 10);
        }
      },

      /**
       * Escape 또는 빈 Accept 처리.
       * clearAndAbort로 stream, timer, throttle, decoration을 모두 정리한다.
       */
      onDismiss: () => {
        clearAndAbort(view);
        // Dismiss 후 동일 컨텍스트 즉시 재발동 방지를 위해 key를 유지한다.
        // (lastContextKeyRef는 리셋하지 않음)
      },
    };

    // ── GhostTextPlugin 주입 ──
    const plugin = createGhostTextPlugin(callbacksRef);
    const tiptap = (editor as any)._tiptapEditor;
    if (tiptap?.registerPlugin) {
      tiptap.registerPlugin(plugin);
    }

    // ─────────────────────────────────────────────────────────────
    // 이벤트 리스너 등록
    // ─────────────────────────────────────────────────────────────

    const handleBeforeInput = (e: InputEvent) => {
      if (isComposingRef.current) return;
      const { inputType } = e;
      if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
        clearAndAbort(view);
        return;
      }
      if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
        clearAndAbort(view);
        setTimeout(() => scheduleGhost(view, 700), 0);
        return;
      }
      const isSentenceEnd =
        inputType === 'insertParagraph' ||
        inputType === 'insertLineBreak' ||
        (inputType === 'insertText' && e.data != null && ['.', '!', '?'].includes(e.data));
      clearAndAbort(view);
      setTimeout(() => scheduleGhost(view, isSentenceEnd ? 300 : 600), 0);
    };

    const handleEditorUpdate = ({ transaction: tr }: { transaction: any }) => {
      if (isComposingRef.current) return;
      if (tr.getMeta?.(ghostTextKey)) return;
      if (tr.docChanged) {
        clearAndAbort(view);
      } else if (tr.selectionSet) {
        const ghost = ghostTextKey.getState(view.state);
        if (ghost?.isActive && tr.selection?.from !== ghost.pos) {
          clearAndAbort(view);
        }
      }
    };
    editor.on?.('update', handleEditorUpdate);

    const handleCompositionStart = () => { isComposingRef.current = true; clearAndAbort(view); };
    const handleCompositionEnd = () => { isComposingRef.current = false; queueMicrotask(() => scheduleGhost(view, 500)); };
    
    // [이벤트 리스너 3] keydown (Ctrl+Space 수동 트리거 감지)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        clearAndAbort(view);
        scheduleGhost(view, 0, true);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Escape') return;
      if (e.isComposing || isComposingRef.current) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        clearAndAbort(view);
      }
    };

    const handleBlur      = () => clearAndAbort(view);
    const handleMouseDown = () => clearAndAbort(view);
    const handleDrop      = () => clearAndAbort(view);

    dom.addEventListener('beforeinput',      handleBeforeInput as EventListener);
    dom.addEventListener('keydown',          handleKeyDown as EventListener);
    dom.addEventListener('compositionstart', handleCompositionStart);
    dom.addEventListener('compositionend',   handleCompositionEnd);
    dom.addEventListener('blur',             handleBlur);
    dom.addEventListener('mousedown',        handleMouseDown);
    dom.addEventListener('drop',             handleDrop);

    // ── Cleanup ──
    return () => {
      try {
        clearAndAbort(view);
        editor.off?.('update', handleEditorUpdate);

        // Plugin 제거
        if (tiptap?.unregisterPlugin) {
          tiptap.unregisterPlugin(ghostTextKey);
        }

        // 모든 DOM 이벤트 리스너 제거
        if (dom) {
          dom.removeEventListener('beforeinput',      handleBeforeInput as EventListener);
          dom.removeEventListener('keydown',          handleKeyDown);
          dom.removeEventListener('compositionstart', handleCompositionStart);
          dom.removeEventListener('compositionend',   handleCompositionEnd);
          dom.removeEventListener('blur',             handleBlur);
          dom.removeEventListener('mousedown',        handleMouseDown);
          dom.removeEventListener('drop',             handleDrop);
        }
      } catch (err) {
        console.warn('[useGhostText] Cleanup error suppressed:', err);
      }
    };
  }, [editor, isLLMReady, enabled, clearAndAbort, scheduleGhost]);
}
