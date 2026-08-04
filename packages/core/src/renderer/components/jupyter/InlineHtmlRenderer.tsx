/**
 * @file InlineHtmlRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/jupyter/InlineHtmlRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import React from 'react'
import { Globe } from 'lucide-react'

// HTML 미리보기 샌드박스 렌더러
export function InlineHtmlRenderer({ code }: { code: string }) {
  return (
    <div style={{
      border: '1px solid rgba(249,115,22,0.35)',
      borderRadius: '10px',
      overflow: 'hidden',
      margin: '16px 0',
      background: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      <div style={{
        background: '#111827',
        padding: '8px 14px',
        fontSize: '11px',
        color: '#f97316',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: '1px solid rgba(249,115,22,0.2)',
        userSelect: 'none',
      }}>
        <Globe size={12} style={{ color: '#f97316' }} />
        HTML 실시간 렌더링 화면 (Live Sandbox)
      </div>
      <iframe
        sandbox="allow-scripts allow-modals"
        title="Inline HTML Preview"
        srcDoc={code}
        style={{
          width: '100%',
          height: '380px',
          border: 'none',
          background: '#fff',
        }}
      />
    </div>
  )
}

