import { useState, useCallback, useEffect } from 'react';
// CreateMLCEngine is imported dynamically to save initial bundle size and avoid auto-loading WASM.
import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

let globalEngine: MLCEngine | null = null;
let globalIsLoading = false;
let globalIsReady = false;
let globalProgress = 0;
let globalProgressText = '';
let globalActiveModelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

export const useWebLLM = () => {
  const [state, setState] = useState({
    isReady: globalIsReady,
    isLoading: globalIsLoading,
    progress: globalProgress,
    progressText: globalProgressText,
    activeModelId: globalActiveModelId,
  });

  useEffect(() => {
    const handler = () => {
      setState({
        isReady: globalIsReady,
        isLoading: globalIsLoading,
        progress: globalProgress,
        progressText: globalProgressText,
        activeModelId: globalActiveModelId,
      });
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const initModel = useCallback(async (modelId: string = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC') => {
    if (globalEngine || globalIsLoading) return;
    
    globalActiveModelId = modelId;
    globalIsLoading = true;
    notify();

    try {
      const initProgressCallback = (report: InitProgressReport) => {
        globalProgressText = report.text;
        if (report.progress) globalProgress = report.progress;
        notify();
      };

      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      globalEngine = await CreateMLCEngine(modelId, { initProgressCallback });
      globalIsReady = true;
    } catch (error) {
      console.error('Failed to init WebLLM:', error);
      alert('AI 모델 초기화 실패. 브라우저가 WebGPU를 지원하지 않을 수 있습니다.');
    } finally {
      globalIsLoading = false;
      notify();
    }
  }, []);

  const generateStream = useCallback(async function* (systemPrompt: string, userPrompt: string) {
    if (!globalEngine) throw new Error('Model not initialized');
    
    const chunks = await globalEngine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: 0.2, // 대기업 보고서 톤/개조식 변환 등은 창의성보다 안정성(낮은 온도)이 중요함
      max_tokens: 1024,
    });

    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }, []);

  return { ...state, initModel, generateStream };
};
