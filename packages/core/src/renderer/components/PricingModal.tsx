/**
 * @file PricingModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/PricingModal.tsx
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

import { useState, useEffect } from 'react'
import { Check, Award, Sparkles, Shield, Key, Network } from 'lucide-react'
import { StrictModal } from './ui/modals/StrictModal'
import * as ipc from '../services/ipc/electronApiAdapter'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `PricingModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `PricingModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [isPro, setIsPro] = useState(false)
  const [isFreeLocked, setIsFreeLocked] = useState(false)

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen) {
      setIsPro(localStorage.getItem('is-pro-plan') === 'true')
      
      ipc.isFreeMode().then((free: boolean) => {
        setIsFreeLocked(free)
      }).catch(() => {})
    }
  }, [isOpen])

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen) return null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleFreeAction`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleFreeAction = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleFreeAction = async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isPro`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isPro)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isPro) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `confirm('Downgrade to Free Plan? (This will reload the application)')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (confirm('Downgrade to Free Plan? (This will reload the application)'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (confirm('Downgrade to Free Plan? (This will reload the application)')) {
        await ipc.planSetStatus(false)
        localStorage.setItem('is-pro-plan', 'false')
        window.location.reload()
      }
    }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleProAction`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleProAction = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleProAction = async () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isPro`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isPro)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isPro) return

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isFreeLocked`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isFreeLocked)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isFreeLocked) {
      alert('무료 버전 강제 데모 모드(--free) 상태에서는 Pro Plan으로 업그레이드할 수 없습니다.')
      return
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `confirm('Upgrade to Pro Plan? (This will reload the application)')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (confirm('Upgrade to Pro Plan? (This will reload the application)'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (confirm('Upgrade to Pro Plan? (This will reload the application)')) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `result`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const result = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const result = await ipc.planSetStatus(true)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `result && !result.success`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (result && !result.success)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (result && !result.success) {
        alert(`업그레이드 실패: ${result.error}`)
        return
      }
      localStorage.setItem('is-pro-plan', 'true')
      window.location.reload()
    }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleEnterpriseAction`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleEnterpriseAction = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleEnterpriseAction = () => {
    window.open('https://github.com/uno-km/AMEVA-Workstation', '_blank')
  }

  return (
    <StrictModal
      isOpen={isOpen}
      onClose={onClose}
      title="AMEVA Workstation Subscription Plans & Capability Matrix"
      icon={<Award size={18} />}
      width={840}
    >
        {/* 장식적 네온 보더라인 */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, #a855f7, #06b6d4, #10b981)' }} />


        {/* 바디 (요금제 매트릭스 카드 3개 수평 배치) */}
        <div
          style={{
            flex: 1,
            padding: '20px 24px',
            display: 'flex',
            gap: '16px',
            overflowY: 'auto'
          }}
        >
          {/* 1. Free Plan Card */}
          <div
            style={{
              flex: 1,
              background: 'color-mix(in srgb, var(--bg-main) 50%, transparent)',
              border: '1px solid var(--border-muted)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.2s'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>FREE PLAN</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '6px 0 12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900 }}>$0</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              
              {/* 장점 요약 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '6px 10px', marginBottom: '12px', fontSize: '9px', color: 'var(--text-muted)' }}>
                <strong>Advantage:</strong> Free access to all Marketplace Plugins & AI tools without limits.
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />
              
              {/* 기능 상세 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Permissions</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)' }}>• Full local workspace read/write access<br />• Outbound networks for plugins</div>
                </div>
                <div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Limits & Usage</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)' }}>• Unlimited AI inferences<br />• Unlimited Marketplace integrations</div>
                </div>
                <div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Core Capabilities</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: 'var(--text-muted)' }} /> <strong>Free Marketplace access</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: 'var(--text-muted)' }} /> <strong>Unrestricted AI features</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: 'var(--text-muted)' }} /> Basic standalone text editing</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleFreeAction}
              style={{
                width: '100%',
                padding: '6px',
                background: isPro ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.04)',
                border: isPro ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: isPro ? '#f87171' : 'var(--text-muted)',
                fontSize: '9.5px',
                fontWeight: 700,
                cursor: isPro ? 'pointer' : 'default',
                marginTop: '16px'
              }}
            >
              {isPro ? 'Downgrade to Free' : 'Current Active Plan'}
            </button>
          </div>

          {/* 2. Pro Plan Card (Recommended) */}
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 5%, transparent) 0%, transparent 100%)',
              border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
              boxShadow: '0 0 15px color-mix(in srgb, var(--primary) 8%, transparent)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transform: 'scale(1.01)'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', right: '14px',
              background: 'var(--primary)', color: '#fff', fontSize: '7.5px',
              fontWeight: 800, padding: '2px 6px', borderRadius: '10px',
              letterSpacing: '0.5px'
            }}>
              POPULAR
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                PRO (COLLAB) <Sparkles size={11} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '6px 0 12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)' }}>$12</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ month</span>
              </div>

              {/* 장점 요약 */}
              <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: '6px', padding: '6px 10px', marginBottom: '12px', fontSize: '9px', color: 'var(--text-main)' }}>
                <strong>Advantage:</strong> Powerful real-time collaboration & multi-user syncing via Cloud Relay.
              </div>

              <div style={{ height: '1px', background: 'rgba(168,85,247,0.2)', marginBottom: '12px' }} />

              {/* 기능 상세 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '8.5px', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Permissions</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)' }}>• All Free Plan permissions<br />• Multi-user Y.js cloud networking</div>
                </div>
                <div>
                  <div style={{ fontSize: '8.5px', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Limits & Usage</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)' }}>• Unlimited Multi-user real-time sessions<br />• Unlimited cloud relay proxy bandwidth</div>
                </div>
                <div>
                  <div style={{ fontSize: '8.5px', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Core Capabilities</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: 'var(--primary)' }} /> <strong>Real-time Y.js co-editing</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: 'var(--primary)' }} /> <strong>Live Mouse presence & tracking</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: 'var(--primary)' }} /> WebRTC Live Voice Chatting</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleProAction}
              style={{
                width: '100%',
                padding: '6px',
                background: isPro ? 'rgba(168, 85, 247, 0.12)' : 'var(--primary)',
                border: isPro ? '1px solid rgba(168, 85, 247, 0.3)' : 'none',
                borderRadius: '6px',
                color: isPro ? '#a855f7' : '#fff',
                fontSize: '9.5px',
                fontWeight: 700,
                cursor: isPro ? 'default' : 'pointer',
                marginTop: '16px',
                boxShadow: isPro ? 'none' : '0 4px 10px rgba(168, 85, 247, 0.25)'
              }}
            >
              {isPro ? 'Current Active Plan ✓' : 'Upgrade to Pro Plan'}
            </button>
          </div>

          {/* 3. Enterprise Plan Card */}
          <div
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4' }}>ENTERPRISE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '6px 0 12px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>Custom</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ contact</span>
              </div>

              {/* 장점 요약 */}
              <div style={{ background: 'rgba(6,182,212,0.06)', borderRadius: '6px', padding: '6px 10px', marginBottom: '12px', fontSize: '9px', color: 'var(--text-main)' }}>
                <strong>Advantage:</strong> Iron-clad secure environments, hardware tokens & audio communications.
              </div>

              <div style={{ height: '1px', background: 'rgba(6,182,212,0.2)', marginBottom: '12px' }} />

              {/* 기능 상세 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '8.5px', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Permissions</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)' }}>• <strong>OS Keychain API</strong> hardware token guard<br />• Complete isolation from guest collab channels</div>
                </div>
                <div>
                  <div style={{ fontSize: '8.5px', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Limits & Usage</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)' }}>• Dedicated Collaboration Node<br />• Zero-trust security policy</div>
                </div>
                <div>
                  <div style={{ fontSize: '8.5px', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>Core Capabilities</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: '#06b6d4' }} /> <strong>Hardware Security Token API</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: '#06b6d4' }} /> Virtual SQLite backup snapshot auto-sync</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} style={{ color: '#06b6d4' }} /> Single Sign-On (SSO) & LDAP directory</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleEnterpriseAction}
              style={{
                width: '100%',
                padding: '6px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '6px',
                color: '#22d3ee',
                fontSize: '9.5px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>

        {/* 푸터 알림 */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.15)',
          fontSize: '9px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fb7185' }}>
            <Shield size={12} /> OS Keychain Protection
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#67e8f9' }}>
            <Key size={12} /> OAuth Tokens isolated
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#86efac' }}>
            <Network size={12} /> WebRTC Dual-audio
          </span>
      </div>
    </StrictModal>
  )
}

