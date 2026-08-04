/**
 * @file RightTabStrip.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/RightTabStrip.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import { Sparkles, List, Calculator, TrendingUp, Play, Globe, Search, Calendar, HardDrive, Map, FileText, Database, Network, MonitorPlay, Timer, Mic, Server, LayoutTemplate } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useUIStore } from '../stores/useUIStore';
import { useAppContext } from '../contexts/AppContext';
import { useProcessStore } from '../stores/useProcessStore';

export interface RightTabStripProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `TabContextMenu`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `TabContextMenu(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function TabContextMenu({
  x, y, tabLabel, isTabOpen,
  onOpen, onClose, onCloseOthers, onDismiss
}: {
  x: number; y: number; tabId: string; tabLabel: string; isTabOpen: boolean
  onOpen: () => void; onClose: () => void; onCloseOthers: () => void; onDismiss: () => void
}) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `menuRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const menuRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const menuRef = useRef<HTMLDivElement>(null);
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `safeX`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const safeX = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const safeX = Math.min(x, window.innerWidth - 200);
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `safeY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const safeY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const safeY = Math.min(y, window.innerHeight - 140);

  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handler`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handler = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handler = (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `menuRef.current && !menuRef.current.contains(e.target as Node)`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (menuRef.current && !menuRef.current.contains(e.target as Node))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `id`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const id = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const id = setTimeout(() => window.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(id); window.removeEventListener('mousedown', handler); };
  }, [onDismiss]);

  const btnStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', color: 'var(--text-main)',
    padding: '7px 12px', textAlign: 'left', cursor: 'pointer',
    fontSize: '11.5px', borderRadius: '4px', width: '100%',
    display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'background 0.12s',
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed', top: safeY, left: safeX,
        background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
        borderRadius: '8px', padding: '4px', display: 'flex', flexDirection: 'column',
        zIndex: 99999, boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)',
        fontFamily: 'var(--font-sans)', minWidth: '180px', backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ padding: '4px 10px 6px', borderBottom: '1px solid var(--border-muted)', marginBottom: '2px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{tabLabel}</span>
      </div>

      <button
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-active)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        onClick={() => { isTabOpen ? onClose() : onOpen(); onDismiss(); }}
      >
        <span>{isTabOpen ? '✕' : '▶'}</span>
        {isTabOpen ? '탭 닫기' : '탭 열기'}
      </button>

      <div style={{ height: '1px', background: 'var(--border-muted)', margin: '2px 0' }} />

      <button
        style={{ ...btnStyle, color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-active)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        onClick={() => { onCloseOthers(); onDismiss(); }}
      >
        <span>⊘</span> 다른 탭 모두 닫기
      </button>
    </div>
  );
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `RightTabStrip`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `RightTabStrip(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function RightTabStrip({}: RightTabStripProps = {}) {
  const { activeRightTab: activeTab, showAIPanel: isOpen, setShowAIPanel, setActiveRightTab, hasChatUnread } = useUIStore();
  const { settings } = useAppContext();
  const canAccessPremium = true;
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `installedPlugins`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const installedPlugins = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const installedPlugins = settings?.installedPlugins || [];
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hotkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hotkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hotkeys = settings?.hotkeys;

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isDraggingRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isDraggingRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isDraggingRef = useRef(false);
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dragStartPos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dragStartPos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const dragStartPos = useRef({ x: 0, y: 0 });

  const dragListenersRef = useRef<{ move: ((e: MouseEvent) => void) | null, up: (() => void) | null }>({ move: null, up: null });

  useEffect(() => {
    return () => {
      if (dragListenersRef.current.move) window.removeEventListener('mousemove', dragListenersRef.current.move);
      if (dragListenersRef.current.up) window.removeEventListener('mouseup', dragListenersRef.current.up);
    };
  }, []);

  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; tabId: string; tabLabel: string
  } | null>(null);

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onToggleTab`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onToggleTab = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onToggleTab = (tab: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen && activeTab === tab`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen && activeTab === tab)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen && activeTab === tab) {
      setShowAIPanel(false);
    } else {
      setActiveRightTab(tab);
      setShowAIPanel(true);
    }
  };

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `formatHotkey`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const formatHotkey = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const formatHotkey = (raw: string | undefined): string => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!raw`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!raw)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!raw) return '';
    return raw
      .replace('Control', 'Ctrl')
      .replace('Shift', 'Shift')
      .replace('Alt', 'Alt')
      .replace('Meta', 'Cmd')
      .split('+')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' + ');
  };

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hkeys = hotkeys || {
    save: 'Control+s', open: 'Control+o', newFile: 'Control+n',
    pdfExport: 'Control+p', toggleAI: 'Control+\\', toggleMode: 'Control+h',
    zoomIn: 'Control+=', zoomOut: 'Control+-', zoomReset: 'Control+0'
  };

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isOutlineSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isOutlineSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isOutlineSubscribed = installedPlugins.includes('outline');
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isCalculatorSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isCalculatorSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isCalculatorSubscribed = installedPlugins.includes('calculator');
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isFinanceSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isFinanceSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isFinanceSubscribed = installedPlugins.includes('finance-dashboard');
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isYoutubeSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isYoutubeSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isYoutubeSubscribed = installedPlugins.includes('youtube');
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isCalendarSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isCalendarSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isCalendarSubscribed = installedPlugins.includes('calendar');
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isGoogleDriveSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isGoogleDriveSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isGoogleDriveSubscribed = installedPlugins.includes('google-drive');
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isGoogleMapsSubscribed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isGoogleMapsSubscribed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isGoogleMapsSubscribed = installedPlugins.includes('google-maps') || installedPlugins.includes('GoogleMapsView');
  const isWebBrowserSubscribed = installedPlugins.includes('web-browser') || installedPlugins.includes('AmevaBrowserView') || installedPlugins.includes('SmartSearchScrap');
  const isPdfRagSubscribed = installedPlugins.includes('pdf-rag') || installedPlugins.includes('PdfRagPlugin');
  const isDbExplorerSubscribed = installedPlugins.includes('db-explorer') || installedPlugins.includes('DatabaseExplorerPlugin');
  const isMindMapSubscribed = installedPlugins.includes('mind-map') || installedPlugins.includes('MindMapPlugin');
  const isPresentationSubscribed = installedPlugins.includes('presentation') || installedPlugins.includes('PresentationPlugin');
  const isPomodoroSubscribed = installedPlugins.includes('pomodoro') || installedPlugins.includes('PomodoroPlugin');
  const isVoiceDictationSubscribed = installedPlugins.includes('voice-dictation') || installedPlugins.includes('VoiceDictationPlugin');
  const isRestClientSubscribed = installedPlugins.includes('rest-client') || installedPlugins.includes('RestClientPlugin');
  const isWireframeSubscribed = installedPlugins.includes('wireframe') || installedPlugins.includes('WireframePlugin');

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tabs`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tabs = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const tabs = canAccessPremium ? [
    { id: 'ai', icon: Sparkles, label: 'AI 어시스턴트', badge: hasChatUnread },
    ...(isOutlineSubscribed ? [{ id: 'outline', icon: List, label: '문서 구조도 (TOC)', badge: false }] : []),
    ...(isCalculatorSubscribed ? [{ id: 'calculator', icon: Calculator, label: '계산기 도구', badge: false }] : []),
    ...(isFinanceSubscribed ? [{ id: 'finance', icon: TrendingUp, label: '주식/환율 정보센터', badge: false }] : []),
    ...(isYoutubeSubscribed ? [{ id: 'youtube', icon: Play, label: 'YouTube 동영상', badge: false }] : []),
    ...(isCalendarSubscribed ? [{ id: 'calendar', icon: Calendar, label: '스케줄 캘린더', badge: false }] : []),
    ...(isGoogleDriveSubscribed ? [{ id: 'google-drive', icon: HardDrive, label: '구글 드라이브', badge: false }] : []),
    ...(isGoogleMapsSubscribed ? [{ id: 'google-maps', icon: Map, label: '구글 지도', badge: false }] : []),
    ...(isPdfRagSubscribed ? [{ id: 'pdf-rag', icon: FileText, label: 'PDF 문서 대화 (RAG)', badge: false }] : []),
    ...(isWebBrowserSubscribed ? [{ id: 'web-browser', icon: Globe, label: '검색 및 스크랩 (Smart Search & Scrap)', badge: false }] : []),
    ...(isDbExplorerSubscribed ? [{ id: 'db-explorer', icon: Database, label: '데이터베이스 탐색기', badge: false }] : []),
    ...(isMindMapSubscribed ? [{ id: 'mind-map', icon: Network, label: '마인드맵 생성기', badge: false }] : []),
    ...(isPresentationSubscribed ? [{ id: 'presentation', icon: MonitorPlay, label: '프레젠테이션 모드', badge: false }] : []),
    ...(isPomodoroSubscribed ? [{ id: 'pomodoro', icon: Timer, label: '집중력 & 뽀모도로', badge: false }] : []),
    ...(isVoiceDictationSubscribed ? [{ id: 'voice-dictation', icon: Mic, label: '음성 회의록 작성', badge: false }] : []),
    ...(isRestClientSubscribed ? [{ id: 'rest-client', icon: Server, label: 'REST API 클라이언트', badge: false }] : []),
    ...(isWireframeSubscribed ? [{ id: 'wireframe', icon: LayoutTemplate, label: 'UI 와이어프레임', badge: false }] : []),
  ] : [
    { id: 'ai', icon: Sparkles, label: 'AI 어시스턴트', badge: hasChatUnread },
  ];

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseDown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseDown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.button !== 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.button !== 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (e.button !== 0) return;
    isDraggingRef.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const onMove = (me: MouseEvent) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const dx = me.clientX - dragStartPos.current.x;
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const dy = me.clientY - dragStartPos.current.y;
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `Math.sqrt(dx * dx + dy * dy) > 5`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (Math.sqrt(dx * dx + dy * dy) > 5)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDraggingRef.current = true;
      }
    };
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onUp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onUp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const onUp = () => {
      if (dragListenersRef.current.move) window.removeEventListener('mousemove', dragListenersRef.current.move);
      if (dragListenersRef.current.up) window.removeEventListener('mouseup', dragListenersRef.current.up);
      dragListenersRef.current.move = null;
      dragListenersRef.current.up = null;
    };
    dragListenersRef.current.move = onMove;
    dragListenersRef.current.up = onUp;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleContextMenu`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleContextMenu = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string, tabLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId, tabLabel });
  }, []);

  return (
    <div
      style={{
        width: '40px', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', background: 'var(--bg-deep)', borderLeft: '1px solid var(--border-muted)',
        paddingTop: '16px', gap: '6px', flexShrink: 0, zIndex: 100, userSelect: 'none',
      }}
    >
      {tabs.map((t) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const isActive = isOpen && activeTab === t.id;
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `Icon`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const Icon = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            onMouseDown={handleMouseDown}
            onMouseUp={(e) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isDraggingRef.current && e.button === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isDraggingRef.current && e.button === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (!isDraggingRef.current && e.button === 0) {
                onToggleTab(t.id);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, t.id, t.label)}
            title={t.id === 'ai' ? t.label + ' (' + formatHotkey(hkeys.toggleAI) + ')' : t.label}
            style={{
              width: '28px', height: '32px', borderRadius: '6px 0 0 6px',
              background: isActive ? 'rgba(236, 72, 153, 0.08)' : 'transparent',
              border: isActive ? '1px solid #ec4899' : '1px solid transparent',
              borderRight: isActive ? 'none' : '1px solid transparent',
              color: isActive ? '#f472b6' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', transition: 'var(--transition-fast)',
              outline: 'none', marginLeft: isActive ? '12px' : '0',
              boxShadow: isActive ? '0 0 14px rgba(236, 72, 153, 0.25)' : 'none',
            }}
            onMouseEnter={(e) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isActive`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isActive)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.background = 'var(--bg-glass-active)';
              }
            }}
            onMouseLeave={(e) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isActive`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isActive)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                left: '2px',
                top: '6px',
                bottom: '6px',
                width: '3px',
                background: 'linear-gradient(to bottom, #a855f7, #ec4899)',
                borderRadius: '2px',
                boxShadow: '0 0 8px #ec4899, 0 0 4px #a855f7',
              }} />
            )}
            <Icon size={isActive ? 18 : 16} strokeWidth={isActive ? 2.5 : 1.8} style={{ transition: 'all 0.2s ease', filter: isActive ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.6))' : 'none' }} />
            {t.badge && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: '#f97316', boxShadow: '0 0 4px #f97316',
              }} />
            )}
          </button>
        );
      })}

      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tabId={contextMenu.tabId}
          tabLabel={contextMenu.tabLabel}
          isTabOpen={isOpen && activeTab === contextMenu.tabId}
          onOpen={() => { setActiveRightTab(contextMenu.tabId); setShowAIPanel(true); }}
          onClose={() => setShowAIPanel(false)}
          onCloseOthers={() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeTab !== 'ai'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeTab !== 'ai')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (activeTab !== 'ai') {
              setActiveRightTab('ai');
            }
          }}
          onDismiss={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

