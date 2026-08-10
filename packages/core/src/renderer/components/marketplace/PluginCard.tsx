/**
 * ============================================================================
 * @file PluginCard.tsx
 * @description PluginCard.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './PluginCard';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file PluginCard.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/marketplace/PluginCard.tsx
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

// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Check } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ./types]
import type { PluginMetadata } from './types'

/**
 * PluginCardProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface PluginCardProps {
  plugin: PluginMetadata
  isInstalled: boolean
  isActionLoading: boolean
  onToggleInstall: (plugin: PluginMetadata) => void
  onPreview: (plugin: PluginMetadata) => void
}

/**
 * parseDescription 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function parseDescription(html: string) {
  if (!html) return null;
  if (!html.includes('<span') && !html.includes('<br')) {
    return html;
  }

  const regex = /<span\s+class=['"]([^'"]+)['"]>(.*?)<\/span>|<br\s*\/?>/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      elements.push(html.substring(lastIndex, match.index));
    }

    if (match[0].startsWith('<br')) {
      elements.push(<br key={key++} />);
    } else {
      const className = match[1];
      const content = match[2];

      const bRegex = /<b>(.*?)<\/b>/g;
      const spanChildren: React.ReactNode[] = [];
      let bLastIndex = 0;
      let bMatch;
      let bKey = 0;

      while ((bMatch = bRegex.exec(content)) !== null) {
        if (bMatch.index > bLastIndex) {
          spanChildren.push(content.substring(bLastIndex, bMatch.index));
        }
        spanChildren.push(<b key={bKey++}>{bMatch[1]}</b>);
        bLastIndex = bRegex.lastIndex;
      }
      if (bLastIndex < content.length) {
        spanChildren.push(content.substring(bLastIndex));
      }

      elements.push(
        <span key={key++} className={className}>
          {spanChildren.length > 0 ? spanChildren : content}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < html.length) {
    elements.push(html.substring(lastIndex));
  }

  return elements;
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `PluginCard`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `PluginCard(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * PluginCard 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function PluginCard({
  plugin: p,
  isInstalled,
  isActionLoading,
  onToggleInstall,
  onPreview,
}: PluginCardProps) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-muted)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.boxShadow = '0 0 8px color-mix(in srgb, var(--primary) 10%, transparent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-muted)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {p.name}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'var(--bg-panel)', padding: '1px 5px', borderRadius: '4px' }}>
            v{p.version}
          </span>
          <span style={{
            fontSize: '9px',
            color: p.type === 'tool' ? '#f59e0b' : p.type === 'feature' ? '#06b6d4' : p.type === 'premium' ? '#ec4899' : '#ec4899',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '1px 5px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.3px'
          }}>
            {p.type}
          </span>
          {p.placement && (
            <span style={{
              fontSize: '9px',
              color: p.placement === 'slash-menu' ? '#8b5cf6' : p.placement === 'editor-overlay' ? '#f59e0b' : '#10b981',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '1px 5px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }}>
              {p.placement === 'slash-menu' ? '📝 BLOCK' : p.placement === 'editor-overlay' ? '✨ OVERLAY' : '👉 SIDEBAR'}
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {parseDescription(p.description)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onPreview(p)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s',
            outline: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          👁️ Preview
        </button>

        <button
          onClick={() => onToggleInstall(p)}
          disabled={isActionLoading}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: isActionLoading ? 'not-allowed' : 'pointer',
            background: isInstalled ? 'rgba(16,185,129,0.12)' : p.type === 'premium' ? 'var(--premium)' : 'var(--primary)',
            border: isInstalled ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
            color: isInstalled ? '#34d399' : '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s',
            outline: 'none',
          }}
        >
          {isInstalled ? (
            <>
              <Check size={11} />
              Installed
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </div>
    </div>
  )
}

