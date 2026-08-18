/**
 * ============================================================================
 * @file DPlanPromptFactory.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/services/llm/prompts/factories/DPlanPromptFactory.ts
 * @role Standardized Prompt Factory for 3B+ Parameter Models (Qwen2.5-3B 등)
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (PromptManager.ts): DPlan 기본 프롬프트 팩토리 구현체로 인스턴스화.
 * - 소비처 B (hooks/editor/useLLMAction.ts): 에디터 인라인 AI 및 RAG 파이프라인에서 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 3B 파라미터 이상 모델에 최적화된 XML 태그(`<answer>`) 및 마크다운 기반 시스템 프롬프트를 생성한다.
 * - RAG 검색 결과 컨텍스트를 주입하여 사실 기반의 정확한 질의응답을 유도한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 응답은 `<answer>`와 `</answer>` 태그로 감싸지도록 프롬프트를 구성할 것.
 * ============================================================================
 */

import type { PromptFactory } from '../PromptFactory';
import { formatRAGContext } from '../PromptFactory';
import type { EmbeddingChunk } from '../../../../features/rag-embedding/types';

export class DPlanPromptFactory implements PromptFactory {
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
    let exampleTarget = 'Hello.';
    let exampleSource = '안녕하세요.';
    
    if (targetLang.includes('한국어') || targetLang.includes('Korean')) {
       exampleSource = 'Hello.';
       exampleTarget = '안녕하세요.';
    } else if (targetLang.includes('중국어') || targetLang.includes('中文') || targetLang.includes('Chinese')) {
       exampleTarget = '你好。';
    } else if (targetLang.includes('일본어') || targetLang.includes('日本語') || targetLang.includes('Japanese')) {
       exampleTarget = 'こんにちは。';
    }

    return `You are an expert translator. You do not converse. You strictly translate text into the requested language.${contextSection}
TASK: Translate the [TARGET TEXT] into ${targetLang}. Ensure the translation is natural, culturally appropriate, and highly accurate.

CRITICAL RULES:
1. You MUST wrap your final translation inside <answer> and </answer> tags.
2. NEVER output conversational filler, greetings, or meta-commentary outside the tags.
3. Keep the original formatting and punctuation as much as possible.

Example:
[TARGET TEXT]
${exampleSource}
-> <answer>${exampleTarget}</answer>`;
  }

  createRAGPrompt(
    query: string,
    contextChunks: Array<EmbeddingChunk | { text: string; heading?: string; section?: string; score?: number }> | string,
    userInstructions?: string
  ): string {
    const formattedContext = formatRAGContext(contextChunks);
    const customInstruction = userInstructions ? `\n[추가 지침]\n${userInstructions}\n` : '';

    return `[참조된 에디터 문서 내용]
${formattedContext}
${customInstruction}`;
  }
}
