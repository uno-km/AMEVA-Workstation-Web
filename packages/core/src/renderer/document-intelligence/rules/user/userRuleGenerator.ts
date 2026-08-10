/**
 * ============================================================================
 * @file userRuleGenerator.ts
 * @description userRuleGenerator.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './userRuleGenerator';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../../feedback/documentFeedbackStore]
import { documentFeedbackStore } from '../../feedback/documentFeedbackStore';
// [내부 프로젝트 의존성 모듈 임포트: ./userRuleStore]
import { userRuleStore } from './userRuleStore';
// [내부 프로젝트 의존성 모듈 임포트: ../../feedback/feedbackTypes]
import type { RuleCandidate } from '../../feedback/feedbackTypes';
// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { DomainRule } from '../types';
// [내부 프로젝트 의존성 모듈 임포트: ../dnaDb]
import { getDnaDb } from '../dnaDb';
// [내부 프로젝트 의존성 모듈 임포트: ../rulePluginRegistry]
import { ruleRegistry } from '../rulePluginRegistry';

const STORE_NAME = 'ruleCandidates';

/**
 * UserRuleGenerator 클래스의 인스턴스를 정의하고 관련 로직을 안전하게 캡슐화합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
class UserRuleGenerator {
  
  async saveRuleCandidate(candidate: RuleCandidate): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).put(candidate);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to save rule candidate');
    });
  }

  async listRuleCandidates(): Promise<RuleCandidate[]> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Failed to list rule candidates');
    });
  }

  async getRuleCandidate(candidateId: string): Promise<RuleCandidate | null> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(candidateId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Failed to get rule candidate');
    });
  }

  async deleteRuleCandidate(candidateId: string): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).delete(candidateId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete rule candidate');
    });
  }

  async generateRuleCandidates(): Promise<void> {
    const feedbacks = await documentFeedbackStore.listDocumentFeedback();
    
    // Domain + Shape 별로 그룹화
    const groups: Record<string, typeof feedbacks> = {};
    feedbacks.forEach(fb => {
      const key = `${fb.corrected.domain}::${fb.corrected.shape}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(fb);
    });

    const existingCandidates = await this.listRuleCandidates();

    // 최소 피드백 3개 이상인 그룹에 대해 후보 생성
    for (const [key, fbs] of Object.entries(groups)) {
      if (fbs.length >= 3) {
        const [domain, shape] = key.split('::');
        
        const keywordFreq: Record<string, number> = {};
        fbs.forEach(fb => {
          (fb.corrected.selectedKeywords || []).forEach(kw => {
            keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
          });
        });

        // 최소 2개 이상 선택된 키워드 추출
        const commonKeywords = Object.entries(keywordFreq)
          .filter(([_, count]) => count >= 2)
          .map(([kw]) => kw);

        if (commonKeywords.length > 0) {
          // 중복 확인
          let existing = existingCandidates.find(c => c.targetDomain === domain && c.targetShape === shape && c.status === 'pending');
          
          if (existing) {
            existing.suggestedKeywords = Array.from(new Set([...existing.suggestedKeywords, ...commonKeywords]));
            existing.supportingFeedbackIds = Array.from(new Set([...existing.supportingFeedbackIds, ...fbs.map(f => f.feedbackId)]));
            existing.confidence = Math.min(100, Math.floor((commonKeywords.length / fbs.length) * 100));
            await this.saveRuleCandidate(existing);
          } else {
            const candidateId = `candidate_${domain}_${Date.now()}`;
            await this.saveRuleCandidate({
              candidateId,
              targetDomain: domain,
              targetShape: shape,
              suggestedKeywords: commonKeywords,
              suggestedSectionHints: [], // TODO
              supportingFeedbackIds: fbs.map(f => f.feedbackId),
              confidence: Math.min(100, Math.floor((commonKeywords.length / fbs.length) * 100)),
              status: 'pending',
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
  }

  async approveRuleCandidate(candidateId: string): Promise<void> {
    const candidate = await this.getRuleCandidate(candidateId);
    if (!candidate || candidate.status !== 'pending') return;
    
    candidate.status = 'approved';
    await this.createUserDomainRuleFromCandidate(candidate);
    await this.saveRuleCandidate(candidate);
    
    // Refresh registry
    const userRules = await userRuleStore.listUserRules();
    ruleRegistry.refreshUserRules(userRules);
  }

  async rejectRuleCandidate(candidateId: string): Promise<void> {
    const candidate = await this.getRuleCandidate(candidateId);
    if (candidate && candidate.status === 'pending') {
      candidate.status = 'rejected';
      await this.saveRuleCandidate(candidate);
    }
  }

  private async createUserDomainRuleFromCandidate(candidate: RuleCandidate): Promise<void> {
    const ruleId = candidate.targetDomain.toLowerCase().replace(/\s+/g, '_');
    const existingRules = await userRuleStore.listUserRules();
    const existing = existingRules.find(r => r.id === ruleId);

    const newKeywords = Array.from(new Set([
      ...(existing?.keywords || []),
      ...candidate.suggestedKeywords
    ]));

    const newRule: DomainRule = {
      id: ruleId,
      label: candidate.targetDomain,
      source: 'user',
      version: '1.0.0',
      keywords: newKeywords,
      weight: 1.25 // 유저 룰 가중치
    };

    await userRuleStore.saveUserRule(newRule);
  }
}

/**
 * userRuleGenerator 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const userRuleGenerator = new UserRuleGenerator();
