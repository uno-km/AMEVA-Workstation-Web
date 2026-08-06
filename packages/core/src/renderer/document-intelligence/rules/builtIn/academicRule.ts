import type { DomainRule } from '../types';

export const academicRule: DomainRule = {
  id: 'academic',
  label: '학사/교육',
  source: 'builtin',
  version: '1.0.0',
  weight: 1,
  keywords: [
    '수강신청', '학점', '전공필수', '재수강', '학사서비스',
    '강의시간표', '개설과목', '대학원', '포탈', '수강정정',
    '학사', '전공', '졸업', '재학', '장학', '교과목', '학기',
    '수업', '강의', '등록금', '휴학', '복학', '논문'
  ]
};
