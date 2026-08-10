import React, { useCallback } from 'react';
import { PromptManager } from '../../services/llm/prompts/PromptManager';
import { XmlTagParser } from '../../services/llm/parsers/XmlTagParser';

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
    mode: 'tone' | 'summary'
  ) => {
    if (!editor || !targetText) return;

    const contextText = taggedBlocks && taggedBlocks.length > 0
      ? taggedBlocks.map(b => Array.isArray(b.content) ? b.content.map((c: any) => c.text).join('') : b.text).filter(Boolean).join('\n')
      : undefined;

    const factory = PromptManager.getFactory(activeModelId);
    const systemPrompt = mode === 'tone' 
      ? factory.createTonePrompt(contextText) 
      : factory.createSummaryPrompt(contextText);

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
      props: { originalBlockJson, originalText, suggestedText: '', mode } as any 
    });

    let fullText = "";
    for await (const chunk of stream) {
      fullText += chunk;
      
      // Use the OutputParser layer
      const displayContent = parser.parseStream(fullText);

      editor.updateBlock(targetBlock.id, { 
        props: { originalBlockJson, originalText, mode, suggestedText: displayContent } as any 
      });
    }
  }, [editor, activeModelId, generateStream, parser, taggedBlocks]);

  return { executeAction };
}
