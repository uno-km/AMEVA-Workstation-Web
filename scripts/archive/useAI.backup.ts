// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react'
import type { ReasoningTraceEvent } from '../../shared/reasoningTypes'
import { StreamingSanitizer } from '../utils/responseSanitizer'
import { AgentEngine } from '../utils/agentEngine'
import { MCPClientManager } from '../utils/mcpClient' // [FIX-MCP-001] MCP 관리 유틸 임포트

/** 블록 삽입 제안 — AI가 문서에 새 블록을 삽입할 위치와 내용을 제안 */
export interface InsertSuggestion {
  /** 이 블록 다음에 삽입. 'START' = 문서 맨 앞, 'END' = 문서 맨 끝 */
  afterBlockId: string
  /** 삽입할 블록의 BlockNote 타입 */
  blockType: 'heading' | 'paragraph' | 'bulletListItem' | 'numberedListItem' | 'table'
  /** heading일 때 레벨 (1~3) */
  level?: 1 | 2 | 3
  /** 삽입할 텍스트 내용 */
  content: string
  /** AI가 해당 위치를 선택한 이유 (태그 앞 설명 텍스트) */
  reasonText?: string
  /** 제안 처리 상태 */
  status: 'pending' | 'accepted' | 'rejected'
  /** 현재 삽입 커서 위치에서의 주변 블록 ID들 (상하 이동 시 사용) */
  siblingBlockIds?: string[]
  /** 현재 afterBlockId가 siblingBlockIds 배열에서 몇 번째 인덱스인지 */
  siblingIndex?: number
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  isStreaming?: boolean
  error?: boolean
  aborted?: boolean
  taggedBlocks?: { id: string; text: string }[]
  // 인라인 Diff 제안용 메타데이터
  originalText?: string
  proposedText?: string
  diffState?: 'pending' | 'accepted' | 'rejected'
  blockId?: string
  /** 새 블록 삽입 제안 (INSERT_SUGGESTION 파싱 결과) */
  insertSuggestion?: InsertSuggestion
  insertSuggestions?: InsertSuggestion[]
  /**
   * 실제 LLM/Provider 출력 기반 추론 추적 이벤트 배열.
   * UI가 만든 문구가 아닌 모델/pipeline 실제 출력만 포함.
   * final answer와 분리 저장/렌더링한다.
   */
  reasoningTrace?: ReasoningTraceEvent[]
  /**
   * reasoning pipeline이 생성한 최종 답변.
   * reasoningTrace와 분리 저장.
   */
  finalAnswer?: string
  /**
   * 추론 추적 상태:
   * - 'ok': trace 정상 생성
   * - 'reasoning_trace_unavailable': 미지원 — fake step 대체 금지
   * - 'error': 오류
   * - undefined: 단순 스트리밍 모드 (pipeline 미사용)
   */
  reasoningStatus?: 'ok' | 'reasoning_trace_unavailable' | 'error'
}

export interface AISettings {
  modelPath: string
  codeModelPath?: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  apiType?: 'local' | 'api' | 'wasm' | 'ollama'
  apiKey?: string
  /** [FIX-W-003] 클라우드 API 엔드포인트 (OpenAI 호환 대체 다이나믹, Claude 등 지원) */
  apiEndpoint?: string
  /** [FIX-W-003] 클라우드 API 모델명 (gpt-4o-mini, claude-3-5-sonnet 등) */
  apiModel?: string
  gpuOnly?: boolean
}

const DEFAULT_SETTINGS: AISettings = {
  modelPath: 'C:\\ameva\\models\\llm\\qwen2.5-3b-instruct-q4_k_m.gguf',
  codeModelPath: '',
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: `당신은 AMEVA 문서 에디터에 내장된 AI 문서 편집 에이전트입니다.
사용자의 문서를 직접 읽고, 분석하고, 수정하거나 새로운 내용을 삽입하는 것이 당신의 주 역할입니다.

# CoT 사고 과정 지침
답변하기 전에 반드시 <think>...</think> 태그 안에 한국어로 사고 과정을 작성하십시오.
- 사용자 요청을 분석하고
- 문서 구조(블록 목록)를 검토하며
- 어떤 액션(WRITE/EDIT/CHAT)이 적합한지 판단하고
- 삽입 위치나 수정 대상 블록을 결정하는 이유를 설명하십시오.
예시:
<think>
사용자가 치즈 보고서 제목을 요청했다. 문서가 비어있으므로 afterBlockId=START, type=heading, level=1이 적합하다.
</think>

# 절대 금지 사항
- JavaScript/Python/코드 예시를 답변에 포함하지 마십시오. 절대 금지.
- "AMEVA Nexus", "코드 실행", "실시간 협업 기능"을 소개하지 마십시오.
- 인사말, 서론, "도와드릴게요" 같은 문구를 생략하십시오.
- 존재하지 않는 Block ID를 임의로 만들지 마십시오.

# 당신이 할 수 있는 것
1. 문서의 특정 블록 텍스트를 수정/교체 → [EDIT_SUGGESTION] 태그 사용
2. 문서에 새 블록(제목/단락/목록 등)을 삽입 → [INSERT_SUGGESTION] 태그 사용
3. 문서 내용을 분석하여 요약하거나 질문에 답변

# [EDIT_SUGGESTION] 형식 (기존 블록 내용 수정)
답변 맨 끝에 다음 형식을 추가하십시오:
[EDIT_SUGGESTION: 대상블록ID]
수정된 텍스트 내용
(블록 ID는 컨텍스트에서 제공된 것과 정확히 일치해야 합니다.)

# [INSERT_SUGGESTION] 형식 (새 블록 삽입)
문서에 새 내용을 추가할 때는 답변 끝에 다음 형식을 사용하십시오:
[INSERT_SUGGESTION: afterBlockId=<블록ID 또는 START 또는 END>, type=<블록타입>, level=<1~3>]
삽입할 내용

블록ID 규칙:
- afterBlockId=START : 문서 맨 앞에 삽입
- afterBlockId=END : 문서 맨 끝에 삽입
- afterBlockId=<실제ID> : 해당 블록 바로 다음에 삽입

블록 타입(type):
- heading : 제목 (level=1,2,3 중 선택)
- paragraph : 일반 단락
- bulletListItem : 글머리 기호 목록
- numberedListItem : 번호 목록

예시:
[INSERT_SUGGESTION: afterBlockId=START, type=heading, level=1]
치즈의 종류와 특징

# 문서 구조 분석 지침 (WRITE 모드)
- 컨텍스트에서 제공된 블록 목록과 ID를 보고 적절한 삽입 위치를 선택하십시오.
- 이미 Heading 1이 있으면 그 아래에 Heading 2로 삽입하는 것을 권장하십시오.
- 문서가 비어있으면 afterBlockId=START를 사용하십시오.
- 본문 요청이면 관련 제목 블록 다음에 paragraph를 삽입하십시오.

# 한국어 답변
반드시 한국어로 답변하십시오.`,
  apiType: 'local',
  apiKey: '',
  gpuOnly: true,
}

export function useAI() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isGenerating, _setIsGenerating] = useState(false)
  const isGeneratingRef = useRef(false)
  const setIsGenerating = useCallback((val: boolean) => {
    _setIsGenerating(val)
    isGeneratingRef.current = val
  }, [])
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const stored = localStorage.getItem('ai-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        // 구버전 프롬프트 마이그레이션: fake thought 지침이 있거나 CoT 지침 누락 시 교체
        if (parsed.systemPrompt && (
          parsed.systemPrompt.includes('간결하고 명확하게 답하세요') ||
          parsed.systemPrompt.includes('친근하고 유연하게') ||
          parsed.systemPrompt.includes('AMEVA AI입니다.') ||
          !parsed.systemPrompt.includes('한국어 답변') ||
          !parsed.systemPrompt.includes('INSERT_SUGGESTION') ||
          !parsed.systemPrompt.includes('CoT 사고 과정 지침') ||  // CoT 지침 미포함 → 강제 교체
          parsed.systemPrompt.includes('사고 과정 지침') ||
          parsed.systemPrompt.includes('<thought>')
        )) {
          parsed.systemPrompt = DEFAULT_SETTINGS.systemPrompt
          localStorage.setItem('ai-settings', JSON.stringify(parsed))
        }
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch {}
    return DEFAULT_SETTINGS
  })
  const [streamingText, setStreamingText] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)
  const [models, setModels] = useState<{ name: string; filename: string; path: string; size: number }[]>([])
  const [codeModels, setCodeModels] = useState<{ name: string; filename: string; path: string; size: number }[]>([])
  const [engineLogs, setEngineLogs] = useState<string>('') // 🤖 로컬 터미널 로그 데이터 저장소
  const [pendingQueue, setPendingQueue] = useState<Array<any>>([])

  const unsubTokenRef = useRef<(() => void) | null>(null)
  const unsubDoneRef = useRef<(() => void) | null>(null)
  const unsubLogRef = useRef<(() => void) | null>(null)
  const currentAssistantIdRef = useRef<string | null>(null)
  const currentSessionIdRef = useRef<string | null>(null) // [FIX-IPC-001] 현재 대화 세션 ID 트래킹 레프

  // 🤖 StreamingSanitizer instance — one per generation session
  const sanitizerRef = useRef<StreamingSanitizer>(new StreamingSanitizer())
  // 🤖 Raw accumulated text (un-sanitized) — used for EDIT_SUGGESTION parsing
  const rawAccumRef = useRef<string>('')
  // 🤖 에이전트 구동 중 전역 토큰 리스너(onLLMToken)와의 충돌을 제어하기 위한 레프 락
  const isAgentRunningRef = useRef<boolean>(false)

  // 🦾 [SaaS 유료 기능] 연속 요청 큐 및 실행 레프
  const pendingQueueRef = useRef<Array<{
    id: string
    userMessage: string
    context?: string
    originalText?: string
    blockId?: string
    runtimeSettings?: Partial<AISettings>
    editorInstance?: any
    taggedBlocks?: { id: string; text: string }[]
  }>>([])

  // 모델 목록 갱신 함수 (수동 리스캔)
  const refreshModels = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      const type = settings.apiType === 'ollama' ? 'ollama' : 'llm'
      const list = await window.electronAPI.llmListModels(type)
      setModels(list)
      if (list.length > 0) {
        setSettings(prev => {
          const exists = list.some(m => m.path === prev.modelPath)
          if (exists) return prev
          const preferred = type === 'ollama' ? list[0] : (list.find(m => m.filename.includes('3b')) || list[list.length - 1])
          return { ...prev, modelPath: preferred.path }
        })
      }
      
      const codeList = await window.electronAPI.llmListModels('code')
      setCodeModels(codeList)
      if (codeList.length > 0) {
        setSettings(prev => {
          const exists = codeList.some(m => m.path === prev.codeModelPath)
          if (exists) return prev
          return { ...prev, codeModelPath: codeList[0].path }
        })
      }
    } catch (e) {
      console.warn('모델 목록 갱신 실패:', e)
    }
  }, [settings.apiType, setSettings])

  // 모델 목록 로드
  useEffect(() => {
    if (!window.electronAPI) {
      // 🤖 웹 브라우저 환경에서는 WebGPU WASM, 클라우드 API, Ollama 모드 가동을 위해 true로 오픈
      setIsAvailable(true)
      return
    }
    refreshModels()
  }, [settings.apiType, refreshModels])

  // API 타입별 실시간 헬스 체크 폴링
  useEffect(() => {
    if (!window.electronAPI) return
    
    const checkHealth = async () => {
      const type = settings.apiType || 'local'
      
      if (type === 'api') {
        setIsAvailable(true)
        return
      }
      
      if (type === 'ollama') {
        try {
          const res = await fetch('http://localhost:11434/api/tags', { 
            method: 'GET', 
            signal: AbortSignal.timeout(1500) 
          })
          setIsAvailable(res.ok)
        } catch {
          setIsAvailable(false)
        }
        return
      }
      
      // 'local' 또는 'wasm' (내부 우회) 모드는 포트 12345 llama-server 헬스 체크 검사
      if (window.electronAPI.llmCheckHealth) {
        try {
          const res = await window.electronAPI.llmCheckHealth()
          setIsAvailable(res.status === 'ok' || res.status === 'loading model')
        } catch {
          setIsAvailable(false)
        }
      } else {
        setIsAvailable(false)
      }
    }
    
    checkHealth() // 최초 1회 실행
    const timer = setInterval(checkHealth, 4000) // 4초마다
    return () => clearInterval(timer)
  }, [settings.apiType])

  // 외부 모델 수동 파일 선택하여 로컬에 추가
  const importModel = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      // 1. GGUF 파일 선택 대화상자 열기
      const filePaths = await window.electronAPI.selectLocalFile([
        { name: 'GGUF 언어모델', extensions: ['gguf'] }
      ])
      if (!filePaths || filePaths.length === 0) return

      const sourcePath = filePaths[0]
      // 2. 메인 프로세스에 복사 요청
      const res = await window.electronAPI.llmImportModel(sourcePath)
      if (res && res.success) {
        alert('모델 가져오기 완료! 즉시 AI 사용이 가능합니다.')
        await refreshModels()
        // 자동으로 선택 지정
        if (res.path) {
          setSettings(prev => {
            const next = { ...prev, modelPath: res.path }
            localStorage.setItem('ai-settings', JSON.stringify(next))
            return next
          })
        }
      } else if (res && !res.success) {
        alert(`가져오기 실패: ${res.error}`)
      }
    } catch (e: any) {
      alert(`가져오기 에러: ${e.message}`)
    }
  }, [refreshModels])

  // 이벤트 리스너 설정 (세션 격리를 위해 비활성화됨)
  useEffect(() => {
    return; // [FIX-IPC-001] 즉시 반환하여 전역 리스너 비활성화
    if (!window.electronAPI) return

    // 스트리밍 토큰 수신
    const unsubToken = window.electronAPI.onLLMToken('', (token) => {
      // 에이전트 구동 중일 때는 전역 토큰 리스너의 간섭을 완전히 배제하고 즉시 무시
      if (isAgentRunningRef.current) return

      // Accumulate raw text (un-sanitized) for EDIT_SUGGESTION parsing at done time
      rawAccumRef.current += token
      setStreamingText(prev => prev + token)

      if (currentAssistantIdRef.current) {
        // Feed token through sanitizer
        sanitizerRef.current.appendChunk(token)
        const safeText = sanitizerRef.current.getSafeOutput()
        const thinkingText = sanitizerRef.current.getThinkingBuffer()

        setMessages(prev => prev.map(m => {
          if (m.id !== currentAssistantIdRef.current) return m

          // Live reasoning trace from accumulated thinking text
          const liveTrace: ReasoningTraceEvent[] = thinkingText
            ? [{
                id: `trace_live_${m.id}`,
                source: 'model' as const,
                type: 'thinking' as const,
                text: thinkingText,
                model: 'streaming',
                timestamp: new Date().toISOString(),
              }]
            : []

          return {
            ...m,
            // Only show sanitized output — internal tags never appear in content
            content: safeText,
            isStreaming: true,
            reasoningTrace: liveTrace,
          }
        }))
      }
    })

    // 완료 이벤트 수신
    const unsubDone = window.electronAPI.onLLMDone('', (data) => {
      setIsGenerating(false)
      setStreamingText('')

      // 🤖 Finalize sanitizer — get clean final content and extracted thinking content
      const sanitizeResult = sanitizerRef.current.finalize()

      // 🤖 EDIT_SUGGESTION must be parsed from the RAW accumulated text
      // (before sanitization; the tag may be inside or after a <thought> block)
      const rawForEdit = rawAccumRef.current

      const targetId = currentAssistantIdRef.current
      setMessages(prev => {
        let updated = false
        const next = prev.map(m => {
          if (targetId && m.id === targetId) {
            updated = true

            const isAbortError = !data.success && (
              data.error === '사용자에 의해 중단됨' ||
              data.error === 'Aborted' ||
              data.error?.includes('중단')
            )

            // Determine the clean display content
            let cleanContent: string
            if (!data.success) {
              cleanContent = isAbortError
                ? (sanitizeResult.finalContent.trim() || m.content || '사용자가 답변을 중단했습니다')
                : (data.error || '오류가 발생했습니다.')
            } else {
              cleanContent = sanitizeResult.finalContent
            }

            // Build the final reasoning trace
            const finalTrace: ReasoningTraceEvent[] = sanitizeResult.thinkingContent
              ? [{
                  id: `trace_final_${m.id}`,
                  source: 'model' as const,
                  type: 'thinking' as const,
                  text: sanitizeResult.thinkingContent,
                  model: 'streaming',
                  timestamp: new Date().toISOString(),
                }]
              : (m.reasoningTrace ?? [])

            let blockId = m.blockId
            let originalText = m.originalText
            let proposedText = cleanContent
            let insertSuggestion: InsertSuggestion | undefined

            // 🤖 [스트리밍 UI 숨김 처리] 스트리밍 중에도 태그 문법 자체는 화면에 노출되지 않도록 제거
            cleanContent = cleanContent
              .replace(/\[EDIT_SUGGESTION:\s*[a-zA-Z0-9_\-]+\](?:\r?\n)?/i, '')
              .replace(/\[INSERT_SUGGESTION:[^\]]+\](?:\r?\n)?/i, '')

            // 🤖 [수정 제안 자동 감지] Parse EDIT_SUGGESTION from RAW (un-sanitized) text.
            const editMatch = rawForEdit.match(/\[EDIT_SUGGESTION:\s*([a-zA-Z0-9_\-]+)\](?:\r?\n)?([\s\S]*)/i)
            if (editMatch && data.success) {
              blockId = editMatch[1]
              proposedText = editMatch[2].trim()
              // 태그는 위에서 이미 제거되었으므로, 제안된 텍스트 자체를 채팅 버블에서 제거합니다.
              if (proposedText) {
                cleanContent = cleanContent.replace(proposedText, '').trim()
              }

              if (editorRef.current) {
                try {
                  const block = editorRef.current.getBlock(blockId)
                  if (block) {
                    if (block.type === 'jupyter') {
                      originalText = block.props?.code || ''
                    } else if (Array.isArray(block.content)) {
                      originalText = block.content.map((c: any) => c.text || '').join('')
                    } else {
                      originalText = String(block.content || '')
                    }
                  }
                } catch (e) {
                  console.warn('에디터 블록 조회 실패:', e)
                }
              }
            }

            // 🤖 [다중 삽입 제안 자동 감지] Parse multiple INSERT_SUGGESTION instances from RAW text.
            let insertSuggestions: InsertSuggestion[] = []
            if (!editMatch && data.success) {
              const tagRegex = /\[INSERT_SUGGESTION:\s*afterBlockId=([^,\]]+),\s*type=(\w+)(?:,\s*level=(\d))?\]/gi
              let match;
              const parsedMatches: any[] = []

              while ((match = tagRegex.exec(rawForEdit)) !== null) {
                parsedMatches.push({
                  tag: match[0],
                  afterBlockIdRaw: match[1].trim(),
                  typeRaw: match[2].trim().toLowerCase(),
                  level: match[3] ? (parseInt(match[3]) as 1 | 2 | 3) : undefined,
                  startIndex: match.index,
                  endIndex: tagRegex.lastIndex
                })
              }

              if (parsedMatches.length > 0) {
                // 첫 번째 제안 이전의 텍스트가 제안 이유(reasonText)로 매핑됨
                const firstTagIdx = parsedMatches[0].startIndex
                const preTagText = rawForEdit.slice(0, firstTagIdx).trim()
                const reasonText = preTagText
                  .replace(/<\/?(thinking|reasoning|thought|though|think)\s*>/gi, '') // <think> 태그 제거
                  .replace(/^지금 요청은[^\n]*\n?/m, '')
                  .replace(/^컨텍스트의 블록[^\n]*\n?/m, '')
                  .trim()

                // [BUG FIX] 표시용 본문은 이미 완벽하게 생각과정이 소독된 sanitizeResult.finalContent를 기준으로
                // [INSERT_SUGGESTION] 코드와 그 하위 제안 본문을 제거하여 깨끗한 설명만 남김
                cleanContent = sanitizeResult.finalContent
                  .replace(/\[INSERT_SUGGESTION:[^\]]*\]?(?:\r?\n)?[\s\S]*/i, '')
                  .trim()

                // 에디터 블록 목록 조회 (up/down 이동용)
                let siblingBlockIds: string[] = []
                if (editorRef.current) {
                  try {
                    const flatBlocks = (function flatten(blocks: any[]): any[] {
                      return blocks.flatMap((b: any) => [b, ...flatten(b.children || [])])
                    })(editorRef.current.document || [])
                    siblingBlockIds = flatBlocks.map((b: any) => b.id)
                  } catch {}
                }

                // 각 매치별로 본문 내용(content)을 분할 추출
                for (let i = 0; i < parsedMatches.length; i++) {
                  const curr = parsedMatches[i]
                  const nextStart = (i + 1 < parsedMatches.length) ? parsedMatches[i + 1].startIndex : rawForEdit.length
                  const insertContent = rawForEdit.slice(curr.endIndex, nextStart).trim()

                  // afterBlockId 정규화: '...' 또는 빈값 → 'END', 대소문자 통일
                  let afterBlockId = curr.afterBlockIdRaw
                  if (!afterBlockId || afterBlockId === '...' || afterBlockId === 'undefined') {
                    afterBlockId = 'END'
                  }

                  const validTypes = ['heading', 'paragraph', 'bulletListItem', 'numberedListItem', 'table']
                  const blockType = validTypes.includes(curr.typeRaw) ? curr.typeRaw as InsertSuggestion['blockType'] : 'paragraph'

                  let siblingIndex = siblingBlockIds.length - 1
                  const foundIdx = siblingBlockIds.indexOf(afterBlockId)
                  if (foundIdx >= 0) {
                    siblingIndex = foundIdx
                  }

                  insertSuggestions.push({
                    afterBlockId,
                    blockType,
                    level: curr.level,
                    content: insertContent,
                    reasonText: reasonText || undefined,
                    status: 'pending',
                    siblingBlockIds,
                    siblingIndex,
                  })
                }
              } else {
                // 파싱 실패 시에도 raw 태그 노출 방지를 위해 잔여 태그 제거
                cleanContent = cleanContent
                  .replace(/\[INSERT_SUGGESTION:[^\]]*\]?(?:\r?\n)?[\s\S]*/i, '')
                  .trim()
              }
            }

            // 모드 에코 패턴 최종 제거 (소형 모델이 [WRITE], [EDIT] 등을 응답에 븼이는 현상)
            if (data.success && cleanContent) {
              cleanContent = cleanContent
                .replace(/^\[(WRITE|EDIT|CHAT|SUMMARY)\]\s*/i, '')
                .replace(/^현재 작업 모드:.*\n?/m, '')
                .replace(/^지금 요청은.*\n?/m, '')
                .trim()
            }

            return {
              ...m,
              isStreaming: false,
              error: !data.success && !isAbortError,
              aborted: isAbortError || m.aborted,
              content: cleanContent,
              finalAnswer: data.success ? sanitizeResult.finalContent : undefined,
              reasoningTrace: finalTrace,
              reasoningStatus: sanitizeResult.hadInternalTags ? 'ok' : m.reasoningStatus,
              proposedText: data.success || (isAbortError && cleanContent.trim())
                ? (editMatch ? proposedText : cleanContent)
                : undefined,
              originalText: data.success || (isAbortError && cleanContent.trim())
                ? (editMatch ? originalText : m.originalText)
                : undefined,
              blockId,
              insertSuggestion: data.success ? insertSuggestions[0] : undefined,
              insertSuggestions: data.success ? insertSuggestions : undefined,
            }
          }
          return m
        })

        // 폴백: 명시적인 변경이 없었고 마지막 메시지가 assistant이면 업데이트
        if (!updated && next.length > 0 && next[next.length - 1].role === 'assistant') {
          const lastIdx = next.length - 1
          const lastMsg = next[lastIdx]

          const isAbortError = !data.success && (
            data.error === '사용자에 의해 중단됨' ||
            data.error === 'Aborted' ||
            data.error?.includes('중단')
          )

          let cleanContent: string
          if (!data.success) {
            cleanContent = isAbortError
              ? (sanitizeResult.finalContent.trim() || lastMsg.content || '사용자가 답변을 중단했습니다')
              : (data.error || '오류가 발생했습니다.')
          } else {
            cleanContent = sanitizeResult.finalContent
          }

          const finalTrace: ReasoningTraceEvent[] = sanitizeResult.thinkingContent
            ? [{
                id: `trace_final_${lastMsg.id}`,
                source: 'model' as const,
                type: 'thinking' as const,
                text: sanitizeResult.thinkingContent,
                model: 'streaming',
                timestamp: new Date().toISOString(),
              }]
            : (lastMsg.reasoningTrace ?? [])

          next[lastIdx] = {
            ...lastMsg,
            isStreaming: false,
            error: !data.success && !isAbortError,
            aborted: isAbortError || lastMsg.aborted,
            content: cleanContent,
            finalAnswer: data.success ? sanitizeResult.finalContent : undefined,
            reasoningTrace: finalTrace,
            reasoningStatus: sanitizeResult.hadInternalTags ? 'ok' : lastMsg.reasoningStatus,
            proposedText: data.success || (isAbortError && cleanContent.trim()) ? cleanContent : undefined,
          }
        }
        // 완료 시점에는 배열 내의 모든 메시지의 isStreaming 상태를 명시적으로 해제 (강제 동기화)
        return next.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
      })

      // Reset per-session state
      currentAssistantIdRef.current = null
      sanitizerRef.current = new StreamingSanitizer()
      rawAccumRef.current = ''
    })

    unsubTokenRef.current = unsubToken
    unsubDoneRef.current = unsubDone

    return () => {
      unsubToken()
      unsubDone()
    }
  }, [])

  // ─── [로그 중앙화] 실시간 콘솔 로그 수신 및 WebGPU 로그 가로채기 ───
  useEffect(() => {
    if (!window.electronAPI) return

    // 1. 메인 프로세스 로그 수신
    const unsubLog = window.electronAPI.onLLMLog((data) => {
      setEngineLogs(prev => prev + data.text)
    })

    // 2. 누락된 초기 로그 가져오기
    if (window.electronAPI.llmGetLogs) {
      window.electronAPI.llmGetLogs().then(logs => {
        if (logs) setEngineLogs(prev => prev === '' ? logs : logs + prev)
      }).catch(err => console.error('Failed to fetch initial LLM logs', err))
    }

    // 3. 브라우저 콘솔 가로채기 (WGU 지원)
    const origLog = console.log
    const origWarn = console.warn
    const origErr = console.error

    const interceptAndSend = (_type: string, args: any[]) => {
      const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      const lower = text.toLowerCase()
      if (lower.includes('webgpu') || lower.includes('gpu') || lower.includes('webgl')) {
        if (window.electronAPI?.llmAddLog) {
          window.electronAPI.llmAddLog({ text, prefix: 'WGU' })
        }
      }
    }

    console.log = (...args) => { origLog(...args); interceptAndSend('log', args) }
    console.warn = (...args) => { origWarn(...args); interceptAndSend('warn', args) }
    console.error = (...args) => { origErr(...args); interceptAndSend('error', args) }

    unsubLogRef.current = unsubLog

    return () => {
      unsubLog()
      console.log = origLog
      console.warn = origWarn
      console.error = origErr
      if (unsubLogRef.current) {
        unsubLogRef.current()
        unsubLogRef.current = null
      }
    }
  }, [])

  const editorRef = useRef<any>(null)

  const generateResponse = useCallback(async (
    userMessage: string,
    context?: string,
    originalText?: string,
    blockId?: string,
    runtimeSettings?: Partial<AISettings>,
    editorInstance?: any,
    taggedBlocks?: { id: string; text: string }[]
  ) => {
    if (editorInstance) {
      editorRef.current = editorInstance
    }
    if (!window.electronAPI) return

    // 🦾 [SaaS 플러그인] 마켓플레이스 요금제 및 요청 큐 플러그인 상태 동적 파싱
    let isPro = false
    let enabledPlugins: Record<string, boolean> = { webSearch: true, pythonConsole: true, requestQueue: false }
    try {
      isPro = localStorage.getItem('is-pro-plan') === 'true'
      const storedPlugins = localStorage.getItem('enabled-plugins')
      if (storedPlugins) {
        enabledPlugins = JSON.parse(storedPlugins)
      }
    } catch {}
    
    // 디버그: 현재 활성화된 플러그인 상태 (플랜 무관 상시 대기열 기능 적용 전)
    console.debug('[Plugins] Current state:', enabledPlugins)

    // (일일 10회 제한 가드를 finalSettings 결합 시점인 하단으로 이동시킴)

    if (isGeneratingRef.current && enabledPlugins.requestQueue) {
      // 🦾 [FEAT] 사용자 요청 플러그인(Request Queue) 활성화 시에만 대기열 작동
      const queueId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const newQueueItem = {
        id: queueId,
        userMessage,
        context,
        originalText,
        blockId,
        runtimeSettings,
        editorInstance,
        taggedBlocks
      }
      pendingQueueRef.current.push(newQueueItem)
      setPendingQueue([...pendingQueueRef.current])
      return
    }

    setEngineLogs('') // [디버그] 이전 LLM 세션 로그 비우기
    console.log('[useAI] generateResponse 호출됨. 런타임 세팅:', runtimeSettings)

    // 🤖 이전 메시지 중 isStreaming: true가 남아 있으면 일제히 꺼줌 (중복 커서 깜빡임 제거)
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))

    const userMsg: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      taggedBlocks: taggedBlocks && taggedBlocks.length > 0 ? [...taggedBlocks] : undefined,
    }

    // 의도 분석 (UI 라우팅용 — fake thinking 주입 목적 아님)
    const intent = (runtimeSettings as any)?.resolvedMode
      ? (runtimeSettings as any).resolvedMode.toUpperCase() as 'WRITE' | 'EDIT' | 'SUMMARY' | 'CHAT'
      : (() => {
          const cleanPrompt = userMessage.toLowerCase().trim()
          const summaryKeywords = ['요약', '정리', '줄여', 'summarize', 'summary', 'brief']
          if (summaryKeywords.some(k => cleanPrompt.includes(k))) return 'SUMMARY'

          // 🤖 태그된 블록이 있으면 EDIT(기존 블록 수정)를 WRITE(새 블록 삽입)보다 최우선하여 체크!
          const hasTags = taggedBlocks && taggedBlocks.length > 0
          const editKeywords = [
            '수정', '변경', '바꿔', '고쳐', '지워', '교체', '고쳐줘',
            'edit', 'modify', 'replace', 'rewrite', 'correct'
          ]
          const isEditQuery = editKeywords.some(k => cleanPrompt.includes(k))
          if (hasTags && isEditQuery) return 'EDIT'

          // 🤖 작명/제목 추천 연쇄 대화용 예외 필터링 (CHAT으로 유도)
          const isTitleGenerationOnly = cleanPrompt.includes('제목') && 
            (cleanPrompt.includes('지어') || cleanPrompt.includes('추천') || cleanPrompt.includes('후보') || cleanPrompt.includes('어때') || cleanPrompt.includes('정해')) &&
            !cleanPrompt.includes('추가') && !cleanPrompt.includes('넣어') && !cleanPrompt.includes('삽입')

          if (isTitleGenerationOnly) return 'CHAT'

          // WRITE: 새 내용 작성/삽입
          const writeKeywords = [
            '써줘', '써', '작성', '보고서', '리포트', '문서 만들어', '글 써줘',
            '제목', '본문', '넣어줘', '넣어', '입력해', '추가해줘', '만들어줘',
            '생성해', '쓰기', 'write', 'draft', 'create', 'compose', 'generate'
          ]
          if (writeKeywords.some(k => cleanPrompt.includes(k))) return 'WRITE'

          // 일반적인 EDIT 체크 (태그가 없을 때)
          if (isEditQuery) return 'EDIT'

          return 'CHAT'
        })()

    // 호출 시점 런타임 세팅 최우선 병합
    const finalSettings = { ...settings, ...runtimeSettings }

    // ── [FEAT] 코딩 요청 자동 감지 및 코딩 특화 모델 교체 ──
    const isCodingRequest = (() => {
      const cleanPrompt = userMessage.toLowerCase().trim()
      const codingKeywords = [
        '코드', '코딩', '개발', '함수', '구현', '프로그래밍', '알고리즘', '정규식',
        'python', 'javascript', 'typescript', 'c++', 'java', 'html', 'css', 'sql',
        'api', '컴파일', '디버그', 'eslint', 'prettier', 'git', 'github', 'mcp', 'wasm',
        'code', 'implement', 'debug', 'compile', 'function', 'class', 'struct', 'library'
      ]
      return codingKeywords.some(k => cleanPrompt.includes(k))
    })()

    let codeModelUsed = false
    if (isCodingRequest && finalSettings.codeModelPath && finalSettings.codeModelPath !== '') {
      finalSettings.modelPath = finalSettings.codeModelPath
      codeModelUsed = true
    }

    // 🦾 [무료 플랜] 일일 AI 생성 10회 제한 및 예외 필터링 실구현 가드
    if (!isPro) {
      const isLocalModel = finalSettings.apiType === 'local' || finalSettings.apiType === 'wasm' || finalSettings.apiType === 'ollama'
      const isPersonalApiKey = finalSettings.apiType === 'api' && !!finalSettings.apiKey && finalSettings.apiKey.trim() !== ''

      // 로컬 모델 연동 혹은 개인 API 키를 사용해 직접 비용을 부담하는 경우는 일일 한도(10회)에서 면제(Bypass)
      if (!isLocalModel && !isPersonalApiKey) {
        const todayStr = new Date().toISOString().split('T')[0]
        const lastDate = localStorage.getItem('ai-usage-date')
        let usageCount = parseInt(localStorage.getItem('ai-daily-usage-count') || '0', 10)

        if (lastDate !== todayStr) {
          localStorage.setItem('ai-usage-date', todayStr)
          localStorage.setItem('ai-daily-usage-count', '0')
          usageCount = 0
        }

        if (usageCount >= 10) {
          const limitMessageId = `msg_limit_${Date.now()}`
          setMessages(prev => [
            ...prev,
            {
              id: limitMessageId,
              role: 'assistant',
              content: `❌ **[무료 요금제 한도 도달]** 무료 플랜의 일일 클라우드 프록시 AI 생성 한도(10회)를 모두 소진하셨습니다. 계속 이용하시려면 개인 API Key를 등록하거나, Ollama/Local GGUF 등의 로컬 모델을 구동하거나, Pro Plan으로 업그레이드해주세요.`,
              timestamp: Date.now()
            }
          ])
          return
        }

        localStorage.setItem('ai-daily-usage-count', String(usageCount + 1))
      }
    }

    // ✅ 빈 content로 시작 — fake initialThought 주입 제거
    const assistantId = `msg_${Date.now()}_assistant`
    const assistantMsg: AIMessage = {
      id: assistantId,
      role: 'assistant',
      content: '', // 모델 스트리밍 토큰이 올 때까지 비워둠
      timestamp: Date.now(),
      isStreaming: true,
      originalText,
      diffState: originalText ? 'pending' : undefined,
      blockId,
      reasoningTrace: [], // pipeline 결과가 오면 채워짐
      finalAnswer: undefined,
      reasoningStatus: undefined,
    }

    currentAssistantIdRef.current = assistantId
    // Reset sanitizer and raw buffer for this new generation session
    sanitizerRef.current = new StreamingSanitizer()
    rawAccumRef.current = ''
    setMessages(prev => [...prev, userMsg, assistantMsg])
    if (codeModelUsed) {
      const modelNameOnly = finalSettings.modelPath.split(/[\\/]/).pop()
      setEngineLogs(prev => prev + `[System] 코딩 요청이 감지되었습니다. 코딩 특화 모델(${modelNameOnly})로 전환하여 응답을 생성합니다.\n`)
    }
    setIsGenerating(true)
    setStreamingText('')

    const sessId = crypto.randomUUID()
    currentSessionIdRef.current = sessId

    // [FIX-IPC-001] 기존 세션 리스너가 살아있다면 해제 처리
    if (unsubTokenRef.current) { unsubTokenRef.current(); unsubTokenRef.current = null }
    if (unsubDoneRef.current) { unsubDoneRef.current(); unsubDoneRef.current = null }

    if (window.electronAPI) {
      let lastRenderTime = 0
      let pendingTokenUpdate = false

      const updateUIState = (targetSessId: string) => {
        if (targetSessId !== currentSessionIdRef.current) return
        const currentAccum = rawAccumRef.current
        setStreamingText(currentAccum)

        if (currentAssistantIdRef.current) {
          const safeText = sanitizerRef.current.getSafeOutput()
          const thinkingText = sanitizerRef.current.getThinkingBuffer()

          setMessages(prev => prev.map(m => {
            if (m.id !== currentAssistantIdRef.current) return m

            const liveTrace: ReasoningTraceEvent[] = thinkingText
              ? [{
                  id: `trace_live_${m.id}`,
                  source: 'model' as const,
                  type: 'thinking' as const,
                  text: thinkingText,
                  model: 'streaming',
                  timestamp: new Date().toISOString(),
                }]
              : []

            return {
              ...m,
              content: safeText,
              isStreaming: true,
              reasoningTrace: liveTrace,
            }
          }))
        }
      }

      // 🎯 실시간 개별 세션 토큰 리스너 바인딩 (60ms 렌더링 스로틀링 탑재로 화면 깜빡임 차단)
      unsubTokenRef.current = window.electronAPI.onLLMToken(sessId, (token) => {
        if (sessId !== currentSessionIdRef.current) return // 타 세션 토큰 무시
        if (isAgentRunningRef.current) return

        rawAccumRef.current += token
        sanitizerRef.current.appendChunk(token)

        const now = Date.now()
        if (now - lastRenderTime > 60) {
          lastRenderTime = now
          updateUIState(sessId)
        } else {
          if (!pendingTokenUpdate) {
            pendingTokenUpdate = true
            setTimeout(() => {
              pendingTokenUpdate = false
              lastRenderTime = Date.now()
              updateUIState(sessId)
            }, 60)
          }
        }
      })

      // 🎯 실시간 개별 세션 완료 리스너 바인딩
      unsubDoneRef.current = window.electronAPI.onLLMDone(sessId, (data) => {
        if (sessId !== currentSessionIdRef.current) return
        
        setIsGenerating(false)
        setStreamingText('')

        const sanitizeResult = sanitizerRef.current.finalize()
        const rawForEdit = rawAccumRef.current
        const targetId = currentAssistantIdRef.current

        setMessages(prev => {
          let updated = false
          const next = prev.map(m => {
            if (targetId && m.id === targetId) {
              updated = true

              const isAbortError = !data.success && (
                data.error === '사용자에 의해 중단됨' ||
                data.error === 'Aborted' ||
                data.error?.includes('중단')
              )

              let cleanContent: string
              if (!data.success) {
                cleanContent = isAbortError
                  ? (sanitizeResult.finalContent.trim() || m.content || '사용자가 답변을 중단했습니다')
                  : (data.error || '오류가 발생했습니다.')
              } else {
                cleanContent = sanitizeResult.finalContent
              }

              const finalTrace: ReasoningTraceEvent[] = sanitizeResult.thinkingContent
                ? [{
                    id: `trace_final_${m.id}`,
                    source: 'model' as const,
                    type: 'thinking' as const,
                    text: sanitizeResult.thinkingContent,
                    model: 'streaming',
                    timestamp: new Date().toISOString(),
                  }]
                : (m.reasoningTrace ?? [])

              let blockId = m.blockId
              let originalText = m.originalText
              let proposedText = cleanContent
              let insertSuggestion: InsertSuggestion | undefined

              // EDIT_SUGGESTION 파싱
              const editMatch = rawForEdit.match(/\[EDIT_SUGGESTION:\s*([a-zA-Z0-9_\-]+)\](?:\r?\n)?([\s\S]*)/i)
              if (editMatch && data.success) {
                blockId = editMatch[1]
                proposedText = editMatch[2].trim()
                cleanContent = cleanContent
                  .replace(/\[EDIT_SUGGESTION:\s*[a-zA-Z0-9_\-]+\](?:\r?\n)?[\s\S]*/i, '')
                  .trim()

                if (editorRef.current) {
                  try {
                    const block = editorRef.current.getBlock(blockId)
                    if (block) {
                      if (block.type === 'jupyter') {
                        originalText = block.props?.code || ''
                      } else if (Array.isArray(block.content)) {
                        originalText = block.content.map((c: any) => c.text || '').join('')
                      } else {
                        originalText = String(block.content || '')
                      }
                    }
                  } catch (e) {
                    console.warn('에디터 블록 조회 실패:', e)
                  }
                }
              }

              // 다중 INSERT_SUGGESTION 파싱
              let insertSuggestions: InsertSuggestion[] = []
              if (!editMatch && data.success) {
                const tagRegex = /\[INSERT_SUGGESTION:\s*afterBlockId=([^,\]]+),\s*type=(\w+)(?:,\s*level=(\d))?\]/gi
                let match;
                const parsedMatches: any[] = []

                while ((match = tagRegex.exec(rawForEdit)) !== null) {
                  parsedMatches.push({
                    tag: match[0],
                    afterBlockIdRaw: match[1].trim(),
                    typeRaw: match[2].trim().toLowerCase(),
                    level: match[3] ? (parseInt(match[3]) as 1 | 2 | 3) : undefined,
                    startIndex: match.index,
                    endIndex: tagRegex.lastIndex
                  })
                }

                if (parsedMatches.length > 0) {
                  const firstTagIdx = parsedMatches[0].startIndex
                  const preTagText = rawForEdit.slice(0, firstTagIdx).trim()
                  const reasonText = preTagText
                    .replace(/<\/?(thinking|reasoning|thought|though|think)\s*>/gi, '')
                    .replace(/^지금 요청은[^\n]*\n?/m, '')
                    .replace(/^컨텍스트의 블록[^\n]*\n?/m, '')
                    .trim()

                  cleanContent = sanitizeResult.finalContent
                    .replace(/\[INSERT_SUGGESTION:[^\]]*\]?(?:\r?\n)?[\s\S]*/i, '')
                    .trim()

                  let siblingBlockIds: string[] = []
                  if (editorRef.current) {
                    try {
                      const flatBlocks = (function flatten(blocks: any[]): any[] {
                        return blocks.flatMap((b: any) => [b, ...flatten(b.children || [])])
                      })(editorRef.current.document || [])
                      siblingBlockIds = flatBlocks.map((b: any) => b.id)
                    } catch {}
                  }

                  for (let i = 0; i < parsedMatches.length; i++) {
                    const curr = parsedMatches[i]
                    const nextStart = (i + 1 < parsedMatches.length) ? parsedMatches[i + 1].startIndex : rawForEdit.length
                    const insertContent = rawForEdit.slice(curr.endIndex, nextStart).trim()

                    let afterBlockId = curr.afterBlockIdRaw
                    if (!afterBlockId || afterBlockId === '...' || afterBlockId === 'undefined') {
                      afterBlockId = 'END'
                    }

                    const validTypes = ['heading', 'paragraph', 'bulletListItem', 'numberedListItem', 'table']
                    const blockType = validTypes.includes(curr.typeRaw) ? curr.typeRaw as InsertSuggestion['blockType'] : 'paragraph'

                    let siblingIndex = siblingBlockIds.length - 1
                    const foundIdx = siblingBlockIds.indexOf(afterBlockId)
                    if (foundIdx >= 0) {
                      siblingIndex = foundIdx
                    }

                    insertSuggestions.push({
                      afterBlockId,
                      blockType,
                      level: curr.level,
                      content: insertContent,
                      reasonText: reasonText || undefined,
                      status: 'pending',
                      siblingBlockIds,
                      siblingIndex,
                    })
                  }
                } else {
                  cleanContent = cleanContent
                    .replace(/\[INSERT_SUGGESTION:[^\]]*\]?(?:\r?\n)?[\s\S]*/i, '')
                    .trim()
                }
              }

              if (data.success && cleanContent) {
                cleanContent = cleanContent
                  .replace(/^\[(WRITE|EDIT|CHAT|SUMMARY)\]\s*/i, '')
                  .replace(/^현재 작업 모드:.*\n?/m, '')
                  .replace(/^지금 요청은.*\n?/m, '')
                  .trim()
              }

              return {
                ...m,
                isStreaming: false,
                error: !data.success && !isAbortError,
                aborted: isAbortError || m.aborted,
                content: cleanContent,
                finalAnswer: data.success ? sanitizeResult.finalContent : undefined,
                reasoningTrace: finalTrace,
                reasoningStatus: sanitizeResult.hadInternalTags ? 'ok' : m.reasoningStatus,
                proposedText: data.success || (isAbortError && cleanContent.trim())
                  ? (editMatch ? proposedText : cleanContent)
                  : undefined,
                originalText: data.success || (isAbortError && cleanContent.trim())
                  ? (editMatch ? originalText : m.originalText)
                  : undefined,
                diffState: (editMatch && data.success) ? 'pending' : m.diffState, // [BUG FIX] espontaneously 생성된 에디터 수정 제안의 상태를 대기로 설정
                blockId,
                insertSuggestion: data.success ? insertSuggestions[0] : undefined,
                insertSuggestions: data.success ? insertSuggestions : undefined,
              }
            }
            return m
          })

          if (!updated && next.length > 0 && next[next.length - 1].role === 'assistant') {
            const lastIdx = next.length - 1
            const lastMsg = next[lastIdx]

            const isAbortError = !data.success && (
              data.error === '사용자에 의해 중단됨' ||
              data.error === 'Aborted' ||
              data.error?.includes('중단')
            )

            let cleanContent: string
            if (!data.success) {
              cleanContent = isAbortError
                ? (sanitizeResult.finalContent.trim() || lastMsg.content || '사용자가 답변을 중단했습니다')
                : (data.error || '오류가 발생했습니다.')
            } else {
              cleanContent = sanitizeResult.finalContent
            }

            const finalTrace: ReasoningTraceEvent[] = sanitizeResult.thinkingContent
              ? [{
                  id: `trace_final_${lastMsg.id}`,
                  source: 'model' as const,
                  type: 'thinking' as const,
                  text: sanitizeResult.thinkingContent,
                  model: 'streaming',
                  timestamp: new Date().toISOString(),
                }]
              : (lastMsg.reasoningTrace ?? [])

            next[lastIdx] = {
              ...lastMsg,
              isStreaming: false,
              error: !data.success && !isAbortError,
              aborted: isAbortError || lastMsg.aborted,
              content: cleanContent,
              finalAnswer: data.success ? sanitizeResult.finalContent : undefined,
              reasoningTrace: finalTrace,
              reasoningStatus: sanitizeResult.hadInternalTags ? 'ok' : lastMsg.reasoningStatus,
              proposedText: data.success || (isAbortError && cleanContent.trim()) ? cleanContent : undefined,
            }
          }
          return next
        })

        // 🦾 [Auto-Apply] taggedBlocks 연동 에디터 자동 반영 기전
        if (data.success && editorRef.current) {
          try {
            const finalAnswerText = sanitizeResult.finalContent

            // 수정 제안 파싱
            const editMatch = finalAnswerText.match(/\[EDIT_SUGGESTION:\s*([a-zA-Z0-9_\-]+)\](?:\r?\n)?([\s\S]*)/i)
            
            // 다중 삽입 제안 파싱
            let insertSuggestions: any[] = []
            if (!editMatch) {
              const tagRegex = /\[INSERT_SUGGESTION:\s*afterBlockId=([^,\]]+),\s*type=(\w+)(?:,\s*level=(\d))?\]/gi
              let match;
              const parsedMatches: any[] = []

              while ((match = tagRegex.exec(finalAnswerText)) !== null) {
                parsedMatches.push({
                  tag: match[0],
                  afterBlockIdRaw: match[1].trim(),
                  typeRaw: match[2].trim().toLowerCase(),
                  level: match[3] ? (parseInt(match[3]) as 1 | 2 | 3) : undefined,
                  startIndex: match.index,
                  endIndex: tagRegex.lastIndex
                })
              }

              if (parsedMatches.length > 0) {
                for (let i = 0; i < parsedMatches.length; i++) {
                  const curr = parsedMatches[i]
                  const nextStart = (i + 1 < parsedMatches.length) ? parsedMatches[i + 1].startIndex : finalAnswerText.length
                  const insertContent = finalAnswerText.slice(curr.endIndex, nextStart).trim()

                  let afterBlockId = curr.afterBlockIdRaw
                  if (!afterBlockId || afterBlockId === '...' || afterBlockId === 'undefined') {
                    afterBlockId = 'END'
                  }

                  const validTypes = ['heading', 'paragraph', 'bulletListItem', 'numberedListItem', 'table', 'jupyter', 'drawing']
                  const blockType = validTypes.includes(curr.typeRaw) ? curr.typeRaw : 'paragraph'

                  insertSuggestions.push({
                    afterBlockId,
                    blockType,
                    level: curr.level,
                    content: insertContent
                  })
                }
              }
            }

            // 1. EDIT_SUGGESTION 자동 반영
            if (editMatch) {
              const targetBlockId = editMatch[1]
              const targetProposed = editMatch[2].trim()
              const block = editorRef.current.getBlock(targetBlockId)
              if (block) {
                if (block.type === 'jupyter') {
                  editorRef.current.updateBlock(targetBlockId, {
                    type: 'jupyter',
                    props: { ...block.props, code: targetProposed }
                  })
                } else {
                  editorRef.current.updateBlock(targetBlockId, {
                    content: [{ type: 'text', text: targetProposed, styles: {} }] // [BUG FIX] BlockNote 규격에 맞춰 문자열을 인라인 객체 배열로 감싸 전달
                  })
                }
                console.log(`[useAI] [Auto-Apply] 블록 ${targetBlockId} 수정안 자동 반영 성공!`)
              }
            }
            // 2. INSERT_SUGGESTION 자동 반영
            else if (insertSuggestions.length > 0) {
              insertSuggestions.forEach(s => {
                if (s.afterBlockId && s.afterBlockId !== 'undefined') {
                  try {
                    editorRef.current.insertBlocks(
                      [{
                        type: s.blockType === 'heading' ? 'heading' : 'paragraph',
                        props: s.level ? { level: s.level } : undefined,
                        content: [{ type: 'text', text: s.content, styles: {} }] // [BUG FIX] BlockNote 규격에 맞춰 문자열을 인라인 객체 배열로 감싸 전달
                      }],
                      s.afterBlockId,
                      'after'
                    )
                    console.log(`[useAI] [Auto-Apply] 블록 ${s.afterBlockId} 뒤에 자동 삽입 성공!`)
                  } catch (insErr) {
                    console.warn('[useAI] 자동 삽입 실패:', insErr)
                  }
                }
              })
            }
            // 3. 폴백: taggedBlocks가 있고, 일반 쓰기(WRITE)/수정(EDIT) 매칭 시 첫 번째 태그된 블록 자동 수정 또는 교체
            else if (taggedBlocks && taggedBlocks.length > 0 && (intent === 'EDIT' || intent === 'WRITE')) {
              const firstBlock = taggedBlocks[0]
              const block = editorRef.current.getBlock(firstBlock.id)
              if (block) {
                const finalClean = sanitizeResult.finalContent
                  .replace(/^\[(WRITE|EDIT|CHAT|SUMMARY)\]\s*/i, '')
                  .trim()
                if (block.type === 'jupyter') {
                  editorRef.current.updateBlock(firstBlock.id, {
                    type: 'jupyter',
                    props: { ...block.props, code: finalClean }
                  })
                } else {
                  editorRef.current.updateBlock(firstBlock.id, {
                    content: [{ type: 'text', text: finalClean, styles: {} }] // [BUG FIX] BlockNote 규격에 맞춰 문자열을 인라인 객체 배열로 감싸 전달
                  })
                }
                console.log(`[useAI] [Auto-Apply] 태그된 블록 ${firstBlock.id}에 텍스트 자동 반영 성공!`)
              }
            }
          } catch (autoApplyErr) {
            console.error('[useAI] Auto-Apply 적용 중 에러:', autoApplyErr)
          }
        }

        // 세션 리스너 자동 해제
        if (unsubTokenRef.current) { unsubTokenRef.current(); unsubTokenRef.current = null }
        if (unsubDoneRef.current) { unsubDoneRef.current(); unsubDoneRef.current = null }

        // [BUG FIX] 만약 EDIT_SUGGESTION 이나 INSERT_SUGGESTION 같은 사용자 승인이 필요한 제안이 있다면
        // 승인이 완료될 때까지 다음 큐를 기동하지 않는다.
        const hasEditMatch = rawForEdit.match(/\[EDIT_SUGGESTION:\s*([a-zA-Z0-9_\-]+)\](?:\r?\n)?([\s\S]*)/i)
        let hasInsertSuggestion = false
        if (!hasEditMatch && data.success) {
          const tagRegex = /\[INSERT_SUGGESTION:\s*afterBlockId=([^,\]]+),\s*type=(\w+)(?:,\s*level=(\d))?\]/gi
          hasInsertSuggestion = tagRegex.test(rawForEdit)
        }
        const hasPendingDecision = data.success && (!!hasEditMatch || hasInsertSuggestion)

        if (!hasPendingDecision) {
          setTimeout(() => checkAndProcessNextQueue(), 80) // [SaaS 큐] 대기 결정이 없으면 완료 시 즉시 다음 항목 기동
        }
      })
    }

    // 🎯 로컬 소형 모델 시간 왜곡 방지 및 유동적인 날짜 추론을 위한 동적 시스템 시간 정보 수집/주입
    const sysDate = new Date()
    const sysYear = sysDate.getFullYear()
    const sysMonth = sysDate.getMonth() + 1
    const sysDay = sysDate.getDate()
    let dynamicSystemPrompt = `${finalSettings.systemPrompt}\n\n` +
      `[System Time Info]\n` +
      `- 현재 시스템 날짜: ${sysYear}년 ${sysMonth}월 ${sysDay}일\n` +
      `- 지침: 사용자가 과거 시점(예: 2025년 트렌드, 2024년 통계 등)을 명시하여 요청할 경우 반드시 사용자가 지정한 연도의 데이터와 맥락에 맞추어 답변하십시오. ` +
      `반면, 구체적인 시점 지정 없이 '요즘', '현재', '최신 트렌드'를 작성해달라고 요청하는 경우에는 반드시 현재 시스템 기준 연도(${sysYear}년)를 기반으로 작성하십시오.`

    // 🤖 본문 문서 내용이 실제로 비어있는 상황(Empty Editor Context)에 대한 가드 지침 추가
    const isContextEmpty = !context || context.trim() === '' || context.trim() === '[]'
    if (isContextEmpty) {
      dynamicSystemPrompt = `[⚠️ 초강력 절대 지침: 빈 에디터 대응 정책]\n` +
        `현재 에디터 문서의 내용이 완전히 비어 있습니다. ` +
        `본문 재료가 없는 상태이므로, 마음대로 가상의 내용을 창작하여 에디터에 삽입하거나 수정 제안(INSERT_SUGGESTION/EDIT_SUGGESTION)을 하지 마십시오. ` +
        `사용자에게 "현재 문서가 비어 있어 해당 작업을 수행할 수 없으니 텍스트를 먼저 입력해 주세요"라고 친절히 안내하십시오.\n\n` +
        dynamicSystemPrompt
    }

    // 🤖 참조된 본문 블록(태그) 컨텍스트 주입
    if (taggedBlocks && taggedBlocks.length > 0) {
      const referencedContent = taggedBlocks.map((b, i) => `[참조 블록 ${i+1}] (ID: ${b.id}): "${b.text}"`).join('\n')
      dynamicSystemPrompt = `[⚠️ 초강력 절대 지침: 참조 본문 우선순위]\n` +
        `현재 사용자가 문서 본문에서 특정 영역을 마우스 블록 지정하거나 별표 버튼을 눌러 아래의 본문 구절들(Reference)을 특별히 지정하여 태깅했습니다:\n` +
        `${referencedContent}\n\n` +
        `AI는 에디터 문서 전체 내용(Context)이 주어지더라도 이를 절대 요약/수정 대상으로 삼아서는 안 됩니다. ` +
        `반드시 위에 명시된 [참조 블록]들의 텍스트만을 유일한 분석, 수정, 요약 대상으로 한정하십시오. ` +
        `예를 들어, 사용자가 "요약해줘"라고 하면 전체 문서가 아닌 오직 위의 [참조 블록] 텍스트들만 요약하고, ` +
        `"수정해줘"라고 하면 오직 위의 [참조 블록] 내용만 대상으로 삼아 [EDIT_SUGGESTION]을 작성해야 합니다. ` +
        `수정 제안(EDIT_SUGGESTION)을 보낼 때 참조 블록의 ID 중 알맞은 ID를 명확하게 매칭하여 태그로 돌려주어야 합니다.\n\n` +
        `[⚠️ 초강력 절대 지침: 수정 텍스트 정제 규격]\n` +
        `문서를 수정할 때, 사용자가 지시한 명령조 문구(예: "~로 수정 ㄱ", "수정해줘", "바꿔줘", "~라고 고쳐", "~라고 수정")를 절대 수정 결과 텍스트 자체에 포함하지 마십시오.\n` +
        `반드시 사용자가 의도한 "수정 후 완성될 깔끔한 최종 본문 문장/단어 자체"만을 정제하여 수정안으로 제시해야 합니다.\n` +
        `예를 들어, "주요기능말고 주요주요로 수정 ㄱ" 라고 요청받았고 대상 텍스트가 "주요 기능"이라면, 수정안 텍스트는 오직 "주요주요" 또는 완결된 문장이어야 하지 "주요주요로 수정"이나 "수정 ㄱ" 같은 지시어가 포함되어서는 절대 안 됩니다.\n\n` +
        dynamicSystemPrompt
    }

    // 🤖 멀티턴 연쇄 작명 지침 추가
    dynamicSystemPrompt += `\n\n[⚠️ 멀티턴 연쇄 작명 지침]\n` +
      `만약 사용자가 "이걸 제목으로 지어줘", "제목 지어줘", "제목으로 정제해줘" 등 이전 대화 및 검색 결과에 대한 작명(Title Generation)을 요구하는 경우:\n` +
      `- 절대 에디터 문서 맨 앞에 삽입 제안([INSERT_SUGGESTION])을 함부로 띄우지 마십시오. 사용자가 명시적으로 문서에 "넣어줘"라고 지시하기 전까지는 일반 대화 답변으로 제목 후보들(예: 3~4개 테마별 제목 안)을 멋지게 추천하여 보여주고, 그 제목들이 왜 좋은지 이전 검색 결과를 근거로 설명하십시오.\n` +
      `- 만약 사용자가 에디터의 특정 블록을 태그하고 "이걸 제목으로 바꿔줘"라고 요청한 상태라면, 당연히 그 블록 ID에 맞추어 깔끔한 정제 제목으로 [EDIT_SUGGESTION]을 제안하십시오.`

    // 🤖 주식 쿼리 및 HTML 카드 렌더링에 관한 강력 지침 주입
    dynamicSystemPrompt += `\n\n[⚠️ 초강력 절대 지침: Stock Query Tool & HTML Card Rendering]\n` +
      `만약 사용자가 주식 시세나 주가를 물어보고 이를 "본문에 요약/삽입/추가"해 달라고 하는 경우:\n` +
      `1. 절대 일반 'web_search'를 쓰지 말고, 반드시 'query_stock_info' 도구를 최우선 호출하여 정확한 종목 시세 정보를 획득하십시오.\n` +
      `2. 획득한 주가 데이터(회사명, 주가, 변동액, 변동률, 전일가, 고가, 거래량, 외인비중 등)를 기반으로, 에디터 본문에 삽입될 아름답고 세련된 주식 시세 요약 카드 HTML/CSS 코드를 작성하십시오.\n` +
      `3. 이 HTML 코드는 반드시 아래와 같은 jupyter HTML 셀 규격으로 [INSERT_SUGGESTION]을 제안하여 본문에 삽입되게 만들어야 합니다. (language는 html이어야 함)\n` +
      `4. 주가 수집과 에디터 삽입([INSERT_SUGGESTION]) 처리가 모두 끝났다면, 최종 마크다운 답변으로 절대 다른 부연 설명을 지어내지 말고 오직 아래의 알림 문장 템플릿만을 유일한 최종 답변으로 출력하여 챗봇창에 보여주십시오. (회사명, 종목코드에 실제 값을 채워넣으십시오)\n` +
      `5. 만약 'query_stock_info' 도구 실행 결과가 에러(Observation: Failed to fetch 등)로 실패하였거나 주가 데이터를 정상적으로 가져오지 못한 경우, 절대 파이썬 코드 실행이나 임의의 기억력/상상력으로 가상의 주가(예: 258000원 등)를 가공하여 답변하지 마십시오. 즉각 주가 수집 실패 사실과 원인을 사용자에게 정직하게 오류 알림 메시지로 출력하십시오.\n\n` +
      `최종 답변 알림 템플릿 규격:\n` +
      `✔ **MCP 데이터 연동 완료**\n` +
      `{회사명}({종목코드})의 실시간 주가 데이터 수집을 성공했습니다. **Stock Query Tool (MCP)**을 통해 최신 시세와 변동률 대시보드 표를 가상 에디터 본문에 즉시 동적으로 생성해 두었습니다!\n\n` +
      `예시 규격 (이 디자인을 그대로 따르되 실제 획득한 수치와 상승/하락 여부에 맞추어 화살표(▲/▼), 색상(상승은 #22c55e/녹색테마 #f0fdf4, 하락은 #ef4444/적색테마 #fef2f2)을 정확히 변경하십시오):\n` +
      `[INSERT_SUGGESTION: afterBlockId=START, type=jupyter]\n` +
      `//# [AMEVA_LANG:html]\n` +
      `<div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 20px; color: #1e293b; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: relative; max-width: 580px; box-sizing: border-box;">\n` +
      `  <div style="position: absolute; top: 16px; right: 16px; background: #22c55e; color: white; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">\n` +
      `    <span>⚡ MCP Live</span>\n` +
      `  </div>\n` +
      `  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">\n` +
      `    <span style="font-size: 14px; font-weight: bold; color: #15803d;">📈 {회사명} ({종목코드}) 시세 정보</span>\n` +
      `  </div>\n` +
      `  <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px;">\n` +
      `    <span style="font-size: 28px; font-weight: 800; color: #0f172a;">{현재가}</span>\n` +
      `    <span style="font-size: 14px; font-weight: bold; color: #22c55e;">{변동액} ({변동률})</span>\n` +
      `  </div>\n` +
      `  <div style="width: 100%; height: 1px; background: #e2e8f0; margin-bottom: 12px;"></div>\n` +
      `  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; color: #475569;">\n` +
      `    <div>전일가: <strong style="color: #1e293b;">{전일가}</strong></div>\n` +
      `    <div>고가: <strong style="color: #1e293b;">{고가}</strong></div>\n` +
      `    <div>거래량: <strong style="color: #1e293b;">{거래량}</strong></div>\n` +
      `    <div>외인비중: <strong style="color: #1e293b;">{외인비중}</strong></div>\n` +
      `  </div>\n` +
      `</div>`

    const codeRestriction = isCodingRequest 
      ? `\n[💡 코딩 지침] 사용자가 코드 또는 프로그래밍 구현을 요청했으므로, 필요한 JavaScript, HTML, CSS 등의 코드 및 설명 예시를 상세히 작성하여 제공하십시오.`
      : `\n코드나 프로그래밍 예시는 절대 출력하지 마십시오.`

    if (intent === 'WRITE') {
      dynamicSystemPrompt += `\n\n지금 요청은 새로운 내용을 문서에 추가하는 작업입니다.\n컨텍스트의 블록 목록을 분석하여 가장 적절한 삽입 위치를 결정하십시오.\n왜 그 위치를 선택했는지 한 문장으로 설명한 뒤, 답변 맨 끝에 반드시 다음 태그를 추가하십시오:\n[INSERT_SUGGESTION: afterBlockId=..., type=..., level=...]\n삽입할 내용\n${codeRestriction}`
    } else if (intent === 'EDIT') {
      dynamicSystemPrompt += `\n\n지금 요청은 문서의 기존 내용을 수정하는 작업입니다.\n수정 이유를 한 문장으로 설명한 뒤, 수정한 내용을 제공할 때 **반드시 다음 형식을 엄격히 지켜서** 출력하십시오:\n\n[EDIT_SUGGESTION: 블록ID]\n여기에 깔끔하게 정제된 수정 결과문을 작성하세요.\n\n주의: 수정한 텍스트는 반드시 위 태그의 아래에 위치해야 하며, 태그를 맨 끝에 적으면 안 됩니다.\n${codeRestriction}`
    } else if (intent === 'SUMMARY') {
      dynamicSystemPrompt += `\n\n지금 요청은 문서 요약 작업입니다. 만약 사용자가 지정하여 태깅한 [참조 블록]들이 있다면, 절대 문서 전체를 요약하지 말고 오직 해당 [참조 블록]들의 내용만을 요약하십시오. 3~5줄로 간결하게 요약하십시오.\n${codeRestriction}`
    } else {
      dynamicSystemPrompt += `\n\n지금은 일반 질문 또는 이전 검색 결과에 대한 연쇄 질의입니다. 이전 대화 기록을 참고하여 사용자의 의도에 맞게 간결하고 명확하게 답변하십시오. 만약 제목 추천 요청인 경우 근사한 제목 후보들을 리스트로 추천하십시오.\n${codeRestriction}`
    }

    // 최근 5개 대화쌍 (최대 10개 메시지)의 내역을 백엔드로 전달하기 위해 매핑
    const historyPayload = messages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.finalAnswer ?? m.content
    }))

    // 🤖 에이전트 구동이 필요한 질문 감지 (검색, 파이썬 실행, 파일 연동 등)
    // 문서 삽입(WRITE)이나 수정(EDIT) 중이더라도 검색/실행 키워드가 있으면 에이전트가 도구를 사용해 최종 결과를 도출하도록 유도
    const agentKeywords = ['검색', '찾아줘', '구글', '네이버', '실행', '파이썬', '계산', 'search', 'run', '주가', '주식', '시세', 'stock']
    const needsAgent = agentKeywords.some(k => userMessage.toLowerCase().includes(k))

    if (needsAgent) {
      isAgentRunningRef.current = true
      
      if (window.electronAPI?.llmAddLog) {
        window.electronAPI.llmAddLog({ text: 'Initializing LangChain ReAct Agent Executor...', prefix: 'langchain' })
        window.electronAPI.llmAddLog({ text: '에이전트 모드가 활성화되었습니다. 도구 바인딩 및 ReAct 루프를 기동합니다.', prefix: 'ReAct' })
      } else {
        setEngineLogs(prev => prev + `\n[System] 에이전트 모드가 감지되었습니다. 도구 바인딩 및 ReAct 루프를 기동합니다...\n`)
      }
      
      let agentHasPendingDecision = false
      try {
        const agent = new AgentEngine({
          providerType: finalSettings.apiType === 'ollama' ? 'ollama' : 'llama.cpp',
          endpointUrl: finalSettings.apiType === 'ollama' ? 'http://localhost:11434' : 'http://localhost:12345',
          modelName: finalSettings.modelPath,
          temperature: 0.1,
          maxTurns: 5
        }, sessId) // [FIX-IPC-001] 세션 격리 ID 바인딩

        // 🦾 [BM-MARKETPLACE] 마켓플레이스 플러그인 온오프 조건 동적 파싱
        let enabledPlugins: Record<string, boolean> = { webSearch: true, pythonConsole: true }
        try {
          const storedPlugins = localStorage.getItem('enabled-plugins')
          if (storedPlugins) {
            enabledPlugins = JSON.parse(storedPlugins)
          }
        } catch {}

        if (enabledPlugins.webSearch) {
          if (window.electronAPI?.llmAddLog) {
            window.electronAPI.llmAddLog({ text: '- [Marketplace Plugin] 웹검색 도구 (ON)', prefix: 'ReAct' })
          } else {
            setEngineLogs(prev => prev + `  - [Marketplace Plugin] 웹검색 도구 (ON)\n`)
          }
        } else {
          agent.unregisterTool('web_search')
          if (window.electronAPI?.llmAddLog) {
            window.electronAPI.llmAddLog({ text: '- [Marketplace Plugin] 웹검색 도구 (OFF - 마켓플레이스 플러그인 제한)', prefix: 'ReAct' })
          } else {
            setEngineLogs(prev => prev + `  - [Marketplace Plugin] 웹검색 도구 (OFF - 마켓플레이스 플러그인 제한)\n`)
          }
        }

        if (enabledPlugins.pythonConsole) {
          if (window.electronAPI?.llmAddLog) {
            window.electronAPI.llmAddLog({ text: '- [Marketplace Plugin] 파이썬 콘솔 도구 (ON)', prefix: 'ReAct' })
          } else {
            setEngineLogs(prev => prev + `  - [Marketplace Plugin] 파이썬 콘솔 도구 (ON)\n`)
          }
        } else {
          agent.unregisterTool('run_python')
          if (window.electronAPI?.llmAddLog) {
            window.electronAPI.llmAddLog({ text: '- [Marketplace Plugin] 파이썬 콘솔 도구 (OFF - 마켓플레이스 플러그인 제한)', prefix: 'ReAct' })
          } else {
            setEngineLogs(prev => prev + `  - [Marketplace Plugin] 파이썬 콘솔 도구 (OFF - 마켓플레이스 플러그인 제한)\n`)
          }
        }

        // 🦾 [Stock-MCP Hard-wire] 실시간 주식 쿼리 MCP 도구를 에이전트에 명시적으로 항상 직접 바인딩
        try {
          agent.registerTool({
            name: "query_stock_info",
            description: "지정한 회사명(예: 삼성전자, 현대차) 또는 6자리 주식 기호(예: 005930)를 입력받아 실시간 시세, 거래량, 변동액, 외인비중 등 상세 정보를 실시간 쿼리하여 반환합니다.",
            parameters: {
              type: "object",
              properties: {
                stockCode: { type: "string", description: "회사명 또는 6자리 주식 기호 (예: 삼성전자, 005930)" }
              },
              required: ["stockCode"]
            },
            execute: async (args) => {
              // mcp-wasm-gateway HTTP 채널을 통해 동기식 호출
              const res = await MCPClientManager.callTool('mcp-wasm-gateway', 'query_stock_info', args)
              return {
                success: res.success,
                result: res.result,
                error: res.error
              }
            }
          })
          if (window.electronAPI?.llmAddLog) {
            window.electronAPI.llmAddLog({ text: '- [System] 실시간 주식 MCP 툴 (query_stock_info) 명시적 강제 연동 완료.', prefix: 'ReAct' })
          } else {
            setEngineLogs(prev => prev + `  - [System] 실시간 주식 MCP 툴 (query_stock_info) 명시적 강제 연동 완료.\n`)
          }
        } catch (stErr) {
          console.warn('[useAI] 주식 MCP 바인딩 오류:', stErr)
        }

        // [FIX-MCP-001] 활성 상태인 외부 MCP 서버들의 도구 동적 주입 및 에이전트 바인딩
        try {
          const mcpTools = await MCPClientManager.fetchAllTools()
          for (const tool of mcpTools) {
            agent.registerTool({
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema as any,
              execute: async (args) => {
                const res = await MCPClientManager.callTool(tool.serverId, tool.name, args)
                return {
                  success: res.success,
                  result: res.result,
                  error: res.error
                }
              }
            })
          }
          if (mcpTools.length > 0) {
            if (window.electronAPI?.llmAddLog) {
              window.electronAPI.llmAddLog({ text: `- [System] MCP 도구 ${mcpTools.length}개 연동 완료.`, prefix: 'ReAct' })
            } else {
              setEngineLogs(prev => prev + `  - [System] MCP 도구 ${mcpTools.length}개 연동 완료.\n`)
            }
          }
        } catch (e: any) {
          console.warn('[useAI] MCP 도구 바인딩 오류:', e)
        }

        // 실시간 터미널 로그 스트리밍을 연동하여 ReAct 과정을 CLI 패널 및 채팅 말풍선에 실시간으로 반영
        let accumulatedLogs = ''
        let agentQuery = userMessage
        
        // 에이전트에게 이전 대화 내역(최대 10개 메시지)을 전달하여 멀티턴 맥락 유지
        if (historyPayload && historyPayload.length > 0) {
          const formattedHistory = historyPayload
            .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
            .join('\n')
          agentQuery = `[이전 대화 내역]\n${formattedHistory}\n\n[현재 사용자 질의]: ${userMessage}`
        }

        if (taggedBlocks && taggedBlocks.length > 0) {
          const referencedContent = taggedBlocks.map((b, i) => `[참조 ${i+1}] ID ${b.id}: "${b.text}"`).join('\n')
          agentQuery = `[참조 본문]\n${referencedContent}\n\n${agentQuery}`
        }
        const agentMildPrompt = `당신은 사용자 대신 실시간 주가 정보를 획득하는 전문 MCP 에이전트입니다.
사용자가 주가 정보나 시세를 물어보면, 절대 일반 검색을 돌리지 말고 반드시 'query_stock_info' 도구를 최우선 호출하여 실시간 수치를 획득하십시오.
도구 호출이 완료되면 그 결과를 기반으로 최종 답변(Final Answer)을 한두 문장으로 솔직하게 정리하여 제공하십시오. HTML 카드 조립이나 [INSERT_SUGGESTION] 태그 기재 등은 절대 하지 마십시오.`

        agentHasPendingDecision = false
        const agentResult = await agent.executeSession(agentQuery, (log) => {
          if (window.electronAPI?.llmAddLog) {
            window.electronAPI.llmAddLog({ text: log, prefix: 'ReAct' })
          } else {
            setEngineLogs(prev => prev + log)
          }
          accumulatedLogs += log

          setMessages(prev => prev.map(m => {
            if (m.id === assistantId) {
              let statusText = '🤖 에이전트 추론 루프 기동 중...'
              
              if (accumulatedLogs.includes('Action:')) {
                const lines = accumulatedLogs.split('\n')
                const actionLine = lines.find(l => l.includes('Action:'))
                if (actionLine) {
                  const actName = actionLine.replace(/Action:\s*/i, '').trim()
                  statusText = `⚙️ [도구 실행] 에이전트가 '${actName}' 도구를 기동하고 있습니다...`
                }
              } else if (accumulatedLogs.includes('[Thought]')) {
                const thoughtIdx = accumulatedLogs.lastIndexOf('[Thought]')
                const sub = accumulatedLogs.slice(thoughtIdx)
                const match = sub.match(/:\s*"([^"]+)"/)
                if (match) {
                  statusText = `🧠 [생각] "${match[1]}"`
                }
              } else if (accumulatedLogs.includes('Turn')) {
                const turnMatch = accumulatedLogs.match(/Turn\s*(\d+\/\d+)/)
                if (turnMatch) {
                  statusText = `▶ 에이전트 추론 진행 중 (단계 ${turnMatch[1]})...`
                }
              }

              return {
                ...m,
                content: '', // 본문은 어수선한 중복 출력 없이 조용히 대기
                isStreaming: true,
                reasoningTrace: [
                  {
                    id: `trace_agent_${m.id}_realtime`,
                    source: 'model',
                    type: 'thinking',
                    text: statusText,
                    model: finalSettings.modelPath || 'unknown',
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            }
            return m
          }))
        }, agentMildPrompt)

        if (agentResult.success && agentResult.finalAnswer) {
          const finalAnswer = agentResult.finalAnswer
          
          let blockId = ''
          let originalText = ''
          let proposedText = finalAnswer
          let insertSuggestions: InsertSuggestion[] = []
          let cleanContent = finalAnswer

          // 🦾 [Stock-Orchestration] 에이전트 실행 로그(accumulatedLogs)에서 query_stock_info 실행 결과 JSON을 파싱하여 동적으로 바인딩
          const stockLog = (accumulatedLogs + ' ' + finalAnswer)
          
          // Observation/실행 결과에 독립적으로 가장 먼저 매칭되는 유효한 주식 JSON 객체({ ... }) 검색
          let stockData: any = null
          const jsonRegex = /({[\s\S]*?})/g
          let match
          while ((match = jsonRegex.exec(stockLog)) !== null) {
            try {
              const parsed = JSON.parse(match[1].trim())
              if (parsed && parsed.name && parsed.price) {
                stockData = parsed
                break
              }
            } catch (e) {
              // 유효하지 않은 JSON 스킵 후 다음 객체 계속 검색
            }
          }

          // 만약 정식 JSON 파싱에 성공했다면 동적 바인딩 기동!
          if (stockData) {
            // 챗봇용 최종 연동 메시지 생성 (MCP 데이터 실시간 반영)
            cleanContent = `✔ **MCP 데이터 연동 완료**\n${stockData.name}(${stockData.code})의 실시간 주가 데이터 수집을 성공했습니다. **Stock Query Tool (MCP)**을 통해 최신 시세와 변동률 대시보드 표를 가상 에디터 본문에 즉시 동적으로 생성해 두었습니다!`
            proposedText = cleanContent

            // 에디터 삽입 위치 결정 (태깅된 블록이 있으면 사용, 없으면 START)
            const targetId = (taggedBlocks && taggedBlocks.length > 0) ? taggedBlocks[0].id : 'START'
            
            let siblingBlockIds: string[] = []
            if (editorRef.current) {
              try {
                const flatBlocks = (function flatten(blocks: any[]): any[] {
                  return blocks.flatMap((b: any) => [b, ...flatten(b.children || [])])
                })(editorRef.current.document || [])
                siblingBlockIds = flatBlocks.map((b: any) => b.id)
              } catch {}
            }

            // 등락 기호(▲ / ▼) 분석하여 상승/하락 테마를 동적으로 스위칭!
            const isUp = !String(stockData.change || '').includes('▼') && !String(stockData.pct || '').includes('-')
            const themeBg = isUp ? '#f0fdf4' : '#fef2f2'
            const themeBorder = isUp ? '#bbf7d0' : '#fecaca'
            const themeText = isUp ? '#15803d' : '#b91c1c'
            const themeAccent = isUp ? '#22c55e' : '#ef4444'

            const htmlCard = `//# [AMEVA_LANG:html]\n` +
              `<div style="background: ${themeBg}; border: 1.5px solid ${themeBorder}; border-radius: 12px; padding: 20px; color: #1e293b; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: relative; max-width: 580px; box-sizing: border-box;">\n` +
              `  <div style="position: absolute; top: 16px; right: 16px; background: ${themeAccent}; color: white; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">\n` +
              `    <span>⚡ MCP Live</span>\n` +
              `  </div>\n` +
              `  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">\n` +
              `    <span style="font-size: 14px; font-weight: bold; color: ${themeText};">📈 ${stockData.name} (${stockData.code}) 시세 정보</span>\n` +
              `  </div>\n` +
              `  <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px;">\n` +
              `    <span style="font-size: 28px; font-weight: 800; color: #0f172a;">${stockData.price}</span>\n` +
              `    <span style="font-size: 14px; font-weight: bold; color: ${themeAccent};">${stockData.change} (${stockData.pct})</span>\n` +
              `  </div>\n` +
              `  <div style="width: 100%; height: 1px; background: #e2e8f0; margin-bottom: 12px;"></div>\n` +
              `  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; color: #475569;">\n` +
              `    <div>전일가: <strong style="color: #1e293b;">${stockData.yesterday}</strong></div>\n` +
              `    <div>고가: <strong style="color: #1e293b;">${stockData.high}</strong></div>\n` +
              `    <div>거래량: <strong style="color: #1e293b;">${stockData.volume}</strong></div>\n` +
              `    <div>외인비중: <strong style="color: #1e293b;">${stockData.foreign}</strong></div>\n` +
              `  </div>\n` +
              `</div>`

            insertSuggestions.push({
              afterBlockId: targetId,
              blockType: 'paragraph',
              content: htmlCard,
              reasonText: cleanContent,
              status: 'pending',
              siblingBlockIds: siblingBlockIds.length > 0 ? siblingBlockIds : [targetId],
              siblingIndex: siblingBlockIds.indexOf(targetId) >= 0 ? siblingBlockIds.indexOf(targetId) : 0
            })
          } else {
            // 수정 제안 파싱
            const editMatch = finalAnswer.match(/\[EDIT_SUGGESTION:\s*([a-zA-Z0-9_\-]+)\](?:\r?\n)?([\s\S]*)/i)
            if (editMatch) {
              blockId = editMatch[1]
              proposedText = editMatch[2].trim()
              cleanContent = cleanContent.replace(/\[EDIT_SUGGESTION:\s*[a-zA-Z0-9_\-]+\](?:\r?\n)?[\s\S]*/i, '').trim()
              
              if (editorRef.current) {
                try {
                  const block = editorRef.current.getBlock(blockId)
                  if (block) {
                    if (block.type === 'jupyter') {
                      originalText = block.props?.code || ''
                    } else if (Array.isArray(block.content)) {
                      originalText = block.content.map((c: any) => c.text || '').join('')
                    } else {
                      originalText = String(block.content || '')
                    }
                  }
                } catch (e) {}
              }
            }

          // 다중 삽입 제안 파싱
          if (!editMatch) {
            const tagRegex = /\[INSERT_SUGGESTION:\s*afterBlockId=([^,\]]+),\s*type=(\w+)(?:,\s*level=(\d))?\]/gi
            let match;
            const parsedMatches: any[] = []

            while ((match = tagRegex.exec(finalAnswer)) !== null) {
              parsedMatches.push({
                tag: match[0],
                afterBlockIdRaw: match[1].trim(),
                typeRaw: match[2].trim().toLowerCase(),
                level: match[3] ? (parseInt(match[3]) as 1 | 2 | 3) : undefined,
                startIndex: match.index,
                endIndex: tagRegex.lastIndex
              })
            }

            if (parsedMatches.length > 0) {
              const firstTagIdx = parsedMatches[0].startIndex
              cleanContent = finalAnswer.slice(0, firstTagIdx).trim()

              let siblingBlockIds: string[] = []
              if (editorRef.current) {
                try {
                  const flatBlocks = (function flatten(blocks: any[]): any[] {
                    return blocks.flatMap((b: any) => [b, ...flatten(b.children || [])])
                  })(editorRef.current.document || [])
                  siblingBlockIds = flatBlocks.map((b: any) => b.id)
                } catch {}
              }

              for (let i = 0; i < parsedMatches.length; i++) {
                const curr = parsedMatches[i]
                const nextStart = (i + 1 < parsedMatches.length) ? parsedMatches[i + 1].startIndex : finalAnswer.length
                const insertContent = finalAnswer.slice(curr.endIndex, nextStart).trim()

                let afterBlockId = curr.afterBlockIdRaw
                if (!afterBlockId || afterBlockId === '...' || afterBlockId === 'undefined') {
                  afterBlockId = 'END'
                }

                const validTypes = ['heading', 'paragraph', 'bulletListItem', 'numberedListItem', 'table']
                const blockType = validTypes.includes(curr.typeRaw) ? curr.typeRaw as InsertSuggestion['blockType'] : 'paragraph'

                let siblingIndex = siblingBlockIds.length - 1
                const foundIdx = siblingBlockIds.indexOf(afterBlockId)
                if (foundIdx >= 0) {
                  siblingIndex = foundIdx
                }

                insertSuggestions.push({
                  afterBlockId,
                  blockType,
                  level: curr.level,
                  content: insertContent,
                  reasonText: cleanContent || undefined,
                  status: 'pending',
                  siblingBlockIds,
                  siblingIndex,
                })
              }
            }
          }

          agentHasPendingDecision = !!(editMatch || insertSuggestions.length > 0)
          // 성공 시 말풍선 내용 업데이트 및 스트리밍 완료 처리
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  content: cleanContent,
                  isStreaming: false,
                  finalAnswer: cleanContent,
                  blockId: blockId || undefined,
                  originalText: originalText || undefined,
                  proposedText: editMatch ? proposedText : undefined,
                  diffState: editMatch ? 'pending' : undefined,
                  insertSuggestion: insertSuggestions[0],
                  insertSuggestions: insertSuggestions,
                  reasoningTrace: agentResult.steps.flatMap((s, sIdx) => {
                    const traces = [
                      {
                        id: `trace_agent_${m.id}_${sIdx}_thought`,
                        source: 'model' as const,
                        type: 'thinking' as const,
                        text: `[사고 단계 ${sIdx + 1}] ${s.thought}`,
                        model: finalSettings.modelPath || 'unknown',
                        timestamp: new Date().toISOString()
                      }
                    ]
                    
                    if (s.action) {
                      let actionText = `🎯 도구 실행: ${s.action}\n인자 데이터 (Action Input): ${s.actionInput}`
                      if (s.observation) {
                        const cleanObs = s.observation.replace(/^Observation:\s*/i, '').trim()
                        actionText += `\n\n🔍 실행 결과 (Observation):\n${cleanObs}`
                      }
                      traces.push({
                        id: `trace_agent_${m.id}_${sIdx}_action`,
                        source: 'model' as const,
                        type: 'thinking' as const,
                        text: actionText,
                        model: finalSettings.modelPath || 'unknown',
                        timestamp: new Date().toISOString()
                      })
                    }
                    
                    return traces
                  })
                }
              : m
          ))
        }
      } else {
        throw new Error(agentResult.error || '에이전트가 솔루션을 도출하지 못했습니다.')
      }
      } catch (err: any) {
        console.error('[useAI] 에이전트 구동 실패:', err)
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `❌ 에이전트 실행 실패: ${err.message}`, isStreaming: false, error: true }
            : m
        ))
      } finally {
        isAgentRunningRef.current = false
        setIsGenerating(false)
        currentAssistantIdRef.current = null
        if (!agentHasPendingDecision) {
          setTimeout(() => checkAndProcessNextQueue(), 80) // [SaaS 큐] 에이전트 종료 시 대기결정이 없으면 다음 항목 기동
        }
      }
      return
    }

    const result = await window.electronAPI.llmGenerate({
      sessionId: sessId, // [FIX-IPC-001] 일반 챗 모드에서도 세션 ID 격리 전송
      modelPath: finalSettings.modelPath,
      prompt: userMessage,
      context: (taggedBlocks && taggedBlocks.length > 0) ? undefined : (context || undefined),
      systemPrompt: dynamicSystemPrompt,
      maxTokens: finalSettings.maxTokens,
      temperature: finalSettings.temperature,
      apiType: finalSettings.apiType === 'wasm' ? 'local' : finalSettings.apiType,
      apiKey: finalSettings.apiKey,
      apiEndpoint: finalSettings.apiEndpoint,
      apiModel: finalSettings.apiModel,
      gpuOnly: finalSettings.gpuOnly,
      history: historyPayload,
    })

    // 에러면 즉시 처리
    if (!result.success && result.error) {
      console.error('[useAI] LLM 구동 실패:', result.error)
      setIsGenerating(false)
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `❌ ${result.error}`, isStreaming: false, error: true }
          : m
      ))
      currentAssistantIdRef.current = null
      setTimeout(() => checkAndProcessNextQueue(), 80) // [SaaS 큐] 에러 시 다음 항목 기동
    }
  }, [isGenerating, settings, messages])

  // 블록 단위 AI 작업 (단발성 텍스트 반환)
  const processBlock = useCallback(async (
    action: 'summarize' | 'translate' | 'improve' | 'expand' | 'explain',
    content: string,
    targetLang?: string
  ): Promise<string> => {
    if (!window.electronAPI) return ''

    const prompts: Record<string, string> = {
      summarize: `다음 텍스트를 3줄 이내로 핵심만 요약하세요:\n\n${content}`,
      translate: `다음 텍스트를 ${targetLang || '영어'}로 번역하세요. 번역문만 출력하세요:\n\n${content}`,
      improve: `다음 텍스트의 문체와 표현을 개선하세요. 개선된 텍스트만 출력하세요:\n\n${content}`,
      expand: `다음 텍스트를 더 자세하고 풍부하게 확장하세요:\n\n${content}`,
      explain: `다음 내용을 쉽게 설명하세요:\n\n${content}`,
    }

    // [FIX-C-001] 리스너 누수 방지: llm:done이 오지 않으면 60초 후 강제 해제와 함께 메모리를 해제하는 Timeout Guard 적용
    return new Promise<string>((resolve) => {
      let result = ''
      let settled = false

      const sessId = `quick-${Date.now()}`

      const cleanup = (unsubToken: () => void, unsubDone: () => void) => {
        if (!settled) {
          settled = true
          unsubToken()
          unsubDone()
        }
      }

      // [FIX-C-001] 리스너를 먼저 등록하고 나서 llmGenerate 호출 (레이스 컨디션 차단)
      const unsubToken = window.electronAPI!.onLLMToken(sessId, (token) => {
        if (!settled) result += token
      })

      const unsubDone = window.electronAPI!.onLLMDone(sessId, (data) => {
        if (settled) return
        cleanup(unsubToken, unsubDone)
        resolve(data.success ? result.trim() : (data.error || ''))
      })

      // [FIX-C-001] 60초 Timeout 안전망: llm:done이 많으면 리스너 강제 해제
      const timeoutId = setTimeout(() => {
        if (!settled) {
          cleanup(unsubToken, unsubDone)
          resolve(result.trim() || '')
        }
      }, 60_000)

      window.electronAPI!.llmGenerate({
        sessionId: sessId,
        modelPath: settings.modelPath,
        prompt: prompts[action] || content,
        systemPrompt: 'You are a document editing assistant. Output only the requested content without any explanation or preamble.',
        maxTokens: 512,
        temperature: 0.5,
        apiType: settings.apiType === 'wasm' ? 'local' : settings.apiType,
        apiKey: settings.apiKey,
        apiEndpoint: settings.apiEndpoint, // [FIX-W-003] 동적 엔드포인트 전달
        apiModel: settings.apiModel,       // [FIX-W-003] 동적 모델명 전달
        gpuOnly: settings.gpuOnly,
      }).catch(() => {
        clearTimeout(timeoutId)
        cleanup(unsubToken, unsubDone)
        resolve('')
      })
    })
  // [FIX-C-002] 의존성 배열 보완: apiType, apiKey, apiEndpoint, apiModel, gpuOnly 누락 방지
  }, [settings.modelPath, settings.apiType, settings.apiKey, settings.apiEndpoint, settings.apiModel, settings.gpuOnly])

  // 🦾 [SaaS 유료 기능] 큐에서 대기 중인 다음 질문을 꺼내 순차 실행
  const checkAndProcessNextQueue = useCallback(() => {
    if (isGeneratingRef.current) return
    if (pendingQueueRef.current.length === 0) return
    const nextReq = pendingQueueRef.current.shift()
    setPendingQueue([...pendingQueueRef.current]) // [BUG FIX] 큐에서 대기열 아이템이 제거되었으므로 즉시 UI 상태 반영
    if (nextReq) {
      // 대기 큐 안내 메시지 필터 제거
      setMessages(prev => prev.filter(m => !m.id.startsWith('msg_queue_')))
      generateResponse(
        nextReq.userMessage,
        nextReq.context,
        nextReq.originalText,
        nextReq.blockId,
        nextReq.runtimeSettings,
        nextReq.editorInstance,
        nextReq.taggedBlocks
      )
    }
  }, [generateResponse])

  const abortGeneration = useCallback(() => {
    // [FIX] 강제 중단 시 대기 중인 모든 큐 작업도 초기화하여 연쇄 실행(Race condition) 방지
    pendingQueueRef.current = []
    setPendingQueue([])
    setMessages(prev => prev.filter(m => !m.id.startsWith('msg_queue_')))

    if (!window.electronAPI || !isGenerating) return
    const currentSessionId = currentSessionIdRef.current || 'default'
    window.electronAPI.llmAbort(currentSessionId) // [FIX-IPC-001] 세션별 중단 요청 전달
  }, [isGenerating])

  const clearHistory = useCallback(() => {
    setMessages([])
    setStreamingText('')
  }, [])

  const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      try {
        // [SEC-W-002] API Key는 localStorage에 저장하지 않음 — 메모리에만 보관
        const { apiKey: _apiKey, ...safeSettings } = updated
        localStorage.setItem('ai-settings', JSON.stringify(safeSettings))
      } catch {}
      return updated
    })
  }, [])

  const updateMessageDiffState = useCallback((msgId: string, state: 'accepted' | 'rejected') => {
    setMessages(prev => {
      const next = prev.map(m =>
        m.id === msgId ? { ...m, diffState: state } : m
      )
      // [BUG FIX] 수정안 승인/거절 시 다음 대기 큐 기동
      setTimeout(() => checkAndProcessNextQueue(), 80)
      return next
    })
  }, [checkAndProcessNextQueue])

  /** 삽입 제안 상태 업데이트 (다중 카드 독립 제어 지원) */
  const updateInsertSuggestionStatus = useCallback((
    msgId: string,
    status: 'pending' | 'accepted' | 'rejected',
    newAfterBlockId?: string,
    newSiblingIndex?: number,
    suggestionIndex?: number
  ) => {
    setMessages(prev => {
      let allResolved = true
      const next = prev.map(m => {
        if (m.id !== msgId) return m

        // 1. 다중 제안 배열이 존재하는 경우 특정 인덱스 업데이트
        if (m.insertSuggestions && m.insertSuggestions.length > 0 && suggestionIndex !== undefined) {
          const updatedSuggestions = [...m.insertSuggestions]
          const target = updatedSuggestions[suggestionIndex]
          if (target) {
            updatedSuggestions[suggestionIndex] = {
              ...target,
              status,
              ...(newAfterBlockId !== undefined ? { afterBlockId: newAfterBlockId } : {}),
              ...(newSiblingIndex !== undefined ? { siblingIndex: newSiblingIndex } : {}),
            }

            // [BUG FIX] 연속적인 다중 삽입 제안 시, 이전 블록이 삽입된 직후 후속 블록의 기준점(afterBlockId)을
            // 방금 새로 삽입된 신규 블록의 ID로 승계 체이닝하여 순서가 뒤바뀌는 버그를 차단함
            if (status === 'accepted' && newAfterBlockId) {
              const oldAfterBlockId = target.afterBlockId
              for (let i = suggestionIndex + 1; i < updatedSuggestions.length; i++) {
                const pendingSuggestion = updatedSuggestions[i]
                if (pendingSuggestion.status === 'pending') {
                  if (pendingSuggestion.afterBlockId === oldAfterBlockId) {
                    updatedSuggestions[i] = {
                      ...pendingSuggestion,
                      afterBlockId: newAfterBlockId
                    }
                  }
                }
              }
            }
          }
          if (updatedSuggestions.some(s => s.status === 'pending')) {
            allResolved = false
          }
          return {
            ...m,
            insertSuggestions: updatedSuggestions,
            insertSuggestion: updatedSuggestions[0] // 하위 호환용
          }
        }

        // 2. 단수형 폴백 호환성 처리
        if (!m.insertSuggestion) return m
        if (status === 'pending') allResolved = false
        return {
          ...m,
          insertSuggestion: {
            ...m.insertSuggestion,
            status,
            ...(newAfterBlockId !== undefined ? { afterBlockId: newAfterBlockId } : {}),
            ...(newSiblingIndex !== undefined ? { siblingIndex: newSiblingIndex } : {}),
          }
        }
      })
      // [BUG FIX] 삽입 제안이 모두 결정(승인/거절)되면 다음 대기 큐 기동
      if (allResolved) {
        setTimeout(() => checkAndProcessNextQueue(), 80)
      }
      return next
    })
  }, [checkAndProcessNextQueue])

  const removeFromQueue = useCallback((itemId: string) => {
    pendingQueueRef.current = pendingQueueRef.current.filter(item => item.id !== itemId)
    setPendingQueue([...pendingQueueRef.current])
  }, [])

  return {
    messages,
    isGenerating,
    isAvailable,
    models,
    codeModels,
    settings,
    streamingText,
    engineLogs,
    setEngineLogs,
    generateResponse,
    processBlock,
    abortGeneration,
    clearHistory,
    updateSettings,
    updateMessageDiffState,
    updateInsertSuggestionStatus,
    refreshModels,
    importModel,
    pendingQueue,
    removeFromQueue,
  }
}
