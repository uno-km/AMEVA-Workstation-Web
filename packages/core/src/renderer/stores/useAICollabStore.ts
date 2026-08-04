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

import { create } from 'zustand';
import type { PeerState } from '../../shared/types';

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

