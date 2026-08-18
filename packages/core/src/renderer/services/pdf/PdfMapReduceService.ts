/**
 * ============================================================================
 * @file PdfMapReduceService.ts
 * @system AMEVA OS Desktop Workstation - PDF Intelligence Engine
 * @location packages/core/src/renderer/services/pdf/PdfMapReduceService.ts
 * @role 3-Stage Hierarchical Map-Reduce Recursive Summarizer for Large PDFs (SCRUM-166)
 * ============================================================================
 */

import type { IAIEngineAdapter } from '../../features/ai-agent/types';

export interface MapReduceProgress {
  stage: 'extracting' | 'mapping' | 'reducing' | 'synthesizing' | 'done' | 'error';
  progressPercent: number;
  currentStep: number;
  totalSteps: number;
  message: string;
  streamingChunk?: string;
}

export interface PageCluster {
  clusterIndex: number;
  startPage: number;
  endPage: number;
  rawText: string;
  summary?: string;
}

export class PdfMapReduceService {
  /**
   * Helper: Runs streaming completion and accumulates text
   */
  private static async runPrompt(
    engine: IAIEngineAdapter,
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    let accumulated = '';
    const generator = engine.generateStream(systemPrompt, userPrompt, { signal, temperature: 0.2 });

    for await (const chunk of generator) {
      if (signal?.aborted) throw new Error('작업이 사용자에 의해 중단되었습니다.');
      accumulated += chunk;
      onChunk?.(chunk);
    }
    return accumulated.trim();
  }

  /**
   * Stage 1: Extracts text page-by-page from pdfjs-dist and groups into clusters
   */
  static async extractAndCluster(
    pdf: any,
    numPages: number,
    pagesPerCluster: number = 3,
    signal?: AbortSignal,
    onProgress?: (p: MapReduceProgress) => void
  ): Promise<PageCluster[]> {
    const clusters: PageCluster[] = [];
    let currentClusterText = '';
    let clusterStart = 1;

    // PDF 객체가 없거나 getPage가 불가능할 때의 안전 Fallback 처리
    if (!pdf || typeof pdf.getPage !== 'function') {
      onProgress?.({
        stage: 'extracting',
        progressPercent: 30,
        currentStep: 1,
        totalSteps: 1,
        message: `📄 [1/3 단계] 문서 메타데이터 기반 컨텍스트 로드 완료...`
      });
      return [{
        clusterIndex: 0,
        startPage: 1,
        endPage: numPages || 1,
        rawText: `[문서 메타데이터 및 분석 대상]: 총 ${numPages || 1}페이지로 구성된 PDF 문서입니다.`
      }];
    }

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (signal?.aborted) throw new Error('텍스트 추출이 중단되었습니다.');

      onProgress?.({
        stage: 'extracting',
        progressPercent: Math.round((pageNum / numPages) * 30),
        currentStep: pageNum,
        totalSteps: numPages,
        message: `📄 [1/3 단계] PDF 텍스트 스트리밍 추출 중 (${pageNum}/${numPages} 페이지)...`
      });

      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((it: any) => it.str).join(' ');
        currentClusterText += `\n[페이지 ${pageNum}]\n${pageText}\n`;
      } catch (err) {
        console.warn(`[PdfMapReduce] Failed to extract page ${pageNum}:`, err);
      }

      const isClusterEnd = pageNum % pagesPerCluster === 0 || pageNum === numPages;
      if (isClusterEnd && currentClusterText.trim()) {
        clusters.push({
          clusterIndex: clusters.length,
          startPage: clusterStart,
          endPage: pageNum,
          rawText: currentClusterText.trim()
        });
        currentClusterText = '';
        clusterStart = pageNum + 1;
      }
    }

    return clusters;
  }

  /**
   * Stage 2: Recursive Map & Reduce on page clusters
   */
  static async executeMapReduce(
    clusters: PageCluster[],
    engine: IAIEngineAdapter,
    signal?: AbortSignal,
    onProgress?: (p: MapReduceProgress) => void
  ): Promise<string[]> {
    const totalClusters = clusters.length;
    const level1Summaries: string[] = [];

    const mapSystemPrompt = `당신은 대용량 문서 분석 전문가입니다. 주어진 페이지 범위의 텍스트에서 핵심 사실, 주요 수치, 핵심 논점만을 3~4개의 간결한 마크다운 불릿(-)으로 응축하여 요약하십시오. 불필요한 서론이나 태그는 절대 작성하지 마십시오.`;

    for (let i = 0; i < totalClusters; i++) {
      if (signal?.aborted) throw new Error('맵리듀스 분석이 중단되었습니다.');
      const cluster = clusters[i];

      const pct = 30 + Math.round(((i + 1) / totalClusters) * 40);
      onProgress?.({
        stage: 'mapping',
        progressPercent: pct,
        currentStep: i + 1,
        totalSteps: totalClusters,
        message: `🧩 [2/3 단계] 섹션별 중간 요약 생성 중 (섹션 ${i + 1}/${totalClusters}: p.${cluster.startPage}~${cluster.endPage})...`
      });

      // 텍스트가 너무 길면 슬라이스하여 토큰 예산(1500자) 보호
      const boundedText = cluster.rawText.length > 2000 ? cluster.rawText.slice(0, 2000) + '...' : cluster.rawText;
      const userPrompt = `[페이지 ${cluster.startPage} ~ ${cluster.endPage} 내용]:\n${boundedText}`;

      try {
        const summary = await this.runPrompt(engine, mapSystemPrompt, userPrompt, signal);
        level1Summaries.push(`### 📌 [페이지 ${cluster.startPage}~${cluster.endPage} 요약]\n${summary}`);
      } catch (err: any) {
        level1Summaries.push(`### 📌 [페이지 ${cluster.startPage}~${cluster.endPage}]\n- (요약 생성 생략: ${err?.message || '처리 오류'})`);
      }
    }

    // 중간 요약의 총량이 너무 크면 (4개 이상) 재귀적 2차 Reduce 수행
    if (level1Summaries.length > 4) {
      onProgress?.({
        stage: 'reducing',
        progressPercent: 75,
        currentStep: 1,
        totalSteps: 1,
        message: `🔄 [2/3 단계] 계층형 중간 요약 재귀 압축(Recursive Reduce) 진행 중...`
      });

      const joined = level1Summaries.join('\n\n');
      const reducePrompt = `다음 중간 요약들의 중복을 제거하고 핵심 흐름을 유지하며 5~6개의 체계적인 문맥으로 재압축하십시오:\n\n${joined.slice(0, 3000)}`;
      const reduced = await this.runPrompt(engine, mapSystemPrompt, reducePrompt, signal);
      return [reduced];
    }

    return level1Summaries;
  }

  /**
   * Stage 3: Master Synthesis Report Generation
   */
  static async synthesizeMasterReport(
    fileName: string,
    numPages: number,
    reducedSummaries: string[],
    engine: IAIEngineAdapter,
    signal?: AbortSignal,
    onProgress?: (p: MapReduceProgress) => void,
    onStreamingChunk?: (chunk: string) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'synthesizing',
      progressPercent: 80,
      currentStep: 1,
      totalSteps: 1,
      message: `✨ [3/3 단계] 마크다운 표 및 종합 통찰 리포트 생성 중...`
    });

    const contextText = reducedSummaries.join('\n\n');

    const synthesisSystemPrompt = `당신은 최고 경영진을 위한 수석 문서 분석가입니다.
제공된 섹션별 요약 데이터를 종합하여 전문적이고 완성도 높은 [최종 종합 분석 리포트]를 작성하십시오.
작성 규칙:
1. 반드시 아래 마크다운 서식을 완벽하게 준수하십시오.
2. <table> HTML 태그는 절대 사용하지 마시고, 표준 마크다운 표(| 열1 | 열2 |)를 사용하십시오.
3. 핵심 지표와 액션 아이템은 실천 가능하도록 명확하게 기술하십시오.`;

    const synthesisUserPrompt = `[문서 파일명]: ${fileName} (총 ${numPages}페이지)
[섹션별 분석 요약 데이터]:
${contextText}

위 데이터를 기반으로 다음 구성의 종합 리포트를 작성해 주십시오:
# 📑 [종합 분석 리포트] ${fileName}

## 1. 💡 총괄 핵심 요약 (Executive Summary)
(문서 전체의 목적과 가장 중요한 핵심 결론을 3~4문장으로 서술)

## 2. 📊 주요 항목 비교 및 데이터 분석 (Key Matrix)
| 구분 | 핵심 내용 / 지표 | 통찰 및 시사점 |
| :--- | :--- | :--- |
(핵심 데이터를 3~4행의 마크다운 표로 정리)

## 3. 🔍 섹션별 세부 분석
(주요 맥락 요약)

## 4. 🎯 실행 권고사항 및 결론 (Action Items)
1. ...
2. ...`;

    let finalReport = '';
    const generator = engine.generateStream(synthesisSystemPrompt, synthesisUserPrompt, { signal, temperature: 0.3 });

    for await (const chunk of generator) {
      if (signal?.aborted) throw new Error('리포트 생성이 중단되었습니다.');
      finalReport += chunk;
      onStreamingChunk?.(chunk);
      onProgress?.({
        stage: 'synthesizing',
        progressPercent: 90,
        currentStep: 1,
        totalSteps: 1,
        message: `✨ [3/3 단계] 리포트 스트리밍 생성 중...`,
        streamingChunk: chunk
      });
    }

    onProgress?.({
      stage: 'done',
      progressPercent: 100,
      currentStep: 1,
      totalSteps: 1,
      message: `🎉 [완료] 대용량 PDF 3단계 맵리듀스 분석이 완료되었습니다!`
    });

    return finalReport.trim();
  }

  /**
   * Full Pipeline Execution
   */
  static async runFullMapReducePipeline(
    pdf: any,
    fileName: string,
    numPages: number,
    engine: IAIEngineAdapter,
    signal?: AbortSignal,
    onProgress?: (p: MapReduceProgress) => void,
    onStreamingChunk?: (chunk: string) => void
  ): Promise<string> {
    // 1. Map (추출 및 청킹)
    const clusters = await this.extractAndCluster(pdf, numPages, 3, signal, onProgress);

    // 2. Reduce (섹션별 계층 요약)
    const reduced = await this.executeMapReduce(clusters, engine, signal, onProgress);

    // 3. Synthesis (최종 종합 리포트)
    const finalReport = await this.synthesizeMasterReport(fileName, numPages, reduced, engine, signal, onProgress, onStreamingChunk);

    return finalReport;
  }
}
