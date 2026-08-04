/**
 * @file useAILogStore.ts
 * @system AMEVA OS Desktop Workstation - Global State Store
 * @location src/renderer/stores/useAILogStore.ts
 * @role AI interaction messages & system log ring-buffer Zustand Store
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - WebGPU 진단 로그 및 시스템 명령어 실행 결과(Sensor Logs)는 1초당 수십~수백 건에 달하여,
 *   매번 직렬 가동 시 리액트 가상 DOM 리렌더링 과부하로 앱이 다운될 수 있다.
 * - 이 문제를 방지하기 위해 **100ms 간격 스로틀링 버퍼(pendingSensorLogs & flushTimeout)**를 구성하고,
 *   로그 총개수가 `MAX_LOG_BUFFER`(1000개)를 넘으면 가장 오래된 로그를 잘라내는 **링 버퍼(Ring Buffer) Invariant**를 설계 적용했다.
 * - 다중 프레임 또는 새창 브라우징 환경 간의 로그 정합성 보존을 위해 **브라우저 BroadcastChannel API**를 연동하여 동시 분배한다.
 * - AI 대화 말풍선 히스토리 데이터(messages) 및 UI 실시간 갱신 버퍼(streamingText)의 전역 수록을 담당한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - AI 대화 말풍선 메시지 셋(`messages`)의 추가, 삭제, 필터 갱신 액션을 제어한다.
 * - 스로틀링 디바운스가 적용된 센서 로그 링 버퍼링을 처리한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT exceed MAX_LOG_BUFFER: 시스템 메모리 누수 방지를 위해,
 *   로그를 병합 플러싱(`_flushExternalLogs`, `addSensorLog`)하는 모든 경로에서는 반드시 슬라이싱 연산을 거쳐 버퍼 개수를 `MAX_LOG_BUFFER` 이하로 제한 유지할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 도메인 훅 내부에서 상태 값 바인딩 및 변경 액션 호출 시 소비.
 * - 소비처 B (src/renderer/components/): 컴포넌트 내 렌더 조건 판단을 위해 실시간 구독(Subscribe) 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - create: Zustand 상태 스토어 생성을 위한 코어 API.
 */
import { create } from 'zustand';

/* 
 * [SHARED CONSTANTS & TYPES]
 * - AI_TERMINAL_CONSTANTS: `MAX_LOG_BUFFER` (최대 1000개 보존) 및 `SENSOR_POLLING_RATE_MS` (100ms 단위) 등의 상수를 들고 있는 전역 설정 정의.
 * - AIMessage: 대화 말풍선 정보 구조체.
 */
const AI_TERMINAL_CONSTANTS = { MAX_LOG_BUFFER: 1000, SENSOR_POLLING_RATE_MS: 100 };
import type { AIMessage } from '../types/aiTypes';

/**
 * AILogState 인터페이스 정의.
 * 로그 링버퍼, 메시지 히스토리 및 브로드캐스트 상태 맵.
 */
export interface AILogState {
  // 1. 센서 및 WebGPU 시스템 로그 보관용 링 버퍼 상태 및 액션
  sensorLogs: string[];
  addSensorLog: (log: string) => void;
  clearSensorLogs: () => void;

  // 2. AI 채팅 메시지 목록 보관용 상태 및 액션
  messages: AIMessage[];
  setMessages: (updater: AIMessage[] | ((prev: AIMessage[]) => AIMessage[])) => void;
  addMessage: (msg: AIMessage) => void;
  updateMessage: (id: string, updater: (msg: AIMessage) => AIMessage) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  chatSessionId: string;
  regenerateChatSessionId: () => void;

  // 3. 실시간 토큰 갱신 렌더 바이패스용 텍스트 조각 상태 및 액션
  streamingText: string;
  setStreamingText: (text: string) => void;

  // 4. [ADDITION] 로그 전용 실시간 검색 필터 쿼리 문자열 상태 및 액션
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 브로드캐스트를 통해 타창으로부터 수신된 로그 플러싱 내부 액션
  _flushExternalLogs: (logs: string[]) => void;
}

/*
 * [TRANSIENT LOG BUFFERS & CHANNELS]
 * - pendingSensorLogs: 100ms 타임슬롯 동안 임시 누적되는 텍스트 배열.
 * - flushTimeout: 100ms 스로틀 스케줄러 타이머 참조.
 * - broadcastChannel: 크롬/일렉트론 프로세스 내 다중 창 로그 분배용 채널.
 */
let pendingSensorLogs: string[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// 브라우저 윈도우 환경 내 채널 개설 및 감청 바인딩
if (typeof window !== 'undefined' && window.BroadcastChannel) {
  broadcastChannel = new BroadcastChannel('ameva-sensor-logs-channel');
  
  broadcastChannel.onmessage = (event) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `event.data && event.data.type === 'new-logs'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (event.data && event.data.type === 'new-logs')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (event.data && event.data.type === 'new-logs') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `logs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const logs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const logs = event.data.logs as string[];
      // 타 프레임 채널로부터 유입된 로그를 로컬 버퍼에 병합 플러시
      useAILogStore.getState()._flushExternalLogs(logs);
    }
  };
}

/**
 * useAILogStore Zustand 스토어 본체 정의.
 */
export const useAILogStore = create<AILogState>((set) => ({
  sensorLogs: [],
  
  /**
   * [CONTRACT - External Logs Merger]
   * - Rationale: 타 채널로부터 공유받은 로그를 추가하고, MAX_LOG_BUFFER를 초과하면 오래된 앞부분을 깎아낸다.
   */
  _flushExternalLogs: (logs: string[]) => {
    set((state) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newLogs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newLogs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let newLogs = [...state.sensorLogs, ...logs];
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `newLogs.length > AI_TERMINAL_CONSTANTS.MAX_LOG_BUFFER`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (newLogs.length > AI_TERMINAL_CONSTANTS.MAX_LOG_BUFFER)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (newLogs.length > AI_TERMINAL_CONSTANTS.MAX_LOG_BUFFER) {
        newLogs = newLogs.slice(newLogs.length - AI_TERMINAL_CONSTANTS.MAX_LOG_BUFFER);
      }
      return { sensorLogs: newLogs };
    });
  },

  /**
   * [CONTRACT - Throttled Add Log Action]
   * - Rationale: 로그 유입 즉시 상태를 바꾸지 않고 100ms 디바운스 대기열(pendingSensorLogs)에 파킹했다가 한꺼번에 플러싱하고,
   *   BroadcastChannel을 통해 타 창으로 포워딩해 준다.
   */
  addSensorLog: (log: string) => {
    pendingSensorLogs.push(log);
    
    // 타이머가 작동 중이면 추가 예약 상태로 리턴
    if (flushTimeout) return;
    
    // 100ms 지연 타이머 기동
    flushTimeout = setTimeout(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `logsToFlush`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const logsToFlush = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const logsToFlush = [...pendingSensorLogs];
      pendingSensorLogs = [];
      flushTimeout = null;

      // 타 윈도우 채널로 로그 전송
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'new-logs', logs: logsToFlush });
      }

      set((state) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newLogs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newLogs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        let newLogs = [...state.sensorLogs, ...logsToFlush];
        
        // CONTRACT: 링 버퍼 초과 슬라이싱 유지 계약
        if (newLogs.length > AI_TERMINAL_CONSTANTS.MAX_LOG_BUFFER) {
          newLogs = newLogs.slice(newLogs.length - AI_TERMINAL_CONSTANTS.MAX_LOG_BUFFER);
        }
        return { sensorLogs: newLogs };
      });
    }, AI_TERMINAL_CONSTANTS.SENSOR_POLLING_RATE_MS || 100);
  },
  
  clearSensorLogs: () => set({ sensorLogs: [] }),

  // AI 채팅 메시지 상태 조작 액션 맵
  messages: [],
  setMessages: (updater) => set((state) => ({ 
    messages: typeof updater === 'function' ? updater(state.messages) : updater 
  })),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id, updater) => set((state) => ({
    messages: state.messages.map((m) => (m.id === id ? updater(m) : m)),
  })),
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== id),
  })),
  clearMessages: () => set({ messages: [], chatSessionId: crypto.randomUUID() }),
  chatSessionId: crypto.randomUUID(),
  regenerateChatSessionId: () => set({ chatSessionId: crypto.randomUUID() }),

  streamingText: '',
  setStreamingText: (text: string) => set({ streamingText: text }),

  // [ADDITION] 검색 쿼리 상태 기본값 및 액션 매핑
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));

