/**
 * @file desktopAdapterImpl.ts
 * @system AMEVA OS - Desktop Platform Adapter Implementation
 * @location packages/core/src/shared/adapters/desktopAdapterImpl.ts
 * @role Implements FileSystemAdapter and AIEngineAdapter using Electron contextBridge IPCs.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 임포트처: `packages/core/src/renderer/main.tsx` (데스크톱 기동 시 플랫폼 감지를 거쳐 registerPlatformAdapter 호출)
 */

/* 
 * [IMPORT SEGMENTATION]
 * - FileSystemAdapter, AIEngineAdapter, PlatformAdapter: 추상화를 구성하는 베이스 인터페이스.
 * - ipc: Electron 메인 프로세스 채널과 통신하기 위한 렌더러 측 IPC 브릿지 어댑터.
 */
import type { FileSystemAdapter, AIEngineAdapter, PlatformAdapter } from './platformAdapter';
import * as ipc from '../../renderer/services/ipc/electronApiAdapter';

/**
 * 데스크톱(Electron) 환경용 파일 시스템 어댑터 구현체입니다.
 */
class DesktopFileSystemAdapter implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    /*
     * [제어 구문 명세]
     * - 조건: window.electronAPI 객체가 존재하지 않거나 readFromPath가 없을 경우
     * - 만족 시: 데스크톱 런타임 환경이 아니므로 빈 문자열로 폴백 처리합니다.
     * - 불만족 시: IPC를 통해 지정한 경로의 파일 콘텐츠를 직접 읽어옵니다.
     * - Example: const content = await this.readFile("/path/to/adc");
     */
    if (!window.electronAPI || !window.electronAPI.readFromPath) {
      console.warn("⚠️ [DesktopFS] electronAPI.readFromPath is unavailable.");
      return "";
    }

    const result = await window.electronAPI.readFromPath(path);
    if (result && result.success && result.content) {
      return result.content;
    }
    throw new Error(result?.error || `Failed to read file from path: ${path}`);
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("⚠️ [DesktopFS] electronAPI is unavailable.");
    }
    const result = await window.electronAPI.saveFile(content, path);
    if (!result.success) {
      throw new Error(`Failed to write file to path: ${path}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    // 데스크톱에서는 간단히 읽기를 시도하여 존재 여부를 판별하거나 true로 가정
    try {
      await this.readFile(path);
      return true;
    } catch {
      return false;
    }
  }

  async selectDirectory(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error("⚠️ [DesktopFS] electronAPI is unavailable.");
    }
    // Electron 폴더 선택 다이얼로그 호출 대용으로 selectLocalFile 또는 showOpenDialog 커스텀 채널 활용
    const result = await window.electronAPI.selectLocalFile();
    return result ? result.filePath : "";
  }
}

/**
 * 데스크톱(Electron Llama.cpp CLI) 환경용 AI 엔진 어댑터 구현체입니다.
 */
class DesktopAIEngineAdapter implements AIEngineAdapter {
  private activeSessionId: string | null = null;

  async runAIStream(
    prompt: string,
    modelPath: string,
    onToken: (token: string) => void
  ): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("⚠️ [DesktopAI] electronAPI is unavailable.");
    }

    const sessionId = Math.random().toString(36).substring(2, 10);
    this.activeSessionId = sessionId;

    // 실시간 토큰 및 완료 리스너 바인딩
    const cleanTokenListener = window.electronAPI.onLLMToken(sessionId, (token) => {
      onToken(token);
    });

    const cleanDoneListener = window.electronAPI.onLLMDone(sessionId, (data) => {
      cleanTokenListener();
      cleanDoneListener();
      this.activeSessionId = null;
    });

    try {
      await window.electronAPI.llmGenerate({
        sessionId,
        modelPath,
        prompt,
        apiType: 'local'
      });
    } catch (e) {
      cleanTokenListener();
      cleanDoneListener();
      this.activeSessionId = null;
      throw e;
    }
  }

  async stopAI(): Promise<void> {
    if (!window.electronAPI) return;
    if (this.activeSessionId) {
      window.electronAPI.llmAbort(this.activeSessionId);
      this.activeSessionId = null;
    }
  }

  async getModels(): Promise<string[]> {
    if (!window.electronAPI) return [];
    const models = await window.electronAPI.llmListModels();
    return models.map(m => m.path || m.name || '');
  }
}

// 싱글톤 데스크톱 플랫폼 어댑터 번들 객체 생성 및 배포
export const desktopAdapter: PlatformAdapter = {
  fs: new DesktopFileSystemAdapter(),
  ai: new DesktopAIEngineAdapter()
};
