/**
 * ============================================================================
 * @file InlineMapRenderer.tsx
 * @description InlineMapRenderer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트]
import React, { Suspense } from 'react'
import { MapPin } from 'lucide-react'

// [내부 프로젝트 의존성 모듈 임포트]
import type { MapPinData, MapRouteData } from '../map/AmevaMapViewer'

const AmevaMapViewer = React.lazy(() => import('../map/AmevaMapViewer').then(m => ({ default: m.AmevaMapViewer })))

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineMapRenderer`
   * - 역할: ameva-map 마크다운 코드블록의 JSON 데이터를 파싱하여 AmevaMapViewer 프레임과 메모, 범례 등을 조합해 반응형 지도로 렌더링함.
   * - 예외 처리: 잘못된 JSON 포맷인 경우 에러 문구를 포함한 <div>를 렌더링.
   */
/**
 * InlineMapRenderer 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function InlineMapRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `data`
   * - 자료형 / 예상 값: { lat, lng, destLat, destLng, zoom, locationName, destination, legend, memo, mapMode, pins, useUserLocation }
   * - 시나리오: JSON 파싱된 지도 설정 객체 데이터 획득.
   */
  let data: any = null
  try {
    data = JSON.parse(code)
  } catch (err) {
    console.error('[InlineMapRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>지도 정보를 해석할 수 없습니다.</div>
  }

  const lat = parseFloat(data.lat) || 37.5665
  const lng = parseFloat(data.lng) || 126.9780
  const destLat = data.destLat ? parseFloat(data.destLat) : undefined
  const destLng = data.destLng ? parseFloat(data.destLng) : undefined
  const zoom = parseInt(data.zoom, 10) || 14
  const locationName = data.locationName || '서울시'
  const destination = data.destination || ''
  const legend = data.legend || ''
  const memo = data.memo || ''
  
  // 고도화 필드 파싱
  const mapMode = data.mapMode || 'pin'
  const pins: MapPinData[] = typeof data.pins === 'string' ? JSON.parse(data.pins || '[]') : (data.pins || [])
  const routes = typeof data.routes === 'string' ? JSON.parse(data.routes || '[]') : (data.routes || [])
  const useUserLocation = data.useUserLocation === 'true'

  return (
    <div style={{
      margin: '16px 0',
      width: '100%',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-muted)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      {/* 헤더 바 */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: 'var(--bg-surface)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#10b981' }}><MapPin size={14} /></span>
            {destination && mapMode === 'route' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                <span style={{ color: '#38bdf8' }}>[출발]</span> {locationName}
                <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>➔</span>
                <span style={{ color: '#facc15' }}>[도착]</span> {destination}
              </div>
            ) : (
              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>{locationName}</span>
            )}
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({lat}, {lng})</span>
          </div>
          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>확대: {zoom}x</span>
        </div>
        {legend && (
          <div style={{
            marginTop: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.2)',
            fontSize: '10px',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>ℹ️</span>
            <span style={{ fontWeight: 'bold' }}>범례/경로 정보:</span>
            <span>{legend}</span>
          </div>
        )}
      </div>
      
      {/* 지도 렌더러 영역 */}
      <AmevaMapViewer
        mapMode={mapMode}
        pins={pins}
        routes={routes}
        startLat={lat}
        startLng={lng}
        destLat={destLat}
        destLng={destLng}
        useUserLocation={useUserLocation}
        zoom={zoom}
      />

      {/* 메모 */}
      {memo && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-muted)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          textAlign: 'left'
        }}>
          <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)' }}>📝 사용자 메모</span>
          <div style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'var(--bg-deep)',
            border: '1px dashed var(--border-muted)',
            color: 'var(--text-main)',
            fontSize: '11px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            {memo}
          </div>
        </div>
      )}
    </div>
  )
}
