/**
 * ============================================================================
 * @file colabWorker.ts
 * @description Mini Colab Worker
 * ============================================================================
 */
let pyodide: any = null;

self.addEventListener('message', async (e) => {
  if (e.data.type === 'EXEC_PYTHON') {
    if (!pyodide) {
      self.postMessage({ type: 'LOADING', msg: 'Pyodide 로딩 중...' });
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs');
      pyodide = await pyodideModule.loadPyodide();
    }
    try {
      const output: string[] = [];
      pyodide.setStdout({ batched: (s: string) => output.push(s) });
      pyodide.setStderr({ batched: (s: string) => output.push('[stderr] ' + s) });
      const result = await pyodide.runPythonAsync(e.data.code);
      output.push(result !== undefined ? String(result) : '');
      self.postMessage({ type: 'EXEC_RESULT', output: output.filter(Boolean).join('\n') });
    } catch(err) {
      self.postMessage({ type: 'EXEC_ERROR', error: String(err) });
    }
  }
  if (e.data.type === 'EXEC_JS') {
    try {
      const logs: string[] = [];
      const fn = new Function('console', e.data.code);
      fn({ log: (...a: any[]) => logs.push(a.map(String).join(' ')), error: (...a: any[]) => logs.push('[error] ' + a.join(' ')) });
      self.postMessage({ type: 'EXEC_RESULT', output: logs.join('\n') });
    } catch(err) { self.postMessage({ type: 'EXEC_ERROR', error: String(err) }); }
  }
  if (e.data.type === 'EXEC_SQL') {
    self.postMessage({ type: 'EXEC_RESULT', output: '[SQL 엔진] sql.js 연동 예정' });
  }
});
