/**
 * ============================================================================
 * @file LargeModelPromptFactory.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/services/llm/prompts/factories/LargeModelPromptFactory.ts
 * @role Prompt Factory for Large Scale LLM Models (7B+ Parameters)
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (PromptManager.ts): 대형 모델 전용 프롬프트 생성기로 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 복잡한 추론 능력을 가진 대형 모델에 적합한 심층 RAG 및 텍스트 변환 프롬프트를 생성한다.
 * ============================================================================
 */

import type { PromptFactory } from '../PromptFactory';
import { formatRAGContext } from '../PromptFactory';
import type { EmbeddingChunk } from '../../../../features/rag-embedding/types';

export class LargeModelPromptFactory implements PromptFactory {
  createTonePrompt(contextText?: string): string {
    const contextSection = contextText ? `\n[BACKGROUND CONTEXT]\n${contextText}\n` : '';
    return `You are a strict text-processing API endpoint. You do not converse.${contextSection}
TASK: Rewrite the [TARGET TEXT] into a highly professional and polite Korean business tone.

CRITICAL RULES:
1. You MUST wrap your final output inside <answer> and </answer> tags.
2. NEVER output conversational filler, greetings, or meta-commentary outside the tags.
3. If the text is a simple formula or meaningless string (e.g., "1+1"), return it exactly as is inside the tags.

Example 1:
[TARGET TEXT]
어제 말한거 아직 안됨?
-> <answer>어제 요청드린 건의 진행 상황을 확인 부탁드려도 될까요?</answer>

Example 2:
[TARGET TEXT]
1+1
-> <answer>1+1</answer>`;
  }

  createSummaryPrompt(contextText?: string): string {
    const contextSection = contextText ? `\n[BACKGROUND CONTEXT]\n${contextText}\n` : '';
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
    const contextSection = contextText ? `\n[BACKGROUND CONTEXT]\n${contextText}\n` : '';
    return `You are an expert translator. You do not converse. You strictly translate text into ${targetLang}.${contextSection}
TASK: Translate the [TARGET TEXT] into ${targetLang} with high fidelity and natural phrasing.

CRITICAL RULES:
1. You MUST wrap your final translation inside <answer> and </answer> tags.
2. NEVER output conversational filler or notes outside the tags.`;
  }

  createRAGPrompt(
    query: string,
    contextChunks: Array<EmbeddingChunk | { text: string; heading?: string; section?: string; score?: number }> | string,
    userInstructions?: string
  ): string {
    const formattedContext = formatRAGContext(contextChunks);
    const customInstruction = userInstructions ? `\n[ADDITIONAL USER INSTRUCTIONS]\n${userInstructions}\n` : '';

    return `You are an advanced knowledge assistant in AMEVA OS.
Analyze the following retrieved knowledge context thoroughly and synthesize a precise, comprehensive answer to the user question.

[RELEVANT RETRIEVED KNOWLEDGE CONTEXT]
${formattedContext}
${customInstruction}
[USER QUESTION]
${query}

CRITICAL RULES:
1. Wrap your entire final response inside <answer> and </answer> tags.
2. Provide a well-structured response in Korean using markdown headings or bullet points where appropriate.
3. Ground all statements in the provided context. If the context is insufficient, explicitly state the limitation.`;
  }
}
