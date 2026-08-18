/**
 * ============================================================================
 * @file CodeIntelligenceService.ts
 * @system AMEVA OS Desktop Workstation - Code Intelligence Core
 * @location packages/core/src/renderer/services/ai/CodeIntelligenceService.ts
 * @role Multilingual Code Generation, Debugging, Review & Explanation Engine (SCRUM-172)
 * ============================================================================
 */

import type { IAIEngineAdapter, InferenceOptions } from '../../features/ai-agent/types';

export type SupportedLanguage = 
  | 'python' 
  | 'javascript' 
  | 'typescript' 
  | 'html' 
  | 'css' 
  | 'java' 
  | 'sql' 
  | 'c' 
  | 'cpp' 
  | 'rust' 
  | 'go';

export interface CodeGenerationRequest {
  prompt: string;
  language: SupportedLanguage;
  contextCode?: string;
  engine: IAIEngineAdapter;
  signal?: AbortSignal;
  onStreamingChunk?: (chunk: string) => void;
}

export interface CodeDebugRequest {
  code: string;
  errorLog?: string;
  language: SupportedLanguage;
  engine: IAIEngineAdapter;
  signal?: AbortSignal;
  onStreamingChunk?: (chunk: string) => void;
}

export interface CodeReviewRequest {
  code: string;
  language: SupportedLanguage;
  engine: IAIEngineAdapter;
  signal?: AbortSignal;
  onStreamingChunk?: (chunk: string) => void;
}

export interface CodeExplanationRequest {
  code: string;
  language: SupportedLanguage;
  engine: IAIEngineAdapter;
  signal?: AbortSignal;
  onStreamingChunk?: (chunk: string) => void;
}

export class CodeIntelligenceService {
  /**
   * 1. 지능형 다국어 코드 생성 (Code Generation)
   */
  static async generateCode({
    prompt,
    language,
    contextCode,
    engine,
    signal,
    onStreamingChunk
  }: CodeGenerationRequest): Promise<string> {
    const systemPrompt = `당신은 세계 최고 수준의 수석 소프트웨어 엔지니어이자 ${language.toUpperCase()} 전문가입니다.
사용자의 요구사항에 맞추어 완벽하고 실행 가능한 최적의 코드를 작성하십시오.

[작성 원칙]
1. 반드시 유효한 \`\`\`${language} ... \`\`\` 마크다운 코드 블록으로 코드를 감싸서 제공하십시오.
2. 프로덕션 레벨의 에러 핸들링, 명확한 변수명, 필요한 경우 간결한 인라인 주석을 포함하십시오.
3. 코드 작성 후, 핵심 구현 원리와 사용법을 2~3문장으로 간결하게 설명하십시오.`;

    let userPrompt = `[요구 언어]: ${language}\n[작성 요구사항]:\n${prompt}`;
    if (contextCode) {
      userPrompt += `\n\n[기존/참조 코드 문맥]:\n\`\`\`${language}\n${contextCode}\n\`\`\``;
    }

    return this.streamPrompt(engine, systemPrompt, userPrompt, { signal, temperature: 0.2 }, onStreamingChunk);
  }

  /**
   * 2. 런타임/문법 에러 자동 진단 및 1-클릭 패치 (Debug & Fix)
   */
  static async debugAndFix({
    code,
    errorLog,
    language,
    engine,
    signal,
    onStreamingChunk
  }: CodeDebugRequest): Promise<string> {
    const systemPrompt = `당신은 컴파일러 및 런타임 오류 디버깅 전문가입니다.
주어진 ${language.toUpperCase()} 코드와 발생한 에러 로그(Traceback/SyntaxError 등)를 철저히 분석하여,
1) 에러의 근본 원인을 명확히 진단하고,
2) 수정된 완전한 전체 코드(\`\`\`${language} ... \`\`\`)와,
3) 무엇이 어떻게 수정되었는지 변경 포인트(Diff 요약)를 제시하십시오.`;

    let userPrompt = `[언어]: ${language}\n[문제가 발생한 코드]:\n\`\`\`${language}\n${code}\n\`\`\``;
    if (errorLog) {
      userPrompt += `\n\n[발생한 에러 로그 / 스택 트레이스]:\n${errorLog}`;
    } else {
      userPrompt += `\n\n[요청]: 위 코드의 잠재적 버그, 문법 오류, 논리적 결함을 찾아 수정된 코드를 제시해 주십시오.`;
    }

    return this.streamPrompt(engine, systemPrompt, userPrompt, { signal, temperature: 0.15 }, onStreamingChunk);
  }

  /**
   * 3. 복잡도, 보안, 클린코드 종합 리뷰 (Code Review)
   */
  static async reviewCode({
    code,
    language,
    engine,
    signal,
    onStreamingChunk
  }: CodeReviewRequest): Promise<string> {
    const systemPrompt = `당신은 엄격한 수석 아키텍트이자 코드 리뷰어입니다.
주어진 ${language.toUpperCase()} 코드를 다각도에서 정밀 분석하여 마크다운 리포트로 작성하십시오.

[리뷰 포함 항목]
1. 📊 **시간/공간 복잡도 분석** ($O(N)$ 표기)
2. 🛡️ **잠재적 엣지 케이스 및 예외 처리 검토**
3. ⚡ **성능 병목 및 메모리 누수 위험도**
4. 💡 **리팩토링 제안 및 개선된 모범 코드**`;

    const userPrompt = `다음 ${language.toUpperCase()} 코드를 전문적으로 리뷰해 주십시오:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    return this.streamPrompt(engine, systemPrompt, userPrompt, { signal, temperature: 0.25 }, onStreamingChunk);
  }

  /**
   * 4. 초보자/전문가 눈높이 맞춤 코드 해설 (Code Explanation)
   */
  static async explainCode({
    code,
    language,
    engine,
    signal,
    onStreamingChunk
  }: CodeExplanationRequest): Promise<string> {
    const systemPrompt = `당신은 친절하고 명쾌한 시니어 개발 멘토입니다.
제공된 ${language.toUpperCase()} 코드의 동작 흐름과 핵심 메커니즘을 누구나 이해하기 쉽게 단계별(Step-by-Step)로 해설하십시오.
주요 로직, 변수의 역할, 알고리즘의 동작 과정을 체계적으로 설명하십시오.`;

    const userPrompt = `다음 코드가 어떻게 동작하는지 자세하고 명확하게 해설해 주십시오:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    return this.streamPrompt(engine, systemPrompt, userPrompt, { signal, temperature: 0.3 }, onStreamingChunk);
  }

  /**
   * 공통 스트리밍 헬퍼 함수
   */
  private static async streamPrompt(
    engine: IAIEngineAdapter,
    systemPrompt: string,
    userPrompt: string,
    options: InferenceOptions,
    onStreamingChunk?: (chunk: string) => void
  ): Promise<string> {
    let result = '';
    const stream = engine.generateStream(systemPrompt, userPrompt, options);

    for await (const chunk of stream) {
      if (options.signal?.aborted) {
        throw new Error('코드 생성이 사용자에 의해 중단되었습니다.');
      }
      result += chunk;
      onStreamingChunk?.(chunk);
    }

    return result;
  }
}
