/**
 * ============================================================================
 * @file useLLMAction.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/hooks/editor/useLLMAction.ts
 * @role Editor Inline AI Action & RAG-Assisted Generation Hook
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (components/MarkdownEditor.tsx): 에디터 팝업 메뉴 및 인라인 AI 블록 치환 연동.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - PromptFactory를 통해 모델별 시스템 프롬프트(톤 변환, 요약, 번역, RAG 질의응답)를 획득한다.
 * - WebLLM 스트림 토큰을 `XmlTagParser`로 실시간 파싱하여 `aiDiff` 블록에 스트리밍 렌더링한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: `XmlTagParser`를 통과한 순수 `<answer>` 내부 텍스트만 에디터 블록에 반영할 것.
 * - MUST: 스트리밍 도중 발생한 에러는 기존 블록을 훼손하지 않고 복원 가능하도록 `originalBlockJson`을 유지할 것.
 * ============================================================================
 */

import React, { useCallback } from 'react';
import { PromptManager } from '../../services/llm/prompts/PromptManager';
import { XmlTagParser } from '../../services/llm/parsers/XmlTagParser';
import type { EmbeddingChunk } from '../../features/rag-embedding/types';

interface LLMActionParams {
  editor: any;
  activeModelId: string;
  generateStream: (prompt: string, userText: string) => AsyncGenerator<string, void, unknown>;
  taggedBlocks?: any[];
}

export function useLLMAction({ editor, activeModelId, generateStream, taggedBlocks }: LLMActionParams) {
  const parser = React.useMemo(() => new XmlTagParser('answer'), []);

  const executeAction = useCallback(async (
    targetBlockId: string | null,
    targetText: string,
    mode: 'tone' | 'summary' | 'translate' | 'rag',
    targetLang?: string,
    ragChunks?: EmbeddingChunk[]
  ) => {
    if (!editor || !targetText) return;

    const contextText = taggedBlocks && taggedBlocks.length > 0
      ? taggedBlocks.map(b => Array.isArray(b.content) ? b.content.map((c: any) => c.text).join('') : b.text).filter(Boolean).join('\n')
      : undefined;

    const factory = PromptManager.getFactory(activeModelId);
    let systemPrompt = '';

    if (mode === 'tone') {
      systemPrompt = factory.createTonePrompt(contextText);
    } else if (mode === 'summary') {
      systemPrompt = factory.createSummaryPrompt(contextText);
    } else if (mode === 'translate' && targetLang) {
      systemPrompt = factory.createTranslationPrompt(targetLang, contextText);
    } else if (mode === 'rag') {
      systemPrompt = factory.createRAGPrompt(targetText, ragChunks || contextText || '');
    }

    const stream = generateStream(systemPrompt, `[TARGET TEXT]\n${targetText}`);
    
    const targetBlock = targetBlockId 
      ? editor.getBlock(targetBlockId) 
      : editor.getTextCursorPosition()?.block;

    if (!targetBlock) return;

    let originalText = '';
    if (Array.isArray(targetBlock.content)) {
      originalText = targetBlock.content.map((c: any) => c.text || '').join('');
    } else {
      originalText = targetText;
    }

    const originalBlockJson = JSON.stringify(targetBlock);

    // Initial placeholder block
    editor.updateBlock(targetBlock.id, { 
      type: 'aiDiff', 
      props: { originalBlockJson, originalText, suggestedText: '', mode, targetLang: targetLang || '' } as any 
    });

    let fullText = "";
    for await (const chunk of stream) {
      fullText += chunk;
      
      // Use the OutputParser layer
      const displayContent = parser.parseStream(fullText);

      editor.updateBlock(targetBlock.id, { 
        props: { originalBlockJson, originalText, mode, targetLang: targetLang || '', suggestedText: displayContent } as any 
      });
    }
  }, [editor, activeModelId, generateStream, parser, taggedBlocks]);

  return { executeAction };
}
