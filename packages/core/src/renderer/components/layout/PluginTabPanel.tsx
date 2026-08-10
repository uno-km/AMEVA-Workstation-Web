/**
 * ============================================================================
 * @file PluginTabPanel.tsx
 * @description PluginTabPanel.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './PluginTabPanel';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file PluginTabPanel.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/layout/PluginTabPanel.tsx
 * @role 마켓플레이스에서 설치된 플러그인 탭 클릭 시 우측 패널에 렌더링되는 라우터 컴포넌트
 *
 * [책임 범위 - RESPONSIBILITY]
 * - activeRightTab ID에 따라 해당 플러그인 패널 뷰를 분기 렌더링한다.
 * - 아직 미구현된 플러그인은 '준비 중' 안내 카드를 표시한다.
 * - 설치된 플러그인 목록에 없는 탭이 열리면 graceful fallback을 보여준다.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useEffect } from 'react'
import {
  Globe, FileText, Database, Network, MonitorPlay,
  Timer, Mic, Server, LayoutTemplate, Map, HardDrive,
  Calendar, TrendingUp, Play, Search, X
} from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useUIStore]
import { useUIStore } from '../../stores/useUIStore'
// [내부 프로젝트 의존성 모듈 임포트: ../ChatPanel]
import { ChatPanel } from '../ChatPanel'
// [내부 프로젝트 의존성 모듈 임포트: ./CalculatorPanel]
import { CalculatorPanel } from './CalculatorPanel'
// [내부 프로젝트 의존성 모듈 임포트: ./OSMMapView]
import { OSMMapView } from './OSMMapView'
// [내부 프로젝트 의존성 모듈 임포트: ../../contexts/AppContext]
import { useAppContext } from '../../contexts/AppContext'

const PLUGIN_META: Record<string, {
  label: string
  icon: React.ReactNode
  color: string
  description: string
  implemented: boolean
}> = {
  'ai': {
    label: 'AI 어시스턴트',
    icon: <Globe size={24} />,
    color: '#8b5cf6',
    description: 'AI 대화형 어시스턴트 패널',
    implemented: true,
  },
  'web-browser': {
    label: '검색 및 스크랩',
    icon: <Globe size={24} />,
    color: '#06b6d4',
    description: '실시간 웹 검색 및 스크랩 도구 (Smart Search & Scrap)',
    implemented: false,
  },
  'pdf-rag': {
    label: 'PDF 문서 대화 (RAG)',
    icon: <FileText size={24} />,
    color: '#ef4444',
    description: 'PDF 파일을 업로드하여 AI와 대화하는 RAG 도구',
    implemented: false,
  },
  'db-explorer': {
    label: '데이터베이스 탐색기',
    icon: <Database size={24} />,
    color: '#10b981',
    description: 'SQLite/PostgreSQL DB 스키마 탐색 및 쿼리 실행기',
    implemented: false,
  },
  'mind-map': {
    label: '마인드맵 생성기',
    icon: <Network size={24} />,
    color: '#a855f7',
    description: '문서 내용을 자동으로 마인드맵으로 시각화',
    implemented: false,
  },
  'presentation': {
    label: '프레젠테이션 모드',
    icon: <MonitorPlay size={24} />,
    color: '#f59e0b',
    description: '문서를 슬라이드 프레젠테이션으로 변환하여 발표',
    implemented: false,
  },
  'pomodoro': {
    label: '집중력 & 뽀모도로',
    icon: <Timer size={24} />,
    color: '#ec4899',
    description: '25분 집중 / 5분 휴식 뽀모도로 타이머',
    implemented: false,
  },
  'voice-dictation': {
    label: '음성 회의록 작성',
    icon: <Mic size={24} />,
    color: '#8b5cf6',
    description: '마이크 음성을 실시간으로 텍스트로 변환하여 문서에 삽입',
    implemented: false,
  },
  'rest-client': {
    label: 'REST API 클라이언트',
    icon: <Server size={24} />,
    color: '#14b8a6',
    description: 'HTTP 요청을 보내고 응답을 문서에 삽입하는 API 테스터',
    implemented: false,
  },
  'wireframe': {
    label: 'UI 와이어프레임',
    icon: <LayoutTemplate size={24} />,
    color: '#f97316',
    description: '드래그 앤 드롭 UI 와이어프레임 설계 도구',
    implemented: false,
  },
  'osm-maps': {
    label: '오픈스트리트맵',
    icon: <Map size={24} />,
    color: '#22c55e',
    description: '오픈스트리트맵 임베드 및 위치 검색',
    implemented: false,
  },
  'OSMMapView': {
    label: '오픈스트리트맵',
    icon: <Map size={24} />,
    color: '#22c55e',
    description: '오픈스트리트맵 임베드 및 위치 검색',
    implemented: false,
  },
  'google-drive': {
    label: '구글 드라이브',
    icon: <HardDrive size={24} />,
    color: '#3b82f6',
    description: '구글 드라이브 파일 연동 및 문서 가져오기',
    implemented: false,
  },
  'calendar': {
    label: '스케줄 캘린더',
    icon: <Calendar size={24} />,
    color: '#8b5cf6',
    description: '일정 관리 및 구글 캘린더 연동',
    implemented: false,
  },
  'finance': {
    label: '주식/환율 정보센터',
    icon: <TrendingUp size={24} />,
    color: '#f59e0b',
    description: '실시간 주식/환율 정보 및 차트',
    implemented: false,
  },
  'youtube': {
    label: 'YouTube 동영상',
    icon: <Play size={24} />,
    color: '#ef4444',
    description: 'YouTube 동영상 검색 및 재생',
    implemented: false,
  },
  'outline': {
    label: '문서 구조도 (TOC)',
    icon: <Search size={24} />,
    color: '#06b6d4',
    description: '현재 문서의 헤딩 구조를 트리로 표시',
    implemented: false,
  },
}

/**
 * PluginTabPanelProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface PluginTabPanelProps {
  tabId: string
}

/**
 * PluginTabPanel 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function PluginTabPanel({ tabId }: PluginTabPanelProps) {
  const { setShowAIPanel } = useUIStore()
  const {
    chatMessages,
    sendChatMessage,
    clearChatMessages,
    username,
    userColor,
    serverRunning
  } = useAppContext()

  useEffect(() => {
    // 탭 변경 시마다 해당 플러그인이 로드되었는지 확인하고 렌더링 시도
    let attempts = 0
    const containerId = `plugin-container-${tabId}`
    
    const timer = setInterval(() => {
      attempts++
      const plugin = (window as any).AMEVA_PLUGINS?.[tabId]
      
      if (plugin) {
        clearInterval(timer)
        // 컨테이너가 마운트되었는지 확인
        const container = document.getElementById(containerId)
        if (container) {
          if (typeof plugin.render === 'function') {
            container.innerHTML = '' // 로딩 표시 제거
            try {
              plugin.render(containerId)
            } catch (e) {
              console.error(`[PluginTabPanel] Error rendering plugin ${tabId}:`, e)
              container.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">플러그인 렌더링 오류가 발생했습니다.</div>`
            }
          } else {
            // 렌더 함수가 없는 경우 (예: 순수 백그라운드 기능이거나 미구현 스크립트)
            container.innerHTML = `
              <div style="padding: 20px; color: var(--text-muted); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.8;">🚧</div>
                <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">개발 중인 기능입니다</div>
                <div style="font-size: 12px;">(Coming Soon)</div>
              </div>
            `
          }
        }
      } else if (attempts > 60) { // 30초 타임아웃
        clearInterval(timer)
        const container = document.getElementById(containerId)
        if (container) {
          container.innerHTML = `
            <div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
              <div style="font-weight: bold; margin-bottom: 8px;">플러그인 로드 실패</div>
              <div style="font-size: 13px; opacity: 0.8; max-width: 250px;">
                마켓플레이스 서버와의 연결이 원활하지 않거나 플러그인 스크립트에 오류가 있습니다.
              </div>
            </div>
          `
        }
      }
    }, 500)

    return () => clearInterval(timer)
  }, [tabId])

  return <PluginTabPanelContent tabId={tabId} />
}

/**
 * PluginTabPanelContent 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function PluginTabPanelContent({ tabId }: PluginTabPanelProps) {
  const { setShowAIPanel, marketplacePlugins } = useUIStore()
  const {
    chatMessages,
    sendChatMessage,
    clearChatMessages,
    username,
    userColor,
    serverRunning
  } = useAppContext()

  const meta = marketplacePlugins.find(p => p.id === tabId)

  // ai 탭이면 ChatPanel 렌더
  if (tabId === 'ai') {
    return (
      <ChatPanel
        messages={chatMessages}
        onSend={sendChatMessage}
        onClear={clearChatMessages}
        username={username}
        userColor={userColor}
        serverRunning={serverRunning}
      />
    )
  }

  // 계산기 플러그인
  if (tabId === 'calculator') {
    return <CalculatorPanel />
  }

  // 구글 맵스 (기존 AI 패널 하드코딩 제거 후 대체)
  if (tabId === 'osm-maps') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', borderLeft: '1px solid var(--border-muted)' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#22c55e' }}><Map size={16} /></span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>OpenStreetMap</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={() => setShowAIPanel(false)}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <OSMMapView />
        </div>
      </div>
    )
  }

  // 구현된 플러그인 탭이면 해당 컴포넌트 렌더 (추후 확장)
  // ...

  // 미구현 플러그인 → 준비 중 안내 카드
  const color = '#8b5cf6'
  const label = meta?.name || tabId
  const description = meta?.description || '이 플러그인은 현재 로딩 중이거나 개발 중입니다.'
  const icon = <Globe size={24} />

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-deep)',
      borderLeft: '1px solid var(--border-muted)',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-muted)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
        </div>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 4,
          }}
          onClick={() => setShowAIPanel(false)}
          title="닫기"
        >
          <X size={14} />
        </button>
      </div>

      {/* 본문 (동적 플러그인 또는 폴백 안내) */}
      <div 
        id={`plugin-container-${tabId}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 20,
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        {/* 아이콘 */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `${color}18`,
          border: `2px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}>
          {React.cloneElement(icon as React.ReactElement, { size: 32 })}
        </div>

        {/* 설명 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, maxWidth: 240 }}>
            {description}
          </div>
        </div>

        {/* 준비 중 뱃지 */}
        <div style={{
          padding: '6px 16px',
          borderRadius: 20,
          background: `${color}15`,
          border: `1px solid ${color}35`,
          fontSize: 11,
          fontWeight: 600,
          color,
          letterSpacing: '0.05em',
        }}>
          🚧 로딩 중 (Loading)
        </div>

        <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
          마켓플레이스에서 플러그인을 불러오고 있습니다...<br />
          잠시만 기다려주세요.
        </div>
      </div>
    </div>
  )
}
