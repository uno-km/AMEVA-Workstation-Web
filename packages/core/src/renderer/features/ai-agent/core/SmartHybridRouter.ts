/**
 * ============================================================================
 * @file SmartHybridRouter.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/core/SmartHybridRouter.ts
 * @role Query Complexity Analyzer & Dynamic On-Device / Cloud Hybrid Dispatcher
 * ============================================================================
 */

export type RoutingTarget = 'local_webgpu' | 'remote_http';

export interface RoutingDecision {
  target: RoutingTarget;
  confidence: number;
  reason: string;
  recommendedModel: string;
}

export interface RouterOptions {
  isWebGPUReady: boolean;
  isBackendAvailable: boolean;
  defaultLocalModel?: string;
  defaultRemoteModel?: string;
}

export class SmartHybridRouter {
  private defaultLocalModel: string;
  private defaultRemoteModel: string;

  constructor(options?: Partial<RouterOptions>) {
    this.defaultLocalModel = options?.defaultLocalModel || 'Qwen2.5-3B-Instruct-q4f32_1-MLC';
    this.defaultRemoteModel = options?.defaultRemoteModel || 'qwen2.5:3b';
  }

  /**
   * Route user prompt based on text length, cognitive load, keywords, and engine readiness.
   */
  route(prompt: string, options: RouterOptions): RoutingDecision {
    const trimmed = prompt.trim();
    const length = trimmed.length;

    // 1. Hardware & Availability Fallbacks
    if (!options.isWebGPUReady && options.isBackendAvailable) {
      return {
        target: 'remote_http',
        confidence: 1.0,
        reason: 'WebGPU 가속 미준비 상태로 원격 백엔드 API로 자동 라우팅',
        recommendedModel: this.defaultRemoteModel
      };
    }

    if (options.isWebGPUReady && !options.isBackendAvailable) {
      return {
        target: 'local_webgpu',
        confidence: 1.0,
        reason: '외부 백엔드 미연결로 100% 로컬 WebGPU 엔진 실행',
        recommendedModel: this.defaultLocalModel
      };
    }

    // 2. Heavy Document / Deep Reasoning Keywords
    const heavyKeywords = [
      '전수 분석', '전체 논문', '빅데이터', '심층 분석', '코드베이스 전체',
      'deep reasoning', 'benchmark', 'exhaustive review'
    ];
    const isHeavyTask = heavyKeywords.some(kw => trimmed.includes(kw)) || length > 1500;

    if (isHeavyTask && options.isBackendAvailable) {
      return {
        target: 'remote_http',
        confidence: 0.92,
        reason: '대용량 컨텍스트 및 고난도 분석 작업으로 고성능 백엔드 API 디스패치',
        recommendedModel: this.defaultRemoteModel
      };
    }

    // 3. Lightweight / Fast Tasks (Default to On-Device WebGPU for 0ms latency & $0 cost)
    return {
      target: 'local_webgpu',
      confidence: 0.95,
      reason: '일반 대화, 단락 요약, 문맥 개선 작업을 위한 0ms 레이턴시 온디바이스 WebGPU 처리',
      recommendedModel: this.defaultLocalModel
    };
  }
}

export const smartHybridRouter = new SmartHybridRouter();
