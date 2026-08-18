/**
 * ============================================================================
 * @file MapBlock.tsx
 * @description MapBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * ============================================================================
 */

import { createReactBlockSpec } from '@blocknote/react'
import { MapPin, Search, Map as MapIcon, X, ChevronDown, ChevronUp, Navigation, Circle, Type } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { AsyncBlockWrapper } from './AsyncBlockWrapper'
import { ResizableBlockContainer } from './ResizableBlockContainer'
import type { MapPinData, MapRouteData } from './map/AmevaMapViewer'

const AmevaMapViewer = React.lazy(() => 
  import('./map/AmevaMapViewer').then(m => ({ default: m.AmevaMapViewer }))
)
const RouteDetails = ({ route }: { route: MapRouteData }) => {
  const [info, setInfo] = useState<{ duration: number, distance: number, steps: any[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const fetchInfo = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/${route.type}/${route.startLng},${route.startLat};${route.destLng},${route.destLat}?overview=false&steps=true`)
        const data = await res.json()
        if (active && data.routes && data.routes.length > 0) {
          const r = data.routes[0]
          setInfo({
            duration: r.duration,
            distance: r.distance,
            steps: r.legs[0]?.steps || []
          })
        }
      } catch(e) {}
      if (active) setLoading(false)
    }
    fetchInfo()
    return () => { active = false }
  }, [route])

  if (loading) return <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>경로 상세 정보를 계산하는 중...</div>
  if (!info) return null

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}분`
    return `${Math.floor(m/60)}시간 ${m%60}분`
  }
  const formatDistance = (m: number) => m < 1000 ? `${m.toFixed(0)}m` : `${(m/1000).toFixed(1)}km`

  return (
    <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-surface)', borderRadius: '4px', fontSize: '10px', color: 'var(--text-main)', border: '1px solid var(--border-muted)' }}>
      <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#10b981', display: 'flex', gap: '8px' }}>
        <span>📍 총 거리: {formatDistance(info.distance)}</span>
        <span>⏱ 예상 소요: {formatDuration(info.duration)}</span>
      </div>
      <div style={{ maxHeight: '100px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginBottom: '8px' }}>
        {info.steps.map((step, idx) => {
          const type = step.maneuver?.type || ''
          const modifier = step.maneuver?.modifier || ''
          let icon = '⬆'
          if (type === 'depart') icon = '🚩'
          else if (type === 'arrive') icon = '🏁'
          else if (modifier.includes('left')) icon = '⬅'
          else if (modifier.includes('right')) icon = '➡'
          else if (modifier.includes('uturn')) icon = '↩'
          
          return (
            <div key={idx} style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <span style={{ width: '12px', textAlign: 'center' }}>{icon}</span>
              <span style={{ flex: 1 }}>{step.name ? `${step.name} 방면` : (type === 'depart' ? '출발' : type === 'arrive' ? '도착' : '직진')}</span>
              <span style={{ color: '#888', minWidth: '40px', textAlign: 'right' }}>{formatDistance(step.distance)}</span>
            </div>
          )
        })}
      </div>
      
      {/* 🚀 공유 및 외부 앱 연동 버튼 */}
      <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const text = `📍 [AMEVA 추천 경로]\n${route.name}\n- 수단: ${route.type === 'driving' ? '자동차' : route.type === 'walking' ? '도보' : '자전거'}\n- 거리: ${formatDistance(info.distance)}\n- 소요시간: ${formatDuration(info.duration)}\n\n🗺️ 구글 지도에서 보기:\nhttps://www.google.com/maps/dir/?api=1&origin=${route.startLat},${route.startLng}&destination=${route.destLat},${route.destLng}`;
            navigator.clipboard.writeText(text);
            alert('경로 정보가 클립보드에 복사되었습니다!');
          }}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-muted)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          📋 복사
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${route.startLat},${route.startLng}&destination=${route.destLat},${route.destLng}&travelmode=${route.type === 'driving' ? 'driving' : route.type === 'walking' ? 'walking' : 'bicycling'}`, '_blank');
          }}
          style={{ flex: 1, background: '#4285F4', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🌐 구글 지도
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://map.naver.com/index.nhn?slng=${route.startLng}&slat=${route.startLat}&stext=${encodeURIComponent('출발')}&elng=${route.destLng}&elat=${route.destLat}&etext=${encodeURIComponent('도착')}&menu=route`, '_blank');
          }}
          style={{ flex: 1, background: '#03C75A', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🟩 네이버 지도
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://map.kakao.com/link/to/${encodeURIComponent(route.name || '목적지')},${route.destLat},${route.destLng}`, '_blank');
          }}
          style={{ flex: 1, background: '#FEE500', border: 'none', color: '#000', padding: '6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          💬 카카오맵
        </button>
      </div>
    </div>
  )
}

const ROUTE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#2563eb', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#4ade80'
]

function generateUUID() {
  return Math.random().toString(36).substring(2, 9)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `MapBlockSpec`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함. (다중 핀 및 경로 탐색 고도화 모드 지원)
   */
export const MapBlockSpec = createReactBlockSpec(
  {
    type: 'map',
    propSchema: {
      lat: { default: '37.5665' },
      lng: { default: '126.9780' },
      zoom: { default: '14' },
      locationName: { default: '서울 특별시' },
      destination: { default: '' },
      destLat: { default: '' },
      destLng: { default: '' },
      legend: { default: '' },
      memo: { default: '' },
      mapMode: { default: 'pin' },
      useUserLocation: { default: 'false' },
      pins: { default: '[]' },
      routes: { default: '[]' },
      height: { default: '480' },
      width: { default: '100%' }
    },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const props = block.props
      const isEditable = editor.isEditable

      const mapMode = props.mapMode as 'pin' | 'route'
      const pins: MapPinData[] = typeof props.pins === 'string' ? JSON.parse(props.pins || '[]') : props.pins
      const routes: MapRouteData[] = typeof props.routes === 'string' ? JSON.parse(props.routes || '[]') : props.routes
      const useUserLocation = props.useUserLocation === 'true'

      const [searchInput, setSearchInput] = useState('')
      const [startSearch, setStartSearch] = useState('')
      const [destSearch, setDestSearch] = useState('')
      
      const [pinSearchResults, setPinSearchResults] = useState<any[]>([])
      const [startSearchResults, setStartSearchResults] = useState<any[]>([])
      const [destSearchResults, setDestSearchResults] = useState<any[]>([])
      const [selectedStart, setSelectedStart] = useState<any>(null)
      const [selectedDest, setSelectedDest] = useState<any>(null)
      const [routeType, setRouteType] = useState<'driving'|'walking'|'cycling'>('driving')

      const [expandedPinIdx, setExpandedPinIdx] = useState<number | null>(null)
      const [expandedRouteIdx, setExpandedRouteIdx] = useState<number | null>(null)

      const handleMemoBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        editor.updateBlock(block, { props: { ...props, memo: e.target.value } } as any)
      }

      const updateProps = (newProps: Partial<typeof props>) => {
        editor.updateBlock(block, { props: { ...props, ...newProps } } as any)
      }

      const fetchJsonp = (url: string) => {
        return new Promise<any>((resolve, reject) => {
          const callbackName = 'vw_cb_' + Math.round(100000 * Math.random());
          (window as any)[callbackName] = (data: any) => {
            resolve(data);
            delete (window as any)[callbackName];
          };
          const script = document.createElement('script');
          script.src = url + '&callback=' + callbackName;
          script.onerror = () => reject(new Error('JSONP failed'));
          document.body.appendChild(script);
        });
      };

      const searchAddressList = async (query: string) => {
        try {
          // 1. 한국 공간정보 오픈플랫폼 (Vworld) 우선 검색 (JSONP로 CORS 우회)
          const vwUrl = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=5&page=1&query=${encodeURIComponent(query)}&type=place&format=jsonp&errorformat=jsonp&key=CEB52025-E065-364C-9DBA-44880E3B02B8`;
          const vwData = await fetchJsonp(vwUrl);
          
          if (vwData?.response?.status === 'OK' && vwData.response.result?.items) {
            return vwData.response.result.items.map((item: any) => ({
              lat: item.point.y,
              lon: item.point.x,
              name: item.title,
              display_name: item.address?.road || item.address?.parcel || item.title
            }))
          }

          // 2. Vworld 실패 시 기존 OSM Nominatim Fallback
          let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
          let data = await res.json()
          
          if (!data || data.length === 0) {
            // [검색 고도화] 한국어 약칭 자동 확장 (결과가 없을 때만 3차 시도)
            let exp = query.trim()
            exp = exp.replace(/([가-힣]+)초(?=\s|$)/g, '$1초등학교')
            exp = exp.replace(/([가-힣]+)중(?=\s|$)/g, '$1중학교')
            exp = exp.replace(/([가-힣]+)고(?=\s|$)/g, '$1고등학교')
            exp = exp.replace(/([가-힣]+)대(?=\s|$)/g, '$1대학교')
            exp = exp.replace(/([가-힣]+)여중(?=\s|$)/g, '$1여자중학교')
            exp = exp.replace(/([가-힣]+)여고(?=\s|$)/g, '$1여자고등학교')
            exp = exp.replace(/([가-힣a-zA-Z]+)(아팟|apt|APT)(?=\s|$)/g, '$1아파트')
            
            if (exp !== query.trim()) {
              res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(exp)}&limit=5`)
              data = await res.json()
            }
          }
          
          return data || []
        } catch(e) {
          console.error(e)
          return []
        }
      }

      const handleSearchPin = async () => {
        if (!searchInput) return
        const results = await searchAddressList(searchInput)
        setPinSearchResults(results)
      }

      const handleSelectPinResult = (result: any) => {
        const newPin: MapPinData = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          name: result.name || searchInput,
          address: result.display_name,
          description: ''
        }
        const newPins = [...pins, newPin]
        updateProps({ pins: JSON.stringify(newPins), lat: String(newPin.lat), lng: String(newPin.lon), locationName: newPin.name })
        setSearchInput('')
        setPinSearchResults([])
      }

      const updatePinData = (idx: number, data: Partial<MapPinData>) => {
        const newPins = [...pins]
        newPins[idx] = { ...newPins[idx], ...data }
        updateProps({ pins: JSON.stringify(newPins) })
      }

      const handleRemovePin = (idx: number) => {
        const newPins = pins.filter((_, i) => i !== idx)
        updateProps({ pins: JSON.stringify(newPins) })
      }

      const handleSearchStart = async () => {
        if (!startSearch) return
        const results = await searchAddressList(startSearch)
        setStartSearchResults(results)
      }

      const handleSearchDest = async () => {
        if (!destSearch) return
        const results = await searchAddressList(destSearch)
        setDestSearchResults(results)
      }

      const handleAddRoute = () => {
        if (!selectedStart || !selectedDest) return
        const newRoute: MapRouteData = {
          id: generateUUID(),
          name: `${selectedStart.name || startSearch} ➔ ${selectedDest.name || destSearch}`,
          description: '',
          startLat: parseFloat(selectedStart.lat),
          startLng: parseFloat(selectedStart.lon),
          destLat: parseFloat(selectedDest.lat),
          destLng: parseFloat(selectedDest.lon),
          color: ROUTE_COLORS[routes.length % 20],
          type: routeType
        }
        const newRoutes = [...routes, newRoute]
        updateProps({ routes: JSON.stringify(newRoutes) })
        setSelectedStart(null)
        setSelectedDest(null)
        setStartSearch('')
        setDestSearch('')
      }

      const updateRouteData = (idx: number, data: Partial<MapRouteData>) => {
        const newRoutes = [...routes]
        newRoutes[idx] = { ...newRoutes[idx], ...data }
        updateProps({ routes: JSON.stringify(newRoutes) })
      }

      const handleRemoveRoute = (idx: number) => {
        const newRoutes = routes.filter((_, i) => i !== idx)
        updateProps({ routes: JSON.stringify(newRoutes) })
      }

      const initialHeight = parseInt(props.height || '480', 10)
      const initialWidth = props.width || '100%'

      return (
        <ResizableBlockContainer
          initialHeight={initialHeight}
          initialWidth={initialWidth}
          minHeight={280}
          maxHeight={3000}
          minWidth={280}
          maxWidth={3200}
          disabled={!isEditable}
          accentColor="#10b981"
          onResizeEnd={({ height: newH, width: newW }) => {
            updateProps({
              height: String(Math.round(newH)),
              width: newW || props.width || '100%'
            })
          }}
          style={{ margin: '14px 0', width: props.width || '100%' }}
        >
          {({ height: containerH }) => (
            <div
              className="bn-block-content-wrapper custom-map-card"
              style={{
                width: '100%',
                height: `${containerH}px`,
                backgroundColor: '#18181c',
                border: '1px solid var(--border-muted)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                boxSizing: 'border-box'
              }}
            >
              {/* 헤더 바 */}
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#121215', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapIcon size={14} color="#10b981" />
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>지도 (Map)</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => updateProps({ mapMode: 'pin' })}
                    style={{ background: mapMode === 'pin' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', border: '1px solid', borderColor: mapMode === 'pin' ? '#10b981' : 'var(--border-muted)', color: mapMode === 'pin' ? '#10b981' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                  >📍 다중 핀</button>
                  <button 
                    onClick={() => updateProps({ mapMode: 'route' })}
                    style={{ background: mapMode === 'route' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', border: '1px solid', borderColor: mapMode === 'route' ? '#3b82f6' : 'var(--border-muted)', color: mapMode === 'route' ? '#3b82f6' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                  >🗺️ 경로 탐색</button>
                </div>
              </div>

              {/* 에디터 컨트롤 패널 (핀 추가, 경로 탐색, 장소 검색) */}
              <div style={{ padding: '12px', background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-muted)', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {mapMode === 'pin' && (
                    <>
                      <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchPin()}
                            placeholder="장소나 주소를 검색 후 엔터를 치세요..."
                            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                          />
                          <button onClick={handleSearchPin} style={{ background: '#10b981', color: '#000', border: 'none', padding: '0 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>검색</button>
                        </div>
                        {pinSearchResults && pinSearchResults.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: '60px', background: '#1e1e24', border: '1px solid var(--border-muted)', borderRadius: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                            {pinSearchResults.map((r, i) => (
                              <div key={i} onClick={() => handleSelectPinResult(r)} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '10px' }}>
                                <strong style={{ color: '#fff' }}>{r.name || searchInput}</strong><br/>
                                <span style={{ color: 'var(--text-muted)' }}>{r.display_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {pinSearchResults && pinSearchResults.length === 0 && searchInput && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: '60px', background: '#1e1e24', border: '1px solid var(--border-muted)', borderRadius: '4px', zIndex: 10, padding: '8px', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                            엔터를 눌러 검색하세요. 결과가 없으면 표시됩니다.
                          </div>
                        )}
                      </div>
                      
                      {pins.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {pins.map((p, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-muted)', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedPinIdx(expandedPinIdx === i ? null : i)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <MapPin size={12} color="#10b981" />
                                  <span style={{ fontSize: '11px', color: '#fff' }}>{p.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button onClick={(e) => { e.stopPropagation(); handleRemovePin(i) }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={12} /></button>
                                  {expandedPinIdx === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </div>
                              </div>
                              {expandedPinIdx === i && (
                                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-muted)' }}>
                                  <textarea
                                    value={p.description || ''}
                                    onChange={e => updatePinData(i, { description: e.target.value })}
                                    placeholder="이 핀에 대한 상세 설명을 작성하세요..."
                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-deep)', border: '1px solid var(--border-muted)', borderRadius: '4px', color: 'var(--text-main)', fontSize: '11px', resize: 'vertical', minHeight: '40px' }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {mapMode === 'route' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* 출발지 / 목적지 검색 UI */}
                        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              type="text" value={startSearch} onChange={e => { setStartSearch(e.target.value); setSelectedStart(null); }} onKeyDown={e => e.key === 'Enter' && handleSearchStart()}
                              placeholder="출발지 검색 (Enter)"
                              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: selectedStart ? '1px solid #3b82f6' : '1px solid var(--border-muted)', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                            />
                            {startSearchResults && startSearchResults.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e24', border: '1px solid var(--border-muted)', borderRadius: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                {startSearchResults.map((r, i) => (
                                  <div key={i} onClick={() => { setSelectedStart(r); setStartSearch(r.name || r.display_name.split(',')[0]); setStartSearchResults([]) }} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '10px' }}>
                                    <strong style={{ color: '#fff' }}>{r.display_name.split(',')[0]}</strong><br/>
                                    <span style={{ color: 'var(--text-muted)' }}>{r.display_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>➡</div>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              type="text" value={destSearch} onChange={e => { setDestSearch(e.target.value); setSelectedDest(null); }} onKeyDown={e => e.key === 'Enter' && handleSearchDest()}
                              placeholder="도착지 검색 (Enter)"
                              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: selectedDest ? '1px solid #3b82f6' : '1px solid var(--border-muted)', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                            />
                            {destSearchResults && destSearchResults.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e24', border: '1px solid var(--border-muted)', borderRadius: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                {destSearchResults.map((r, i) => (
                                  <div key={i} onClick={() => { setSelectedDest(r); setDestSearch(r.name || r.display_name.split(',')[0]); setDestSearchResults([]) }} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '10px' }}>
                                    <strong style={{ color: '#fff' }}>{r.display_name.split(',')[0]}</strong><br/>
                                    <span style={{ color: 'var(--text-muted)' }}>{r.display_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 이동 수단 및 추가 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setRouteType('driving')} style={{ background: routeType === 'driving' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', border: '1px solid', borderColor: routeType === 'driving' ? '#3b82f6' : 'var(--border-muted)', color: routeType === 'driving' ? '#3b82f6' : 'var(--text-muted)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>🚗 자동차</button>
                            <button onClick={() => setRouteType('walking')} style={{ background: routeType === 'walking' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', border: '1px solid', borderColor: routeType === 'walking' ? '#10b981' : 'var(--border-muted)', color: routeType === 'walking' ? '#10b981' : 'var(--text-muted)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>🚶 도보</button>
                            <button onClick={() => setRouteType('cycling')} style={{ background: routeType === 'cycling' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', border: '1px solid', borderColor: routeType === 'cycling' ? '#f59e0b' : 'var(--border-muted)', color: routeType === 'cycling' ? '#f59e0b' : 'var(--text-muted)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>🚲 자전거</button>
                          </div>
                          <button onClick={handleAddRoute} disabled={!selectedStart || !selectedDest} style={{ background: selectedStart && selectedDest ? '#3b82f6' : 'var(--bg-surface)', color: selectedStart && selectedDest ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: selectedStart && selectedDest ? 'pointer' : 'not-allowed' }}>경로 추가</button>
                        </div>
                      </div>

                      {/* 등록된 다중 경로 리스트 */}
                      {routes.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                          {routes.map((r, i) => (
                            <div key={r.id || i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-muted)', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedRouteIdx(expandedRouteIdx === i ? null : i)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Circle fill={r.color} color={r.color} size={10} />
                                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{r.name}</span>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{r.type === 'driving' ? '자동차' : r.type === 'walking' ? '도보' : '자전거'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button onClick={(e) => { e.stopPropagation(); handleRemoveRoute(i) }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={12} /></button>
                                  {expandedRouteIdx === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </div>
                              </div>
                              {expandedRouteIdx === i && (
                                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="color" value={r.color} onChange={e => updateRouteData(i, { color: e.target.value })} style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                                    <input type="text" value={r.name} onChange={e => updateRouteData(i, { name: e.target.value })} placeholder="경로 이름" style={{ flex: 1, padding: '4px 8px', background: 'var(--bg-deep)', border: '1px solid var(--border-muted)', borderRadius: '4px', color: 'var(--text-main)', fontSize: '11px' }} />
                                  </div>
                                  <textarea
                                    value={r.description || ''}
                                    onChange={e => updateRouteData(i, { description: e.target.value })}
                                    placeholder="이 경로에 대한 상세 설명을 작성하세요..."
                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-deep)', border: '1px solid var(--border-muted)', borderRadius: '4px', color: 'var(--text-main)', fontSize: '11px', resize: 'vertical', minHeight: '40px' }}
                                  />
                                  <RouteDetails route={r} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

              {/* 지도 렌더러 영역 */}
              <div style={{ flex: 1, minHeight: '180px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                <AsyncBlockWrapper name="지도">
                  <AmevaMapViewer
                    mapMode={mapMode}
                    pins={pins}
                    routes={routes}
                    startLat={parseFloat(props.lat)}
                    startLng={parseFloat(props.lng)}
                    destLat={props.destLat ? parseFloat(props.destLat) : undefined}
                    destLng={props.destLng ? parseFloat(props.destLng) : undefined}
                    useUserLocation={useUserLocation}
                    height="100%"
                  />
                </AsyncBlockWrapper>
              </div>

              {/* 메모 영역 (글로벌) */}
              <div style={{ padding: '12px', background: '#121215', borderTop: '1px solid var(--border-muted)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 'bold' }}>📝 글로벌 메모</span>
                </div>
                {isEditable ? (
                  <textarea
                    defaultValue={props.memo}
                    onBlur={handleMemoBlur}
                    placeholder="전체 지도에 대한 노트를 남기세요..."
                    style={{ width: '100%', border: '1px solid var(--border-muted)', color: 'var(--text-main)', fontSize: '11px', lineHeight: '1.4', resize: 'vertical', outline: 'none', padding: '6px', borderRadius: '4px', background: 'transparent' }}
                  />
                ) : props.memo ? (
                  <div style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', color: 'var(--text-main)', fontSize: '11px', lineHeight: '1.5', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                    {props.memo}
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'left' }}>남겨진 메모가 없습니다.</div>
                )}
              </div>
            </div>
          )}
        </ResizableBlockContainer>
      )
    }
  }
)

export const MapBlock = MapBlockSpec()
