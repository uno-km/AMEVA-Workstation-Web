import type { DomainRule } from '../types';

export const welfareRule: DomainRule = {
  id: 'welfare',
  label: '사회복지',
  source: 'builtin',
  version: '1.0.0',
  weight: 1,
  keywords: [
    '복지', '지원', '대상자', '수급자', '급여', '사회복지',
    '취약계층', '아동', '노인', '장애인', '보육', '시설',
    '바우처', '돌봄', '상담', '신청', '선정', '자격'
  ]
};
