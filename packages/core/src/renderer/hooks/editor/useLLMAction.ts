import React, { useCallback } from 'react';
import { PromptManager } from '../../services/llm/prompts/PromptManager';
import { XmlTagParser } from '../../services/llm/parsers/XmlTagParser';

interface LLMActionParams {
  editor: any;
  activeModelId: string;
  generateStream: (prompt: string, userText: string) => AsyncGenerator<string, void, unknown>;
}

export function useLLMAction({ editor, activeModelId, generateStream }: LLMActionParams) {
  const parser = React.useMemo(() => new XmlTagParser('answer'), []);

  const executeAction = useCallback(async (
    targetBlockId: string | null,
    targetText: string,
    mode: 'tone' | 'summary'
  ) => {
    if (!editor || !targetText) return;

    const factory = PromptManager.getFactory(activeModelId);
    const systemPrompt = mode === 'tone' 
      ? factory.createTonePrompt() 
      : factory.createSummaryPrompt();

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
  }, [editor, activeModelId, generateStream, parser]);

  return { executeAction };
}
