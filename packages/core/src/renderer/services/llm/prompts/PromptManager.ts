/**
 * ============================================================================
 * @file PromptManager.ts
 * @description PromptManager.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './PromptManager';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ./PromptFactory]
import type { PromptFactory } from './PromptFactory';
// [내부 프로젝트 의존성 모듈 임포트: ./factories/DPlanPromptFactory]
import { DPlanPromptFactory } from './factories/DPlanPromptFactory';

/**
 * PromptManager 클래스의 인스턴스를 정의하고 관련 로직을 안전하게 캡슐화합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export class PromptManager {
  private static factoryInstance: PromptFactory | null = null;

  /**
   * Retrieves the DPlanPromptFactory (Standardized for 3B+ models).
   * Caches the factory instance to avoid unnecessary allocations.
   */
  static getFactory(modelId?: string): PromptFactory {
    if (!this.factoryInstance) {
      this.factoryInstance = new DPlanPromptFactory();
    }
    return this.factoryInstance;
  }
}
