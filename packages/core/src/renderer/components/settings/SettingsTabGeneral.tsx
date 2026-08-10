/**
 * ============================================================================
 * @file SettingsTabGeneral.tsx
 * @description SettingsTabGeneral.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './SettingsTabGeneral';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file SettingsTabGeneral.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/settings/SettingsTabGeneral.tsx
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
import { ToggleLeft, ToggleRight } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../SettingsModal]
import type { AppSettings } from '../SettingsModal'
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useProcessStore]
import { useProcessStore, type UserTier } from '../../stores/useProcessStore'

/**
 * SettingsTabGeneralProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface SettingsTabGeneralProps {
  activeTab: string
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
}

/**
 * SettingsTabGeneral 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function SettingsTabGeneral({
  activeTab,
  settings,
  onUpdateSettings,
}: SettingsTabGeneralProps) {
  const userTier = useProcessStore((state) => state.userTier)
  const setUserTier = useProcessStore((state) => state.setUserTier)
  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value as UserTier;
    setUserTier(newTier);
  };

  if (activeTab !== 'General') return null

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>General Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>실시간 타인 포인터 표시</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>동료의 실시간 마우스 움직임을 화면에 투사합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showPeersPointer: !settings.showPeersPointer })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showPeersPointer ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>타인 텍스트 드래그 동기화</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>동료의 선택 영역 렉트 하이라이트를 실시간 표시합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showPeersDrag: !settings.showPeersDrag })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showPeersDrag ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>코드 샌드박스 콘솔 도크</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>에디터 아래에 코드 퀵 런타임 위젯을 상시 노출합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ showCodeConsole: !settings.showCodeConsole })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {settings.showCodeConsole ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>줄바꿈 비활성화 (가로 스크롤)</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>텍스트 자동 줄바꿈을 풀고 가로 스크롤로 문장을 표출합니다.</div>
          </div>
          <button onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
            {!settings.wordWrap ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: 'var(--text-dark)' }} />}
          </button>
        </div>

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
              background: 'var(--bg-glass-active)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-muted)', 
              borderRadius: '4px', 
              padding: '4px 8px' 
            }}
          >
            <option value="free">Free Tier</option>
            <option value="pro">Pro Tier</option>
            <option value="enterprise">Enterprise Tier</option>
          </select>
        </div>
      </div>
    </>
  )
}

