/**
 * @file WelcomeBanner.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/editor/WelcomeBanner.tsx
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

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `WelcomeBanner`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `WelcomeBanner(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
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
        background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(249,115,22,0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: '16px',
        padding: '24px 32px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ zIndex: 2 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚀 AMEVA Workstation Guide Book
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            아메바 워크스테이션에 오신 것을 환영합니다! 아래는 손실 없이 완전히 렌더링된 공식 안내 백서입니다.<br />
            문서를 직접 작성하거나 웰컴 가이드를 편집하려면 아래 버튼 중 하나를 클릭해 편집을 바로 시작하십시오.
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
              background: 'var(--primary)',
              color: 'var(--text-on-primary)',
              boxShadow: '0 4px 12px var(--primary-glow)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={onStartWelcomeEdit}
          >
            <Code2 size={14} /> ✍ 가이드 문서 편집하기
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
            📂 기존 파일 열기
          </button>
        </div>
      </div>

      {/* 마크다운 원본의 완전 무결 렌더링 뷰포트 */}
      <div style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border-muted)',
        borderRadius: '16px',
        padding: '24px 36px',
      }}>
        <MarkdownPreview markdown={currentContent} editor={editor} />
      </div>
    </div>
  )
}

