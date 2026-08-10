import type { PromptFactory } from '../PromptFactory';

export class SmallModelPromptFactory implements PromptFactory {
  createTonePrompt(): string {
    return `You are a strict text-processing API endpoint. You do not converse.
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

  createSummaryPrompt(): string {
    return `You are a strict text-processing API endpoint. You do not converse.
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
}




