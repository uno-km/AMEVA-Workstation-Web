/**
 * ============================================================================
 * @file useAICollabStore.ts
 * @description useAICollabStore.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useAICollabStore';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file useAICollabStore.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/stores/useAICollabStore.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 도메인 훅 내부에서 상태 값 바인딩 및 변경 액션 호출 시 소비.
 * - 소비처 B (src/renderer/components/): 컴포넌트 내 렌더 조건 판단을 위해 실시간 구독(Subscribe) 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

// [외부 패키지 및 라이브러리 임포트: zustand]
import { create } from 'zustand';
// [내부 프로젝트 의존성 모듈 임포트: ../../shared/types]
import type { PeerState } from '../../shared/types';

/**
 * CollabState 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface CollabState {
  peers: PeerState[];
  setPeers: (peers: PeerState[]) => void;
  clearPeers: () => void;
}

/**
 * 투 트랙(Two-Track) 아키텍처 중 협업(Collaboration) 트랙을 담당.
 * 다중 사용자의 커서, 포커스 등 메타데이터를 전역 스토어로 관리하여
 * 최상단 App.tsx부터 깊은 컴포넌트까지 Props Drilling 없이 사용할 수 있게 고도화.
 */
export const useAICollabStore = create<CollabState>((set) => ({
  peers: [],
  setPeers: (peers) => set({ peers }),
  clearPeers: () => set({ peers: [] }),
}));

