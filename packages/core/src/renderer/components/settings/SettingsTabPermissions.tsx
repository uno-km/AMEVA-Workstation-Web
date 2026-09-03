/**
 * ============================================================================
 * @file SettingsTabPermissions.tsx
 * @description SettingsTabPermissions.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './SettingsTabPermissions';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file SettingsTabPermissions.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/settings/SettingsTabPermissions.tsx
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

// [내부 프로젝트 의존성 모듈 임포트: ../SettingsModal]
import type { AppSettings } from '../SettingsModal'
import { useTranslation } from '../../i18n/useTranslation'

export interface SettingsTabPermissionsProps {
  activeTab: string
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
}

export function SettingsTabPermissions({
  activeTab,
  settings,
  onUpdateSettings,
}: SettingsTabPermissionsProps) {
  const { isKorean } = useTranslation()

  if (activeTab !== 'Permissions') return null

  const securityModes = [
    {
      id: 'turbo',
      title: 'Turbo Mode',
      desc: isKorean ? '기본 성능 중심. 빠른 실행을 우선합니다.' : 'Performance prioritized. Executes agent tools with minimal latency.'
    },
    {
      id: 'restricted',
      title: 'Restricted Sandbox',
      desc: isKorean ? '에이전트를 안전한 샌드박스 내에서만 실행합니다.' : 'Executes agents strictly within isolated WebAssembly sandboxes.'
    },
    {
      id: 'paranoiac',
      title: 'Paranoid Maximum',
      desc: isKorean ? '가장 강력한 보안. 자동 실행을 완전히 금지합니다.' : 'Maximum security. Completely forbids any autonomous execution.'
    }
  ]

  const artifactPolicies = [
    {
      id: 'always',
      title: 'Always Allow',
      desc: isKorean ? '항상 검토 없이 바로 실행합니다.' : 'Automatically execute generated artifacts without prompt.'
    },
    {
      id: 'ask',
      title: 'Always Ask',
      desc: isKorean ? '실행 시 항상 확인 창을 띄웁니다.' : 'Always display a confirmation prompt before running artifacts.'
    },
    {
      id: 'never',
      title: 'Always Block',
      desc: isKorean ? '자동 실행을 완전히 비활성화합니다.' : 'Completely disable autonomous artifact execution.'
    }
  ]

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>
        {isKorean ? '에이전트 보안 모드' : 'Agent security mode'}
      </h3>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
        {isKorean ? '세 가지 모드 중 하나를 선택하십시오. 세부 권한은 아래에서 커스터마이징할 수 있습니다.' : 'Select one of the three options. Agent settings and permissions can be further customized below.'}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {securityModes.map(item => {
          const isActive = (settings.securityPreset || 'turbo') === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onUpdateSettings({ securityPreset: item.id as AppSettings['securityPreset'] })}
              style={{
                background: isActive ? 'var(--bg-glass-active)' : 'transparent',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: isActive ? 1 : 0.6
              }}
            >
              <div style={{ fontSize: '13px', color: isActive ? 'var(--primary)' : 'var(--text-main)', marginBottom: '8px', fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</div>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>
        {isKorean ? '아티팩트 자동 실행 정책' : 'Artifact Auto-execution'}
      </h3>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
        {isKorean ? '에이전트가 생성한 아티팩트의 자동 실행 허용 여부를 설정합니다.' : 'Configure permission policies for automatic artifact and script execution.'}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {artifactPolicies.map(item => {
          const isActive = (settings.artifactReviewPolicy || 'ask') === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onUpdateSettings({ artifactReviewPolicy: item.id as AppSettings['artifactReviewPolicy'] })}
              style={{
                background: isActive ? 'var(--bg-glass-active)' : 'transparent',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: isActive ? 1 : 0.6
              }}
            >
              <div style={{ fontSize: '13px', color: isActive ? 'var(--primary)' : 'var(--text-main)', marginBottom: '8px', fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</div>
            </div>
          );
        })}
      </div>
    </>
  )
}

