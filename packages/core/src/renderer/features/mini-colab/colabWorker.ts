/**
 * ============================================================================
 * @file colabWorker.ts
 * @description Mini Colab Worker
 * ============================================================================
 */
import { amevaGPU } from './tensor-bridge/gpuCore';

// 워커 전역 객체에 WebGPU 코어 노출
(self as any).AmevaGPU = amevaGPU;

let pyodide: any = null;

self.addEventListener('message', async (e) => {
  if (e.data.type === 'EXEC_PYTHON') {
    if (!pyodide) {
      self.postMessage({ type: 'LOADING', msg: 'Pyodide 로딩 중...' });
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs');
      pyodide = await pyodideModule.loadPyodide();

      self.postMessage({ type: 'LOADING', msg: 'Ameva Tensor (WebGPU) 브릿지 초기화 중...' });
      await pyodide.loadPackage('numpy');
      
      // 파이썬 커스텀 라이브러리(ameva_tensor) 주입
      await pyodide.runPythonAsync(`
import js
import numpy as np

class AmevaTensor:
    @staticmethod
    def random(shape):
        return np.random.rand(*shape).astype(np.float32)

    @staticmethod
    async def matmul(A, B):
        # 1D 평탄화 후 JS로 넘기면 Pyodide가 자동으로 Float32Array 뷰로 매핑 (Zero-copy)
        # WebGPU의 mapAsync는 비동기이므로 await 필수
        result_buffer = await js.AmevaGPU.gpuMatmul(A.ravel(), B.ravel(), A.shape[0])
        
        # 결과를 다시 Numpy로 변환
        return np.asarray(result_buffer.to_py()).reshape(A.shape[0], B.shape[1])

    @staticmethod
    async def add(A, B):
        result_buffer = await js.AmevaGPU.gpuElementwise(A.ravel(), B.ravel(), A.size, 0)
        return np.asarray(result_buffer.to_py()).reshape(A.shape)

    @staticmethod
    async def mul(A, B):
        result_buffer = await js.AmevaGPU.gpuElementwise(A.ravel(), B.ravel(), A.size, 1)
        return np.asarray(result_buffer.to_py()).reshape(A.shape)

    @staticmethod
    async def sin(A):
        dummy_B = np.zeros(A.size, dtype=np.float32)
        result_buffer = await js.AmevaGPU.gpuElementwise(A.ravel(), dummy_B, A.size, 2)
        return np.asarray(result_buffer.to_py()).reshape(A.shape)

    @staticmethod
    async def cos(A):
        dummy_B = np.zeros(A.size, dtype=np.float32)
        result_buffer = await js.AmevaGPU.gpuElementwise(A.ravel(), dummy_B, A.size, 3)
        return np.asarray(result_buffer.to_py()).reshape(A.shape)

import sys
sys.modules['ameva_tensor'] = AmevaTensor()
      `);
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
