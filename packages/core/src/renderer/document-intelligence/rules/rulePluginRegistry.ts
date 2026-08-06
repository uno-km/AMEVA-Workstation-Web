import type { DomainRule, ShapeRule } from './types';
import { academicRule } from './builtIn/academicRule';
import { constructionRule } from './builtIn/constructionRule';
import { softwareRule } from './builtIn/softwareRule';
import { medicalRule } from './builtIn/medicalRule';
import { welfareRule } from './builtIn/welfareRule';

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

export const ruleRegistry = new RulePluginRegistry();
