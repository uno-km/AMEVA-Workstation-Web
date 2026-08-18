/**
 * ============================================================================
 * @file AmevaMapViewer.tsx
 * @description AmevaMapViewer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * ============================================================================
 */

import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet 기본 마커 아이콘 깨짐 방지 (Vite/Webpack 호환)
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

// 사용자 위치 핀 커스텀 (초록색 느낌)
const UserIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

export interface MapPinData {
  lat: number
  lng: number
  name: string
  address?: string
  description?: string
}

export interface MapRouteData {
  id: string
  name: string
  description?: string
  startLat: number
  startLng: number
  destLat: number
  destLng: number
  color: string
  type: 'driving' | 'walking' | 'cycling'
}

interface AmevaMapViewerProps {
  mapMode: 'pin' | 'route'
  pins: MapPinData[]
  routes?: MapRouteData[] // V2 멀티 경로
  startLat?: number
  startLng?: number
  destLat?: number
  destLng?: number
  useUserLocation: boolean
  zoom?: number
  height?: string
}

// 리사이징 시 Leaflet 지도 크기 재계산 컴포넌트
function MapResizer({ height }: { height?: string }) {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [height, map])
  return null
}

// 지도 영역 자동 맞춤 컴포넌트
function MapFitter({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  }, [bounds, map])
  return null
}

// 클릭 시 이동하는 마커
function InteractiveMarker({ position, icon, children, onClick }: { position: [number, number], icon?: L.Icon | L.DivIcon, children?: React.ReactNode, onClick?: () => void }) {
  const map = useMap()
  return (
    <Marker 
      position={position} 
      icon={icon || DefaultIcon}
      eventHandlers={{
        click: () => {
          map.flyTo(position, map.getZoom(), { duration: 1 })
          if (onClick) onClick()
        }
      }}
    >
      {children}
    </Marker>
  )
}

// 개별 OSRM 경로 렌더러
function RouteRenderer({ route, onSelect }: { route: MapRouteData, onSelect: () => void }) {
  const [positions, setPositions] = useState<[number, number][]>([])
  const [info, setInfo] = useState<{ duration: number, distance: number } | null>(null)

  useEffect(() => {
    let active = true
    const fetchRoute = async () => {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/${route.type}/${route.startLng},${route.startLat};${route.destLng},${route.destLat}?overview=full&geometries=geojson`)
        const data = await res.json()
        if (!active) return
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])
          setPositions(coords)
          setInfo({
            duration: data.routes[0].duration,
            distance: data.routes[0].distance
          })
        }
      } catch (e) {
        console.error('OSRM Route fetch error:', e)
      }
    }
    fetchRoute()
    return () => { active = false }
  }, [route])

  if (positions.length === 0) return null

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return '1분 미만'
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}분`
    const h = Math.floor(m / 60)
    return `${h}시간 ${m % 60}분`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const typeLabel = route.type === 'driving' ? '🚗 자동차' : route.type === 'cycling' ? '🚲 자전거' : '🚶 도보'

  return (
    <>
      <Polyline positions={positions} color={route.color} weight={5} opacity={0.8} />
      <InteractiveMarker position={[route.destLat, route.destLng]} onClick={onSelect}>
        <Popup>
          <div style={{ padding: '4px', textAlign: 'left' }}>
            <strong style={{ fontSize: '12px', color: route.color }}>{route.name || '도착지'}</strong>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              <strong>{typeLabel}</strong>: {info ? `${formatDuration(info.duration)} (${formatDistance(info.distance)})` : '계산 중...'}
            </div>
            {route.description && (
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                {route.description}
              </div>
            )}
          </div>
        </Popup>
      </InteractiveMarker>
      <InteractiveMarker position={[route.startLat, route.startLng]} onClick={onSelect}>
        <Popup>
          <div style={{ padding: '4px', textAlign: 'left' }}>
            <strong style={{ fontSize: '12px', color: '#666' }}>[출발] {route.name}</strong>
          </div>
        </Popup>
      </InteractiveMarker>
    </>
  )
}

export function AmevaMapViewer({
  mapMode,
  pins,
  routes = [],
  startLat,
  startLng,
  destLat,
  destLng,
  useUserLocation,
  zoom = 14,
  height = '480px'
}: AmevaMapViewerProps) {
  
  const [routeA, setRouteA] = useState<[number, number][]>([])
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null)

  // V2: GPS 실시간 연동 (저장되지 않는 런타임 전용 기능)
  const [isGpsActive, setIsGpsActive] = useState(false)
  const [activeTarget, setActiveTarget] = useState<{lat: number, lng: number} | null>(null)
  const [routeB, setRouteB] = useState<[number, number][]>([])
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null)

  // 기본 단일 경로 탐색 (호환성 A루트용)
  useEffect(() => {
    let active = true
    const fetchRoutes = async () => {
      if (mapMode === 'route' && startLat && startLng && destLat && destLng) {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`)
          const data = await res.json()
          if (!active) return
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])
            setRouteA(coords)
            setBounds(L.latLngBounds(coords))
          }
        } catch(e) {}
      }
    }

    if (mapMode === 'route') {
      fetchRoutes()
    } else {
      setRouteA([])
    }
    return () => { active = false }
  }, [mapMode, startLat, startLng, destLat, destLng])

  // GPS 연동 실시간 위치 추적 및 B->Z 경로 탐색
  useEffect(() => {
    let watchId: number | null = null
    if (isGpsActive && activeTarget && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const uLat = position.coords.latitude
          const uLng = position.coords.longitude
          setUserPos({ lat: uLat, lng: uLng })

          try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${activeTarget.lng},${activeTarget.lat}?overview=full&geometries=geojson`)
            const data = await res.json()
            if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])
              setRouteB(coords)
              setBounds(L.latLngBounds([ [uLat, uLng], [activeTarget.lat, activeTarget.lng] ]))
            }
          } catch(e) {}
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    } else {
      setUserPos(null)
      setRouteB([])
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [isGpsActive, activeTarget])

  // 핀 또는 멀티 경로 바운즈 계산
  useEffect(() => {
    if (mapMode === 'pin' && pins.length > 0) {
      const b = L.latLngBounds(pins.map(p => [p.lat, p.lng]))
      setBounds(b)
    } else if (mapMode === 'route' && routes.length > 0) {
      const points: [number, number][] = []
      routes.forEach(r => {
        points.push([r.startLat, r.startLng])
        points.push([r.destLat, r.destLng])
      })
      if (points.length > 0) {
        setBounds(L.latLngBounds(points))
      }
    }
  }, [mapMode, pins, routes])

  // 초기 중앙점 (에러 방지용)
  const centerLat = startLat || (pins.length > 0 ? pins[0].lat : 37.5665)
  const centerLng = startLng || (pins.length > 0 ? pins[0].lng : 126.9780)

  return (
    <div style={{ width: '100%', height, position: 'relative', zIndex: 0, borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={zoom} 
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <MapResizer height={height} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapFitter bounds={bounds} />

        {/* 다중 핀 렌더링 */}
        {pins.map((pin, i) => (
          <InteractiveMarker 
            key={i} 
            position={[pin.lat, pin.lng]} 
            onClick={() => setActiveTarget({ lat: pin.lat, lng: pin.lng })}
          >
            <Popup>
              <div style={{ padding: '2px', textAlign: 'left' }}>
                <strong style={{ fontSize: '13px' }}>{pin.name}</strong><br />
                {pin.address && <span style={{fontSize: '11px', color: '#666', display: 'block', margin: '4px 0'}}>{pin.address}</span>}
                {pin.description && (
                  <div style={{ fontSize: '11px', color: '#333', marginTop: '6px', whiteSpace: 'pre-wrap', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                    {pin.description}
                  </div>
                )}
              </div>
            </Popup>
          </InteractiveMarker>
        ))}

        {/* 단일 경로(호환성) 렌더링 */}
        {mapMode === 'route' && startLat && startLng && routes.length === 0 && (
          <InteractiveMarker position={[startLat, startLng]}>
            <Popup><strong>출발지 (A)</strong></Popup>
          </InteractiveMarker>
        )}
        {mapMode === 'route' && destLat && destLng && routes.length === 0 && (
          <InteractiveMarker 
            position={[destLat, destLng]}
            onClick={() => setActiveTarget({ lat: destLat, lng: destLng })}
          >
            <Popup><strong>목적지 (Z)</strong></Popup>
          </InteractiveMarker>
        )}
        {routeA.length > 0 && routes.length === 0 && (
          <Polyline positions={routeA} color="#3b82f6" weight={5} opacity={0.8} />
        )}

        {/* V2 다중 경로 렌더링 */}
        {mapMode === 'route' && routes.map((r, i) => (
          <RouteRenderer 
            key={r.id || i} 
            route={r} 
            onSelect={() => setActiveTarget({ lat: r.destLat, lng: r.destLng })} 
          />
        ))}

        {/* 사용자 위치 경로 B->Z (초록색) */}
        {userPos && (
          <InteractiveMarker position={[userPos.lat, userPos.lng]} icon={UserIcon}>
            <Popup><strong>내 위치 (B)</strong></Popup>
          </InteractiveMarker>
        )}
        {routeB.length > 0 && (
          <Polyline positions={routeB} color="#10b981" weight={5} opacity={0.8} dashArray="10, 10" />
        )}
      </MapContainer>

      {/* GPS 내 위치 실시간 안내 버튼 (런타임 오버레이) */}
      {activeTarget && (
        <button
          onClick={() => setIsGpsActive(!isGpsActive)}
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 400,
            background: isGpsActive ? '#10b981' : '#18181c',
            color: '#fff',
            border: isGpsActive ? 'none' : '1px solid var(--border-muted)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title={isGpsActive ? "GPS 안내 종료" : "선택한 목적지로 실시간 GPS 경로 안내 시작"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </button>
      )}
    </div>
  )
}
