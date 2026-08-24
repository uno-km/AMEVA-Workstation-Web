/**
 * ============================================================================
 * @file RightTabStrip.tsx
 * @description RightTabStrip.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './RightTabStrip';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Sparkles, List, Calculator, TrendingUp, Play, Globe, Search, Calendar, HardDrive, Map, FileText, Database, Network, MonitorPlay, Timer, Mic, Server, LayoutTemplate } from 'lucide-react';
// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useRef, useEffect, useCallback } from 'react';

// [내부 프로젝트 의존성 모듈 임포트: ../stores/useUIStore]
import { useUIStore } from '../stores/useUIStore';
// [내부 프로젝트 의존성 모듈 임포트: ../contexts/AppContext]
import { useAppContext } from '../contexts/AppContext';
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useProcessStore]
import { useProcessStore } from '../stores/useProcessStore';

/**
 * RightTabStripProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface RightTabStripProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `TabContextMenu`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `TabContextMenu(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * TabContextMenu 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
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
/**
 * RightTabStrip 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function RightTabStrip({}: RightTabStripProps = {}) {
  const { activeRightTab: activeTab, showAIPanel: isOpen, setShowAIPanel, setActiveRightTab, hasChatUnread } = useUIStore();
  const { settings } = useAppContext();
  const canAccessPremium = true;

  const installedPlugins = settings?.installedPlugins || [];
  const hotkeys = settings?.hotkeys;

  const isDraggingRef = useRef(false);
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

  const onToggleTab = (tab: string) => {
    if (isOpen && activeTab === tab) {
      setShowAIPanel(false);
    } else {
      setActiveRightTab(tab);
      setShowAIPanel(true);
    }
  };

  const formatHotkey = (raw: string | undefined): string => {
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

  const hkeys = hotkeys || {
    save: 'Control+s', open: 'Control+o', newFile: 'Control+n',
    pdfExport: 'Control+p', toggleAI: 'Control+\\', toggleMode: 'Control+h',
    zoomIn: 'Control+=', zoomOut: 'Control+-', zoomReset: 'Control+0'
  };

  const { marketplacePlugins } = useUIStore();
  
  // 알려진 플러그인 ID에 대한 아이콘 매핑 (없으면 기본값 Globe 사용)
  const iconMap: Record<string, any> = {
    'outline': List,
    'calculator': Calculator,
    'finance-dashboard': TrendingUp,
    'FinanceDashboardView': TrendingUp,
    'youtube': Play,
    'calendar': Calendar,
    'google-drive': HardDrive,
    'osm-maps': Map,
    'OpenStreetMapsView': Map,
    'pdf-rag': FileText,
    'PdfRagPlugin': FileText,
    'web-browser': Globe,
    'AmevaBrowserView': Globe,
    'SmartSearchScrap': Globe,
    'db-explorer': Database,
    'DatabaseExplorerPlugin': Database,
    'mind-map': Network,
    'MindMapPlugin': Network,
    'presentation': MonitorPlay,
    'PresentationPlugin': MonitorPlay,
    'pomodoro': Timer,
    'PomodoroPlugin': Timer,
    'voice-dictation': Mic,
    'VoiceDictationPlugin': Mic,
    'rest-client': Server,
    'RestClientPlugin': Server,
    'wireframe': LayoutTemplate,
    'WireframePlugin': LayoutTemplate,
  };

  const tabs: any[] = [
    { id: 'ai', icon: Sparkles, label: 'AI 어시스턴트', badge: hasChatUnread },
  ];

  if (canAccessPremium) {
    installedPlugins.forEach((id) => {
      // 마켓플레이스 데이터에서 플러그인 정보 찾기
      const meta = marketplacePlugins.find((p) => p.id === id);
      
      // placement가 명시적으로 존재하고 'right-panel'이 아니면 탭에 추가하지 않음
      if (meta && meta.placement && meta.placement !== 'right-panel') {
        return;
      }

      const label = meta ? meta.name : id;
      const icon = iconMap[id] || Globe;
      
      // 중복 추가 방지
      if (!tabs.find(t => t.id === id)) {
        tabs.push({ id, icon, label, badge: false });
      }
    });
  }


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
              background: isActive ? 'var(--bg-glass-active)' : 'transparent',
              border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
              borderRight: isActive ? 'none' : '1px solid transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', transition: 'var(--transition-fast)',
              outline: 'none', marginLeft: isActive ? '12px' : '0',
              boxShadow: isActive ? '0 0 14px var(--primary-glow)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.background = 'var(--bg-glass-active)';
              }
            }}
            onMouseLeave={(e) => {
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
                background: 'var(--primary)',
                borderRadius: '2px',
                boxShadow: '0 0 8px var(--primary-glow)',
              }} />
            )}
            <Icon size={isActive ? 18 : 16} strokeWidth={isActive ? 2.5 : 1.8} style={{ transition: 'all 0.2s ease' }} />
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

