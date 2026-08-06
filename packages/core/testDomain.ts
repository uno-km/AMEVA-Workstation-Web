import { classifyDomain } from './src/renderer/document-intelligence/classifiers/domainClassifier';
import { ruleRegistry } from './src/renderer/document-intelligence/rules/rulePluginRegistry';

// Load built-in rules
ruleRegistry.loadBuiltInRules();

const testCases = [
  { name: '1. 건설/토목', filename: '시방서.pdf', text: '압축강도 24MPa 콘크리트 타설 시방서 기준에 따름.' },
  { name: '2. 소프트웨어', filename: '설계서.pdf', text: 'REST API OAuth2 인증 플로우 시퀀스 다이어그램.' },
  { name: '3. 법무', filename: '계약서.docx', text: '제3조 2항에 의거하여 원고는 피고에게 손해배상을 청구함.' },
  { name: '4. 금융', filename: '보고서.xlsx', text: '2024년 2분기 영업이익 및 재무상태표 현금흐름표 분석.' },
  { name: '5. 행정', filename: '공고문.pdf', text: '2024년 중소기업 지원금 신청 안내. 지자체 민원 접수 요망.' },
  { name: '6. 연구', filename: '논문.pdf', text: '본 연구는 정규분포를 가정한 p-value 검정 결과 통계적으로 유의미한 상관관계를 보임.' },
  { name: '7. 물류', filename: '서류.pdf', text: '선하증권(B/L) 발급 및 컨테이너 상차 완료. 인보이스 패킹리스트 첨부.' },
  { name: '8. 제조', filename: '도면.pdf', text: 'BOM(자재명세서) 기준 원가 산출 및 CNC 가공 공차 0.01mm 적용.' },
  { name: '9. 환경', filename: '보고서.pdf', text: '온실가스 배출량 감축 및 수질오염 방지 대책. 지속가능경영 ESG 지표.' },
  { name: '10. 부동산', filename: '계약서.pdf', text: '임대차계약서 및 등기부등본 확인 요망. 전입신고 확정일자 필.' }
];

testCases.forEach(tc => {
  // Mock KeywordStat extraction
  const mockKeywords = tc.text.split(' ').map(term => ({ term, score: 5, category: 'domain', tfidf: 1 }));
  const result = classifyDomain(tc.filename, mockKeywords as any, tc.text);
  console.log(`\n--- ${tc.name} ---`);
  console.log(`Primary Domain: ${result.primary}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Evidence:`);
  result.evidence.forEach(e => console.log(` - ${e}`));
});
