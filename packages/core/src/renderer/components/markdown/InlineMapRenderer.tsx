/**
 * @file InlineMapRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineMapRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 ameva-map 인라인 세그먼트 전용 지도 렌더러로 소비.
 */

import React from 'react'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineMapRenderer`
   * - 역할: ameva-map 마크다운 코드블록의 JSON 데이터를 파싱하여 OpenStreetMap 프레임과 메모, 범례 등을 조합해 반응형 지도로 렌더링함.
   */
export function InlineMapRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `data`
   * - 자료형 / 예상 값: { lat, lng, destLat, destLng, zoom, locationName, destination, legend, memo, routeType, routingEngine }
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
  const destLat = data.destLat ? parseFloat(data.destLat) : null
  const destLng = data.destLng ? parseFloat(data.destLng) : null
  const zoom = parseInt(data.zoom, 10) || 14
  const locationName = data.locationName || '서울시'
  const destination = data.destination || ''
  const legend = data.legend || ''
  const memo = data.memo || ''
  const routeType = data.routeType || 'none'
  const routingEngine = data.routingEngine || 'osrm'
  
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `mapSrc`
   * - 자료형 / 예상 값: string
   * - 시나리오: 경로 설정 여부에 따라 OSM의 단일 마커 지도 소스 혹은 방향 경로 안내 페이지 소스를 분기 구성함.
   */
  let mapSrc = ''
  
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `destLat !== null && destLng !== null && !isNaN(destLat) && !isNaN(destLng)`
   * - 만족 시: 출발지와 목적지 경로 탐색 소스를 빌드.
   * - 불만족 시: 단일 마커 지도 좌표 bbox 소스를 빌드.
   */
  if (destLat !== null && destLng !== null && !isNaN(destLat) && !isNaN(destLng)) {
    let engineParam = 'fossgis_osrm_car'
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `routingEngine` 엔진 타입 및 `routeType` 이동 수단 판별
     * - 만족 분기: osrm, graphhopper, valhalla 각 수단별 파라미터 세팅.
     */
    if (routingEngine === 'osrm') {
      engineParam = routeType === 'car' ? 'fossgis_osrm_car' : routeType === 'bicycle' ? 'fossgis_osrm_bike' : 'fossgis_osrm_foot'
    } else if (routingEngine === 'graphhopper') {
      engineParam = routeType === 'car' ? 'graphhopper_car' : routeType === 'bicycle' ? 'graphhopper_bicycle' : 'graphhopper_foot'
    } else if (routingEngine === 'valhalla') {
      engineParam = routeType === 'car' ? 'valhalla_car' : routeType === 'bicycle' ? 'valhalla_bicycle' : 'valhalla_foot'
    }
    mapSrc = 'https://www.openstreetmap.org/directions?engine=' + engineParam + '&route=' + lat + ',' + lng + ';' + destLat + ',' + destLng
  } else {
    const delta = Math.max(0.001, 0.5 / Math.pow(2, zoom - 10))
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  }

  return (
    <div style={{
      margin: '16px 0',
      width: '100%',
      backgroundColor: '#18181c',
      border: '1px solid var(--border-muted)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      {/* 헤더 바 */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: '#121215',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#10b981' }}>📍</span>
            {destination ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 'bold', color: '#f8fafc' }}>
                <span style={{ color: '#38bdf8' }}>[출발]</span> {locationName}
                <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>➔</span>
                <span style={{ color: '#facc15' }}>[도착]</span> {destination}
              </div>
            ) : (
              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#f8fafc' }}>{locationName}</span>
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
      {/* 지도 */}
      <div style={{ height: '480px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <iframe
          src={mapSrc}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{
            position: 'absolute',
            top: '-50px',
            left: 0,
            width: '100%',
            height: 'calc(100% + 50px)',
            border: 0,
            filter: 'invert(0.9) hue-rotate(180deg)'
          }}
          allowFullScreen
          loading="lazy"
          title={`지도: ${locationName}`}
        />
      </div>
      {/* 메모 */}
      {memo && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-muted)',
          background: 'rgba(255,255,255,0.01)',
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
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
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
