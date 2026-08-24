/**
 * ============================================================================
 * @file AboutModal.tsx
 * @description AboutModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './AboutModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file AboutModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/AboutModal.tsx
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

import { Award, Cpu, ExternalLink, Download } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ./ui/modals/StrictModal]
import { StrictModal } from './ui/modals/StrictModal'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useUIStore]
import { useUIStore } from '../stores/useUIStore'
import { useTranslation } from '../i18n/useTranslation'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenGithub: () => void
}

export function AboutModal({ isOpen, onClose, onOpenGithub }: AboutModalProps) {
  const { t } = useTranslation()
  const setIsInstallPromptOpen = useUIStore((state) => state.setIsInstallPromptOpen)
  
  if (!isOpen) return null

  return (
    <StrictModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.aboutModal.title}
      icon={<Award size={20} />}
      width={560}
      footer={
        <>
          <button className="btn btn-glass" style={{ fontSize: '12px' }} onClick={() => window.open('https://github.com/uno-km', '_blank')}>
            <ExternalLink size={12} /> {t.aboutModal.contactGithub}
          </button>
          <button className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '12px' }} onClick={onClose}>
            {t.common.close}
          </button>
        </>
      }
    >

        {/* 바디 */}
        <div style={{ padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 아메바 로고 이미지 구역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '32px',
                fontWeight: 900,
                boxShadow: '0 0 25px var(--primary-glow)',
              }}
            >
              A
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
                AMEVA <span style={{ color: 'var(--primary)' }}>Workspace</span>
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t.aboutModal.version}
              </p>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-muted)' }} />

          {/* 에코시스템 목적 소개 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '13px' }}>
            <p>
              {t.aboutModal.descP1}
            </p>
            <p>
              {t.aboutModal.descP2}
            </p>
            <p>
              {t.aboutModal.descP3}
            </p>
            
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <Cpu size={18} style={{ color: 'var(--primary)', marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{t.aboutModal.openSpecTitle}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t.aboutModal.openSpecDesc}
                </p>
              </div>
            </div>

            {/* 데스크톱 앱 설치 권장 */}
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Download size={18} style={{ color: '#22c55e', marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>{t.aboutModal.desktopAppTitle}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.aboutModal.desktopAppDesc}
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-end', fontSize: '11px', padding: '6px 16px', background: '#22c55e', borderColor: '#22c55e', color: '#fff' }}
                onClick={() => {
                  onClose()
                  setIsInstallPromptOpen(true)
                }}
              >
                {t.aboutModal.desktopAppBtn}
              </button>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', marginTop: '10px' }} />

          {/* 명함 (Business Card) 구역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-lighter)', border: '1px solid var(--border-muted)' }}>
            <img 
              src="/uno-km.jpg" 
              alt="UnoKim" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Uno Kim (uno-km)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {t.aboutModal.creatorRole}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--primary)', margin: 0, marginTop: '4px', fontStyle: 'italic' }}>
                {t.aboutModal.creatorQuote}
              </p>
            </div>
          </div>
        </div>
    </StrictModal>
  )
}

