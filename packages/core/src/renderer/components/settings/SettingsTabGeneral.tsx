/**
 * ============================================================================
 * @file SettingsTabGeneral.tsx
 * @description General configuration tab including AI auto-load, pointer sync, code console, minimap.
 * ============================================================================
 */

import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { AppSettings } from '../SettingsModal';
import { useProcessStore, type UserTier } from '../../stores/useProcessStore';

export interface SettingsTabGeneralProps {
  activeTab: string;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export function SettingsTabGeneral({
  activeTab,
  settings,
  onUpdateSettings,
}: SettingsTabGeneralProps) {
  const userTier = useProcessStore((state) => state.userTier);
  const setUserTier = useProcessStore((state) => state.setUserTier);
  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value as UserTier;
    setUserTier(newTier);
  };

  if (activeTab !== 'General') return null;

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>General Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 1. AI 모델 자동 로딩 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8' }}>
              브라우저 시작 시 AI 모델 자동 로딩
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              워크스테이션이 열리거나 새로고침될 때 선택된 WebGPU AI 모델을 백그라운드에서 자동으로 메모리에 적재합니다.
            </div>
          </div>
          <button
            data-testid="settings-auto-load-ai-toggle"
            onClick={() => {
              const nextVal = !settings.autoLoadAI;
              onUpdateSettings({ autoLoadAI: nextVal });
              localStorage.setItem('ameva_auto_load_llm', String(nextVal));
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8' }}
          >
            {settings.autoLoadAI ? <ToggleRight size={28} /> : <ToggleLeft size={28} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 2. 실시간 타인 포인터 표시 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>실시간 타인 포인터 표시</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>동료의 실시간 마우스 움직임을 화면에 투사합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showPeersPointer: !settings.showPeersPointer })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showPeersPointer ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 3. 타인 텍스트 드래그 동기화 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>타인 텍스트 드래그 동기화</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>동료의 선택 영역 렉트 하이라이트를 실시간 표시합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showPeersDrag: !settings.showPeersDrag })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showPeersDrag ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 4. 코드 샌드박스 콘솔 도크 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>코드 샌드박스 콘솔 도크</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>에디터 아래에 코드 퀵 런타임 위젯을 상시 노출합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showCodeConsole: !settings.showCodeConsole })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showCodeConsole ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 5. 줄바꿈 비활성화 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>줄바꿈 비활성화 (가로 스크롤)</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>텍스트 자동 줄바꿈을 풀고 가로 스크롤로 문장을 표출합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {!settings.wordWrap ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 6. 에디터 우측 미니맵 표시 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>에디터 우측 미니맵 표시</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>오른쪽에 전체 레이아웃 시각화 Minimap 바를 표시합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showMinimap: !settings.showMinimap })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showMinimap ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />

        {/* 7. License Tier */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px dashed rgba(168, 85, 247, 0.3)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)' }}>👑 AMEVA License Tier (Dev)</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              권한 테스트용 라이선스 등급 스위처입니다.
            </div>
          </div>
          <select
            value={userTier}
            onChange={handleTierChange}
            style={{
              padding: '4px 8px',
              fontSize: '11.5px',
              borderRadius: '4px',
              background: 'var(--bg-glass-active)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-muted)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="free">Free Tier</option>
            <option value="pro">Pro Tier</option>
            <option value="enterprise">Enterprise Tier</option>
          </select>
        </div>
      </div>
    </>
  );
}
