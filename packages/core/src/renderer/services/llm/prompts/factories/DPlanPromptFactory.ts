/**
 * ============================================================================
 * @file DPlanPromptFactory.ts
 * @description DPlanPromptFactory.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './DPlanPromptFactory';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../PromptFactory]
import type { PromptFactory } from '../PromptFactory';

/**
 * DPlanPromptFactory 클래스의 인스턴스를 정의하고 관련 로직을 안전하게 캡슐화합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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
}
