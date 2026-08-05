const fs = require('fs');
const path = 'c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Workstation-Web/packages/core/src/renderer/components/layout/PluginTabPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `        const container = document.getElementById(containerId)
        if (container) {
          if (typeof plugin.render === 'function') {
            container.innerHTML = '' // 로딩 표시 제거
            try {
              plugin.render(containerId)
            } catch (e) {
              console.error(\`[PluginTabPanel] Error rendering plugin \${tabId}:\`, e)
              container.innerHTML = \`<div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">플러그인 렌더링 중 오류가 발생했습니다.</div>\`
            }
          } else {
            // 렌더 함수가 없는 경우 (앱 내장 네이티브 기능이거나 미구현 스크립트)
            if (!plugin.native) {
              container.innerHTML = \`
                <div style="padding: 20px; color: var(--text-muted); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                  <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.8;">🚧</div>
                  <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">개발 중인 기능입니다</div>
                  <div style="font-size: 12px;">(Coming Soon)</div>
                </div>
              \`
            }
          }
        }
      } else if (attempts > 20) { // 10초 대기아웃
        clearInterval(timer)
        const container = document.getElementById(containerId)
        if (container) {
          container.innerHTML = \`<div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">플러그인 스크립트를 로드할 수 없습니다.</div>\`
        }
      }`;

const replacement1 = `        const container = document.getElementById(containerId)
        const placeholder = document.getElementById(\`plugin-placeholder-\${tabId}\`)
        
        if (container) {
          if (typeof plugin.render === 'function') {
            if (placeholder) placeholder.style.display = 'none'
            container.innerHTML = '' 
            try {
              plugin.render(containerId)
            } catch (e) {
              console.error(\`[PluginTabPanel] Error rendering plugin \${tabId}:\`, e)
              container.innerHTML = \`<div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">플러그인 렌더링 중 오류가 발생했습니다.</div>\`
            }
          } else {
            if (!plugin.native) {
              if (placeholder) placeholder.style.display = 'none'
              container.innerHTML = \`
                <div style="padding: 20px; color: var(--text-muted); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                  <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.8;">🚧</div>
                  <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">개발 중인 기능입니다</div>
                  <div style="font-size: 12px;">(Coming Soon)</div>
                </div>
              \`
            }
          }
        }
      } else if (attempts > 20) { 
        clearInterval(timer)
        const container = document.getElementById(containerId)
        const placeholder = document.getElementById(\`plugin-placeholder-\${tabId}\`)
        if (placeholder) placeholder.style.display = 'none'
        if (container) {
          container.innerHTML = \`<div style="padding: 20px; color: #ef4444; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">플러그인 스크립트를 로드할 수 없습니다.</div>\`
        }
      }`;

content = content.replace(target1, replacement1);
fs.writeFileSync(path, content);
console.log('done useEffect');
