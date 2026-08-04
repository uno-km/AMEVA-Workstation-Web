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

import React from 'react'
import {
  Globe, FileText, Database, Network, MonitorPlay,
  Timer, Mic, Server, LayoutTemplate, Map, HardDrive,
  Calendar, TrendingUp, Play, Search, X
} from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { ChatPanel } from '../ChatPanel'
import { CalculatorPanel } from './CalculatorPanel'
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
  'google-maps': {
    label: '구글 지도',
    icon: <Map size={24} />,
    color: '#22c55e',
    description: '구글 지도 임베드 및 위치 검색',
    implemented: false,
  },
  'GoogleMapsView': {
    label: '구글 지도',
    icon: <Map size={24} />,
    color: '#22c55e',
    description: '구글 지도 임베드 및 위치 검색',
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

interface PluginTabPanelProps {
  tabId: string
}

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

  const meta = PLUGIN_META[tabId]

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

  // 구현된 플러그인 탭이면 해당 컴포넌트 렌더 (추후 확장)
  // ...

  // 미구현 플러그인 → 준비 중 안내 카드
  const color = meta?.color || '#8b5cf6'
  const label = meta?.label || tabId
  const description = meta?.description || '이 플러그인은 현재 개발 중입니다.'
  const icon = meta?.icon || <Globe size={24} />

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

      {/* 본문 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 20,
        textAlign: 'center',
      }}>
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
          🚧 개발 중 (Coming Soon)
        </div>

        <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
          마켓플레이스에서 설치되었으나<br />
          아직 패널이 준비되지 않은 플러그인입니다.
        </div>
      </div>
    </div>
  )
}
