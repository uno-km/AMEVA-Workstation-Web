import { useEffect } from 'react'
import { useDependencyStore } from './useDependencyStore'

import { useWebLLM } from '../components/useWebLLM';

export function useBackgroundInit() {
  const { initDependency, setDependencyStatus } = useDependencyStore()
  const { initModel } = useWebLLM()

  useEffect(() => {
    // 자동 복구 리로드 플래그 검사
    if (sessionStorage.getItem('ameva_auto_init_webgpu') === '1') {
      sessionStorage.removeItem('ameva_auto_init_webgpu');
      setTimeout(() => {
        const model = localStorage.getItem('ameva_selected_llm_model') || 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
        console.log('[AutoInitWebGPU] Seamlessly starting WebGPU model after recovery:', model);
        initModel(model).catch(e => console.warn('[AutoInitWebGPU] error:', e));
      }, 600);
    }
  }, [initModel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // 1. Web-LLM (AI 엔진)
      initDependency('web-llm', '로컬 AI 추론 엔진 (@mlc-ai/web-llm)')
      setDependencyStatus('web-llm', 'loading')
      import('@mlc-ai/web-llm')
        .then(() => setDependencyStatus('web-llm', 'ready'))
        .catch((err) => setDependencyStatus('web-llm', 'error', err.message))

      // 2. Transformers (임베딩/비전 엔진)
      initDependency('transformers', '온디바이스 머신러닝 (@xenova/transformers)')
      setDependencyStatus('transformers', 'loading')
      import('@xenova/transformers')
        .then(() => setDependencyStatus('transformers', 'ready'))
        .catch((err) => setDependencyStatus('transformers', 'error', err.message))
    }, 5000)

    return () => clearTimeout(timer)
  }, [])
}
