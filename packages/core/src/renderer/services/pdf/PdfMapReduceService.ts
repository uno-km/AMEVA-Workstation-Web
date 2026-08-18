/**
 * ============================================================================
 * @file PdfMapReduceService.ts
 * @system AMEVA OS Desktop Workstation - PDF Intelligence Engine
 * @location packages/core/src/renderer/services/pdf/PdfMapReduceService.ts
 * @role 3-Stage Hierarchical Map-Reduce Recursive Summarizer for Large PDFs (SCRUM-166)
 * ============================================================================
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { IAIEngineAdapter } from '../../features/ai-agent/types';
import { getAttachment } from '../../utils/vfsDatabase';

export interface MapReduceProgress {
  stage: 'extracting' | 'mapping' | 'reducing' | 'synthesizing' | 'done' | 'error';
  progressPercent: number;
  currentStep: number;
  totalSteps: number;
  message: string;
  streamingChunk?: string;
}

export interface MapReduceLogItem {
  id: string;
  time: string;
  stage: 'extracting' | 'mapping' | 'reducing' | 'synthesizing' | 'system';
  message: string;
  detail?: string;
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
   * Helper: Resolves a pdfjs document instance from pdf object, fileId, or raw data
   */
  static async resolvePdfInstance(pdfInput: any, fileId?: string, pdfData?: string): Promise<{ pdf: any; numPages: number }> {
    if (pdfInput && typeof pdfInput.getPage === 'function') {
      return { pdf: pdfInput, numPages: pdfInput.numPages || 1 };
    }

    if (fileId) {
      try {
        const blob = await getAttachment(fileId);
        if (blob) {
          const ab = await blob.arrayBuffer();
          const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
          return { pdf: doc, numPages: doc.numPages };
        }
      } catch (err) {
        console.warn('[PdfMapReduce] Failed to resolve PDF from fileId:', err);
      }
    }

    if (pdfData) {
      try {
        let cleanBase64 = pdfData.includes(',') ? pdfData.split(',')[1] : pdfData;
        const binaryString = atob(cleanBase64.replace(/\s/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        return { pdf: doc, numPages: doc.numPages };
      } catch (err) {
        console.warn('[PdfMapReduce] Failed to resolve PDF from pdfData:', err);
      }
    }

    return { pdf: null, numPages: 1 };
  }

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

  private static createLog(stage: MapReduceLogItem['stage'], message: string, detail?: string): MapReduceLogItem {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    return { id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, time, stage, message, detail };
  }

  /**
   * Stage 1: Extracts text page-by-page from pdfjs-dist and groups into clusters
   */
  static async extractAndCluster(
    pdf: any,
    numPages: number,
    pagesPerCluster: number = 3,
    signal?: AbortSignal,
    onProgress?: (p: MapReduceProgress) => void,
    onLog?: (log: MapReduceLogItem) => void
  ): Promise<PageCluster[]> {
    const clusters: PageCluster[] = [];
    let currentClusterText = '';
    let clusterStart = 1;

    onLog?.(this.createLog('extracting', `📄 PDF 스트리밍 텍스트 추출 시작 (총 ${numPages} 페이지 대상)...`));

    // Fallback if pdfjs instance is missing
    if (!pdf || typeof pdf.getPage !== 'function') {
      onProgress?.({
        stage: 'extracting',
        progressPercent: 30,
        currentStep: 1,
        totalSteps: 1,
        message: `📄 [1/3 단계] 문서 메타데이터 기반 컨텍스트 로드 완료 (총 ${numPages}p)`
      });
      onLog?.(this.createLog('extracting', `⚠️ PDF 직접 추출 불가능 상태 - 메타데이터 컨텍스트로 전환합니다.`));
      return [{
        clusterIndex: 0,
        startPage: 1,
        endPage: numPages || 1,
        rawText: `[문서 분석 대상]: 총 ${numPages || 1}페이지로 구성된 PDF 문서입니다.`
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

        onLog?.(this.createLog('extracting', `[페이지 ${pageNum}/${numPages}] 텍스트 추출 완료 (${pageText.length}자)`, pageText.slice(0, 150) + '...'));
      } catch (err) {
        console.warn(`[PdfMapReduce] Failed to extract page ${pageNum}:`, err);
        onLog?.(this.createLog('extracting', `⚠️ [페이지 ${pageNum}] 추출 오류 발생, 건너뜁니다.`));
      }

      const isClusterEnd = pageNum % pagesPerCluster === 0 || pageNum === numPages;
      if (isClusterEnd && currentClusterText.trim()) {
        const cluster: PageCluster = {
          clusterIndex: clusters.length,
          startPage: clusterStart,
          endPage: pageNum,
          rawText: currentClusterText.trim()
        };
        clusters.push(cluster);
        onLog?.(this.createLog('extracting', `📦 [클러스터 #${cluster.clusterIndex + 1}] ${cluster.startPage}~${cluster.endPage}p 묶음 형성 완료 (${cluster.rawText.length}자)`));
        currentClusterText = '';
        clusterStart = pageNum + 1;
      }
    }

    if (clusters.length === 0) {
      clusters.push({
        clusterIndex: 0,
        startPage: 1,
        endPage: numPages,
        rawText: '문서 텍스트 데이터'
      });
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
    onProgress?: (p: MapReduceProgress) => void,
    onLog?: (log: MapReduceLogItem) => void
  ): Promise<string[]> {
    const totalClusters = clusters.length;
    const level1Summaries: string[] = [];

    onLog?.(this.createLog('mapping', `🧩 [2/3 단계] 총 ${totalClusters}개 섹션별 병렬 중간 요약(Map) 가동 시작...`));

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

      // 안정적인 토큰 예산: 700자 내외로 슬라이스하여 VRAM 버퍼 및 OOM 방지
      const boundedText = cluster.rawText.length > 700 ? cluster.rawText.slice(0, 700) + '...' : cluster.rawText;
      const userPrompt = `[페이지 ${cluster.startPage} ~ ${cluster.endPage} 내용]:\n${boundedText}`;

      try {
        onLog?.(this.createLog('mapping', `⚡ [섹션 ${i + 1}/${totalClusters}] p.${cluster.startPage}~${cluster.endPage} LLM 중간 요약 생성 중...`));
        const summary = await this.runPrompt(engine, mapSystemPrompt, userPrompt, signal);
        level1Summaries.push(`### 📌 [페이지 ${cluster.startPage}~${cluster.endPage} 요약]\n${summary}`);
        onLog?.(this.createLog('mapping', `✅ [섹션 ${i + 1}/${totalClusters}] 요약 완료`, summary));

        // GPU 버퍼 GC 및 D3D12 TDR 방지를 위한 1.0초 안정적 페이싱 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err: any) {
        level1Summaries.push(`### 📌 [페이지 ${cluster.startPage}~${cluster.endPage}]\n- (요약 생성 생략: ${err?.message || '처리 오류'})`);
        onLog?.(this.createLog('mapping', `⚠️ [섹션 ${i + 1}] 요약 중 예외: ${err?.message}`));
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
      onLog?.(this.createLog('reducing', `🔄 [Recursive Reduce] ${level1Summaries.length}개 섹션 요약을 통합 재압축합니다...`));

      const joined = level1Summaries.join('\n\n');
      const reducePrompt = `다음 중간 요약들의 중복을 제거하고 핵심 흐름을 유지하며 5~6개의 체계적인 문맥으로 재압축하십시오:\n\n${joined.slice(0, 1500)}`;
      const reduced = await this.runPrompt(engine, mapSystemPrompt, reducePrompt, signal);
      onLog?.(this.createLog('reducing', `✅ 2차 재귀 압축 완료!`, reduced));

      // GPU 쿨다운
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
    onLog?: (log: MapReduceLogItem) => void,
    onStreamingChunk?: (chunk: string) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'synthesizing',
      progressPercent: 80,
      currentStep: 1,
      totalSteps: 1,
      message: `✨ [3/3 단계] 마크다운 표 및 종합 통찰 리포트 생성 중...`
    });
    onLog?.(this.createLog('synthesizing', `✨ [3/3 단계] 최고 수석 분석가 모드로 종합 마크다운 표 & 액션 리포트 작성 시작!`));

    // Stage 2와 Stage 3 사이 GPU TDR 방지 및 버퍼 정리 1.2초 쿨다운
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const contextText = reducedSummaries.join('\n\n').slice(0, 1200);

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
        message: `✨ [3/3 단계] 리포트 실시간 스트리밍 작성 중...`,
        streamingChunk: chunk
      });
    }

    onLog?.(this.createLog('synthesizing', `🎉 [완료] 대용량 PDF 3단계 맵리듀스 종합 분석 리포트 생성 완료!`));

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
    pdfInput: any,
    fileName: string,
    numPages: number,
    engine: IAIEngineAdapter,
    fileId?: string,
    pdfData?: string,
    signal?: AbortSignal,
    onProgress?: (p: MapReduceProgress) => void,
    onLog?: (log: MapReduceLogItem) => void,
    onStreamingChunk?: (chunk: string) => void
  ): Promise<string> {
    onLog?.(this.createLog('system', `🚀 대용량 PDF 3단계 계층형 맵리듀스 파이프라인 가동 (${fileName})`));

    // 0. Resolve PDF Instance safely
    const { pdf, numPages: resolvedPages } = await this.resolvePdfInstance(pdfInput, fileId, pdfData);
    const finalPages = resolvedPages || numPages || 1;

    // 1. Map (추출 및 청킹)
    const clusters = await this.extractAndCluster(pdf, finalPages, 3, signal, onProgress, onLog);

    // 2. Reduce (섹션별 계층 요약)
    const reduced = await this.executeMapReduce(clusters, engine, signal, onProgress, onLog);

    // 3. Synthesis (최종 종합 리포트)
    const finalReport = await this.synthesizeMasterReport(fileName, finalPages, reduced, engine, signal, onProgress, onLog, onStreamingChunk);

    return finalReport;
  }
}
