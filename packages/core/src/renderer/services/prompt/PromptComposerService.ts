/**
 * ============================================================================
 * @file PromptComposerService.ts
 * @system AMEVA OS Desktop Workstation - Prompt Architecture
 * @location packages/core/src/renderer/services/prompt/PromptComposerService.ts
 * @role Domain Service for Combining RAG Context, User Persona, and System Safety Guardrails
 * ============================================================================
 */

import type { IPromptStorageService } from './IPromptStorageService';
import { LocalStoragePromptStorage } from './LocalStoragePromptStorage';

export class PromptComposerService {
  private static instance: PromptComposerService | null = null;
  private storageService: IPromptStorageService;

  constructor(storageService?: IPromptStorageService) {
    this.storageService = storageService || new LocalStoragePromptStorage();
  }

  static getInstance(): PromptComposerService {
    if (!this.instance) {
      this.instance = new PromptComposerService();
    }
    return this.instance;
  }

  /**
   * Sets or swaps the underlying prompt storage strategy (DIP)
   */
  setStorageStrategy(storage: IPromptStorageService): void {
    this.storageService = storage;
  }

  getStorageStrategy(): IPromptStorageService {
    return this.storageService;
  }

  /**
   * Composes the final full system prompt with RAG context, active persona, and safety guardrails.
   */
  async buildSystemPrompt(ragContextPrompt: string): Promise<string> {
    const persona = await this.storageService.getCustomPersona();

    return `${ragContextPrompt}

[AGENT ROLE & ACTIVE PERSONA]
${persona}

[FORMAT & SAFETY RULES]
1. 답변을 생성하기 전 <think>...</think> 태그 안에 단계별 사고 과정(CoT)을 한국어로 작성하십시오.
2. <table>, <tr>, <td>, <th>, <answer>, <itemized-list>, <li> 등의 HTML/XML 태그를 절대 쓰지 마십시오.
3. 표(Table)를 작성할 때는 반드시 표준 마크다운 표 문법(| 열1 | 열2 |\\n| --- | --- |\\n| 값1 | 값2 |)으로만 작성하십시오.
4. 문서에 새로운 단락이나 제목을 추가해야 할 경우 아래 형식으로 제안하십시오:
   <insert afterBlockId="START|END|블록ID" type="heading|paragraph|table" level="1|2|3">추가할 내용</insert>
5. 사용자의 질문 문장(예: '요약해줘') 자체를 문서의 제목이나 내용으로 취급하지 마시고, 오직 [참조된 에디터 문서 내용]에 적힌 실제 본문 데이터만을 기반으로 요약하십시오.`;
  }
}
