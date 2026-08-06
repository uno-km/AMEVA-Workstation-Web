import type { DomainRule } from '../types';

export const constructionRule: DomainRule = {
  id: 'civil_engineering',
  label: '토목/건설',
  source: 'builtin',
  version: '1.0.0',
  weight: 1,
  keywords: [
    '토공', '콘크리트', '철근', '거푸집', '배수', '포장', '교량',
    '터널', '옹벽', '흙막이', '굴착', '성토', '절토', '시방서',
    '수량산출', '공정표', '품질관리', '안전관리', '시공', '준공',
    '현장', '공사비', '내역서', '구조물', '지반', '측량', '도면',
    '설계', '공법', '하중', '균열', '압축강도'
  ],
  unitHints: ["MPa", "mm", "m2", "m3", "㎡", "㎥", "kN"]
};
