/**
 * ============================================================================
 * @file rulePluginRegistry.ts
 * @description rulePluginRegistry.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './rulePluginRegistry';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ./types]
import type { DomainRule, ShapeRule } from './types';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/academicRule]
import { academicRule } from './builtIn/academicRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/constructionRule]
import { constructionRule } from './builtIn/constructionRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/softwareRule]
import { softwareRule } from './builtIn/softwareRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/medicalRule]
import { medicalRule } from './builtIn/medicalRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/welfareRule]
import { welfareRule } from './builtIn/welfareRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/financeRule]
import { financeRule } from './builtIn/financeRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/investmentRule]
import { investmentRule } from './builtIn/investmentRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/realEstateRule]
import { realEstateRule } from './builtIn/realEstateRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/hrRule]
import { hrRule } from './builtIn/hrRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/procurementRule]
import { procurementRule } from './builtIn/procurementRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/electronicsRule]
import { electronicsRule } from './builtIn/electronicsRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/electricalRule]
import { electricalRule } from './builtIn/electricalRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/manufacturingRule]
import { manufacturingRule } from './builtIn/manufacturingRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/qualityRule]
import { qualityRule } from './builtIn/qualityRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/logisticsRule]
import { logisticsRule } from './builtIn/logisticsRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/legalRule]
import { legalRule } from './builtIn/legalRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/publicAdministrationRule]
import { publicAdministrationRule } from './builtIn/publicAdministrationRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/publicPolicyRule]
import { publicPolicyRule } from './builtIn/publicPolicyRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/healthcareRule]
import { healthcareRule } from './builtIn/healthcareRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/tourismRule]
import { tourismRule } from './builtIn/tourismRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/foodRule]
import { foodRule } from './builtIn/foodRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/lifestyleRule]
import { lifestyleRule } from './builtIn/lifestyleRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/researchRule]
import { researchRule } from './builtIn/researchRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/securityRule]
import { securityRule } from './builtIn/securityRule';
// [내부 프로젝트 의존성 모듈 임포트: ./builtIn/environmentRule]
import { environmentRule } from './builtIn/environmentRule';

/**
 * RulePluginRegistry 클래스의 인스턴스를 정의하고 관련 로직을 안전하게 캡슐화합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
class RulePluginRegistry {
  private domainRules: Map<string, DomainRule> = new Map();
  private shapeRules: Map<string, ShapeRule> = new Map();

  // --- Domain Rules ---
  registerDomainRule(rule: DomainRule) {
    this.domainRules.set(rule.id, rule);
  }

  unregisterDomainRule(domainId: string) {
    this.domainRules.delete(domainId);
  }

  getDomainRules(): DomainRule[] {
    return Array.from(this.domainRules.values());
  }

  getDomainRule(domainId: string): DomainRule | undefined {
    return this.domainRules.get(domainId);
  }

  // --- Shape Rules ---
  registerShapeRule(rule: ShapeRule) {
    this.shapeRules.set(rule.id, rule);
  }

  getShapeRules(): ShapeRule[] {
    return Array.from(this.shapeRules.values());
  }

  // --- Initialization ---
  loadBuiltInRules() {
    this.registerDomainRule(academicRule);
    this.registerDomainRule(constructionRule);
    this.registerDomainRule(softwareRule);
    this.registerDomainRule(medicalRule);
    this.registerDomainRule(welfareRule);
    this.registerDomainRule(financeRule);
    this.registerDomainRule(investmentRule);
    this.registerDomainRule(realEstateRule);
    this.registerDomainRule(hrRule);
    this.registerDomainRule(procurementRule);
    this.registerDomainRule(electronicsRule);
    this.registerDomainRule(electricalRule);
    this.registerDomainRule(manufacturingRule);
    this.registerDomainRule(qualityRule);
    this.registerDomainRule(logisticsRule);
    this.registerDomainRule(legalRule);
    this.registerDomainRule(publicAdministrationRule);
    this.registerDomainRule(publicPolicyRule);
    this.registerDomainRule(healthcareRule);
    this.registerDomainRule(tourismRule);
    this.registerDomainRule(foodRule);
    this.registerDomainRule(lifestyleRule);
    this.registerDomainRule(researchRule);
    this.registerDomainRule(securityRule);
    this.registerDomainRule(environmentRule);

    // 기본 Shape Rules
    this.registerShapeRule({ id: 'guide', label: '가이드/안내', keywords: ['방법', '절차', '순서', '확인', '클릭', '선택', '입력', '조회', '결과', '안내'] });
    this.registerShapeRule({ id: 'manual', label: '매뉴얼', keywords: ['설치', '설정', '사용법', '주의사항', '오류', '가이드', '매뉴얼'] });
    this.registerShapeRule({ id: 'report', label: '보고서', keywords: ['보고서', '분석', '현황', '결과', '결론', '개선방안'] });
    this.registerShapeRule({ id: 'contract', label: '계약서', keywords: ['계약', '갑', '을', '손해배상', '권리', '의무', '계약해지'] });
    this.registerShapeRule({ id: 'specification', label: '시방서', keywords: ['시방서', '규격', '기준', '품질', '성능', '재료', '시공', '검사'] });
    this.registerShapeRule({ id: 'checklist', label: '체크리스트', keywords: ['점검', '체크리스트', '확인사항', '적합', '부적합', '완료여부'] });
    this.registerShapeRule({ id: 'schedule', label: '일정/공정표', keywords: ['일정', '계획', '착수', '완료', '마일스톤', '공정표'] });
    this.registerShapeRule({ id: 'invoice', label: '청구서', keywords: ['청구서', '견적서', '단가', '수량', '합계', '공급가액', '세액'] });
    this.registerShapeRule({ id: 'research_paper', label: '논문/연구', keywords: ['논문', '초록', '연구', '실험', '참고문헌', 'abstract', 'introduction'] });
    this.registerShapeRule({ id: 'meeting_minutes', label: '회의록', keywords: ['회의', '참석자', '안건', '결정사항', '액션아이템', '논의사항', 'todo'] });
    this.registerShapeRule({ id: 'technical_document', label: '기술문서', keywords: ['기술', '아키텍처', '설계', '개발', '테스트', '배포', '인프라'] });
    this.registerShapeRule({ id: 'form', label: '신청양식', keywords: ['양식', '신청서', '서식', '작성', '제출', '동의', '서명'] });
    this.registerShapeRule({ id: 'policy', label: '정책/규정', keywords: ['규정', '지침', '정책', '시행', '준수', '개인정보', '보안'] });
  }

  resetToBuiltIns() {
    this.domainRules.clear();
    this.shapeRules.clear();
    this.loadBuiltInRules();
  }

  refreshUserRules(userRules: DomainRule[]) {
    this.mergeBuiltinAndUserRules(userRules);
  }

  mergeBuiltinAndUserRules(userRules: DomainRule[]) {
    // 1. 초기화 후 내장 룰 로드
    this.resetToBuiltIns();

    // 2. User 룰 오버라이드 (또는 병합)
    userRules.forEach(rule => {
      const existing = this.domainRules.get(rule.id);
      if (existing) {
        existing.keywords = Array.from(new Set([...(existing.keywords || []), ...(rule.keywords || [])]));
        if (rule.phrases) existing.phrases = Array.from(new Set([...(existing.phrases || []), ...rule.phrases]));
        if (rule.sectionHints) existing.sectionHints = Array.from(new Set([...(existing.sectionHints || []), ...rule.sectionHints]));
        if (rule.filenameHints) existing.filenameHints = Array.from(new Set([...(existing.filenameHints || []), ...rule.filenameHints]));
        if (rule.unitHints) existing.unitHints = Array.from(new Set([...(existing.unitHints || []), ...rule.unitHints]));
        
        existing.weight = Math.max(existing.weight || 1, rule.weight || 1);
        if (rule.source === 'user') existing.source = 'user';
      } else {
        this.registerDomainRule(rule);
      }
    });
  }
}

/**
 * ruleRegistry 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const ruleRegistry = new RulePluginRegistry();
