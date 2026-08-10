/**
 * ============================================================================
 * @file useLLMAction.ts
 * @description useLLMAction.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useLLMAction';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useCallback } from 'react';
// [내부 프로젝트 의존성 모듈 임포트: ../../services/llm/prompts/PromptManager]
import { PromptManager } from '../../services/llm/prompts/PromptManager';
// [내부 프로젝트 의존성 모듈 임포트: ../../services/llm/parsers/XmlTagParser]
import { XmlTagParser } from '../../services/llm/parsers/XmlTagParser';

/**
 * LLMActionParams 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface LLMActionParams {
  editor: any;
  activeModelId: string;
  generateStream: (prompt: string, userText: string) => AsyncGenerator<string, void, unknown>;
  taggedBlocks?: any[];
}

/**
 * useLLMAction 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function useLLMAction({ editor, activeModelId, generateStream, taggedBlocks }: LLMActionParams) {
  const parser = React.useMemo(() => new XmlTagParser('answer'), []);

  const executeAction = useCallback(async (
    targetBlockId: string | null,
    targetText: string,
    mode: 'tone' | 'summary' | 'translate',
    targetLang?: string
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
