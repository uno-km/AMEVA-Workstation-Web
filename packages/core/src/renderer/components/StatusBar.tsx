/**
 * @file StatusBar.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/StatusBar.tsx
 * @role Bottom Status Bar & Quick Utilities UI Panel
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 문서 메타데이터(저장 상태, 줄 수, 글자 수, 단어 수)를 실시간 계산하여 표시한다.
 * - 로컬 AI 모델 다운로드의 진행률(속도, 퍼센트, 진행 바)을 실시간으로 감시 및 시각화한다.
 * - 시스템 핵심 서브시스템(MCP 서버, Local AI 에이전트, 피어 협업 엔진)의 상태 뱃지를 렌더링하고 상태 툴팁을 제공한다.
 * - 줄바꿈 해제 및 줌 배율(문서 줌 및 UI 줌 분리) 상태를 유저에게 보여주며 설정 팝업 버튼을 노출한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 다운로드의 일시정지/취소 제어, 실제 줌 인/아웃 연산 수행 (useProcessStore 및 useAppSettingsManager에 완전히 위임).
 * - 단축키 등록 직접 수행 (useGlobalShortcuts가 전담).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT cause performance degradation: 줄 수, 글자 수 등은 매 입력(`currentContent` 변경)마다 재계산되므로,
 *   내부에 무거운 동기적 문자열 파싱이나 복잡도 O(N^2) 이상의 알고리즘을 추가하지 말 것.
 * - MUST: `PeerState` 타입 임포트는 쓰이지 않아 빌드 에러를 유발하므로 다시 들여오지 말 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - React, useState, useRef: 호버 툴팁 가이드 및 렌더 가드 제어용 React API.
 */
import React, { useState, useRef } from 'react'

/* 
 * [LUCIDE ICONS]
 * - Settings: 환경설정 톱니바퀴 아이콘.
 * - ZoomIn: 줌 배율 돋보기 아이콘.
 * - WrapText: 가로 스크롤 줄바꿈 상태 아이콘.
 */
import { Settings, ZoomIn, WrapText } from 'lucide-react'

/* 
 * [STATUS SUB INDICATORS]
 * - AIStatusIndicator: 로컬 AI 활성화 및 포트 상태 진단 뱃지.
 * - MCPStatusIndicator: 연결된 Model Context Protocol 서버 뱃지.
 * - DocStatusIndicator: 저장 여부, 수정중(dirty) 유무 뱃지.
 * - CollabIndicator: 동시 편집실 참여 피어들의 머릿수 뱃지.
 */
import { MCPStatusIndicator } from './statusbar/MCPStatusIndicator'
import { DocStatusIndicator } from './statusbar/DocStatusIndicator'

/* 
 * [CONTEXT & STORES]
 * - useAppContext: 협업 정보, 전역 설정을 구독하는 컨텍스트.
 * - useUIStore: 환경설정창 개폐 Zustand 스토어.
 * - useWorkspaceStore: 실시간 문서 버퍼 Zustand 스토어.
 * - useProcessStore: 모델 다운로드 및 줌 크기 Zustand 스토어.
 * - useAI: AI 설정 및 가용성 훅.
 */
import { useAppContext } from '../contexts/AppContext'
import { useUIStore } from '../stores/useUIStore'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'
import { useProcessStore } from '../stores/useProcessStore'

export interface StatusBarProps {}

/**
 * @component StatusBar
 * @description 작업 어플리케이션 하단에 고정되어 실시간 리소스 통계 및 시스템 진단 상태를 표기하는 컴포넌트.
 */
export function StatusBar({}: StatusBarProps = {}) {
  /*
   * [HOOK CONFIG CONNECTIONS]
   * - peers: Yjs 동시 편집 접속 유저 목록.
   * - serverRunning: 중계 서버 가동 유무.
   * - handleUpdateSettings: 설정 정보 부분 저장.
   * - isProPlan: 멤버십 요금제 프로 가입 여부.
   */
  const { settings, handleUpdateSettings, mcpServers } = useAppContext()
  const { setIsSettingsOpen } = useUIStore()
  
  // 줌 크기 및 모델 파일 다운로드 현황 스토어 구독
  const { editorZoom: zoomLevel, browserZoom = 1.0 } = useProcessStore()
  const canUseMCP = true
  const { filePath, currentContent, lastSavedTime, originalContent } = useWorkspaceStore()
  const { downloadStatus } = useProcessStore()
  
  
  // 줄바꿈 옵션 상태 추출
  const wordWrap = settings?.wordWrap || false
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onToggleWordWrap`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onToggleWordWrap = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onToggleWordWrap = () => handleUpdateSettings({ wordWrap: !wordWrap })
  
  // 설정 패널 띄우기
  const onOpenSettings = () => setIsSettingsOpen(true)
  
  // 변경 사항이 있는데 아직 수동 저장을 안 했는지 여부 (dirty)
  const isDirty = currentContent !== originalContent

  /*
   * [INVARIANT - Tooltip Timer Management]
   * - activeTooltip: 현재 마우스가 올라간 뱃지의 식별 툴팁 문자열.
   * - tooltipTimerRef: 마우스 아웃 시 즉시 사라지지 않고 250ms 여유를 두어 깜빡임을 막는 타이머 락.
   */
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tooltipTimerRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tooltipTimerRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const tooltipTimerRef = useRef<any>(null)

  // 툴팁 활성화
  const handleMouseEnter = (id: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setActiveTooltip(id)
  }

  // 툴팁 해제
  const handleMouseLeave = () => {
    tooltipTimerRef.current = setTimeout(() => {
      setActiveTooltip(null)
    }, 250)
  }

  /*
   * [PERFORMANCE CRITICAL - Real-time statistics / O(N)]
   * - charCount: 글자 개수.
   * - wordCount: 공백 기준 단어 수.
   * - lineCount: 개행 문자 기준 줄 수.
   */
  const charCount = currentContent.length
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `wordCount`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const wordCount = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lineCount`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lineCount = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const lineCount = currentContent ? currentContent.split('\n').length : 0

  /*
   * [INVARIANT - Glassmorphism Tooltip Design Tokens]
   * - Rationale: 타 모달에 가려지지 않는 절대 zIndex 9999 보장.
   */
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '32px',
    background: 'rgba(15, 15, 20, 0.88)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(139, 92, 246, 0.35)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '12px 14px',
    zIndex: 9999,
    pointerEvents: 'auto',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-sans)',
  }
  
  // 소수점 줌 수치 백분율 포맷 변환
  const zoomPercent = Math.round(zoomLevel * 100)

  return (
    <div
      className="glass-panel"
      style={{
        height: '28px',
        width: '100%',
        borderTop: '1px solid var(--border-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)',
        zIndex: 101,
        userSelect: 'none',
      }}
    >
      {/* 1. 좌측: 파일 상태 및 문서 통계 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <DocStatusIndicator 
          filePath={filePath}
          isDirty={isDirty}
          lastSavedTime={lastSavedTime}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
          tooltipStyle={tooltipStyle}
        />
        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-muted)' }} />
        <span>
          줄 수: <strong>{lineCount}</strong>줄 | 공백 포함: <strong>{charCount}</strong>자 | 단어: <strong>{wordCount}</strong>개
        </span>
      </div>

      {/* 📥 중앙: 로컬 모델 다운로드 실시간 진행률 및 속도 지표 */}
      {downloadStatus && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '6px',
          padding: '2px 10px',
          color: 'var(--secondary)',
          fontWeight: 600,
          fontSize: '10.5px',
          height: '20px',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            📥 {downloadStatus.filename?.split(/[\\/]/).pop()}: {downloadStatus.progress}%
          </span>
          <div style={{ width: '70px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${downloadStatus.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
          </div>
          <span style={{ fontSize: '9px', opacity: 0.85 }}>({downloadStatus.speed || 0} MB/s)</span>
        </div>
      )}

      {/* 2. 우측: 시스템 상태 진단 뱃지 및 설정 컨트롤 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* MCP 서버 동작 상태 */}
        <MCPStatusIndicator 
          canUseMCP={canUseMCP}
          mcpServers={mcpServers || []}
          activeTooltip={activeTooltip}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          tooltipStyle={tooltipStyle}
        />
        {canUseMCP && mcpServers && mcpServers.length > 0 && <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-muted)' }} />}



        {/* 가로 스크롤 강제 줄바꿈 비활성화 단추 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            color: !wordWrap ? 'var(--secondary)' : 'var(--text-muted)',
            fontWeight: !wordWrap ? 600 : 400,
            transition: 'var(--transition-fast)',
          }}
          title="줄바꿈을 끄고 본문을 한 줄로 길게 보이며 가로 스크롤을 활성화합니다."
        >
          <input
            type="checkbox"
            checked={!wordWrap}
            onChange={onToggleWordWrap}
            style={{ cursor: 'pointer', accentColor: 'var(--secondary)' }}
          />
          <WrapText size={12} />
          <span>줄바꿈 비활성화 (가로 스크롤)</span>
        </label>

        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-muted)' }} />

        {/* 줌 배율 지표 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ZoomIn size={12} />
          <span>
            문서: <strong>{zoomPercent}%</strong>
            {browserZoom !== 1.0 && (
              <span style={{ color: 'var(--secondary)', marginLeft: '6px' }}>
                UI: <strong>{Math.round(browserZoom * 100)}%</strong>
              </span>
            )}
          </span>
        </div>

        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-muted)' }} />

        {/* 환경 설정 트리거 버튼 */}
        <button
          onClick={onOpenSettings}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'var(--transition-fast)',
          }}
          title="환경 설정"
        >
          <Settings size={12} style={{ color: 'var(--primary)' }} />
          <span>설정</span>
        </button>
      </div>
    </div>
  )
}

