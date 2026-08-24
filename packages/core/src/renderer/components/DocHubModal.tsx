/**
 * @file DocHubModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/DocHubModal.tsx
 * @role In-App Official Documentation, IR Pitch Deck, and Business Plan Center
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 메인 사용자 매뉴얼(README), 12-Slide IR Pitch Deck, 정부지원사업 PSST 사업계획서, 시스템 아키텍처 문서를 인앱 뷰어로 직관 제공한다.
 * - 탭 전환, 원문 복사(Copy Markdown), 공식 GitHub 및 Vercel 쇼케이스 랜딩 페이지 바로가기 연동을 지원한다.
 */

import { useState, useMemo } from 'react'
import { FileText, Presentation, Landmark, Layers, Copy, Check, ExternalLink, Globe, Eye, Code } from 'lucide-react'
import { StrictModal } from './ui/modals/StrictModal'
import { useUIStore } from '../stores/useUIStore'
import { marked } from 'marked'

interface DocHubModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'readme' | 'ir' | 'psst' | 'arch'

interface DocItem {
  id: TabType
  title: string
  subtitle: string
  icon: typeof FileText
  badge: string
  githubUrl: string
  content: string
}

const DOCS_DATABASE: Record<TabType, DocItem> = {
  readme: {
    id: 'readme',
    title: 'AMEVA Workstation Main Manual',
    subtitle: '16대 초격차 핵심 기능 & 시스템 사용 매뉴얼 (v0.8.19)',
    icon: FileText,
    badge: 'Official Manual',
    githubUrl: 'https://github.com/uno-km/AMEVA-Workstation-Web/blob/main/README.md',
    content: `# AMEVA Workstation: Next-Gen AI-Powered Integrated Media Workspace

The World's First 100% On-Device WebGPU AI & In-App Multi-Media Workspace

외부 서버 데이터 전송 0% & 서버비 0원 — 사용자의 GPU(WebGPU)를 활용한 초고속 온디바이스 로컬 AI 추론, 비디오 타임라인 컷편집, 이미지 AI 배경제거, 오디오 무음 자동삭제, 대용량 PDF 3단계 맵리듀스, 지능형 인터랙티브 지오매핑을 단일 런타임에 통합한 차세대 지식 워크스테이션입니다.

---

## 16대 핵심 기능 요약 매뉴얼

1. 멀티미디어 인앱 저작 스튜디오 (Video / Image / Audio)
   - 비디오 타임라인 컷편집 & 8방향 비례 리사이저 (/video)
   - 이미지 갤러리 & Fabric.js 캔버스 + AI 1초 배경 제거 (/image)
   - 오디오 파형 스튜디오 & 무음존 자동 감지 및 1-클릭 일괄 삭제 (/audio)

2. 온디바이스 WebGPU 문서 인텔리전스 & 맵리듀스 요약 덱 (/doc)
   - PDF, DOCX, PPTX, HWPX 3초 Fast-Pass 고속 요약 및 대용량 3단계 맵리듀스 카드 덱

3. Mini-Colab & 브라우저 WebGPU 텐서 연산 셰이더 (/colab)
   - WGSL 셰이더(matmul, elementwise) 브릿지를 통한 초고속 텐서 가속

4. Knowledge Graph 3D/2D 지식 관계망 시각화 뷰어 (/graph)
   - 60fps Web Worker 기반 인터랙티브 포스-지향 지식 그래프

5. FortuneSheet 완전 호환 인앱 엑셀 스프레드시트 (/excel)
   - MS Excel .xlsx 무손실 양방향 임포트/익스포트 및 실시간 셀 수식 연산

6. Excalidraw 완전 내장 화이트보드 드로잉 (/drawing)
   - 자유형 손그림, 시스템 다이어그램, UI 와이어프레임 캔버스

7. 인라인 인터랙티브 칸반 보드 (/kanban)
   - 마크다운 본문 내 드래그 앤 드롭 업무 관리 보드

8. 인터랙티브 지오매핑 & 최적 경로 탐색 시스템 (/map)
   - OpenStreetMap 장소 검색, 다중 핀 꽂기, OSRM 최적 경로 탐색 직렬화

9. 파이썬 WASM 샌드박스 & HTML 라이브 런타임 (/jupyter, /code)
   - Pyodide WASM 기반 NumPy, Pandas, Matplotlib 차트 실행

10. Mermaid 다이어그램 지능형 문법 자동 보정기 (/mermaid)
    - 콜론 문법 오류 및 줄바꿈 누락 자동 보정

11. 신경망 실시간 번역 & 4대 맞춤형 문체 다듬기
    - 6개 국어 WebGPU 번역 & 학술/비즈니스/캐주얼/기술 문체 AI Diff 뷰어

12. 차세대 자율 AI 에이전트 & 로컬 RAG 패널 (Cmd/Ctrl + L)
    - Qwen2.5 온디바이스 추론 & 에디터 도구 자율 호출

13. 유튜브 타임스탬프 & 스마트 링크 프리뷰 (/youtube, /link)
14. Presentation 모드 (1-클릭 슬라이드 쇼 변환)
15. 8대 포맷 네이티브 무손실 내보내기 (.docx, .pptx, .hwpx, .xlsx, .pdf, .html, .xml, .adc)
16. 인앱 확장 마켓플레이스 & 실시간 문서 미니맵 (Minimap)`
  },
  ir: {
    id: 'ir',
    title: 'Series Seed / Pre-A Investor Pitch Deck',
    subtitle: '실리콘밸리 YC & Top-Tier VC 표준 12-Slide 투자 유치 피치덱',
    icon: Presentation,
    badge: 'Confidential IR',
    githubUrl: 'https://github.com/uno-km/AMEVA-Workstation-Web/blob/main/docs/IR_PITCH_DECK.md',
    content: `# AMEVA Workstation: Series Seed / Pre-A Investor Pitch Deck

Target Round: $1,500,000 USD (SAFE / Equity, Post-Money Valuation $10,000,000 USD)
Lead Architect: Uno Kim (uno-km)
Live Demo: https://ameva-workstation-web-core.vercel.app/

---

## Slide 1: Company Vision & Core Mission
"Every byte of enterprise intelligence remains sovereign on client hardware.
 Every multimedia authoring pipeline unified in a zero-latency document canvas."

## Slide 2: The Problem (Market Pain Point)
1. Enterprise Data Exfiltration: 74% of regulated enterprises in defense, finance, and medical sectors ban cloud AI due to IP leaks.
2. Tool Fragmentation: Workers juggle 8.3 SaaS tools (Notion, Premiere, Photoshop, Audacity, Excel), losing 40% productivity.
3. Compounding Token Costs: Cloud AI token bills scale linearly with employee count.

## Slide 3: The AMEVA Solution
Zero-Leakage On-Device WebGPU AI + In-App Multimedia Studio (Video/Audio/Image) + Zero Server Infrastructure Cost.

## Slide 4: Deep Product Breakdown & Architecture
16-Core capability suite including WebGPU Qwen2.5, Audio Silence Purge, Fabric.js BG Remover, Document Map-Reduce, FortuneSheet, Excalidraw, OSRM Routing.

## Slide 5: Proprietary Technology Moats
1. WebGPU Zero-Copy Tensor Bridge: Native desktop inference speed.
2. In-Canvas Media Processing DSP: Sub-millisecond client audio/image processing.
3. The .adc Sovereign Container: AES-GCM 256-bit encrypted single-file archive.

## Slide 6: Market Opportunity (TAM / SAM / SOM)
TAM: $78.5B (Global Collaboration & AI Software)
SAM: $14.2B (Security-Mandated Regulated Workspaces)
SOM: $450M (3-Year Target Beachhead Market Share)

## Slide 7: Business Model & Unrivaled Unit Economics
- B2C Community: Free (Open-Source Core)
- B2B Team SaaS: $15 / user / month
- Enterprise Sovereign: $50,000 to $250,000+ / year (On-Premise)
- Gross Margin: 92%+ (Client-side WebGPU compute offloading)

## Slide 8: Go-To-Market Strategy
Phase 1: Open Source & Developer Viral (10k+ Stars)
Phase 2: Product-Led Growth & Team Subscriptions
Phase 3: Top-Down Air-Gapped Enterprise & Gov Contracting

## Slide 9: Competitive Teardown
vs Notion AI: 100% Local Privacy & In-App Video/Audio vs Cloud Data Exfiltration.
vs Obsidian: Out-of-the-box WebGPU AI & Real-time P2P vs Brittle Plugins.

## Slide 10: 3-Year Financial Model
- Year 1: $780K ARR (120K MAU)
- Year 2: $4.85M ARR (750K MAU, Break-Even)
- Year 3: $21.2M ARR (3.2M MAU, +$9.4M Operating Profit)

## Slide 11: Founding Team & Execution Track Record
Uno Kim (uno-km) - Principal System Architect & Full-Stack Engine Creator.

## Slide 12: The Ask ($1.5M Seed Round)
- R&D & Engineering (50%): Quantization & Custom WGSL Shaders.
- Compliance & GTM (30%): SOC2 Type II, ISMS-P, CSAP & Tier-1 PoCs.
- Community & Growth (20%): Global Hackathons & Product Hunt Launch.`
  },
  psst: {
    id: 'psst',
    title: '정부지원사업 표준 사업계획서 (PSST)',
    subtitle: '예비·초기창업패키지 / TIPS / 디딤돌 R&D 심사위원 맞춤형 양식',
    icon: Landmark,
    badge: 'Gov R&D / PSST',
    githubUrl: 'https://github.com/uno-km/AMEVA-Workstation-Web/blob/main/docs/GOV_STARTUP_BUSINESS_PLAN_PSST.md',
    content: `# [정부지원사업 표준 사업계획서 (PSST 양식)]
과제명: 온디바이스(On-Device) WebGPU AI 및 클라이언트 사이드 미디어 스튜디오가 통합된 기업 기밀 유출 0% 엔터프라이즈 마크다운 워크스테이션(AMEVA) 개발

---

## 1. Problem (문제 인식)
- 생성형 AI 도입에 따른 기업 대외비 및 핵심 지식재산권(IP) 유출 위기 심화.
- 금융사, 방산기업, 의료기관 74% 이상이 사내 AI 사용 금지 또는 제한.
- 8개 이상의 분절된 툴 사용으로 인한 컨텍스트 스위칭 비용 과다.

## 2. Solution (실현 가능성 및 기술 개발)
- 클라우드 서버비 $0 & 100% 프라이버시 WebGPU 가속 엔진 (Qwen2.5, Whisper).
- 인앱 비디오 컷편집, Fabric.js 캔버스 & AI 1초 배경제거, 오디오 무음존 자동 삭제.
- 대용량 PDF/DOCX/PPTX/HWPX 3초 Fast-Pass & 3단계 맵리듀스 요약 덱.
- TRL(기술성숙도) 7단계 달성: 실제 배포 운영 중인 라이브 데모 확보.

## 3. Scale-up (성장 전략 및 비즈니스 모델)
- B2C Freemium -> B2B Pro SaaS (월 15,000원) -> Enterprise 온프레미스 (연 5,000만~2억 원).
- 매출총이익률 92%+ 달성: 클라이언트 연산 기반 한계비용 제로 모델.
- 조달청 혁신제품 등록 및 CSAP/ISMS-P 인증을 통한 공공/국방 시장 진입.

## 4. Team (팀 구성 및 사업화 역량)
- 대표자 / 총괄 아키텍트 (uno-km): AMEVA 아키텍처 100% 설계 및 풀스택 개발.
- 9개월 1억 원 정부지원금 상세 집행 계획 (R&D 35%, PoC 40%, 인증 25%).`
  },
  arch: {
    id: 'arch',
    title: 'AMEVA System Architecture Specification',
    subtitle: '엔터프라이즈 시스템 토폴로지, VFS, WebGPU 텐서 브릿지 설계 명세',
    icon: Layers,
    badge: 'Tech Architecture',
    githubUrl: 'https://github.com/uno-km/AMEVA-Workstation-Web/blob/main/docs/AMEVA_Architecture_Design_v1.md',
    content: `# AMEVA Enterprise Architecture Design Specification

## System Topology & Security Boundary
- Zero-Knowledge Client Sandbox (Browser & Electron Isolation)
- WebGPU Buffer Direct Memory Mapping (Zero-Copy Tensor Bridge)
- AES-GCM 256-bit Local IndexedDB Encrypted VFS
- P2P / WebRTC & Relay Y.js CRDT Real-time Collaboration Engine

## Key Subsystem Modules
1. Renderer Engine: BlockNote AST + React 19 + Vite 8
2. Compute Core: WebLLM Qwen2.5 0.5B/1.5B/7B + Transformers.js
3. Media Processing DSP: Web Audio API FFT Analyzer + OffscreenCanvas
4. Polyglot WASM Isolation: Pyodide (Python, NumPy, Pandas) + SQLite WASM
5. Document Parsing Pipeline: PDF.js + JSZip (DOCX/PPTX/HWPX)`
  }
}

export function DocHubModal({ isOpen, onClose }: DocHubModalProps) {
  const initialTab = useUIStore((state) => (state.docHubInitialTab as TabType) || 'readme')
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')

  if (!isOpen) return null

  const currentDoc = DOCS_DATABASE[activeTab]

  const parsedHtml = useMemo(() => {
    try {
      return marked.parse(currentDoc.content, { breaks: true, gfm: true }) as string
    } catch {
      return `<pre>${currentDoc.content}</pre>`
    }
  }, [currentDoc.content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDoc.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <StrictModal
      isOpen={isOpen}
      onClose={onClose}
      title="공식 문서 & IR 투자 자료 센터 (Documentation & IR Hub)"
      maxWidth="1050px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh' }}>
        
        {/* 상단 탭 네비게이션 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid var(--border-muted)', 
          paddingBottom: '12px' 
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(Object.keys(DOCS_DATABASE) as TabType[]).map((tabKey) => {
              const item = DOCS_DATABASE[tabKey]
              const Icon = item.icon
              const isActive = activeTab === tabKey
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    backgroundColor: isActive ? 'var(--primary-glow)' : 'var(--bg-glass)',
                    color: isActive ? '#38bdf8' : 'var(--text-muted)',
                    border: `1px solid ${isActive ? 'var(--secondary)' : 'var(--border-muted)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  <span>{item.title.split(' ')[0]} {item.id === 'readme' ? 'README' : item.id === 'ir' ? 'Pitch Deck' : item.id === 'psst' ? 'PSST Plan' : 'Architecture'}</span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* 뷰 모드 토글 (렌더링 vs 원본) */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-muted)' }}>
              <button
                onClick={() => setViewMode('preview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  background: viewMode === 'preview' ? '#2563eb' : 'transparent',
                  color: viewMode === 'preview' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Eye size={12} />
                <span>렌더링</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  background: viewMode === 'raw' ? '#2563eb' : 'transparent',
                  color: viewMode === 'raw' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Code size={12} />
                <span>마크다운 소스</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                backgroundColor: copied ? 'rgba(16,185,129,0.2)' : 'var(--bg-glass)',
                color: copied ? '#34d399' : 'var(--text-main)',
                border: '1px solid var(--border-muted)',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? '복사 완료!' : '마크다운 복사'}</span>
            </button>
            <a
              href={currentDoc.githubUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                backgroundColor: 'var(--bg-glass)',
                color: '#60a5fa',
                border: '1px solid var(--border-muted)',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} />
              GitHub 원문
            </a>
            <a
              href="/promo/index.html"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                border: 'none',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <Globe size={13} />
              쇼케이스 웹사이트
            </a>
          </div>
        </div>

        {/* 문서 헤더 안내 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-muted)'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              {currentDoc.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentDoc.subtitle}
            </div>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(56,189,248,0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(56,189,248,0.3)'
          }}>
            {currentDoc.badge}
          </span>
        </div>

        {/* 문서 본문 스크롤 영역 (마크다운 렌더링 vs 원본 뷰) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#070a0f',
          border: '1px solid var(--border-muted)',
          borderRadius: '8px',
          padding: '24px',
          maxHeight: '56vh'
        }}>
          {viewMode === 'preview' ? (
            <div 
              className="dochub-markdown-body"
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
              style={{
                color: '#e2e8f0',
                fontSize: '13.5px',
                lineHeight: '1.75'
              }}
            />
          ) : (
            <pre style={{
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: '12px',
              lineHeight: '1.7',
              color: '#94a3b8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0
            }}>
              {currentDoc.content}
            </pre>
          )}
        </div>

        <style>{`
          .dochub-markdown-body h1 { font-size: 20px; font-weight: 800; color: #38bdf8; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(56,189,248,0.25); padding-bottom: 8px; }
          .dochub-markdown-body h2 { font-size: 16px; font-weight: 700; color: #60a5fa; margin: 20px 0 10px 0; border-left: 3px solid #3b82f6; padding-left: 10px; }
          .dochub-markdown-body h3 { font-size: 14px; font-weight: 700; color: #34d399; margin: 16px 0 8px 0; }
          .dochub-markdown-body h4 { font-size: 13px; font-weight: 700; color: #fbbf24; margin: 12px 0 6px 0; }
          .dochub-markdown-body p { margin-bottom: 12px; }
          .dochub-markdown-body ul, .dochub-markdown-body ol { margin-left: 22px; margin-bottom: 12px; }
          .dochub-markdown-body li { margin-bottom: 5px; }
          .dochub-markdown-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
          .dochub-markdown-body th, .dochub-markdown-body td { border: 1px solid rgba(255,255,255,0.12); padding: 8px 12px; text-align: left; }
          .dochub-markdown-body th { background: rgba(56,189,248,0.12); color: #38bdf8; font-weight: 700; }
          .dochub-markdown-body tr:nth-child(even) { background: rgba(255,255,255,0.03); }
          .dochub-markdown-body code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11.5px; color: #f59e0b; }
          .dochub-markdown-body pre { margin: 14px 0; }
          .dochub-markdown-body pre code { display: block; padding: 12px; background: #030712; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; color: #cbd5e1; }
          .dochub-markdown-body hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0; }
          .dochub-markdown-body blockquote { border-left: 4px solid #38bdf8; color: #94a3b8; margin: 14px 0; background: rgba(56,189,248,0.05); padding: 10px 14px; border-radius: 0 6px 6px 0; }
          .dochub-markdown-body strong { color: #f8fafc; font-weight: 700; }
        `}</style>

      </div>
    </StrictModal>
  )
}
