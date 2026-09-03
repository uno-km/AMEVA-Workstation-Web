/**
 * ============================================================================
 * @file JupyterCodeEditorHeader.tsx
 * @description JupyterCodeEditorHeader.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * ============================================================================
 */

import { useState } from 'react'
import { Play, Copy, ChevronDown, Sparkles, Eye, Code2, Columns } from 'lucide-react'
import { type AmevaEditor } from '../../editor/amevaBlockSchema'
import { useCodeRuntime } from '../../hooks/useCodeRuntime'
import { getLangMeta, getDefaultCodeForLanguage, isDefaultCodeTemplate } from './langMeta'
import { LanguagePickerMenu } from './LanguagePickerMenu'

export function JupyterCodeEditorHeader({
  code,
  language,
  blockId,
  editor,
  onRunStart,
  onRunSuccess,
  onRunFailure,
  isInputCollapsed = false,
  onToggleInputCollapse,
  isAIOpen = false,
  onToggleAI,
  isAIGenerating = false,
  previewMode = 'preview',
  onTogglePreviewMode,
}: {
  code: string
  language: string
  blockId: string
  editor: AmevaEditor
  onRunStart: () => void
  onRunSuccess: (success: boolean, lines: string[], tableData?: any) => void
  onRunFailure: (errMessage: string) => void
  isInputCollapsed?: boolean
  onToggleInputCollapse?: () => void
  isAIOpen?: boolean
  onToggleAI?: () => void
  isAIGenerating?: boolean
  previewMode?: 'preview' | 'code' | 'split'
  onTogglePreviewMode?: (mode: 'preview' | 'code' | 'split') => void
}) {
  const { isRunning, executeCode } = useCodeRuntime()
  const meta = getLangMeta(language)
  const [copied, setCopied] = useState(false)

  const handleRun = async () => {
    onRunStart()
    try {
      if (language === 'html') {
        onRunSuccess(true, ['렌더링 완료'])
        return
      }
      const result = await executeCode(language, code)
      onRunSuccess(result.success, (result.output || '').split('\n'), result.tableData)
    } catch (err: any) {
      onRunFailure(err.message || '알 수 없는 에러')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const accentColor = meta.color

  return (
    <div
      className="jupyter-cell-header editor-cell-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        height: '100%',
        background: '#161b26',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        userSelect: 'none',
        boxSizing: 'border-box',
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* 코드 영역 접기/펼치기 */}
      {onToggleInputCollapse && (
        <button
          onClick={onToggleInputCollapse}
          title={isInputCollapsed ? '코드 영역 펼치기' : '코드 영역 접기'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            marginRight: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
          }}
        >
          <ChevronDown
            size={15}
            style={{
              transform: isInputCollapsed ? 'rotate(-90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      )}

      {/* 언어 선택 셀렉터 (자주 쓰는 언어 + 기타 언어 서브메뉴) */}
      <LanguagePickerMenu
        currentLanguage={language}
        onSelectLanguage={(val) => {
          const currentBlockProps = (editor.getBlock(blockId)?.props as any) || {}
          const currentCode = currentBlockProps.code || ''
          const shouldUpdateCode = isDefaultCodeTemplate(language, currentCode)

          editor.updateBlock(blockId, {
            type: 'jupyter' as any,
            props: {
              ...currentBlockProps,
              language: val,
              code: shouldUpdateCode ? getDefaultCodeForLanguage(val) : currentCode,
              runState: JSON.stringify({ hasRun: false, success: null, outputLines: [] })
            }
          } as any)
        }}
      />

      {/* Mermaid / HTML 전용 뷰 모드 토글 (다이어그램 / 코드 / 분할) */}
      {(meta.isMermaid || meta.isHtml) && onTogglePreviewMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0d1117',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '5px',
          padding: '2px',
          gap: '2px',
          marginLeft: '4px'
        }}>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onTogglePreviewMode('preview')
            }}
            title={meta.isMermaid ? '다이어그램 렌더링 뷰' : 'HTML 렌더링 뷰'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: previewMode === 'preview' ? '#2563eb' : 'transparent',
              color: previewMode === 'preview' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={11} />
            {meta.isMermaid ? '다이어그램' : '미리보기'}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onTogglePreviewMode('code')
            }}
            title="소스코드 편집 뷰"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: previewMode === 'code' ? '#2563eb' : 'transparent',
              color: previewMode === 'code' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Code2 size={11} />
            코드
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onTogglePreviewMode('split')
            }}
            title="코드 및 다이어그램 분할 뷰"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: previewMode === 'split' ? '#2563eb' : 'transparent',
              color: previewMode === 'split' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Columns size={11} />
            분할
          </button>
        </div>
      )}

      {/* 우측 액션 버튼들 */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* ✨ AI 어시스턴트 토글 버튼 */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleAI?.()
          }}
          title={isAIOpen ? 'AI 패널 닫기' : 'AI 인텔리전스 (코드 자동생성, 에러 수정, 복잡도 최적화, 해설)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: isAIOpen
              ? 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)'
              : 'rgba(59, 130, 246, 0.15)',
            border: `1px solid ${isAIOpen ? '#38bdf8' : 'rgba(59, 130, 246, 0.35)'}`,
            color: isAIOpen ? '#ffffff' : '#93c5fd',
            borderRadius: '5px',
            padding: '4px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isAIOpen ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={12} color={isAIOpen ? '#ffffff' : '#38bdf8'} />
          AI {isAIGenerating ? '생성 중...' : '어시스턴트'}
        </button>

        {/* 실행 버튼 */}
        {meta.runnable && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleRun()
            }}
            disabled={isRunning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isRunning ? '#475569' : accentColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '4px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: isRunning ? 'none' : `0 2px 8px ${accentColor}40`,
              transition: 'all 0.15s ease',
            }}
          >
            <Play size={10} fill="#ffffff" />
            Run
          </button>
        )}

        {/* 복사 버튼 */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCopy()
          }}
          title="코드 복사"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '5px',
            padding: '4px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            color: copied ? '#34d399' : '#f1f5f9',
            transition: 'all 0.15s ease',
          }}
        >
          <Copy size={11} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
