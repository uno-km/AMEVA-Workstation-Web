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
import { PromptComposerService } from '../../../services/prompt/PromptComposerService';

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
        level: levelStr ? (parseInt(levelStr, 10) as 1 | 2 | 3) : undefined,
        status: 'pending'
      });
    }

    cleanText = cleanText.replace(insertRegex, '').trim();
    cleanText = this.cleanXmlArtifacts(cleanText);
    return { cleanText, suggestions };
  }

  /**
   * 경량 모델의 비정상 XML/HTML 태그 (<answer>, <itemized-list>, <li>)를 자연스러운 마크다운으로 정제
   */
  private cleanXmlArtifacts(text: string): string {
    let res = text;
    // HTML <table>...</table>을 표준 마크다운 표 문법으로 변환
    res = res.replace(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/gi, (_, trContent) => {
      const ths = trContent.match(/<th>([\s\S]*?)<\/th>/gi) || [];
      const headers = ths.map((th: string) => th.replace(/<\/?th>/gi, '').trim());
      if (headers.length === 0) return '';
      return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
    });
    res = res.replace(/<tbody>\s*([\s\S]*?)\s*<\/tbody>/gi, (_, tbodyContent) => {
      const rows = tbodyContent.match(/<tr>([\s\S]*?)<\/tr>/gi) || [];
      return rows.map((r: string) => {
        const tds = r.match(/<td>([\s\S]*?)<\/td>/gi) || [];
        const cells = tds.map((td: string) => td.replace(/<\/?td>/gi, '').trim());
        return `| ${cells.join(' | ')} |`;
      }).join('\n');
    });

    // <insert ...>, </insert>, <blockId...>, </blockId>, <table>, <tr>, <td> 등 잔여 태그 완전 제거
    res = res.replace(/<\/?(table|thead|tbody|tr|th|td)(?:\s+[^>]*)?>/gi, '');
    res = res.replace(/<\/?insert(?:\s+[^>]*)?>/gi, '');
    res = res.replace(/<\/?blockId(?:\s+[^>]*)?>/gi, '');
    // 속성이 포함된 <answer type="..."> 및 </answer> 완전 제거
    res = res.replace(/<\/?answer(?:\s+[^>]*)?>/gi, '');
    // <itemized-list ...> 및 </itemized-list> 제거
    res = res.replace(/<\/?itemized-list(?:\s+[^>]*)?>/gi, '');
    // <item ...> 태그를 자연스러운 줄바꿈으로 변환
    res = res.replace(/<item(?:\s+[^>]*)?>\s*/gi, '');
    res = res.replace(/<\/item>\s*/gi, '\n');
    // <li> 태그 변환
    res = res.replace(/<li(?:\s+[^>]*)?>\s*/gi, '- ');
    res = res.replace(/<\/li>\s*/gi, '\n');
    // 불필요한 연속 개행 정리
    res = res.replace(/\n{3,}/g, '\n\n');
    return res.trim();
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
      // 3. 시맨틱 캐시(SemanticCache) 조회 (실시간 문서 기반 요약/수정은 항상 LLM 실시간 추론 바이패스)
      const isDocQuery = userPrompt.includes('문서') || userPrompt.includes('요약') || userPrompt.includes('개선') || userPrompt.includes('정리') || userPrompt.includes('RAG');
      if (!isDocQuery && !taggedBlocks?.length) {
        const cachedHit = await semanticCache.findMatch(userPrompt);
        if (cachedHit) {
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

      // 5. 시스템 프롬프트 조립 (CoT 및 도구 지침, 유저 커스텀 페르소나 포함)
      const systemPrompt = await PromptComposerService.getInstance().buildSystemPrompt(ragSystemPrompt);

      // 6. 직전 대화 히스토리(최근 2턴, 250자 스마트 슬라이스) 추출 및 LLM 스트리밍 생성
      const previousHistory = store.messages
        .filter(m => m.id !== userMsgId && m.id !== assistantMsgId && m.content && !m.error && !m.content.includes('초기화되었습니다'))
        .slice(-2)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content.length > 250 ? m.content.slice(0, 250) + '...' : m.content
        }));

      let rawAccumulated = '';

      const generator = this.aiEngine.generateStream(systemPrompt, userPrompt, {
        signal: ac.signal,
        temperature: 0.3,
        history: previousHistory
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
