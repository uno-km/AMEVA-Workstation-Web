/**
 * ============================================================================
 * @file JupyterBlock.tsx
 * @description JupyterBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createReactBlockSpec, BlockContentWrapper } from '@blocknote/react'
import { JupyterCodeEditorHeader, JupyterCodeEditorTerminal } from './JupyterCodeEditor'
import type { RunState } from './JupyterCodeEditor'
import { useCodeRuntime } from '../hooks/useCodeRuntime'
import { useWebLLM } from './useWebLLM'
import { WebLLMEngineAdapter } from '../features/ai-agent/adapters/WebLLMEngineAdapter'
import { CodeIntelligenceService, type SupportedLanguage } from '../services/ai/CodeIntelligenceService'
import { ResizableBlockContainer } from './ResizableBlockContainer'
import { marked } from 'marked'
import { InlineMermaidRenderer } from './markdown/InlineMermaidRenderer'
import { InlineHtmlRenderer } from './jupyter/InlineHtmlRenderer'
import { 
  Sparkles, 
  Wand2, 
  Bug, 
  Zap, 
  BookOpen, 
  RotateCcw, 
  ArrowRightLeft, 
  Check, 
  X,
  GitCompare,
  Columns,
  AlignJustify
} from 'lucide-react'
import { computeLineDiff, type DiffLine } from '../utils/diffUtils'

// ─── 0. 자동완성용 정적 키워드 사전 ───────────────────────────
const KEYWORDS: Record<string, string[]> = {
  javascript: ['console', 'const', 'let', 'function', 'return', 'import', 'export', 'await', 'async', 'document', 'window', 'Promise', 'setTimeout', 'setInterval', 'querySelector', 'addEventListener', 'stringify', 'parse', 'forEach', 'map', 'filter', 'reduce'],
  python: ['print', 'def', 'import', 'return', 'class', 'self', 'lambda', 'yield', 'try', 'except', 'finally', 'global', 'numpy', 'pandas', 'matplotlib', 'range', 'len', 'append', 'dict', 'list', 'split', 'join'],
  sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'COUNT', 'SUM'],
  html: ['div', 'span', 'class', 'id', 'style', 'script', 'href', 'iframe', 'button', 'canvas', 'input', 'head', 'body', 'section', 'header', 'footer', 'meta', 'link', 'title'],
  bash: ['echo', 'cd', 'ls', 'pwd', 'mkdir', 'rm', 'git', 'npm', 'node', 'python', 'pip', 'grep', 'cat', 'install', 'run', 'build', 'sudo', 'chmod', 'clear'],
  cmd: ['echo', 'cd', 'dir', 'mkdir', 'del', 'rmdir', 'copy', 'move', 'cls', 'path', 'taskkill', 'tasklist', 'netstat', 'ipconfig']
}

// 본문 문서 내 최근 단어 토크나이저
function getDocWords(text: string): string[] {
  const matches = text.match(/\b[a-zA-Z_]\w{1,25}\b/g)
  if (!matches) return []
  return Array.from(new Set(matches))
}

// 1. 커스텀 Jupyter React 블록 정의
const JupyterBlockSpec = createReactBlockSpec(
  {
    type: 'jupyter',
    propSchema: {
      language: { default: 'javascript' },
      code: { default: '' },
      runState: { default: '{"hasRun":false,"success":null,"outputLines":[]}' },
      height: { default: '570' },
      width: { default: '100%' }
    },
    content: 'none'
  },
  {
    render: ({ block, editor }) => {
      try {
        const code = block.props.code || ''
        const language = block.props.language || 'javascript'
        const rawHeight = block.props.height ? parseInt(block.props.height, 10) : 570
        const initialHeight = isNaN(rawHeight) || rawHeight < 120 ? 570 : rawHeight

        const { executeCode } = useCodeRuntime()
        const { generateCoderStream, isCoderReady, initCoderModel } = useWebLLM()
        const [isInputCollapsed, setIsInputCollapsed] = useState(false)
        const textareaRef = useRef<HTMLTextAreaElement | null>(null)
        const [cursorPos, setCursorPos] = useState(0)
        const mirrorRef = useRef<HTMLDivElement | null>(null)

        // 로컬 입력 버퍼 캐시 (빈 코드인 경우 해당 언어의 대표 스타터 템플릿 자동 주입)
        const [localCode, setLocalCode] = useState(code || '')

        // 인라인 AI 상태 관리 (SCRUM-172)
        const [isAIOpen, setIsAIOpen] = useState(false)
        const [aiPrompt, setAiPrompt] = useState('')
        const [isAIGenerating, setIsAIGenerating] = useState(false)
        const [aiStatus, setAiStatus] = useState<string | null>(null)
        const [aiExplanation, setAiExplanation] = useState<string | null>(null)
        const [historyCode, setHistoryCode] = useState<string | null>(null)

        // ─── AI 코드 변경 Diff 검토 상태 ───
        const [isDiffOpen, setIsDiffOpen] = useState(false)
        const [diffOldCode, setDiffOldCode] = useState<string>('')
        const [diffNewCode, setDiffNewCode] = useState<string>('')
        const [diffViewMode, setDiffViewMode] = useState<'split' | 'unified'>('split')

        // Mermaid / HTML 프리뷰 모드 ('preview' | 'code' | 'split')
        const [previewMode, setPreviewMode] = useState<'preview' | 'code' | 'split'>('preview')

        // 부모의 code prop이 변경되면 로컬 캐시 동기화 (단, 포커스 중이 아닐 때만)
        useEffect(() => {
          if (document.activeElement !== textareaRef.current && !isDiffOpen) {
            setLocalCode(code)
          }
        }, [code, isDiffOpen])

        // 텍스트 스크롤 동기화 핸들러
        const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
          if (mirrorRef.current) {
            mirrorRef.current.scrollTop = e.currentTarget.scrollTop
          }
        }

        // 제안 단어 실시간 계산 (로컬 캐시 기준)
        let suggestion = ''
        const beforeCursor = localCode.substring(0, cursorPos)
        const prefixMatch = beforeCursor.match(/([a-zA-Z_]\w*)$/)
        const prefix = prefixMatch ? prefixMatch[1] : ''

        if (prefix.length >= 1) {
          const langKeywords = KEYWORDS[language] || []
          const docWords = getDocWords(localCode)
          const allCandidates = Array.from(new Set([...docWords, ...langKeywords]))
          const match = allCandidates.find(word => word.startsWith(prefix) && word !== prefix)
          if (match) {
            suggestion = match.substring(prefix.length)
          }
        }
        
        let parsedRunState: RunState = { hasRun: false, success: null, outputLines: [] }
        if (block.props.runState) {
          try {
            parsedRunState = JSON.parse(block.props.runState)
          } catch (e) {
            console.error('runState 파싱 에러:', e)
          }
        }

        // 블록 props 변경 유틸 (로컬과 부모 상태 둘 다 갱신)
        const updateCode = (newCode: string) => {
          setLocalCode(newCode)
          editor.updateBlock(block.id, {
            type: 'jupyter',
            props: { ...block.props, code: newCode }
          })
        }

        const updateRunState = (newRunState: RunState) => {
          editor.updateBlock(block.id, {
            type: 'jupyter',
            props: { ...block.props, code: localCode, runState: JSON.stringify(newRunState) }
          })
        }

        // 엔진 어댑터 취득 (0.5B 온디바이스 자동 할당)
        const getEngineAdapter = async () => {
          if (!isCoderReady) {
            setAiStatus('⚡ 온디바이스 코더 엔진 준비 중...')
            await initCoderModel()
          }
          return new WebLLMEngineAdapter(generateCoderStream, true)
        }

        // 1. AI 코드 생성 / 수정 (생성 완료 시 Diff 뷰어 자동 활성화)
        const handleAIGenerate = async (customPrompt?: string) => {
          const promptToUse = customPrompt || aiPrompt
          if (!promptToUse.trim() && !localCode.trim()) return
          
          const baseOriginalCode = localCode
          setHistoryCode(baseOriginalCode)
          setIsAIGenerating(true)
          setAiStatus('⚡ Qwen-Coder 코드 작성 중...')
          try {
            const engine = await getEngineAdapter()
            let accumulated = ''
            const result = await CodeIntelligenceService.generateCode({
              prompt: promptToUse || '위 코드를 개선하고 확장해줘',
              language: (language || 'javascript') as SupportedLanguage,
              contextCode: baseOriginalCode,
              engine,
              onStreamingChunk: (chunk) => {
                accumulated += chunk
                const pure = CodeIntelligenceService.extractPureCode(accumulated)
                setLocalCode(pure)
              }
            })
            const pureCode = CodeIntelligenceService.extractPureCode(result)
            
            // 이전 코드가 존재하고 코드가 변경되었으면 Diff 검토 모드 실행
            if (baseOriginalCode.trim() && baseOriginalCode.trim() !== pureCode.trim()) {
              setDiffOldCode(baseOriginalCode)
              setDiffNewCode(pureCode)
              setIsDiffOpen(true)
              setAiStatus('변경사항(Diff)이 감지되었습니다. 확인 후 적용해 주세요.')
            } else {
              updateCode(pureCode)
              setAiStatus('코드 생성이 완료되었습니다.')
            }
            setAiPrompt('')
          } catch (err: any) {
            setAiStatus(`에러: ${err.message}`)
          } finally {
            setIsAIGenerating(false)
          }
        }

        // 2. AI 1-클릭 에러 디버깅 & 자동 패치 (Diff 비교 지원)
        const handleAIDebugFix = async (errorLog?: string) => {
          if (!localCode.trim()) return
          const baseOriginalCode = localCode
          setHistoryCode(baseOriginalCode)
          setIsAIGenerating(true)
          setIsAIOpen(true)
          setAiStatus('AI가 에러를 분석하여 자동 수정 중...')
          try {
            const engine = await getEngineAdapter()
            let accumulated = ''
            const result = await CodeIntelligenceService.debugAndFix({
              code: baseOriginalCode,
              errorLog: errorLog || (parsedRunState.outputLines.filter(l => l.type === 'stderr').map(l => l.text).join('\n')),
              language: (language || 'javascript') as SupportedLanguage,
              engine,
              onStreamingChunk: (chunk) => {
                accumulated += chunk
                const pure = CodeIntelligenceService.extractPureCode(accumulated)
                setLocalCode(pure)
              }
            })
            const pureCode = CodeIntelligenceService.extractPureCode(result)
            
            if (baseOriginalCode.trim() !== pureCode.trim()) {
              setDiffOldCode(baseOriginalCode)
              setDiffNewCode(pureCode)
              setIsDiffOpen(true)
              setAiStatus('에러 수정 코드가 준비되었습니다. Diff를 확인 후 적용해 주세요.')
            } else {
              updateCode(pureCode)
              setAiStatus('에러가 해결되어 코드가 자동 수정되었습니다.')
            }
          } catch (err: any) {
            setAiStatus(`에러: ${err.message}`)
          } finally {
            setIsAIGenerating(false)
          }
        }

        // 3. AI 성능 및 복잡도 최적화
        const handleAIOptimize = async () => {
          if (!localCode.trim()) return
          await handleAIGenerate('이 코드의 시간복잡도와 공간복잡도를 O(N) 레벨로 최적화하고 가독성을 높여서 리팩토링해줘.')
        }

        // 4. AI 코드 상세 해설
        const handleAIExplain = async () => {
          if (!localCode.trim()) return
          setIsAIGenerating(true)
          setAiStatus('코드 동작 원리 분석 중...')
          try {
            const engine = await getEngineAdapter()
            let accumulated = ''
            const result = await CodeIntelligenceService.explainCode({
              code: localCode,
              language: (language || 'javascript') as SupportedLanguage,
              engine,
              onStreamingChunk: (chunk) => {
                accumulated += chunk
                setAiExplanation(accumulated)
              }
            })
            setAiExplanation(result)
            setAiStatus('코드 해설이 준비되었습니다.')
          } catch (err: any) {
            setAiStatus(`에러: ${err.message}`)
          } finally {
            setIsAIGenerating(false)
          }
        }

        // 5. 다국어 상호 변환 (Diff 검토 지원)
        const handleAIConvert = async (targetLang: string) => {
          if (!localCode.trim()) return
          const baseOriginalCode = localCode
          setHistoryCode(baseOriginalCode)
          setIsAIGenerating(true)
          setAiStatus(`${language.toUpperCase()} ➔ ${targetLang.toUpperCase()} 변환 중...`)
          try {
            const engine = await getEngineAdapter()
            let accumulated = ''
            const result = await CodeIntelligenceService.convertLanguage({
              code: baseOriginalCode,
              sourceLanguage: (language || 'javascript') as SupportedLanguage,
              targetLanguage: targetLang as SupportedLanguage,
              engine,
              onStreamingChunk: (chunk) => {
                accumulated += chunk
                const pure = CodeIntelligenceService.extractPureCode(accumulated)
                setLocalCode(pure)
              }
            })
            const pureCode = CodeIntelligenceService.extractPureCode(result)
            
            setDiffOldCode(baseOriginalCode)
            setDiffNewCode(pureCode)
            setIsDiffOpen(true)
            
            editor.updateBlock(block.id, {
              type: 'jupyter',
              props: {
                ...block.props,
                language: targetLang,
                code: pureCode,
                runState: JSON.stringify({ hasRun: false, success: null, outputLines: [] })
              }
            } as any)
            setLocalCode(pureCode)
            setAiStatus(`${targetLang.toUpperCase()} 코드로 변환되었습니다. Diff를 확인해 주세요.`)
          } catch (err: any) {
            setAiStatus(`에러: ${err.message}`)
          } finally {
            setIsAIGenerating(false)
          }
        }

        // ─── Diff 적용 & 거절 핸들러 ───
        const handleAcceptDiff = () => {
          updateCode(diffNewCode)
          setIsDiffOpen(false)
          setAiStatus('변경사항이 코드에 성공적으로 적용되었습니다.')
        }

        const handleRejectDiff = () => {
          updateCode(diffOldCode)
          setIsDiffOpen(false)
          setAiStatus('이전 코드를 유지하고 AI 변경을 취소했습니다.')
        }

        // Diff 라인 계산 메모이제이션
        const diffLines = useMemo(() => {
          if (!isDiffOpen || !diffOldCode) return []
          return computeLineDiff(diffOldCode, diffNewCode)
        }, [isDiffOpen, diffOldCode, diffNewCode])

        // Ctrl+Enter 실행 로직
        const handleCtrlEnterRun = async () => {
          updateRunState({
            hasRun: true,
            success: null,
            outputLines: [{ type: 'info', text: '▶ 실행 중...' }]
          })
          try {
            if (language === 'html') {
              updateRunState({
                hasRun: true,
                success: true,
                outputLines: [{ type: 'info', text: '렌더링 완료' }]
              })
              return
            }
            const result = await executeCode(language, localCode)
            updateRunState({
              hasRun: true,
              success: result.success,
              outputLines: (result.output || '').split('\n').map(text => ({
                type: result.success ? 'stdout' : 'stderr',
                text
              })),
              tableData: result.tableData
            })
          } catch (err: any) {
            updateRunState({
              hasRun: true,
              success: false,
              outputLines: [{ type: 'stderr', text: err.message || '알 수 없는 에러' }]
            })
          }
        }

        // 갓 생성된 빈 코드블록인 경우 인풋 textarea에 자동 포커스
        useEffect(() => {
          if (textareaRef.current && code === '') {
            const timer = setTimeout(() => {
              textareaRef.current?.focus()
            }, 60)
            return () => clearTimeout(timer)
          }
        }, [block.id])

        // 또렷하고 선명한 칩 버튼 스타일 (High Contrast & Sharp)
        const chipStyle: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: '#1e2230',
          border: '1px solid #334155',
          color: '#f8fafc',
          borderRadius: '5px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }

        return (
          <BlockContentWrapper
            blockType="jupyter"
            blockProps={block.props}
            propSchema={{
              language: { default: 'javascript' },
              code: { default: '' },
              runState: { default: '{"hasRun":false,"success":null,"outputLines":[]}' },
              height: { default: '570' },
              width: { default: '100%' }
            }}
          >
            {/* ─── 상하좌우 마우스 드래그 리사이즈 래퍼 (높이 및 너비 설정값 영구 보존) ─── */}
            <ResizableBlockContainer
              initialHeight={initialHeight}
              initialWidth={block.props.width || '100%'}
              minHeight={140}
              maxHeight={2500}
              minWidth={280}
              maxWidth={3200}
              accentColor="rgba(59, 130, 246, 0.7)"
              enableResize={!isInputCollapsed}
              onResizeEnd={({ height: newH, width: newW }) => {
                editor.updateBlock(block.id, {
                  type: 'jupyter',
                  props: {
                    ...block.props,
                    height: String(Math.round(newH)),
                    width: newW || block.props.width || '100%'
                  }
                } as any)
              }}
              style={{ margin: '14px 0', width: block.props.width || '100%' }}
            >
              {({ height: containerH }) => (
                <div
                  className="custom-jupyter-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: `${containerH}px`,
                    background: '#0d1117',
                    border: isAIOpen ? '1px solid #2563eb' : '1px solid #30363d',
                    borderRadius: '8px',
                    boxShadow: isAIOpen ? '0 2px 14px rgba(37, 99, 235, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontFamily: 'Consolas, "JetBrains Mono", monospace',
                    WebkitFontSmoothing: 'antialiased',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* 1. 상단 헤더 배너 (AI / Run / Copy 버튼) */}
                  <div style={{ height: '36px', minHeight: '36px', width: '100%' }}>
                    <JupyterCodeEditorHeader
                      code={localCode}
                      language={language}
                      blockId={block.id}
                      editor={editor as any}
                      isInputCollapsed={isInputCollapsed}
                      onToggleInputCollapse={() => setIsInputCollapsed(!isInputCollapsed)}
                      isAIOpen={isAIOpen}
                      onToggleAI={() => setIsAIOpen(!isAIOpen)}
                      isAIGenerating={isAIGenerating}
                      previewMode={previewMode}
                      onTogglePreviewMode={setPreviewMode}
                      onRunStart={() => {
                        updateRunState({
                          hasRun: true,
                          success: null,
                          outputLines: [{ type: 'info', text: '▶ 실행 중...' }]
                        })
                      }}
                      onRunSuccess={(success, lines, tableData) => {
                        updateRunState({
                          hasRun: true,
                          success,
                          outputLines: lines.map(text => ({ type: success ? 'stdout' : 'stderr', text })),
                          tableData
                        })
                      }}
                      onRunFailure={(errMessage) => {
                        updateRunState({
                          hasRun: true,
                          success: false,
                          outputLines: [{ type: 'stderr', text: errMessage }]
                        })
                      }}
                    />
                  </div>

                  {/* ─── 2. 인라인 AI 인텔리전스 패널 (SCRUM-172) ─── */}
                  {isAIOpen && (
                    <div style={{
                      background: '#131722',
                      borderBottom: '1px solid #282e3f',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      userSelect: 'none',
                      flexShrink: 0,
                      fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    }}>
                      {/* 상단 상태 라벨 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.2px' }}>
                          <Sparkles size={13} color="#38bdf8" />
                          <span>AI 코드 어시스턴트</span>
                        </div>
                        {aiStatus && (
                          <div style={{ fontSize: '11px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <Check size={11} color="#34d399" />
                            <span>{aiStatus}</span>
                          </div>
                        )}
                      </div>

                      {/* 프롬프트 입력창 & 생성 버튼 */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAIGenerate();
                            }
                          }}
                          placeholder="코드 작성/수정 요청: '피보나치 수열 작성', '버그 찾아 수정', '시간복잡도 최적화'..."
                          disabled={isAIGenerating}
                          style={{
                            flex: 1,
                            background: '#0d1117',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            padding: '7px 12px',
                            color: '#ffffff',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            fontFamily: 'Pretendard, -apple-system, sans-serif',
                            outline: 'none',
                            transition: 'border-color 0.15s',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                        />
                        <button
                          onClick={() => handleAIGenerate()}
                          disabled={isAIGenerating || (!aiPrompt.trim() && !localCode.trim())}
                          style={{
                            background: isAIGenerating ? '#4b5563' : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: isAIGenerating ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Wand2 size={12} />
                          {isAIGenerating ? '생성 중...' : '실행 (Enter)'}
                        </button>
                      </div>

                      {/* 퀵 액션 칩스 */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={() => handleAIDebugFix()}
                          disabled={isAIGenerating || !localCode.trim()}
                          style={chipStyle}
                        >
                          <Bug size={12} color="#f87171" />
                          버그 진단 & 즉시 수정
                        </button>
                        <button
                          onClick={() => handleAIOptimize()}
                          disabled={isAIGenerating || !localCode.trim()}
                          style={chipStyle}
                        >
                          <Zap size={12} color="#fbbf24" />
                          $O(N)$ 성능 최적화
                        </button>
                        <button
                          onClick={() => handleAIExplain()}
                          disabled={isAIGenerating || !localCode.trim()}
                          style={chipStyle}
                        >
                          <BookOpen size={12} color="#34d399" />
                          코드 상세 해설
                        </button>

                        {/* 언어 변환 셀렉터 */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                          <ArrowRightLeft size={12} color="#60a5fa" />
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>변환:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAIConvert(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            disabled={isAIGenerating || !localCode.trim()}
                            defaultValue=""
                            style={{
                              background: '#1e2230',
                              border: '1px solid #334155',
                              color: '#93c5fd',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '3px 6px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="" disabled>언어 선택...</option>
                            <option value="python">Python으로 변환</option>
                            <option value="javascript">JavaScript로 변환</option>
                            <option value="typescript">TypeScript로 변환</option>
                            <option value="sql">SQL로 변환</option>
                            <option value="html">HTML로 변환</option>
                          </select>
                        </div>

                        {/* 롤백 버튼 */}
                        {historyCode !== null && (
                          <button
                            onClick={() => {
                              updateCode(historyCode);
                              setHistoryCode(null);
                              setAiStatus('이전 코드로 롤백되었습니다.');
                            }}
                            style={{
                              ...chipStyle,
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#fecaca',
                              marginLeft: '4px'
                            }}
                          >
                            <RotateCcw size={12} />
                            되돌리기
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── 3. AI 코드 변경사항 Diff 인스펙터 (SCRUM-172) ─── */}
                  {isDiffOpen && (
                    <div style={{
                      background: '#0a0d14',
                      borderBottom: '1px solid #334155',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      flexShrink: 0,
                      maxHeight: '260px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700, color: '#93c5fd' }}>
                          <GitCompare size={14} color="#60a5fa" />
                          <span>AI 코드 변경사항 검토 (Diff Review)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Split vs Unified 뷰 토글 */}
                          <div style={{ display: 'flex', background: '#1e293b', borderRadius: '4px', padding: '2px', border: '1px solid #334155' }}>
                            <button
                              onClick={() => setDiffViewMode('split')}
                              title="2열 비교 뷰"
                              style={{
                                background: diffViewMode === 'split' ? '#3b82f6' : 'transparent',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 700
                              }}
                            >
                              <Columns size={10} />
                              2열 비교
                            </button>
                            <button
                              onClick={() => setDiffViewMode('unified')}
                              title="통합 Diff 뷰"
                              style={{
                                background: diffViewMode === 'unified' ? '#3b82f6' : 'transparent',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 700
                              }}
                            >
                              <AlignJustify size={10} />
                              통합
                            </button>
                          </div>

                          {/* [✅ 전체 적용] 버튼 */}
                          <button
                            onClick={handleAcceptDiff}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#059669',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)'
                            }}
                          >
                            <Check size={12} />
                            전체 적용 (Accept)
                          </button>

                          {/* [❌ 거절/원복] 버튼 */}
                          <button
                            onClick={handleRejectDiff}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#fca5a5',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                            거절 (Reject)
                          </button>
                        </div>
                      </div>

                      {/* Diff 라인 렌더링 컨테이너 */}
                      <div style={{
                        background: '#0b0f19',
                        border: '1px solid #1e293b',
                        borderRadius: '6px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        fontFamily: 'Consolas, "JetBrains Mono", monospace',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        padding: '6px 0'
                      }}>
                        {diffViewMode === 'split' ? (
                          /* ── 2열 비교 (Side-by-Side) ── */
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 8px' }}>
                            <div style={{ borderRight: '1px solid #1e293b', paddingRight: '8px' }}>
                              <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700, paddingBottom: '4px', borderBottom: '1px solid #1e293b' }}>
                                ◀ 이전 소스코드 (Original)
                              </div>
                              <pre style={{ margin: '4px 0 0 0', color: '#f87171', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {diffOldCode}
                              </pre>
                            </div>
                            <div style={{ paddingLeft: '4px' }}>
                              <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, paddingBottom: '4px', borderBottom: '1px solid #1e293b' }}>
                                ▶ AI 제안 코드 (AI Proposed)
                              </div>
                              <pre style={{ margin: '4px 0 0 0', color: '#34d399', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {diffNewCode}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          /* ── 통합 뷰 (Unified Diff) ── */
                          <div>
                            {diffLines.map((line, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  padding: '1px 8px',
                                  background: line.type === 'added' ? 'rgba(16, 185, 129, 0.15)' : line.type === 'removed' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                  color: line.type === 'added' ? '#34d399' : line.type === 'removed' ? '#f87171' : '#94a3b8',
                                  borderLeft: line.type === 'added' ? '3px solid #10b981' : line.type === 'removed' ? '3px solid #ef4444' : '3px solid transparent'
                                }}
                              >
                                <span style={{ width: '20px', userSelect: 'none', opacity: 0.7 }}>
                                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                </span>
                                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                  {line.value || ' '}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. 중단 에디터 및 다이어그램/HTML 렌더러 영역 */}
                  {(() => {
                    const renderTextarea = (customStyle?: React.CSSProperties) => (
                      <div 
                        style={{ 
                          padding: isInputCollapsed ? '0px 14px' : '14px 16px', 
                          background: '#0d1117', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          flex: 1, 
                          minHeight: '60px', 
                          overflow: 'hidden', 
                          position: 'relative',
                          ...customStyle
                        }}
                      >
                        {/* 고스트 텍스트 오버레이 레이어 */}
                        {!isInputCollapsed && (
                          <div
                            ref={mirrorRef}
                            style={{
                              position: 'absolute',
                              top: '14px',
                              left: '16px',
                              right: '16px',
                              bottom: '14px',
                              pointerEvents: 'none',
                              fontFamily: 'Consolas, "JetBrains Mono", "Fira Code", monospace',
                              fontSize: '13.5px',
                              lineHeight: '1.6',
                              fontWeight: 500,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              color: 'transparent',
                              overflow: 'hidden',
                              textAlign: 'left'
                            }}
                          >
                            <span>{localCode.substring(0, cursorPos)}</span>
                            {suggestion && (
                              <span style={{ color: '#64748b', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', padding: '0 2px' }}>
                                {suggestion}
                              </span>
                            )}
                          </div>
                        )}

                        <textarea
                          ref={textareaRef}
                          value={localCode}
                          onChange={(e) => {
                            const val = e.target.value
                            updateCode(val)
                            setCursorPos(e.target.selectionStart)
                          }}
                          onScroll={handleScroll}
                          onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
                          onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
                          onKeyDown={(e) => {
                            setCursorPos(e.currentTarget.selectionStart)
                            
                            // Tab 키 자동완성
                            if (e.key === 'Tab' && suggestion) {
                              e.preventDefault()
                              const textarea = e.currentTarget
                              const start = textarea.selectionStart
                              const before = localCode.substring(0, start)
                              const after = localCode.substring(start)
                              const newCode = before + suggestion + after
                              updateCode(newCode)
                              setTimeout(() => {
                                textarea.selectionStart = textarea.selectionEnd = start + suggestion.length
                                setCursorPos(start + suggestion.length)
                              }, 0)
                              return
                            }

                            // 일반 Tab 인덴트
                            if (e.key === 'Tab') {
                              e.preventDefault()
                              const textarea = e.currentTarget
                              const start = textarea.selectionStart
                              const end = textarea.selectionEnd
                              const newCode = localCode.substring(0, start) + '  ' + localCode.substring(end)
                              updateCode(newCode)
                              setTimeout(() => {
                                textarea.selectionStart = textarea.selectionEnd = start + 2
                                setCursorPos(start + 2)
                              }, 0)
                              return
                            }

                            // Ctrl+Enter 실행
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault()
                              handleCtrlEnterRun()
                              return
                            }

                            const textarea = e.currentTarget
                            const start = textarea.selectionStart
                            const end = textarea.selectionEnd
                            const text = localCode

                            // 엔터 키 스마트 인덴트
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const lines = text.substring(0, start).split('\n')
                              const currentLine = lines[lines.length - 1]
                              const matchIndent = currentLine.match(/^(\s*)/)
                              let indent = matchIndent ? matchIndent[1] : ''
                              if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':') || currentLine.trim().endsWith('(')) {
                                indent += '  '
                              }
                              const newCode = text.substring(0, start) + '\n' + indent + text.substring(end)
                              updateCode(newCode)
                              setTimeout(() => {
                                textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length
                                setCursorPos(start + 1 + indent.length)
                              }, 0)
                              return
                            }

                            // 괄호 자동 닫힘
                            const PAIRS: Record<string, string> = {
                              '(': ')',
                              '[': ']',
                              '{': '}',
                              '"': '"',
                              "'": "'",
                              '`': '`'
                            }

                            if (PAIRS[e.key]) {
                              e.preventDefault()
                              const openChar = e.key
                              const closeChar = PAIRS[e.key]
                              const selected = text.substring(start, end)
                              const newCode = text.substring(0, start) + openChar + selected + closeChar + text.substring(end)
                              updateCode(newCode)
                              setTimeout(() => {
                                textarea.selectionStart = start + 1
                                textarea.selectionEnd = end + 1
                                setCursorPos(start + 1)
                              }, 0)
                              return
                            }

                            // HTML 태그 자동 닫힘
                            if (language === 'html' && e.key === '>') {
                              const beforeText = text.substring(0, start)
                              const tagMatch = beforeText.match(/<([a-zA-Z1-6]+)(?:\s+[^>]*)?$/)
                              if (tagMatch) {
                                e.preventDefault()
                                const tagName = tagMatch[1]
                                const newCode = beforeText + '>' + '</' + tagName + '>' + text.substring(end)
                                updateCode(newCode)
                                setTimeout(() => {
                                  textarea.selectionStart = textarea.selectionEnd = start + 1
                                  setCursorPos(start + 1)
                                }, 0)
                                return
                              }
                            }
                          }}
                          placeholder={language === 'mermaid' ? 'graph TD\n    A[시작] --> B[완료]' : '// 이곳에 코드를 입력하세요...'}
                          style={{
                            width: '100%',
                            height: '100%',
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: '#f8fafc',
                            fontFamily: 'Consolas, "JetBrains Mono", "Fira Code", monospace',
                            fontSize: '13.5px',
                            lineHeight: '1.6',
                            fontWeight: 500,
                            resize: 'none',
                            outline: 'none',
                            padding: '0',
                            margin: '0',
                            zIndex: 2,
                            caretColor: '#38bdf8'
                          }}
                        />
                      </div>
                    )

                    if (isInputCollapsed) {
                      if (language === 'mermaid') {
                        return (
                          <div style={{ width: '100%', minHeight: '160px', height: '100%', background: '#0a0d14', display: 'flex', overflow: 'hidden' }}>
                            <InlineMermaidRenderer code={localCode} />
                          </div>
                        )
                      }
                      if (language === 'html') {
                        return (
                          <div style={{ padding: '16px', background: '#0a0d14', overflowX: 'auto' }}>
                            <InlineHtmlRenderer code={localCode} />
                          </div>
                        )
                      }
                      return null
                    }

                    if (language === 'mermaid') {
                      if (previewMode === 'preview') {
                        return (
                          <div style={{ flex: 1, minHeight: '140px', width: '100%', height: '100%', background: '#0a0d14', overflow: 'hidden', display: 'flex' }}>
                            <InlineMermaidRenderer code={localCode} />
                          </div>
                        )
                      }
                      if (previewMode === 'split') {
                        return (
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '140px', background: '#0d1117', overflow: 'hidden', height: '100%' }}>
                            {renderTextarea({ borderRight: '1px solid #1e293b' })}
                            <div style={{ background: '#0a0d14', overflow: 'hidden', display: 'flex', height: '100%', width: '100%' }}>
                              <InlineMermaidRenderer code={localCode} />
                            </div>
                          </div>
                        )
                      }
                      return renderTextarea()
                    }

                    if (language === 'html') {
                      if (previewMode === 'preview') {
                        return (
                          <div style={{ flex: 1, minHeight: '120px', padding: '16px', background: '#0a0d14', overflowY: 'auto' }}>
                            <InlineHtmlRenderer code={localCode} />
                          </div>
                        )
                      }
                      if (previewMode === 'split') {
                        return (
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '120px', background: '#0d1117', overflow: 'hidden' }}>
                            {renderTextarea({ borderRight: '1px solid #1e293b' })}
                            <div style={{ padding: '16px', background: '#0a0d14', overflowY: 'auto' }}>
                              <InlineHtmlRenderer code={localCode} />
                            </div>
                          </div>
                        )
                      }
                      return renderTextarea()
                    }

                    return renderTextarea()
                  })()}

                  {/* ─── 5. 인라인 AI 코드 해설 카드 ─── */}
                  {aiExplanation && (
                    <div style={{
                      background: '#131722',
                      borderTop: '1px solid #282e3f',
                      padding: '12px 16px',
                      fontSize: '12.5px',
                      color: '#f8fafc',
                      textAlign: 'left',
                      flexShrink: 0,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      fontFamily: 'Pretendard, -apple-system, sans-serif',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#34d399', fontSize: '11.5px' }}>
                          <BookOpen size={13} />
                          AI 코드 분석 및 해설 리포트
                        </div>
                        <button
                          onClick={() => setAiExplanation(null)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div
                        className="markdown-rendered-body"
                        dangerouslySetInnerHTML={{ __html: marked.parse(aiExplanation) as string }}
                        style={{ lineHeight: '1.6', fontSize: '12.5px' }}
                      />
                    </div>
                  )}

                  {/* 6. 하단 터미널 결과창 */}
                  {parsedRunState.hasRun && (
                    <div style={{ width: '100%', flexShrink: 0 }}>
                      <JupyterCodeEditorTerminal
                        language={language}
                        runState={parsedRunState}
                        code={code}
                        blockId={block.id}
                        onAIFix={(errorLog) => handleAIDebugFix(errorLog)}
                        isFixing={isAIGenerating}
                      />
                    </div>
                  )}
                </div>
              )}
            </ResizableBlockContainer>
          </BlockContentWrapper>
        )
      } catch (err: any) {
        return (
          <div style={{
            padding: '16px',
            margin: '14px 0',
            background: '#fef2f2',
            border: '1.5px solid #f87171',
            borderRadius: '10px',
            color: '#991b1b',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            Jupyter 블록 렌더링 실패: {err.message}
          </div>
        )
      }
    },
    toExternalHTML: ({ block }) => {
      return (
        <pre 
          data-content-type="jupyter" 
          data-language={block.props.language} 
          data-height={block.props.height || '570'}
        >
          <code>{block.props.code}</code>
        </pre>
      )
    }
  }
)

export const JupyterBlock = JupyterBlockSpec()
