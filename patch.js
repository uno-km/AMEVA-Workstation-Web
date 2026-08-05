const fs = require('fs');
const path = 'c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation-Web/packages/core/src/renderer/components/layout/PluginTabPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const head = content.substring(0, content.lastIndexOf('return ('));
const newTail = `return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-deep)',
      borderLeft: '1px solid var(--border-muted)',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-muted)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
        </div>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 4,
          }}
          onClick={() => setShowAIPanel(false)}
          title="닫기"
        >
          <X size={14} />
        </button>
      </div>

      {/* 본문 (동적 플러그인 또는 폴백 안내) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* 리액트가 관리하는 Placeholder (순수 DOM 조작으로 hide 처리됨) */}
        <div 
          id={\`plugin-placeholder-\${tabId}\`}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 32, gap: 20, textAlign: 'center', zIndex: 1
          }}
        >
          {/* 아이콘 */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: \`\${color}18\`, border: \`2px solid \${color}40\`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
          }}>
            {React.cloneElement(icon as React.ReactElement, { size: 32 })}
          </div>
          {/* 설명 */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, maxWidth: 240 }}>{description}</div>
          </div>
          {/* 준비 중 뱃지 */}
          <div style={{ padding: '6px 16px', borderRadius: 20, background: \`\${color}15\`, border: \`1px solid \${color}35\`, fontSize: 11, fontWeight: 600, color, letterSpacing: '0.05em' }}>
            🚧 로딩 중 (Loading)
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
            마켓플레이스에서 플러그인을 불러오고 있습니다...<br />잠시만 기다려주세요.
          </div>
        </div>

        {/* 플러그인이 직접 innerHTML로 그릴 빈 컨테이너 (리액트 관여 X) */}
        <div 
          id={\`plugin-container-\${tabId}\`}
          style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}
        />
      </div>
    </div>
  )
}
`;

fs.writeFileSync(path, head + newTail);
console.log('done');
