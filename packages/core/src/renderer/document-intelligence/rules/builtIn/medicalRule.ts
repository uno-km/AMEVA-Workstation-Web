import type { DomainRule } from '../types';

export const medicalRule: DomainRule = {
  id: 'medical',
  label: '의료/보건',
  source: 'builtin',
  version: '1.0.0',
  weight: 1,
  keywords: [
    '의료', '병원', '환자', '진료', '처방', '수술',
    '진단', '투약', '간호', '병동', '외래', '입원',
    '퇴원', '건강', '보험', '요양', '임상', '약국',
    '의사', '간호사', '약사'
  ]
};
