/**
 * ============================================================================
 * @file AIContextMenu.tsx
 * @description AIContextMenu.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './AIContextMenu';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Sparkles } from 'lucide-react';
// [외부 패키지 및 라이브러리 임포트: @tiptap/core]
import type { JSONContent } from '@tiptap/core';

/**
 * AIContextMenuProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface AIContextMenuProps {
  contextMenuState: {
    isOpen: boolean;
    x: number;
    y: number;
    selectedText: string;
    blockId: string | null;
  };
  setContextMenuState: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    x: number;
    y: number;
    selectedText: string;
    blockId: string | null;
  }>>;
  hoverBlock: { id: string; text: string; content?: JSONContent | JSONContent[] } | null;
  editor: any;
  // AI States
  isMainReady: boolean;
  isGhostReady: boolean;
  isMainLoading: boolean;
  isGhostLoading: boolean;
  mainProgressText: string;
  ghostProgressText: string;
  pMain: number;
  pGhost: number;
  pendingModelId: string;
  setPendingModelId: (id: string) => void;
  initModel: (id: string) => void;
  ghostTextEnabled: boolean;
  setGhostTextEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  executeAction: (blockId: string | null, targetText: string, mode: 'tone' | 'summary' | 'translate', targetLang?: string) => Promise<void>;
}

/**
 * AIContextMenu 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function AIContextMenu({
  contextMenuState,
  setContextMenuState,
  hoverBlock,
  editor,
  isMainReady,
  isGhostReady,
  isMainLoading,
  isGhostLoading,
  mainProgressText,
  ghostProgressText,
  pMain,
  pGhost,
  pendingModelId,
  setPendingModelId,
  initModel,
  ghostTextEnabled,
  setGhostTextEnabled,
  executeAction,
}: AIContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenuState(prev => ({ ...prev, isOpen: false }));
      }
    };
    // Use capture phase so we catch the click before editor components might stop propagation
    window.addEventListener('mousedown', handleClick, true);
    return () => {
      window.removeEventListener('mousedown', handleClick, true);
    };
  }, [setContextMenuState]);

  if (!contextMenuState.isOpen || !mounted) return null;

  const menuElement = (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: contextMenuState.x,
        top: contextMenuState.y,
        background: 'var(--bg-glass-active)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-main)',
        borderRadius: '8px',
        padding: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        minWidth: '220px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid var(--border-muted)' }}>
        클립보드
      </div>
      <button
        className="bn-button"
        style={{ textAlign: 'left', padding: '6px 8px', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        onClick={() => {
          if (contextMenuState.selectedText) {
            navigator.clipboard.writeText(contextMenuState.selectedText);
          } else if (contextMenuState.blockId && editor) {
            const b = editor.getBlock(contextMenuState.blockId);
            if (b) {
              let textToCopy = '';
              if (Array.isArray(b.content)) {
                textToCopy = b.content.map((c: any) => c.text || '').join('');
              }
              navigator.clipboard.writeText(textToCopy);
            }
          }
          setContextMenuState(prev => ({ ...prev, isOpen: false }));
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        복사
      </button>
      <button
        className="bn-button"
        style={{ textAlign: 'left', padding: '6px 8px', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        onClick={async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text && editor) {
              const targetBlock = contextMenuState.blockId 
                ? editor.getBlock(contextMenuState.blockId) 
                : editor.getTextCursorPosition()?.block;
              if (targetBlock) {
                editor.insertBlocks([{ type: 'paragraph', content: text }], targetBlock, 'after');
              } else {
                editor.insertInlineContent([{ type: 'text', text, styles: {} as any }]);
              }
            }
          } catch (e) {
            console.error('클립보드 권한 거부됨', e);
            alert("클립보드 접근 권한이 거부되었습니다!");
          }
          setContextMenuState(prev => ({ ...prev, isOpen: false }));
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        붙여넣기
      </button>

      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '6px', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid var(--border-muted)' }}>
        블록 관리
      </div>
      <button
        className="bn-button"
        style={{ textAlign: 'left', padding: '6px 8px', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        onClick={() => {
          if (contextMenuState.blockId && editor) {
            const b = editor.getBlock(contextMenuState.blockId);
            if (b) {
              let textToCopy = '';
              if (Array.isArray(b.content)) {
                textToCopy = b.content.map((c: any) => c.text || '').join('');
              }
              if (!textToCopy && hoverBlock?.id === b.id) {
                textToCopy = hoverBlock.text;
              }
              navigator.clipboard.writeText(textToCopy);
            }
          }
          setContextMenuState(prev => ({ ...prev, isOpen: false }));
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        블록 복사
      </button>
      <button
        className="bn-button"
        style={{ textAlign: 'left', padding: '6px 8px', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        onClick={() => {
          setContextMenuState(prev => ({ ...prev, isOpen: false }));
          if (contextMenuState.blockId) {
            editor?.focus();
            setTimeout(() => {
              const domNode = editor?.dom.querySelector(`[data-id="${contextMenuState.blockId}"]`);
              if (domNode) {
                const pos = editor?.view.posAtDOM(domNode, 0);
                if (pos !== undefined && pos >= 0) {
                  editor?.view.dispatch(editor?.state.tr.setSelection(require('prosemirror-state').TextSelection.create(editor?.state.doc, pos)));
                }
              }
            }, 0);
          }
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        여기로 포커스
      </button>
      <button
        className="bn-button"
        style={{ textAlign: 'left', padding: '6px 8px', borderRadius: '4px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        onClick={() => {
          setContextMenuState(prev => ({ ...prev, isOpen: false }));
          if (contextMenuState.blockId && editor) {
            editor.removeBlocks([contextMenuState.blockId]);
          }
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        블록 삭제
      </button>

      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '6px', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid var(--border-muted)' }}>
        AI 어시스턴트
      </div>

      {!isMainReady ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 4px' }}>
          <select
            value={pendingModelId}
            onChange={(e) => setPendingModelId(e.target.value)}
            style={{
              background: 'var(--bg-main)', color: 'var(--text-main)',
              border: '1px solid var(--border-muted)', borderRadius: '4px',
              padding: '4px 6px', fontSize: '11px', outline: 'none', cursor: 'pointer',
              marginBottom: '2px'
            }}
          >
            <option value="Qwen2.5-1.5B-Instruct-q4f32_1-MLC">Qwen 2.5 (1.5B) - 기본 추천 (빠르고 안정적)</option>
            <option value="Qwen2.5-0.5B-Instruct-q4f32_1-MLC">Qwen 2.5 (0.5B) - 초경량 내장그래픽용</option>
            <option value="Qwen2.5-3B-Instruct-q4f32_1-MLC">Qwen 2.5 (3B) - 고성능 추론용</option>
            <option value="Llama-3.2-1B-Instruct-q4f32_1-MLC">Llama 3.2 (1B) - Meta 공식</option>
          </select>
          {pendingModelId.includes('7B') && (
            <div style={{ fontSize: '10px', color: '#ef4444', marginBottom: '4px', lineHeight: '1.2' }}>
              ⚠️ 첫 로딩 시 수 분이 소요되며 브라우저가 버벅일 수 있습니다.
            </div>
          )}
          {isMainLoading || isGhostLoading ? (
            <div style={{ padding: '8px', fontSize: '12px', color: '#666', borderTop: '1px solid var(--border-muted)', textAlign: 'center' }}>
              <div style={{ marginBottom: '6px', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span>⚡ GPU VRAM 모델 로딩 중...</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                <span>{pendingModelId.split('-')[0]} {pendingModelId.split('-')[1]} (통합 엔진)</span>
                <span>{pMain}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', margin: '4px 0 6px' }}>
                <div style={{ width: `${pMain}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', transition: 'width 0.2s ease-out' }} />
              </div>
              <div style={{ color: '#94a3b8', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                {mainProgressText || '가중치 다운로드 및 GPU 파이프라인 초기화 중...'}
              </div>

              {isGhostLoading && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8b5cf6', opacity: 0.9 }}>
                    <span>Ghost 보조 모델</span>
                    <span>{pGhost}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden', margin: '2px 0' }}>
                    <div style={{ width: `${pGhost}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)', transition: 'width 0.2s ease-out' }} />
                  </div>
                  <div style={{ color: '#8b5cf6', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{ghostProgressText}</div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="bn-button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left', padding: '6px 8px', borderRadius: '6px', background: 'transparent', color: '#a855f7', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => {
                if (isMainLoading || isGhostLoading) return;
                try {
                  Promise.resolve(initModel(pendingModelId)).catch(e => console.warn('[AIContextMenu] init error:', e));
                } catch (e) {
                  console.warn('[AIContextMenu] init sync error:', e);
                }
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.1)' }}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Sparkles size={14} />
              AMEVA AI 활성화하기
            </button>
          )}
        </div>
      ) : (
        <>
          <button
            className="bn-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left', padding: '6px 8px', borderRadius: '6px', background: 'transparent', color: '#10b981', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            onClick={async () => {
              setContextMenuState(prev => ({ ...prev, isOpen: false }));
              let targetText = contextMenuState.selectedText;
              if (!targetText && contextMenuState.blockId && editor) {
                 const b = editor.getBlock(contextMenuState.blockId);
                 if (b && Array.isArray(b.content)) {
                   targetText = b.content.map((c: any) => c.text || '').join('');
                 }
              }
              if (!targetText && hoverBlock) targetText = hoverBlock.text;
              if (!targetText) {
                alert("처리할 텍스트가 없습니다. 텍스트를 드래그하거나 블록에 커서를 올려주세요.");
                return;
              }
              await executeAction(contextMenuState.blockId, targetText, 'tone');
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Sparkles size={14} />
            AMEVA AI에게 톤 다듬기 요청
          </button>
          <button
            className="bn-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left', padding: '6px 8px', borderRadius: '6px', background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            onClick={async () => {
              setContextMenuState(prev => ({ ...prev, isOpen: false }));
              let targetText = contextMenuState.selectedText;
              if (!targetText && contextMenuState.blockId && editor) {
                 const b = editor.getBlock(contextMenuState.blockId);
                 if (b && Array.isArray(b.content)) {
                   targetText = b.content.map((c: any) => c.text || '').join('');
                 }
              }
              if (!targetText && hoverBlock) targetText = hoverBlock.text;
              if (!targetText) {
                alert("처리할 텍스트가 없습니다. 텍스트를 드래그하거나 블록에 커서를 올려주세요.");
                return;
              }
              await executeAction(contextMenuState.blockId, targetText, 'summary');
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Sparkles size={14} />
            AMEVA AI에게 요약 요청
          </button>
          
          <div style={{ padding: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--border-muted)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={10} color="#f59e0b"/> 번역 (Translate)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {['English', '한국어', '中文', '日本語'].map(lang => (
                <button
                  key={lang}
                  style={{ flex: 1, minWidth: '45%', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-muted)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.1s' }}
                  onClick={async () => {
                    setContextMenuState(prev => ({ ...prev, isOpen: false }));
                    let targetText = contextMenuState.selectedText;
                    if (!targetText && contextMenuState.blockId && editor) {
                       const b = editor.getBlock(contextMenuState.blockId);
                       if (b && Array.isArray(b.content)) {
                         targetText = b.content.map((c: any) => c.text || '').join('');
                       }
                    }
                    if (!targetText && hoverBlock) targetText = hoverBlock.text;
                    if (!targetText) {
                      alert("번역할 텍스트가 없습니다. 텍스트를 드래그하거나 블록에 커서를 올려주세요.");
                      return;
                    }
                    await executeAction(contextMenuState.blockId, targetText, 'translate', lang);
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Ghost Text 자동완성 ON/OFF 토글 (AI 활성 상태일 때만 노출) */}
      {isGhostReady && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 8px', marginTop: '4px', borderTop: '1px solid var(--border-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>자동완성 (Ghost Text)</span>
            <button
              style={{
                width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: ghostTextEnabled ? '#a855f7' : 'var(--border-muted)',
                position: 'relative', transition: 'background 0.2s',
              }}
              onClick={() => setGhostTextEnabled(prev => !prev)}
              title={ghostTextEnabled ? '자동완성 비활성화' : '자동완성 활성화'}
            >
              <span style={{
                position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                left: ghostTextEnabled ? '18px' : '2px',
              }} />
            </button>
          </div>
          {ghostTextEnabled && (
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', opacity: 0.8, marginTop: '6px', lineHeight: 1.4 }}>
              💡 <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 3px', borderRadius: '3px' }}>Ctrl+Space</kbd> 즉시 호출<br/>
              💡 <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 3px', borderRadius: '3px' }}>Ctrl+→</kbd> 단어 단위 부분 수락
            </div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(menuElement, document.body);
}
