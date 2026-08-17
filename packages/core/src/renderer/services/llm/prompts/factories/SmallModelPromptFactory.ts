/**
 * ============================================================================
 * @file SmallModelPromptFactory.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/services/llm/prompts/factories/SmallModelPromptFactory.ts
 * @role Compact Prompt Factory for Lightweight/Edge Models (1.5B 이하)
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (PromptManager.ts): 소형 모델 전용 프롬프트 생성기로 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 컨텍스트 윈도우와 연산량이 제한적인 경량 모델(Qwen2.5-1.5B, GhostText 등)에 최적화된 압축 프롬프트를 생성한다.
 * ============================================================================
 */

import type { PromptFactory } from '../PromptFactory';
import { formatRAGContext } from '../PromptFactory';
import type { EmbeddingChunk } from '../../../../features/rag-embedding/types';

export class SmallModelPromptFactory implements PromptFactory {
  createTonePrompt(contextText?: string): string {
    const contextSection = contextText ? `\n[CONTEXT]\n${contextText}\n` : '';
    return `You are a strict text-processing API endpoint. You do not converse.${contextSection}
TASK: Rewrite the [TARGET TEXT] into a professional Korean business tone (경어체).

CRITICAL RULES:
1. You MUST wrap your final output inside <answer> and </answer> tags.
2. NEVER output conversational filler, greetings, or meta-commentary outside the tags.
3. If the text is a simple formula or meaningless string (e.g., "1+1"), return it exactly as is inside the tags.

Example 1:
[TARGET TEXT]
대충 해
-> <answer>신속하게 처리하겠습니다.</answer>

Example 2:
[TARGET TEXT]
1+1
-> <answer>1+1</answer>`;
  }

  createSummaryPrompt(contextText?: string): string {
    const contextSection = contextText ? `\n[CONTEXT]\n${contextText}\n` : '';
    return `You are a strict text-processing API endpoint. You do not converse.${contextSection}
TASK: Summarize the [TARGET TEXT] into 3 bullet points or fewer in Korean.

CRITICAL RULES:
1. You MUST wrap your final output inside <answer> and </answer> tags.
2. Each line inside the tags MUST start with a dash (-).

Example 1:
[TARGET TEXT]
오늘 회의에서 A안건은 통과됐고 B는 보류. 낼 다시 이야기하기로 함.
-> <answer>- A안건 통과
- B안건 보류 및 내일 재논의</answer>`;
  }

  createTranslationPrompt(targetLang: string, contextText?: string): string {
    const contextSection = contextText ? `\n[CONTEXT]\n${contextText}\n` : '';
    return `Translate strictly into ${targetLang}.${contextSection}
Wrap answer in <answer> tags.`;
  }

  createRAGPrompt(
    query: string,
    contextChunks: Array<EmbeddingChunk | { text: string; heading?: string; section?: string; score?: number }> | string,
    userInstructions?: string
  ): string {
    const formattedContext = formatRAGContext(contextChunks);
    const custom = userInstructions ? `\nNote: ${userInstructions}` : '';

    return `Answer the user question using ONLY the provided context.

[CONTEXT]
${formattedContext}${custom}

[QUESTION]
${query}

RULES:
1. Wrap response in <answer> and </answer> tags.
2. Answer concisely in Korean based strictly on the context.`;
  }
}
