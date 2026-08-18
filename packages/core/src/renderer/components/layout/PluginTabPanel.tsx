/**
 * ============================================================================
 * @file PluginTabPanel.tsx
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/components/layout/PluginTabPanel.tsx
 * @role Router Component for Marketplace Plugins & AI Agent Side Panel
 * ============================================================================
 */

import React, { useEffect } from 'react';
import {
  Globe, FileText, Database, Network, MonitorPlay,
  Timer, Mic, Server, LayoutTemplate, Map, HardDrive,
  Calendar, TrendingUp, Play, Search, X
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { AIPanel } from '../AIPanel';
import { CalculatorPanel } from './CalculatorPanel';
import { OSMMapView } from './OSMMapView';

const PLUGIN_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  implemented: boolean;
}> = {
  'ai': {
    label: 'AI 어시스턴트',
    icon: <Globe size={24} />,
    color: '#2563eb',
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
    color: '#2563eb',
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
    color: '#2563eb',
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
};

/**
 * Isolated Dynamic Marketplace Plugin Component to preserve React Hook rules
 */
function DynamicPluginView({ tabId }: { tabId: string }) {
  const { setShowAIPanel, marketplacePlugins } = useUIStore();
  const meta = marketplacePlugins.find(p => p.id === tabId);
  const pluginInfo = PLUGIN_META[tabId];
  const containerId = `plugin-container-${tabId}`;

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      const plugin = (window as any).AMEVA_PLUGINS?.[tabId];
      
      if (plugin) {
        clearInterval(timer);
        const container = document.getElementById(containerId);
        if (container) {
          if (typeof plugin.render === 'function') {
            container.innerHTML = '';
            try {
              plugin.render(containerId);
            } catch (e) {
              console.error(`[PluginTabPanel] Error rendering plugin ${tabId}:`, e);
              container.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">플러그인 렌더링 오류가 발생했습니다.</div>`;
            }
          }
        }
      } else if (attempts > 60) {
        clearInterval(timer);
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = `
            <div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
              <div style="font-weight: bold; margin-bottom: 8px;">플러그인 로드 실패</div>
              <div style="font-size: 13px; opacity: 0.8; max-width: 250px;">
                마켓플레이스 서버와의 연결이 원활하지 않거나 플러그인 스크립트에 오류가 있습니다.
              </div>
            </div>
          `;
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [tabId, containerId]);

  const label = meta?.name || pluginInfo?.label || tabId;
  const description = meta?.description || pluginInfo?.description || '이 플러그인은 현재 로딩 중이거나 개발 중입니다.';
  const color = pluginInfo?.color || '#2563eb';
  const icon = pluginInfo?.icon || <Globe size={24} />;

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
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={16} color={color} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          onClick={() => setShowAIPanel(false)}
        >
          <X size={14} />
        </button>
      </div>

      <div
        id={containerId}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, maxWidth: 240 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

export interface PluginTabPanelProps {
  tabId: string;
}

export function PluginTabPanel({ tabId }: PluginTabPanelProps) {
  const { setShowAIPanel } = useUIStore();

  // 1. AI 어시스턴트 탭
  if (tabId === 'ai') {
    return <AIPanel />;
  }

  // 2. 계산기 플러그인
  if (tabId === 'calculator') {
    return <CalculatorPanel />;
  }

  // 3. 구글 맵스 (OSM 뷰)
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
    );
  }

  // 4. 동적 마켓플레이스 플러그인 (격리된 서브 컴포넌트로 렌더하여 React Hook 룰 위반 완벽 방지)
  return <DynamicPluginView tabId={tabId} />;
}
