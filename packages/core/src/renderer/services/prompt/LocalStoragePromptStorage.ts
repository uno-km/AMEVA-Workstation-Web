/**
 * ============================================================================
 * @file LocalStoragePromptStorage.ts
 * @system AMEVA OS Desktop Workstation - Prompt Architecture
 * @location packages/core/src/renderer/services/prompt/LocalStoragePromptStorage.ts
 * @role Default Storage Adapter (Web LocalStorage / IndexedDB Fallback)
 * ============================================================================
 */

import type { IPromptStorageService, PromptPreset } from './IPromptStorageService';

export const DEFAULT_AGENT_PERSONA = `당신은 AMEVA 지능형 문서 작업 어시스턴트입니다. 한국어로 전문적이고 친절하게 문서를 분석하고 요약하며, 사용자의 요청에 맞춰 최적의 마크다운 서식으로 답변합니다.`;

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'doc-assistant',
    title: '기본 문서 어시스턴트',
    icon: '📝',
    description: '문서 요약, 목차 구성, 내용 보강에 특화된 표준 모드',
    persona: DEFAULT_AGENT_PERSONA
  },
  {
    id: 'senior-dev',
    title: '시니어 풀스택 개발자',
    icon: '💻',
    description: '타입 안정성, 견고한 예외 처리, 클린 코드 작성 중심',
    persona: `당신은 15년 차 시니어 풀스택 소프트웨어 아키텍트입니다. 코드 작성 시 현대적인 디자인 패턴, 타입 안정성(TypeScript), 명확한 주석과 클린 아키텍처 원칙을 준수하여 답변하십시오.`
  },
  {
    id: 'data-analyst',
    title: '데이터 분석 & 표 마스터',
    icon: '📊',
    description: '핵심 수치 통찰 및 일목요연한 마크다운 테이블 요약',
    persona: `당신은 수석 데이터 분석가입니다. 문서 내의 핵심 지표, 통계, 분류 데이터를 체계적으로 추출하여 일목요연한 마크다운 표(Table)와 불릿 포인트로 통찰을 정리하십시오.`
  },
  {
    id: 'copywriter',
    title: '전문 에디터 & 카피라이터',
    icon: '✍️',
    description: '문맥 교정, 설득력 있는 문장 다듬기, 비즈니스 톤 최적화',
    persona: `당신은 전문 카피라이터이자 수석 편집장입니다. 문서의 논리적 흐름을 매끄럽게 교정하고, 독자에게 신뢰감과 설득력을 주는 세련된 한국어 문체로 작성하십시오.`
  }
];

export class LocalStoragePromptStorage implements IPromptStorageService {
  private readonly STORAGE_KEY = 'ameva_custom_system_prompt';

  async getCustomPersona(): Promise<string> {
    if (typeof localStorage === 'undefined') {
      return this.getDefaultPersona();
    }
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved || !saved.trim()) {
      return this.getDefaultPersona();
    }
    return saved.trim();
  }

  async saveCustomPersona(persona: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, persona.trim());
    }
  }

  async resetCustomPersona(): Promise<string> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    return this.getDefaultPersona();
  }

  getPresets(): PromptPreset[] {
    return PROMPT_PRESETS;
  }

  getDefaultPersona(): string {
    return DEFAULT_AGENT_PERSONA;
  }
}
