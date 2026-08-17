import { useEffect } from 'react'
import { useDependencyStore } from './useDependencyStore'

export function useBackgroundInit() {
  const { initDependency, setDependencyStatus } = useDependencyStore()

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
