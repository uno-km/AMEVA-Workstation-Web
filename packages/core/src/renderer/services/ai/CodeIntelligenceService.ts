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

export interface CodeConversionRequest {
  code: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
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
    let systemPrompt = `당신은 최고 수준의 ${language.toUpperCase()} 소프트웨어 엔지니어입니다.
사용자의 요구사항에 맞추어 오직 실행 가능한 깨끗하고 효율적인 ${language.toUpperCase()} 코드를 작성하십시오.

[작성 원칙]
1. 반드시 유효한 \`\`\`${language} ... \`\`\` 마크다운 코드 블록으로 완전한 코드를 감싸서 제공하십시오.
2. 불필요하거나 반복적인 긴 주석(comment)을 생성하지 마십시오. 핵심 로직 구현에만 집중하십시오.
3. 동일한 설명 문구나 단어를 절대 중복 반복(Degenerate Loop)하지 마십시오.`;

    if (language === 'mermaid') {
      systemPrompt = `당신은 최고 수준의 Mermaid.js 다이어그램 설계 전문가입니다.
오직 렌더링 가능한 완벽한 Mermaid 코드만을 \`\`\`mermaid ... \`\`\` 블록으로 작성하십시오.

[Mermaid 필수 문법 원칙]
1. Flowchart/Graph에서는 노드 연결선 라벨에 콜론(:)을 절대 사용하지 말고, 반드시 파이프(|라벨|) 또는 화살표(-- 라벨 -->)를 사용하십시오.
   - 올바른 예: A -->|Process| B 또는 A -- Process --> B
   - 금지 예: A --> B: Process (이 문법은 sequenceDiagram 전용이므로 flowchart에서 절대 금지)
2. 각 노드와 연결선은 반드시 줄바꿈으로 명확히 구분하십시오.
3. 노드 텍스트에 한글/특수문자가 있을 때는 큰따옴표로 감싸십시오. (예: A["시작 (Start)"])
4. 설명 텍스트 없이 오직 유효한 Mermaid 코드 블록만 출력하십시오.`;
    }

    let userPrompt = `[요구 언어]: ${language}\n[작성 요구사항]:\n${prompt}`;
    if (contextCode) {
      userPrompt += `\n\n[기존/참조 코드 문맥]:\n\`\`\`${language}\n${contextCode}\n\`\`\``;
    }

    return this.streamPrompt(engine, systemPrompt, userPrompt, { signal, temperature: 0.35 }, onStreamingChunk);
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
   * 5. 다국어 코드 상호 변환 (Language Conversion)
   */
  static async convertLanguage({
    code,
    sourceLanguage,
    targetLanguage,
    engine,
    signal,
    onStreamingChunk
  }: CodeConversionRequest): Promise<string> {
    const systemPrompt = `당신은 다국어 프로그래밍 언어 변환 및 트랜스파일러 전문가입니다.
주어진 ${sourceLanguage.toUpperCase()} 코드를 동등한 동작을 수행하는 최적의 ${targetLanguage.toUpperCase()} 코드로 완벽하게 변환하십시오.
[작성 원칙]
1. 반드시 유효한 \`\`\`${targetLanguage} ... \`\`\` 마크다운 코드 블록으로 감싸십시오.
2. 타겟 언어의 표준 관용구(Idiomatic style) 및 모범 사례를 따르십시오.`;

    const userPrompt = `다음 ${sourceLanguage.toUpperCase()} 코드를 ${targetLanguage.toUpperCase()} 코드로 변환해 주십시오:\n\n\`\`\`${sourceLanguage}\n${code}\n\`\`\``;

    return this.streamPrompt(engine, systemPrompt, userPrompt, { signal, temperature: 0.15 }, onStreamingChunk);
  }

  /**
   * 6. 마크다운 블록에서 순수 소스코드만 안전 추출
   */
  static extractPureCode(rawResponse: string): string {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const matches = Array.from(rawResponse.matchAll(codeBlockRegex));
    if (matches.length > 0) {
      return matches[0][1].trim();
    }
    return rawResponse.trim();
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
