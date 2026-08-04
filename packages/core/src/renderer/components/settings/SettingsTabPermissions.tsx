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

import type { AppSettings } from '../SettingsModal'

export interface SettingsTabPermissionsProps {
  activeTab: string
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SettingsTabPermissions`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SettingsTabPermissions(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SettingsTabPermissions({
  activeTab,
  settings,
  onUpdateSettings,
}: SettingsTabPermissionsProps) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeTab !== 'Permissions'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeTab !== 'Permissions')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (activeTab !== 'Permissions') return null

  return (
    <>
      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>Agent security mode</h3>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Select one of the three options. Agent settings and permissions can be further customized below.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { id: 'turbo', title: 'Turbo Mode', desc: '기본 성능 중심. 빠른 실행을 우선합니다.' },
          { id: 'restricted', title: 'Restricted Sandbox', desc: '에이전트를 안전한 샌드박스 내에서만 실행합니다.' },
          { id: 'paranoiac', title: 'Paranoid Maximum', desc: '가장 강력한 보안. 자동 실행을 완전히 금지합니다.' }
        ].map(item => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
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
              <div style={{ fontSize: '13px', color: isActive ? 'var(--primary)' : 'var(--text-main)', marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</div>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>Artifact Auto-execution</h3>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px' }}>아티팩트 자동 실행 허용 여부를 설정합니다.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {[
          { id: 'always', title: 'Always Allow', desc: '항상 검토 없이 바로 실행합니다.' },
          { id: 'ask', title: 'Always Ask', desc: '실행 시 항상 확인 창을 띄웁니다.' },
          { id: 'never', title: 'Always Block', desc: '자동 실행을 완전히 비활성화합니다.' }
        ].map(item => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
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
              <div style={{ fontSize: '13px', color: isActive ? 'var(--primary)' : 'var(--text-main)', marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</div>
            </div>
          );
        })}
      </div>
    </>
  )
}

