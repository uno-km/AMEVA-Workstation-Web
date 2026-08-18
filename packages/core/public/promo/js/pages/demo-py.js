import { trackEvent } from '../common/analytics.js';
import { showToast } from '../utils/toast.js';

export function initDemoPy() {
  trackEvent('PageLoad', 'DemoPython');

  const runBtn = document.getElementById('run-py-btn');
  const codeArea = document.getElementById('py-code-input');
  const consoleOutput = document.getElementById('py-console-output');

  if (runBtn && codeArea && consoleOutput) {
    runBtn.addEventListener('click', () => {
      const code = codeArea.value.trim();
      trackEvent('Action', 'RunPythonCode');
      consoleOutput.innerHTML = '<span class="status-running">🐍 Executing Python Kernel...</span>\n';
      
      setTimeout(() => {
        let logs = [];
        
        // 쌈뽕한 파이썬 print() 파서 시뮬레이터
        const lines = code.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          
          // print("문구") 또는 print('문구') 파싱
          const printMatch = trimmed.match(/^print\((['"`])(.*)\1\)$/);
          if (printMatch) {
            logs.push(printMatch[2]);
          } else if (trimmed.startsWith('print(')) {
            // 변수나 연산 print 파싱 시도
            const inner = trimmed.substring(6, trimmed.length - 1);
            try {
              // 간단한 수학 연산 시뮬레이션
              const evalVal = eval(inner.replace(/and/g, '&&').replace(/or/g, '||'));
              logs.push(evalVal);
            } catch {
              logs.push(inner);
            }
          } else if (trimmed && !trimmed.startsWith('#') && !trimmed.includes('=')) {
            logs.push(`>>> ${trimmed}`);
          }
        });

        if (logs.length === 0) {
          consoleOutput.textContent = 'Process finished with exit code 0. No stdout.';
        } else {
          consoleOutput.textContent = logs.join('\n');
        }
        showToast('Python 코드가 실시간 실행되었습니다!', 'success');
      }, 400);
    });
  }
}
