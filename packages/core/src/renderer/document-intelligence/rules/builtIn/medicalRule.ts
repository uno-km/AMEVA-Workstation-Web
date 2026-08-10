/**
 * ============================================================================
 * @file medicalRule.ts
 * @description medicalRule.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './medicalRule';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { DomainRule } from '../types';

/**
 * medicalRule 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const medicalRule: DomainRule = {
  id: 'medical',
  label: '의료/병원',
  source: 'builtin',
  version: '1.0.0',
  weight: 1.0,

  subDomains: [
    { id: 'diagnosis', label: '진단', keywords: ['진단', '소견', '판독', '검진', '증상', '진단서'] },
    { id: 'radiology', label: '영상의학', keywords: ['영상', '방사선', '초음파', 'MRI', 'CT', 'X선', '촬영'] },
    { id: 'prescription', label: '처방', keywords: ['처방', '투약', '약물', '항생제', '복용', '수액'] },
    { id: 'medical_record', label: '의무기록', keywords: ['의무기록', '차트', '병력', '과거력', '가족력', '경과'] },
    { id: 'surgery', label: '수술', keywords: ['수술', '마취', '봉합', '절개', '수술기록', '집도'] },
    { id: 'rehabilitation', label: '재활', keywords: ['재활', '물리치료', '운동치료', '도수치료', '회복'] }
  ],

  keywords: [
    '처방', '수술', '병동', '외래', '입원', '응급', '투약', '증상', '부작용', 
    '의무기록', '진단서', '소견서', '간호', '병리', '마취', '재활',
    '초음파', '혈압', '맥박', '호흡', '체온', '수액', '백신', '항생제', 
    '임상', '진료', '처치', '예방', '회진'
  ],
  weakKeywords: ['진단', '환자', '치료', '검사', '혈액', 'MRI', 'CT'],
  ambiguousKeywords: ['기록', '결과', '계획', '확인', '진행'],

  strongPhrases: [
    '의무 기록 사본', '입원 환자 관리', '수술 전 동의서', '투약 지시서', 
    '병리 검사 결과', '임상 시험 계획'
  ],
  phrases: [
    '진단서 발급', '응급실 내원', '외래 진료 기록', '감염 예방 지침', 
    '건강 검진 결과', '퇴원 수속', '간호 기록지', '처방 내역', '환자 모니터링'
  ],

  sectionHints: [
    '주호소', '과거력', '가족력', '신체 검진', '검사 소견', '진단명', '치료 계획',
    '수술 기록', '마취 기록', '투약 기록', '간호 일지', '경과 기록', '퇴원 요약'
  ],
  filenameHints: [
    '진단서', '소견서', '의무기록', '검사결과', '간호기록', '수술기록', '입퇴원확인서', 
    '처방전', '진료기록', '투약기록', '동의서', '병리기록', '응급기록'
  ],

  unitHints: ['mg', 'ml', 'cc', 'mmHg', 'bpm', 'mmol', 'g/dL', 'IU'],
  entityHints: [],
  negativeKeywords: ['다이어트식품', '건강보조', '민간요법', '피부마사지', '네일아트', '미용실']
};
