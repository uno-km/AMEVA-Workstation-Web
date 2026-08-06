import type { DomainRule } from '../types';

export const softwareRule: DomainRule = {
  id: 'software',
  label: 'IT/소프트웨어',
  source: 'builtin',
  version: '1.0.0',
  weight: 1.0,

  subDomains: [
    { id: 'api', label: 'API', keywords: ['api', 'endpoint', 'rest', 'graphql', 'json', '연동'] },
    { id: 'security', label: '보안', keywords: ['보안', '취약점', '해킹', '암호화', '토큰', '인증'] },
    { id: 'database', label: '데이터베이스', keywords: ['db', 'sql', 'nosql', '스키마', '쿼리'] },
    { id: 'deployment', label: '배포', keywords: ['배포', 'ci', 'cd', 'docker', 'kubernetes', '파이프라인'] },
    { id: 'architecture', label: '아키텍처', keywords: ['아키텍처', '설계', 'msa', '마이크로서비스', '인프라'] }
  ],

  keywords: [
    '프론트엔드', '백엔드', 'API', '네트워크', '알고리즘', '배포', '아키텍처', 
    '도커', '컨테이너', '쿠버네티스', '트래픽', '마이그레이션', '엔드포인트',
    '프레임워크', '라이브러리', '런타임', '컴파일', '디버깅', '리포지토리',
    '파라미터', '페이로드', '라우팅', '토큰', '인증', '방화벽'
  ],
  weakKeywords: ['서버', '클라이언트', '데이터베이스', '보안', '최적화', '테스트', '응답', '요청'],
  ambiguousKeywords: ['기능', '설계', '개발', '시스템', '모듈', '버전'],

  strongPhrases: [
    'API 명세서', '시스템 아키텍처', '데이터베이스 스키마', '배포 파이프라인', 
    '엔드포인트 라우팅', '오픈 API 연동'
  ],
  phrases: [
    '코드 리뷰', '버전 관리', '릴리스 노트', '에러 핸들링', '성능 최적화', 
    '보안 취약점', '클라우드 인프라', '단위 테스트', '오픈 소스', '데이터 마이그레이션'
  ],

  sectionHints: [
    '시스템 개요', '아키텍처', 'API 레퍼런스', '데이터 모델', '배포 환경', 
    '테스트 시나리오', '트러블슈팅', '설치 가이드', '보안 요구사항', '변경 이력'
  ],
  filenameHints: [
    'API명세서', '시스템설계서', '요구사항정의서', '테스트결과서', '배포가이드', 
    '아키텍처', '테이블정의서', '인터페이스', '릴리스노트', '보안점검'
  ],

  unitHints: ['KB', 'MB', 'GB', 'TB', 'ms', 'TPS', 'Mbps', 'GHz'],
  entityHints: [],
  negativeKeywords: ['엑셀사용법', '스마트폰사용법', '컴퓨터조립', '프린터연결', '와이파이연결', '단축키']
};
