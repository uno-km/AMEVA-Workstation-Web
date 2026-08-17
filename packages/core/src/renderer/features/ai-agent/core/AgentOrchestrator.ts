/**
 * ============================================================================
 * @file AgentOrchestrator.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/core/AgentOrchestrator.ts
 * @role High-Level ReAct Agent Orchestrator with Semantic Cache & XML Tag Parser
 * ============================================================================
 */

import type {
  IAIEngineAdapter,
  IRAGRetriever,
  IToolRegistry,
  AgentMessage,
  InsertSuggestion
} from '../types';
import { useAIAgentStore } from './useAIAgentStore';
import { semanticCache } from './semanticCache';

export class AgentOrchestrator {
  private aiEngine: IAIEngineAdapter;
  private ragRetriever: IRAGRetriever;
  private toolRegistry: IToolRegistry;
  private abortController: AbortController | null = null;

  constructor(
    aiEngine: IAIEngineAdapter,
    ragRetriever: IRAGRetriever,
    toolRegistry: IToolRegistry
  ) {
    this.aiEngine = aiEngine;
    this.ragRetriever = ragRetriever;
    this.toolRegistry = toolRegistry;
  }

  setEngine(aiEngine: IAIEngineAdapter) {
    this.aiEngine = aiEngine;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * CoT (<think>...</think>) 사고 과정 분리 추출
   */
  private extractThought(rawText: string): { thought: string; cleanContent: string } {
    const thinkStart = rawText.indexOf('<think>');
    const thinkEnd = rawText.indexOf('</think>');

    if (thinkStart !== -1) {
      if (thinkEnd !== -1) {
        const thought = rawText.slice(thinkStart + 7, thinkEnd).trim();
        const cleanContent = (rawText.slice(0, thinkStart) + rawText.slice(thinkEnd + 8)).trim();
        return { thought, cleanContent };
      } else {
        const thought = rawText.slice(thinkStart + 7).trim();
        const cleanContent = rawText.slice(0, thinkStart).trim();
        return { thought, cleanContent };
      }
    }

    return { thought: '', cleanContent: rawText };
  }

  /**
   * <insert ...> XML 태그 및 제안 파싱
   */
  private parseInsertSuggestions(text: string): { cleanText: string; suggestions: InsertSuggestion[] } {
    const suggestions: InsertSuggestion[] = [];
    const insertRegex = /<insert\s+afterBlockId="([^"]*)"\s+type="([^"]*)"(?:\s+level="([^"]*)")?>([\s\S]*?)<\/insert>/g;

    let match;
    let cleanText = text;

    while ((match = insertRegex.exec(text)) !== null) {
      const [fullTag, afterBlockId, blockType, levelStr, content] = match;
      suggestions.push({
        afterBlockId: afterBlockId || 'END',
        blockType: (blockType as any) || 'paragraph',
        content: content.trim(),
        level: levelStr ? parseInt(levelStr, 10) : undefined,
        status: 'pending'
      });
    }

    cleanText = cleanText.replace(insertRegex, '').trim();
    return { cleanText, suggestions };
  }

  /**
   * User Prompt Execution Pipeline with Semantic Cache Bypass
   */
  async processUserPrompt(
    userPrompt: string,
    taggedBlocks?: Array<{ id: string; text: string }>
  ): Promise<void> {
    this.abort();
    const ac = new AbortController();
    this.abortController = ac;

    const store = useAIAgentStore.getState();

    // 1. 사용자 메시지 추가
    const userMsgId = `user-${Date.now()}`;
    const userMsg: AgentMessage = {
      id: userMsgId,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
      taggedBlocks
    };
    store.addMessage(userMsg);

    // 2. 어시스턴트 임시 메시지 추가
    const assistantMsgId = `asst-${Date.now()}`;
    const assistantMsg: AgentMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };
    store.addMessage(assistantMsg);
    store.setIsStreaming(true);

    try {
      // 3. 시맨틱 캐시(SemanticCache) 조회 (0.001s Instant Hit)
      const cachedHit = await semanticCache.findMatch(userPrompt);
      if (cachedHit && !taggedBlocks?.length) {
        console.log('[AgentOrchestrator] ⚡ Semantic Cache Hit! Instant Response.');
        store.updateMessage(assistantMsgId, {
          content: cachedHit.response.content,
          thought: cachedHit.response.thought,
          citations: cachedHit.response.citations,
          insertSuggestions: cachedHit.response.insertSuggestions,
          isStreaming: false
        });
        store.setIsStreaming(false);
        return;
      }

      // 4. RAG 하이브리드 지식 & GraphRAG 검색 실행
      const { prompt: ragSystemPrompt, chunks } = await this.ragRetriever.buildContextPrompt(userPrompt);
      
      const citations = chunks.slice(0, 4).map((c, idx) => ({
        chunkId: c.id || `chunk-${idx}`,
        heading: c.heading,
        section: c.section,
        text: c.text,
        score: c.score,
        blockId: c.blockId
      }));

      store.updateMessage(assistantMsgId, { citations });

      // 5. 시스템 프롬프트 조립 (CoT 및 도구 지침 포함)
      const systemPrompt = `${ragSystemPrompt}

[AGENT ROLE & FORMAT INSTRUCTIONS]
당신은 AMEVA 지능형 문서 작업 에이전트입니다.
답변 작성 시 반드시 아래 규칙을 준수하십시오:
1. 답변을 생성하기 전 <think>...</think> 태그 안에 단계별 사고 과정(CoT)을 한국어로 작성하십시오.
2. 문서에 새로운 단락이나 제목을 추가해야 할 경우 아래 형식으로 제안하십시오:
   <insert afterBlockId="START|END|블록ID" type="heading|paragraph|table" level="1|2|3">추가할 내용</insert>
3. 질문에 명확하고 전문적인 한국어로 답변하십시오.`;

      // 6. LLM 스트리밍 생성
      let rawAccumulated = '';

      const generator = this.aiEngine.generateStream(systemPrompt, userPrompt, {
        signal: ac.signal,
        temperature: 0.3
      });

      for await (const chunk of generator) {
        if (ac.signal.aborted) break;
        rawAccumulated += chunk;

        const { thought, cleanContent } = this.extractThought(rawAccumulated);
        const { cleanText, suggestions } = this.parseInsertSuggestions(cleanContent);

        store.updateMessage(assistantMsgId, {
          content: cleanText,
          thought: thought || undefined,
          insertSuggestions: suggestions.length > 0 ? suggestions : undefined
        });
      }

      // 7. 스트리밍 완료 후 최종 가공 및 시맨틱 캐시 저장
      const { thought: finalThought, cleanContent: finalClean } = this.extractThought(rawAccumulated);
      const { cleanText: finalContent, suggestions: finalSuggestions } = this.parseInsertSuggestions(finalClean);

      const finalResponse = {
        content: finalContent || '답변을 생성할 수 없습니다.',
        thought: finalThought || undefined,
        citations,
        insertSuggestions: finalSuggestions.length > 0 ? finalSuggestions : undefined
      };

      store.updateMessage(assistantMsgId, {
        ...finalResponse,
        isStreaming: false
      });

      // 캐시 저장
      if (!taggedBlocks?.length && finalResponse.content.length > 10) {
        await semanticCache.set(userPrompt, finalResponse);
      }

    } catch (err: any) {
      if (ac.signal.aborted) {
        store.updateMessage(assistantMsgId, { isStreaming: false });
        return;
      }

      console.error('[AgentOrchestrator] Error generating response:', err);
      store.updateMessage(assistantMsgId, {
        content: `오류가 발생했습니다: ${err.message || '알 수 없는 에러'}`,
        isStreaming: false
      });
    } finally {
      store.setIsStreaming(false);
      this.abortController = null;
    }
  }
}
