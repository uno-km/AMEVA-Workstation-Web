/**
 * @file GhostTextPlugin.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/services/llm/ghostText/GhostTextPlugin.ts
 * @role ProseMirror Ghost Text 렌더링 플러그인
 *
 * [책임 범위 - RESPONSIBILITY]
 * - Ghost Text 상태(GhostTextState)를 ProseMirror plugin state로 보관한다.
 * - 유효한 Ghost Text가 존재할 때, 커서 뒤에 Decoration.widget을 렌더링한다.
 * - Tab/Escape 키 의도를 감지하고, 실제 처리는 callbacks를 통해 React로 위임한다.
 * - doc 변경 또는 selection 이탈 시 Plugin state를 자체적으로 clean up한다.
 *
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - LLM stream 관리, requestId 증가, AbortController 호출은 절대 하지 않는다.
 * - React state(useState)는 절대 건드리지 않는다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - 모든 Ghost meta transaction에는 반드시 `addToHistory: false`를 명시한다.
 * - Tab Accept transaction에는 addToHistory를 명시하지 않는다 (기본값 true = Ctrl+Z 지원).
 * - Meta key는 반드시 ghostTextKey PluginKey 객체만 사용한다 (문자열 키 절대 금지).
 * - 플러그인은 콜백을 통해서만 React와 통신한다. 직접 Ref를 건드리지 않는다.
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorState, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { EditorView } from 'prosemirror-view';

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

/** Plugin이 보관하는 Ghost Text 상태 */
export interface GhostTextState {
  /** 현재 표시 중인 자동완성 텍스트 */
  text: string;
  /** Decoration을 삽입할 절대 문서 위치 (= 요청 시점 커서 pos) */
  pos: number | null;
  /** Stale response 차단용 ID. React에서 clearAndAbort 시 증가됨 */
  requestId: number;
  /** 현재 Decoration 표시 여부 */
  isActive: boolean;
}

/** Plugin이 외부(React)로 위임하는 콜백 인터페이스 */
export interface GhostTextCallbacks {
  /**
   * Tab Accept 의도 시 호출.
   * React 내부에서 requestId++, abort, insertText, ghost clear를 처리함.
   * @param text trimOverlap이 적용된 최종 삽입 텍스트
   * @param pos  삽입 위치 (ghostState.pos)
   * @param isPartial  단어 단위 부분 수락 여부
   */
  onAccept: (text: string, pos: number, isPartial?: boolean) => void;
  /**
   * Escape 또는 빈 Accept 시 호출.
   * React 내부에서 requestId++, abort, ghost clear를 처리함.
   */
  onDismiss: () => void;
}

/** PluginKey 기반 Meta Action 타입 (문자열 키 사용 금지) */
export type GhostTextMeta =
  | { type: 'show';  text: string; pos: number; requestId: number }
  | { type: 'clear' };

/** Plugin meta key (전역 싱글톤) */
export const ghostTextKey = new PluginKey<GhostTextState>('ghostText');

const INITIAL_STATE: GhostTextState = {
  text: '', pos: null, requestId: 0, isActive: false,
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * 커서 이후 limit 글자를 추출한다.
 * trimOverlap 및 Tab Accept 전 중복 체크에 사용된다.
 */
export function getTextAfterCursor(state: EditorState, pos: number, limit: number): string {
  const end = Math.min(state.doc.content.size, pos + limit);
  if (end <= pos) return '';
  return state.doc.textBetween(pos, end, '');
}

/**
 * ghost 완성 텍스트와 커서 이후 텍스트의 prefix overlap을 제거한다.
 * 예: ghost="안녕하세요 만나서", after="만나서 반갑습니다" → "안녕하세요 "
 */
export function trimOverlap(ghostText: string, afterText: string): string {
  const maxCheck = Math.min(ghostText.length, afterText.length, 40);
  for (let len = maxCheck; len > 0; len--) {
    if (ghostText.endsWith(afterText.slice(0, len))) {
      return ghostText.slice(0, ghostText.length - len);
    }
  }
  return ghostText;
}

/**
 * 커서 이전 텍스트 반환
 */
export function getTextBeforeCursor(state: EditorState, pos: number, maxLen: number): string {
  const start = Math.max(0, pos - maxLen);
  return state.doc.textBetween(start, pos, '\n');
}

/**
 * Ghost Text 앞부분이 beforeText의 뒷부분과 겹치면 해당 부분을 제거한다.
 * 예: beforeText="...안녕", ghostText="안녕하세요" -> "하세요" 반환
 */
export function trimPrefixOverlap(ghost: string, beforeText: string): string {
  const ghostClean = ghost.trimStart(); // 공백 무시
  const ghostSpaces = ghost.substring(0, ghost.length - ghostClean.length);
  
  const maxOverlap = Math.min(ghostClean.length, beforeText.length);
  // 가장 긴 겹침부터 확인
  for (let i = maxOverlap; i > 0; i--) {
    const ghostPrefix = ghostClean.substring(0, i);
    const beforeSuffix = beforeText.substring(beforeText.length - i);
    if (ghostPrefix === beforeSuffix) {
      return ghostSpaces + ghostClean.substring(i);
    }
  }
  return ghost;
}

/**
 * LLM 출력 후처리 파이프라인.
 * 코드펜스, 따옴표, 과도한 줄바꿈, AFTER 중복 제거, BEFORE 중복 제거 및 길이 제한
 * @returns 정제된 텍스트. 비어있으면 빈 문자열 반환
 */
export function postProcessSuggestion(raw: string, afterText: string, beforeText: string = ''): string {
  let text = raw;
  // 코드펜스 제거
  text = text.replace(/```[\s\S]*?```/g, '').trim();
  // 앞뒤 따옴표/백틱 제거
  text = text.replace(/^["'`]+|["'`]+$/g, '').trim();
  // 연속 줄바꿈 2회 이상이면 첫 문단만
  text = text.split(/\n{2,}/)[0].trimEnd();
  // max length: 한국어 기준 100자
  if (text.length > 100) text = text.slice(0, 100);
  // BEFORE 중복 접두사 제거 (예: 안녕| + 안녕하세요 -> 하세요)
  if (beforeText) {
    text = trimPrefixOverlap(text, beforeText);
  }
  // AFTER 중복 접미사 제거
  text = trimOverlap(text, afterText);
  // 너무 짧으면 폐기
  if (text.trim().length < 2) return '';
  return text;
}

/** LLM 시스템 프롬프트 (RAG 지능형 컨텍스트 지원) */
export function buildSystemPrompt(referenceContext?: string): string {
  const refSection = referenceContext && referenceContext.trim()
    ? `\n[RELEVANT REFERENCE CONTEXT]\n${referenceContext.trim()}\n`
    : '';

  return `You are an inline text completion engine embedded in a document editor.${refSection}
Continue the text at the cursor position with a short completion phrase grounded in the context.

STRICT RULES:
- Output ONLY the completion text. No explanation, no preamble.
- Do NOT wrap in quotes, markdown fence, or code blocks.
- Match the exact language (Korean/English) and formality level of the existing text.
- Do NOT repeat text that already appears in the AFTER section.
- Limit output to 1 sentence or short phrase (~15-25 words maximum).
- If the context is too short or ambiguous, output nothing.
- Preserve Korean speech level (해요체/합쇼체/반말) exactly as found in BEFORE.`;
}

// ─────────────────────────────────────────────────────────────
// Plugin Factory
// ─────────────────────────────────────────────────────────────

/**
 * GhostText ProseMirror Plugin을 생성한다.
 *
 * [주입 방식]
 * - BlockNoteEditor.create() 내 `_tiptapEditor` 접근 없이,
 *   에디터 마운트 이후 `view.updateState`를 통해 plugin을 재귀 삽입하는 방식 대신,
 *   이 함수는 callbacks를 인자로 받아 Plugin 인스턴스를 반환한다.
 * - useGhostText hook에서 editor가 준비된 시점에 콜백을 생성하고,
 *   `view.dispatch(view.state.tr)` 수준이 아닌
 *   BlockNoteEditor의 내부 TipTap editor에 `registerPlugin`을 통해 삽입한다.
 *
 * [Stale Closure 방지]
 * - callbacks 객체는 useRef로 감싸진 callbacksRef.current를 참조하여
 *   항상 최신 함수를 호출한다. Plugin 내부에서 직접 closure로 캡처하지 않는다.
 *
 * @param callbacksRef - React useRef로 감싼 콜백 컨테이너 (stale closure 방지)
 */
export function createGhostTextPlugin(
  callbacksRef: React.MutableRefObject<GhostTextCallbacks>
): Plugin {
  return new Plugin<GhostTextState>({
    key: ghostTextKey,

    state: {
      init: () => ({ ...INITIAL_STATE }),

      apply(tr: Transaction, prev: GhostTextState): GhostTextState {
        const meta = tr.getMeta(ghostTextKey) as GhostTextMeta | undefined;

        // ① Ghost 전용 Meta 트랜잭션 우선 처리
        if (meta) {
          if (meta.type === 'clear') return { ...INITIAL_STATE };
          if (meta.type === 'show') {
            return {
              text: meta.text,
              pos: meta.pos,
              requestId: meta.requestId,
              isActive: true,
            };
          }
        }

        // ② Ghost Meta가 없는 일반 트랜잭션에서의 자동 클리어
        if (prev.isActive) {
          // 문서 내용 변경 → clear (사용자 입력/paste/drop/remote 포함)
          // React 쪽 stream abort는 beforeinput/editor.on('update')가 처리
          if (tr.docChanged) return { ...INITIAL_STATE };

          // 커서 이탈 → clear
          if (tr.selectionSet && prev.pos !== null) {
            if (tr.selection.from !== prev.pos) return { ...INITIAL_STATE };
          }
        }

        return prev;
      },
    },

    props: {
      /**
       * [Decoration 렌더링]
       * - Decoration.widget의 key를 requestId + text.length 기반 동적값으로 설정해
       *   ProseMirror의 stale DOM 재사용을 방지한다.
       * - widget factory function 방식 사용: ProseMirror가 필요시 새 DOM을 생성하도록 한다.
       */
      decorations(state: EditorState): DecorationSet {
        const ghost = ghostTextKey.getState(state)!;
        if (!ghost.isActive || !ghost.text || ghost.pos === null) {
          return DecorationSet.empty;
        }

        // Ghost Text DOM 노드
        const createWidget = () => {
          const span = document.createElement('span');
          span.className = 'ghost-text-suggestion';
          span.setAttribute('aria-hidden', 'true');
          span.setAttribute('data-ghost-text', 'true');
          span.style.cssText = [
            'color: #6b7280',
            'pointer-events: none',
            'white-space: pre-wrap',
            'font-style: italic',
            'opacity: 0.65',
            'user-select: none',
          ].join(';');
          span.textContent = ghost.text;
          return span;
        };

        return DecorationSet.create(state.doc, [
          Decoration.widget(
            ghost.pos,
            createWidget,
            {
              side: 1,
              // 동적 key: requestId와 text.length 조합으로 stale DOM 재사용 방지
              key: `ghost-${ghost.requestId}-${ghost.text.length}`,
            }
          ),
        ]);
      },

      /**
       * [키보드 이벤트 처리]
       * Plugin은 "의도 감지"만 하고, 실제 stream abort/requestId 관리는
       * callbacksRef.current를 통해 React로 위임한다 (stale closure 방지).
       */
      handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
        const ghost = ghostTextKey.getState(view.state)!;

        // ── Escape: Ghost 제거 의도 → React onDismiss 위임 ──
        if (event.key === 'Escape' && ghost.isActive) {
          event.preventDefault();
          // Plugin은 dispatchClear를 직접 하지 않는다.
          // onDismiss 내부에서 requestId++, abort, clear가 원자적으로 처리된다.
          callbacksRef.current.onDismiss();
          return true;
        }

        // ── Tab Accept ──
        // 다음 조건을 모두 만족할 때만 가로챈다:
        // 1. Ghost 활성화 상태
        // 2. 순수 Tab (Shift+Tab 제외)
        // 3. IME 조합 중 아님 (view.composing + event.isComposing 이중 체크)
        // 4. Selection이 Collapsed 상태
        // 5. 현재 커서 위치(selection.from)가 ghost.pos와 일치
        if (
          event.key === 'Tab' &&
          !event.shiftKey &&
          ghost.isActive &&
          ghost.text &&
          ghost.pos !== null &&
          !view.composing &&
          !event.isComposing &&
          view.state.selection.empty &&
          view.state.selection.from === ghost.pos
        ) {
          event.preventDefault();
          event.stopPropagation();

          // 커서 이후 텍스트와의 중복 제거
          const afterText = getTextAfterCursor(view.state, ghost.pos, 100);
          const finalText = postProcessSuggestion(ghost.text, afterText);

          if (!finalText) {
            // 빈 결과 → dismiss로 처리
            callbacksRef.current.onDismiss();
          } else {
            // Accept 처리는 React로 위임 (requestId++, abort, insertText, clear)
            callbacksRef.current.onAccept(finalText, ghost.pos);
          }
          return true;
        }

        // ── Ctrl + ArrowRight: 단어 단위 부분 수락 (Partial Accept) ──
        if (
          event.key === 'ArrowRight' &&
          event.ctrlKey &&
          ghost.isActive &&
          ghost.text &&
          ghost.pos !== null &&
          !view.composing &&
          !event.isComposing &&
          view.state.selection.empty &&
          view.state.selection.from === ghost.pos
        ) {
          event.preventDefault();
          event.stopPropagation();
          
          const afterText = getTextAfterCursor(view.state, ghost.pos, 100);
          const finalText = postProcessSuggestion(ghost.text, afterText);
          
          if (!finalText) {
            callbacksRef.current.onDismiss();
          } else {
            // 부분 수락 콜백 호출
            callbacksRef.current.onAccept(finalText, ghost.pos, true);
          }
          return true;
        }

        return false;
      },
    },
  });
}
