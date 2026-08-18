/**
 * ============================================================================
 * @file InstallDesktopModal.tsx
 * @description InstallDesktopModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './InstallDesktopModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import { useState } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Monitor, Download, X, ArrowRight, Shield, Terminal } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useUIStore]
import { useUIStore } from '../stores/useUIStore'

/**
 * InstallDesktopModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface InstallDesktopModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * InstallDesktopModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function InstallDesktopModal({ isOpen, onClose }: InstallDesktopModalProps) {
  const [downloading, setDownloading] = useState(false)
  const baseZIndex = useUIStore((s) => s.baseZIndex)

  if (!isOpen) return null

  const handleDownload = () => {
    window.open('https://github.com/uno-km/AMEVA-Workstation', '_blank')
    onClose()
  }

  const handleDismissForever = () => {
    localStorage.setItem('ameva_desktop_install_prompt_dismissed', 'true')
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 5, 10, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: baseZIndex + 50,
        animation: 'fadeIn 0.3s ease-out-back'
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* 모달 창 본체 */}
      <div
        style={{
          width: '480px',
          background: 'linear-gradient(135deg, rgba(24, 24, 35, 0.9) 0%, rgba(15, 15, 23, 0.95) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          padding: '32px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          color: '#f3f4f6'
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            transition: 'background-color 0.2s, color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9ca3af'
          }}
        >
          <X size={18} />
        </button>

        {/* 상단 화려한 네이티브 일러스트 박스 */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
            position: 'relative'
          }}
        >
          <Monitor size={36} color="#fff" />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '3px solid #0f0d2c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Download size={12} color="#fff" />
          </div>
        </div>

        {/* 타이틀 */}
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px 0', color: '#fff', letterSpacing: '-0.025em' }}>
          AMEVA 데스크톱 클라이언트 권장
        </h2>

        {/* 안내 내용 */}
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#9ca3af', margin: '0 0 24px 0' }}>
          현재 일반 브라우저 환경에서 실행 중입니다.<br />
          로컬 파일 직접 편집, 드래그앤드롭 미디어 추출, WASM 백엔드 RAG 쉘 및 오프라인 AI 추론 서버의 모든 네이티브 커널 성능을 완전하게 경험하려면 전용 데스크톱 앱 설치가 필요합니다.
        </p>

        {/* 주요 탑재 네이티브 기둥 리스트 */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '28px',
            border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <Terminal size={14} color="#38bdf8" />
            <span>딥리즈닝(Deep Reasoning)을 통한 로컬 LLM 아키텍처 무료 사용</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <Shield size={14} color="#38bdf8" />
            <span>협업 비즈니스를 위한 광대한 마켓플레이스 환경 제공</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <ArrowRight size={14} color="#38bdf8" />
            <span>향상된 네이티브 AI 툴 및 오프라인 미디어 자동 컴파일 지원</span>
          </div>
        </div>

        {/* 하단 제어 버튼 그룹 */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(90deg, #2563eb 0%, #2563eb 100%)',
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'transform 0.2s, opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {downloading ? '다운로드 생성 중...' : '설치 페이지로 이동 및 깃허브 확인'}
            <ArrowRight size={16} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              그냥 브라우저로 쓸래요
            </button>

            <button
              onClick={handleDismissForever}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
                opacity: 0.8
              }}
            >
              다시 보지 않기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
