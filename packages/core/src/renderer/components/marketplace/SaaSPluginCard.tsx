/**
 * @file SaaSPluginCard.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/marketplace/SaaSPluginCard.tsx
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


interface SaaSPluginCardProps {
  id: string
  name: string
  version: string
  type: string
  description: string
  isEnabled: boolean
  onToggle: (id: string) => void
  onPreview: (id: string) => void
}

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
   * - 함수 명: `SaaSPluginCard`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SaaSPluginCard(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SaaSPluginCard({
  id,
  name,
  version,
  type,
  description,
  isEnabled,
  onToggle,
  onPreview,
}: SaaSPluginCardProps) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 5%, var(--bg-main)) 0%, var(--bg-main) 100%)',
        border: '1px dashed color-mix(in srgb, var(--primary) 25%, transparent)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.boxShadow = '0 0 8px color-mix(in srgb, var(--primary) 20%, transparent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 25%, transparent)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>
            👑 {name}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)', padding: '1px 5px', borderRadius: '4px' }}>
            v{version}
          </span>
          <span style={{
            fontSize: '9px',
            color: 'var(--primary)',
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            padding: '1px 5px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.3px'
          }}>
            {type}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {parseDescription(description)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onPreview(id)}
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
          onClick={() => onToggle(id)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: isEnabled ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'var(--bg-panel)',
            border: isEnabled ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)' : '1px solid var(--border-muted)',
            color: isEnabled ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s',
            outline: 'none',
          }}
        >
          {isEnabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>
    </div>
  )
}

