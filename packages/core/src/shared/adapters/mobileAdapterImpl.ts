/**
 * @file mobileAdapterImpl.ts
 * @system AMEVA OS - Mobile Platform Adapter Implementation
 * @location packages/core/src/shared/adapters/mobileAdapterImpl.ts
 * @role Implements FileSystemAdapter and AIEngineAdapter using Capacitor Mobile APIs.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 임포트처: `packages/core/src/renderer/main.tsx` (모바일/하이브리드 웹뷰 기동 시 registerPlatformAdapter 호출)
 */

/* 
 * [IMPORT SEGMENTATION]
 * - FileSystemAdapter, AIEngineAdapter, PlatformAdapter: 공통 플랫폼 인터페이스 규격.
 */
import type { FileSystemAdapter, AIEngineAdapter, PlatformAdapter } from './platformAdapter';

// Capacitor 전역 타이핑 정의
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
      Plugins: {
        Filesystem?: {
          readFile(options: { path: string; directory?: string; encoding?: string }): Promise<{ data: string }>;
          writeFile(options: { path: string; data: string; directory?: string; encoding?: string }): Promise<void>;
          stat(options: { path: string; directory?: string }): Promise<{ size: number }>;
        };
        AmevaNativeAI?: {
          runStream(options: { prompt: string; modelPath: string }): Promise<{ success: boolean }>;
          stop(): Promise<void>;
          getModels(): Promise<{ models: string[] }>;
        };
      };
    };
  }
}

/**
 * 모바일(Capacitor FileSystem API) 환경용 파일 시스템 어댑터 구현체입니다.
 */
class MobileFileSystemAdapter implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    if (!window.Capacitor || !window.Capacitor.Plugins.Filesystem) {
      throw new Error("⚠️ [MobileFS] Capacitor Filesystem plugin is unavailable.");
    }
    const fs = window.Capacitor.Plugins.Filesystem;
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const isBinary = ['docx', 'pdf', 'hwpx', 'xlsx', 'xls', 'adc'].includes(ext);

    // Capacitor는 이진 데이터(base64)와 일반 텍스트 읽기를 지원함.
    const result = await fs.readFile({
      path,
      encoding: isBinary ? undefined : 'utf8' // 인코딩 미지정 시 base64로 로드됨
    });
    return result.data;
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!window.Capacitor || !window.Capacitor.Plugins.Filesystem) {
      throw new Error("⚠️ [MobileFS] Capacitor Filesystem plugin is unavailable.");
    }
    const fs = window.Capacitor.Plugins.Filesystem;
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const isBinary = ['docx', 'pdf', 'hwpx', 'xlsx', 'xls', 'adc'].includes(ext);

    await fs.writeFile({
      path,
      data: content,
      encoding: isBinary ? undefined : 'utf8'
    });
  }

  async exists(path: string): Promise<boolean> {
    if (!window.Capacitor || !window.Capacitor.Plugins.Filesystem) return false;
    try {
      await window.Capacitor.Plugins.Filesystem.stat({ path });
      return true;
    } catch {
      return false;
    }
  }

  async selectDirectory(): Promise<string> {
    // 모바일에서는 폴더 탐색이 시스템 다이얼로그로 대체되므로 임시 주소 반환
    return "Documents";
  }
}

/**
 * 모바일(네이티브 Llama.cpp JNI 바인딩) 환경용 AI 엔진 어댑터 구현체입니다.
 */
class MobileAIEngineAdapter implements AIEngineAdapter {
  async runAIStream(
    prompt: string,
    modelPath: string,
    onToken: (token: string) => void
  ): Promise<void> {
    if (!window.Capacitor || !window.Capacitor.Plugins.AmevaNativeAI) {
      // 목업 작동 (네이티브 AI 미연동 시 콘솔 경고 및 에러 대체)
      console.warn("⚠️ [MobileAI] Native AI Plugin is not installed. Falling back to HTTP Ollama.");
      return;
    }
    const nativeAI = window.Capacitor.Plugins.AmevaNativeAI;

    // 네이티브 플러그인 기동
    await nativeAI.runStream({ prompt, modelPath });

    // 네이티브에서 올라오는 이벤트를 수신하기 위해 전역 리스너 등록
    const handleNativeToken = (event: any) => {
      if (event && event.token) {
        onToken(event.token);
      }
    };
    
    // 리스너 바인딩 (이벤트 이름 매핑)
    window.addEventListener('amevaNativeToken', handleNativeToken);

    // 생성 마감 시 이벤트 클린업 리스너 추가
    const handleNativeDone = () => {
      window.removeEventListener('amevaNativeToken', handleNativeToken);
      window.removeEventListener('amevaNativeDone', handleNativeDone);
    };
    window.addEventListener('amevaNativeDone', handleNativeDone);
  }

  async stopAI(): Promise<void> {
    if (!window.Capacitor || !window.Capacitor.Plugins.AmevaNativeAI) return;
    await window.Capacitor.Plugins.AmevaNativeAI.stop();
  }

  async getModels(): Promise<string[]> {
    if (!window.Capacitor || !window.Capacitor.Plugins.AmevaNativeAI) return ["Mobile-Qwen-0.5B.gguf"];
    const result = await window.Capacitor.Plugins.AmevaNativeAI.getModels();
    return result.models;
  }
}

// 싱글톤 모바일 플랫폼 어댑터 번들 객체 생성 및 배포
export const mobileAdapter: PlatformAdapter = {
  fs: new MobileFileSystemAdapter(),
  ai: new MobileAIEngineAdapter()
};
