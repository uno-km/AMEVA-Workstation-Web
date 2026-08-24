/**
 * ============================================================================
 * @file MarkdownGuideModal.tsx
 * @description MarkdownGuideModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './MarkdownGuideModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 */

import React from 'react'
import { Key, BookOpen, HelpCircle } from 'lucide-react'
import { StrictModal } from './ui/modals/StrictModal'
import { useTranslation } from '../i18n/useTranslation'

interface MarkdownGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MarkdownGuideModal({ isOpen, onClose }: MarkdownGuideModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <StrictModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.markdownGuideModal.title}
      icon={<BookOpen size={20} />}
      width={700}
      height="80vh"
    >
      {/* 바디 (스크롤 가능) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 단축키 및 에디터 사용법 */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Key size={16} /> {t.markdownGuideModal.shortcutsTitle}
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ padding: '8px', background: 'var(--bg-glass-active)', borderRadius: '6px', border: '1px solid var(--border-muted)' }}>
              <span style={{ color: 'var(--primary)' }}>Ctrl + Space</span> : {t.markdownGuideModal.shortcutAutoComp}
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-glass-active)', borderRadius: '6px', border: '1px solid var(--border-muted)' }}>
              <span style={{ color: 'var(--primary)' }}>Ctrl + →</span> : {t.markdownGuideModal.shortcutAutoCompAccept}
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-glass-active)', borderRadius: '6px', border: '1px solid var(--border-muted)' }}>
              <span style={{ color: 'var(--primary)' }}>Ctrl + S</span> : {t.markdownGuideModal.shortcutSave}
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-glass-active)', borderRadius: '6px', border: '1px solid var(--border-muted)' }}>
              <span style={{ color: 'var(--primary)' }}>Ctrl + Wheel</span> : {t.markdownGuideModal.shortcutZoomWheel}
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-glass-active)', borderRadius: '6px', border: '1px solid var(--border-muted)' }}>
              <span style={{ color: 'var(--primary)' }}>Ctrl + + / -</span> : {t.markdownGuideModal.shortcutZoomScale}
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-glass-active)', borderRadius: '6px', border: '1px solid var(--border-muted)' }}>
              <span style={{ color: 'var(--primary)' }}>Ctrl + 0</span> : {t.markdownGuideModal.shortcutZoomReset}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-muted)' }} />

        {/* 마크다운 기본 문법 */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <HelpCircle size={16} /> {t.markdownGuideModal.syntaxTitle}
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-muted)' }}>
                <th style={{ padding: '8px', color: 'var(--text-muted)' }}>{t.markdownGuideModal.colSyntax}</th>
                <th style={{ padding: '8px', color: 'var(--text-muted)' }}>{t.markdownGuideModal.colTyping}</th>
                <th style={{ padding: '8px', color: 'var(--text-muted)' }}>{t.markdownGuideModal.colResult}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 8px' }}>{t.markdownGuideModal.heading}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}># Heading 1 / ## Heading 2</td>
                <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{t.markdownGuideModal.headingDesc}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 8px' }}>{t.markdownGuideModal.bold}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>**text**</td>
                <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{t.markdownGuideModal.boldDesc}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 8px' }}>{t.markdownGuideModal.italic}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>*text*</td>
                <td style={{ padding: '10px 8px', fontStyle: 'italic' }}>{t.markdownGuideModal.italicDesc}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 8px' }}>{t.markdownGuideModal.codeBlock}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>```javascript ... ```</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{t.markdownGuideModal.codeBlockDesc}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 8px' }}>{t.markdownGuideModal.table}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>| Col1 | Col2 |</td>
                <td style={{ padding: '10px 8px' }}>{t.markdownGuideModal.tableDesc}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 푸터 */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-muted)',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: 'var(--bg-glass-active)',
        }}
      >
        <button className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '12px' }} onClick={onClose}>
          {t.common.close}
        </button>
      </div>
    </StrictModal>
  )
}

