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

import { Award, Cpu, ExternalLink } from 'lucide-react'
import { StrictModal } from './ui/modals/StrictModal'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenGithub: () => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `AboutModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `AboutModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function AboutModal({ isOpen, onClose, onOpenGithub }: AboutModalProps) {
  if (!isOpen) return null

  return (
    <StrictModal
      isOpen={isOpen}
      onClose={onClose}
      title="About AMEVA Ecosystem"
      icon={<Award size={20} />}
      width={560}
      footer={
        <>
          <button className="btn btn-glass" style={{ fontSize: '12px' }} onClick={() => window.open('https://github.com/uno-km', '_blank')}>
            <ExternalLink size={12} /> Contact Us (UnoKim GitHub)
          </button>
          <button className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '12px' }} onClick={onClose}>
            닫기
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
                AMEVA <span style={{ color: 'var(--primary)' }}>Model Nexus</span>
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Version 1.0.0 (Enterprise Gold Release)
              </p>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-muted)' }} />

          {/* 에코시스템 목적 소개 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '13px' }}>
            <p>
              <strong>아메바(AMEVA) 생태계</strong>는 개발자, 연구원, 기업이 디지털 문서를 단 하나의 툴에서 완벽하게 창작,
              분석, 시각화하고 최종 빌드할 수 있는 최첨단 통합 문서 플랫폼입니다.
            </p>
            <p>
              단순한 텍스트 편집의 한계를 넘어, <strong>실시간 Yjs 협업 엔진</strong>을 탑재하여 언제 어디서나 안전하게 공동 연구 및
              편집을 진행할 수 있습니다. 
            </p>
            <p>
              또한 웹 환경에서도 원활하게 작동하는 P2P 기반 실시간 채팅 기능, 칸반 보드, 다크모드, 자동 백업 등 웹 워크스테이션으로서의 완벽한 기능들을 제공합니다.
            </p>
            
            <div
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
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
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>오픈 스펙 표준 변환 지원</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Word, Excel, PDF, HTML, XML은 물론 한글 HWPX 규격까지 무손실 빌드를 보장합니다.
                </p>
              </div>
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
                Creator & Lead Architect of AMEVA OS
              </p>
              <p style={{ fontSize: '11px', color: 'var(--primary)', margin: 0, marginTop: '4px', fontStyle: 'italic' }}>
                "Building the next generation of collaborative workspaces."
              </p>
            </div>
          </div>
        </div>
    </StrictModal>
  )
}

