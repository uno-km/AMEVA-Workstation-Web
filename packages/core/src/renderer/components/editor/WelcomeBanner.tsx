/**
 * ============================================================================
 * @file WelcomeBanner.tsx
 * @description WelcomeBanner.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-18 18:37:00
 * @author uno-km
 * @commit refactor: Apply Antigravity Blue theme & Clean up syntax
 * ============================================================================
 */

import React from 'react'
import { Code2 } from 'lucide-react'
import { MarkdownPreview } from '../MarkdownPreview'
import { type AmevaEditor } from '../../editor/amevaBlockSchema'

export interface WelcomeBannerProps {
  onStartWelcomeEdit?: () => void
  onStartNewDocument?: () => void
  onOpenFile?: () => void
  currentContent: string
  editor: AmevaEditor | null
}

/**
 * WelcomeBanner 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 */
export function WelcomeBanner({
  onStartWelcomeEdit,
  onStartNewDocument,
  onOpenFile,
  currentContent,
  editor,
}: WelcomeBannerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 눈부신 웰컴 오로라 그래디언트 배너 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(6,182,212,0.12) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '16px',
        padding: '24px 32px',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ zIndex: 2 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="AMEVA Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} /> AMEVA Workstation Guide Book
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            처음이라면 가이드 문서로 시작해 보세요. 실제 예제를 클릭하며 주요 기능을 3분 안에 빠르게 익힐 수 있습니다!
          </p>
        </div>

        {/* 아름다운 액션 버튼 그룹 */}
        <div style={{ display: 'flex', gap: '12px', zIndex: 2, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s transform 0.1s',
              transform: 'scale(1)',
            }}
            onClick={onStartWelcomeEdit}
          >
            🚀 기능 체험 시작하기
          </button>
          
          <button
            className="btn btn-glass"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-glass-active)',
              border: '1px solid var(--border-muted)',
              color: 'var(--text-on-active)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={onStartNewDocument}
          >
            ➕ 새 문서 작성하기
          </button>

          <button
            className="btn btn-glass"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-glass-active)',
              border: '1px solid var(--border-muted)',
              color: 'var(--text-on-active)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={onOpenFile}
          >
            📁 기존 파일 열기 (PDF, MD, Word, Excel, PPT 등)
          </button>
        </div>
      </div>

      {/* 가이드북 본문 프리뷰 렌더링 컨테이너 */}
      <div 
        className="welcome-guide-preview"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-muted)',
          padding: '24px 32px',
          color: 'var(--text-main)',
          lineHeight: '1.7',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <MarkdownPreview content={currentContent} />
      </div>
    </div>
  )
}
