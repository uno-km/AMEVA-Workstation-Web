import { trackEvent } from '../common/analytics.js';
import { showToast } from '../utils/toast.js';

export function initDemoJS() {
  trackEvent('PageLoad', 'DemoJS');

  const runBtn = document.getElementById('run-js-btn');
  const codeArea = document.getElementById('js-code-input');
  const consoleOutput = document.getElementById('js-console-output');

  if (runBtn && codeArea && consoleOutput) {
    runBtn.addEventListener('click', () => {
      const code = codeArea.value;
      trackEvent('Action', 'RunJSCode');
      consoleOutput.innerHTML = '<span class="status-running">▶ Running...</span>\n';
      
      setTimeout(() => {
        let logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')),
          error: (...args) => logs.push(`[ERROR] ${args.join(' ')}`),
          warn: (...args) => logs.push(`[WARN] ${args.join(' ')}`)
        };

        try {
          // 안전하게 함수 컨텍스트에 console을 커스텀 주입하여 가둠
          const runner = new Function('console', code);
          runner(customConsole);
          
          if (logs.length === 0) {
            consoleOutput.textContent = 'Execution finished successfully. No logs produced.';
          } else {
            consoleOutput.textContent = logs.join('\n');
          }
          showToast('JavaScript 코드가 성공적으로 실행되었습니다!', 'success');
        } catch (err) {
          consoleOutput.innerHTML = `<span class="status-error">Error: ${err.message}</span>`;
          showToast('코드 실행 중 에러가 발생했습니다.', 'error');
        }
      }, 300);
    });
  }
}
