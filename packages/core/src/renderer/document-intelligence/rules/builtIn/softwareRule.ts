import type { DomainRule } from '../types';

export const softwareRule: DomainRule = {
  id: 'software',
  label: 'SW/IT',
  source: 'builtin',
  version: '1.0.0',
  weight: 1,
  keywords: [
    '소프트웨어', '서버', 'API', '데이터베이스', '네트워크',
    '인증', '보안', '클라우드', '배포', '시스템', '장애',
    '프론트엔드', '백엔드', '모바일', '인프라', '아키텍처',
    '개발', '테스트', '버그', '디버깅', '라이브러리', '프레임워크'
  ]
};
