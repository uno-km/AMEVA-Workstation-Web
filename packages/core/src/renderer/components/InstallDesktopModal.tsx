import { useState } from 'react'
import { Monitor, Download, X, ArrowRight, Shield, Terminal } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'

export interface InstallDesktopModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InstallDesktopModal({ isOpen, onClose }: InstallDesktopModalProps) {
  const [downloading, setDownloading] = useState(false)
  const baseZIndex = useUIStore((s) => s.baseZIndex)

  if (!isOpen) return null

  const handleDownload = () => {
    setDownloading(true)
    
    // 강제 다운로드 유도
    const link = document.createElement('a')
    link.href = '/downloads/AMEVA_Workstation_Setup.exe'
    link.download = 'AMEVA_Workstation_Setup.exe'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      setDownloading(false)
      // 설치 중이거나 완료 단계 안내를 위해 상태를 유지한 뒤 나중에 닫도록 함
      alert('AMEVA 데스크톱 클라이언트 다운로드가 시작되었습니다.\n다운로드가 완료되면 설치 프로그램을 실행해 주세요.')
      onClose()
    }, 1500)
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
          border: '1px solid rgba(139, 92, 246, 0.25)',
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
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
            <Terminal size={14} color="#a78bfa" />
            <span>로컬 AI & Ollama 백그라운드 무제한 로드</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <Shield size={14} color="#a78bfa" />
            <span>OS 샌드박스 보안 격리 실행</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <Download size={14} color="#a78bfa" />
            <span>동영상/오디오 미디어 자동 컴파일 패키징</span>
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
              background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
              transition: 'transform 0.2s, opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {downloading ? '다운로드 생성 중...' : '설치 파일 다운로드 및 실행'}
            <ArrowRight size={14} />
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
