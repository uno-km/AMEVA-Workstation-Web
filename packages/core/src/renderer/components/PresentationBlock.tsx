/**
 * @file PresentationBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/PresentationBlock.tsx
 * @role BlockNote custom React block component for PPTX slide show presentation playback.
 */

import { useState, useEffect, useCallback } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Presentation, ChevronLeft, ChevronRight, Maximize2, Minimize2, AlertCircle } from 'lucide-react'
import { type AmevaBlock, type AmevaEditor } from '../editor/amevaBlockSchema'

interface PresentationBlockComponentProps {
  block: AmevaBlock
  editor: AmevaEditor
}

/**
 * @component PresentationBlockComponent
 * @description PPTX 프레젠테이션 슬라이드를 캐러셀 형태로 뷰잉하고,
 *              전체 화면 슬라이드 쇼 형태로 재생할 수 있는 반응형 에디터 블록 컴포넌트입니다.
 */
export const PresentationBlockComponent = ({ block, editor: _editor }: PresentationBlockComponentProps) => {
  const props = block.props as any

  const { pptxPath = '', slides = '', fallback = false, slidesText = '[]' } = props

  const slidesArray = typeof slides === 'string' ? (slides ? slides.split(',') : []) : (Array.isArray(slides) ? slides : [])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 텍스트 폴백 데이터 파싱
  const parsedSlidesText = (() => {
    try {
      return slidesText ? JSON.parse(slidesText) : []
    } catch {
      return []
    }
  })()

  const totalSlides = fallback ? parsedSlidesText.length : slidesArray.length

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1))
  }, [totalSlides])

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0))
  }, [totalSlides])

  // 전체화면 슬라이드 쇼 조율 키보드 리스너
  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, handleNext, handlePrev])

  if (totalSlides === 0) {
    return (
      <div 
        className="bn-custom-block"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          color: 'var(--text-muted, #9ca3af)',
          textAlign: 'center',
          margin: '12px 0'
        }}
      >
        <Presentation size={36} style={{ marginBottom: '8px', opacity: 0.6 }} />
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>프레젠테이션 데이터를 준비하는 중입니다...</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.5 }}>{pptxPath || 'PPTX 파일 변환 중'}</p>
      </div>
    )
  }

  return (
    <div 
      className={`bn-custom-block presentation-block-wrapper ${isFullscreen ? 'fullscreen-slide' : ''}`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#0a0a0c',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      } : {
        position: 'relative',
        width: '100%',
        maxWidth: '720px',
        margin: '16px auto',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #18181f 0%, #121217 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* 슬라이드 렌더링 뷰포트 */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#09090b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {fallback ? (
          /* Text Fallback 모드 렌더러 */
          <div 
            style={{
              padding: '40px',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              color: '#f3f4f6',
              background: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f0d2c 100%)',
              textAlign: 'left',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', opacity: 0.7 }}>
              <AlertCircle size={16} color="#8b5cf6" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Text Outline Fallback Mode
              </span>
            </div>
            
            <h3 style={{ margin: '0 0 12px 0', fontSize: isFullscreen ? '32px' : '22px', color: '#fff', fontWeight: 700 }}>
              Slide {parsedSlidesText[currentSlide]?.slide_index}
            </h3>
            
            <div style={{ width: '100%', fontSize: isFullscreen ? '22px' : '15px', lineHeight: 1.6, opacity: 0.85 }}>
              {parsedSlidesText[currentSlide]?.texts?.map((t: string, i: number) => (
                <p key={i} style={{ margin: '8px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>•</span>
                  <span>{t}</span>
                </p>
              )) || <p style={{ fontStyle: 'italic', opacity: 0.5 }}>본문에 텍스트 내용이 없는 슬라이드입니다.</p>}
            </div>
          </div>
        ) : (
          /* PNG 이미지 컴파일 렌더러 */
          <img 
            src={slidesArray[currentSlide]} 
            alt={`Slide ${currentSlide + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* 홉업용 슬라이드 컨트롤 오버레이 (마우스 오버 시 선명하게 노출) */}
        <div 
          className="slide-controls"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            borderRadius: '24px',
            background: 'rgba(15, 15, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10
          }}
        >
          <button 
            onClick={handlePrev}
            style={{
              border: 'none',
              background: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, minWidth: '50px', textAlign: 'center' }}>
            {currentSlide + 1} / {totalSlides}
          </span>

          <button 
            onClick={handleNext}
            style={{
              border: 'none',
              background: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 전체화면 토글 버튼 */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(15, 15, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            padding: '8px',
            borderRadius: '50%',
            transition: 'background-color 0.2s, transform 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* 컴팩트 꼬리 정보바 (에디터 내 뷰 모드일 때 파일 경로 제공) */}
      {!isFullscreen && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            fontSize: '11px',
            color: '#9ca3af',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Presentation size={12} color="#8b5cf6" />
            <span style={{ fontWeight: 600, color: '#f3f4f6' }}>
              {pptxPath.split(/[\\/]/).pop() || 'Presentation'}
            </span>
          </div>
          <span style={{ opacity: 0.6 }}>
            {fallback ? 'Text Mode (PowerPoint 미검출)' : 'Image Mode'}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * BlockNote amevaSchema 에 병합할 Presentation 커스텀 블록 사양 정의
 */
export const PresentationBlockSpec = createReactBlockSpec(
  {
    type: 'presentation',
    propSchema: {
      pptxPath: { default: '' },
      slides: { default: '' },
      fallback: { default: false },
      slidesText: { default: '[]' }
    },
    content: 'none'
  },
  {
    render: (props) => (
      <PresentationBlockComponent block={props.block as any} editor={props.editor as any} />
    )
  }
)

export const PresentationBlock = PresentationBlockSpec()
