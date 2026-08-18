/**
 * ============================================================================
 * @file EditorToolAdapter.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/adapters/EditorToolAdapter.ts
 * @role BlockNote Document Manipulation & Editor Interaction Tool Adapter
 * ============================================================================
 */

import type { IToolRegistry, ToolDefinition, ToolResult, InsertSuggestion } from '../types';

export class EditorToolAdapter implements IToolRegistry {
  private editorRef: any = null;

  setEditor(editor: any) {
    this.editorRef = editor;
  }

  listTools(): ToolDefinition[] {
    return [
      {
        name: 'insert_block',
        description: '에디터의 특정 위치에 새로운 블록을 삽입합니다.',
        parameters: {
          afterBlockId: { type: 'string', description: '삽입할 기준 블록 ID (또는 START, END)' },
          blockType: { type: 'string', enum: ['heading', 'paragraph', 'bulletListItem', 'numberedListItem', 'table', 'codeBlock'] },
          content: { type: 'string', description: '삽입할 텍스트' },
          level: { type: 'number', description: 'heading 레벨 (1~3)' }
        }
      },
      {
        name: 'scroll_to_block',
        description: '에디터 화면을 특정 블록으로 부드럽게 스크롤하고 하이라이트합니다.',
        parameters: {
          blockId: { type: 'string', description: '포커스할 블록 ID' }
        }
      }
    ];
  }

  async executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
    if (name === 'scroll_to_block') {
      const blockId = args.blockId;
      if (!blockId) return { success: false, error: 'blockId is required' };
      const el = document.querySelector(`[data-id="${blockId}"], [data-block-id="${blockId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const outer = el.closest('.bn-block-outer') || el;
        if (outer) {
          outer.setAttribute('data-highlighted-temp', 'true');
          setTimeout(() => outer.removeAttribute('data-highlighted-temp'), 1800);
        }
        return { success: true, output: `Scrolled to block ${blockId}` };
      }
      return { success: false, error: `Block element ${blockId} not found in DOM` };
    }

    if (name === 'insert_block') {
      const { afterBlockId, blockType, content, level } = args as InsertSuggestion;
      
      if (!this.editorRef) {
        const { useWorkspaceStore } = await import('../../../stores/useWorkspaceStore');
        const storeEditor = useWorkspaceStore.getState().activeEditorInstance;
        if (storeEditor) {
          this.editorRef = storeEditor;
        }
      }

      if (!this.editorRef) {
        return { success: false, error: '에디터가 아직 연결되지 않았습니다. 문서를 클릭한 후 다시 시도해주세요.' };
      }

      try {
        const type = blockType || 'paragraph';
        const props: Record<string, any> = { ...((args as any).props || {}) };

        if (type === 'heading') {
          props.level = level || (args as any).level || 2;
        } else if (type === 'codeBlock') {
          props.language = (args as any).language || props.language || 'python';
        }

        const newBlock: any = {
          type,
          props,
          content: content || ''
        };

        if (afterBlockId === 'START') {
          const firstBlock = this.editorRef.document[0];
          if (firstBlock) {
            this.editorRef.insertBlocks([newBlock], firstBlock, 'before');
          } else {
            this.editorRef.replaceBlocks(this.editorRef.document, [newBlock]);
          }
        } else if (afterBlockId === 'END' || !afterBlockId) {
          const lastBlock = this.editorRef.document[this.editorRef.document.length - 1];
          if (lastBlock) {
            this.editorRef.insertBlocks([newBlock], lastBlock, 'after');
          } else {
            this.editorRef.replaceBlocks(this.editorRef.document, [newBlock]);
          }
        } else {
          this.editorRef.insertBlocks([newBlock], afterBlockId, 'after');
        }

        // 스크롤 및 하이라이트 애니메이션
        setTimeout(() => {
          try {
            const doc = this.editorRef?.document;
            if (doc && doc.length > 0) {
              const last = doc[doc.length - 1];
              if (last?.id) {
                const el = document.querySelector(`[data-id="${last.id}"], [data-block-id="${last.id}"]`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const outer = el.closest('.bn-block-outer') || el;
                  if (outer) {
                    outer.setAttribute('data-highlighted-temp', 'true');
                    setTimeout(() => outer.removeAttribute('data-highlighted-temp'), 1800);
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[EditorToolAdapter] Scroll after insert skipped:', e);
          }
        }, 120);

        return { success: true, output: `Block inserted successfully` };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to insert block' };
      }
    }

    return { success: false, error: `Unknown tool: ${name}` };
  }
}

export const editorToolAdapter = new EditorToolAdapter();
