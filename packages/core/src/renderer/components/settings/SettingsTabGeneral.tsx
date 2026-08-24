/**
 * ============================================================================
 * @file SettingsTabGeneral.tsx
 * @description General configuration tab including AI auto-load, pointer sync, code console, minimap.
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../SettingsModal]
import React from 'react';
import { ToggleLeft, ToggleRight, Globe } from 'lucide-react';
import type { AppSettings } from '../SettingsModal';
import { useProcessStore, type UserTier } from '../../stores/useProcessStore';
import { useTranslation, type SupportedLanguage } from '../../i18n/useTranslation';

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
  const { t, language, setLanguage } = useTranslation();
  const userTier = useProcessStore((state) => state.userTier);
  const setUserTier = useProcessStore((state) => state.setUserTier);

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value as UserTier;
    setUserTier(newTier);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLang = e.target.value as SupportedLanguage;
    setLanguage(nextLang);
  };

  if (activeTab !== 'General') return null;

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>
        {t.settingsModal.general.title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 0. 인터페이스 언어 설정 (Language) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(168, 85, 247, 0.06)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} />
              {t.settingsModal.general.languageSetting}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.languageSettingDesc}
            </div>
          </div>
          <select
            value={language}
            onChange={handleLanguageChange}
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--bg-glass-active)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-muted)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ko">한국어 (Korean)</option>
            <option value="en">English (영어)</option>
          </select>
        </div>

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
              {t.settingsModal.general.autoLoadAI}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.autoLoadAIDesc}
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
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
              {t.settingsModal.general.showPeersPointer}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.showPeersPointerDesc}
            </div>
          </div>
          <button onClick={() => onUpdateSettings({ showPeersPointer: !settings.showPeersPointer })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showPeersPointer ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 3. 타인 텍스트 드래그 동기화 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
              {t.settingsModal.general.showPeersDrag}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.showPeersDragDesc}
            </div>
          </div>
          <button onClick={() => onUpdateSettings({ showPeersDrag: !settings.showPeersDrag })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showPeersDrag ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 4. 코드 샌드박스 콘솔 도크 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
              {t.settingsModal.general.showCodeConsole}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.showCodeConsoleDesc}
            </div>
          </div>
          <button onClick={() => onUpdateSettings({ showCodeConsole: !settings.showCodeConsole })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showCodeConsole ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 5. 줄바꿈 비활성화 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
              {t.settingsModal.general.wordWrap}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.wordWrapDesc}
            </div>
          </div>
          <button onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.wordWrap ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        {/* 6. 에디터 우측 미니맵 표시 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
              {t.settingsModal.general.showMinimap}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.showMinimapDesc}
            </div>
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
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px dashed rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)' }}>
              {t.settingsModal.general.tierSetting}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.settingsModal.general.tierSettingDesc}
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
