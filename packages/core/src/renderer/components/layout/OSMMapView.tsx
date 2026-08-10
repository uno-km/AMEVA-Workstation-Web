/**
 * ============================================================================
 * @file OSMMapView.tsx
 * @description OSMMapView.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './OSMMapView';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// @ts-nocheck
import React, { useState, useMemo } from 'react';
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { MapPin, Search } from 'lucide-react';

/**
 * OSMMapView 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function OSMMapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapQuery, setMapQuery] = useState('서울');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [legendText, setLegendText] = useState('');
  const [memoText, setMemoText] = useState('');
  
  const [lat, setLat] = useState(37.5665);
  const [lng, setLng] = useState(126.9780);
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  const [zoom, setZoom] = useState(14);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 이동방법 및 알고리즘 상태 설정
  const [routeType, setRouteType] = useState<'car' | 'bicycle' | 'foot'>('car');
  const [routingEngine, setRoutingEngine] = useState<'osrm' | 'graphhopper' | 'valhalla'>('osrm');

  // Nominatim Geo-coding API 호출 헬퍼
  const fetchCoordinates = async (queryStr: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr.trim())}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AMEVAOS/1.0'
        }
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json() as Array<{ lat: string; lon: string; display_name?: string }>;
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: queryStr.trim()
        };
      }
      return null;
    } catch (e) {
      console.error('[OSMMapView] fetchCoordinates failed for:', queryStr, e);
      return null;
    }
  };

  // 1. 출발지 입력 검색 처리기
  const handleSearchStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const coords = await fetchCoordinates(searchQuery);
      if (coords) {
        setLat(coords.lat);
        setLng(coords.lng);
        setMapQuery(coords.name);
        
        // 경로 탐색 모드인데 도착지 주소창이 입력되어 있다면 도착지 검색도 바로 수행
        if (isRouteMode && destinationQuery.trim()) {
          const destCoords = await fetchCoordinates(destinationQuery);
          if (destCoords) {
            setDestLat(destCoords.lat);
            setDestLng(destCoords.lng);
            setLegendText(coords.name + ' - ' + destCoords.name + ' 경로');
          }
        } else {
          // 단일 뷰 이동의 경우 도착지를 제거하여 단일 뷰어로 복원
          setDestLat(null);
          setDestLng(null);
        }
      } else {
        setErrorMsg('출발지를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 목적지 입력 검색 처리기
  const handleSearchEnd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!destinationQuery.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const coords = await fetchCoordinates(destinationQuery);
      if (coords) {
        setDestLat(coords.lat);
        setDestLng(coords.lng);
        
        // 만약 출발지 주소창도 입력되어 있다면 출발지 좌표도 다시 갱신하여 경로 바로 세팅
        if (searchQuery.trim()) {
          const startCoords = await fetchCoordinates(searchQuery);
          if (startCoords) {
            setLat(startCoords.lat);
            setLng(startCoords.lng);
            setMapQuery(startCoords.name);
            setLegendText(startCoords.name + ' - ' + coords.name + ' 경로');
          } else {
            setLegendText(mapQuery + ' - ' + coords.name + ' 경로');
          }
        } else {
          setLegendText('목적지: ' + coords.name);
        }
      } else {
        setErrorMsg('목적지(도착지)를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 지도 영역 bbox 및 iframe 소스 빌드
  const mapSrc = useMemo(() => {
    if (isRouteMode && destLat !== null && destLng !== null) {
      let engineParam = 'fossgis_osrm_car';
      if (routingEngine === 'osrm') {
        engineParam = routeType === 'car' ? 'fossgis_osrm_car' : routeType === 'bicycle' ? 'fossgis_osrm_bike' : 'fossgis_osrm_foot';
      } else if (routingEngine === 'graphhopper') {
        engineParam = routeType === 'car' ? 'graphhopper_car' : routeType === 'bicycle' ? 'graphhopper_bicycle' : 'graphhopper_foot';
      } else if (routingEngine === 'valhalla') {
        engineParam = routeType === 'car' ? 'valhalla_car' : routeType === 'bicycle' ? 'valhalla_bicycle' : 'valhalla_foot';
      }
      return 'https://www.openstreetmap.org/directions?engine=' + engineParam + '&route=' + lat + ',' + lng + ';' + destLat + ',' + destLng;
    } else {
      const delta = Math.max(0.001, 0.5 / Math.pow(2, zoom - 10));
      const bbox = (lng - delta) + ',' + (lat - delta) + ',' + (lng + delta) + ',' + (lat + delta);
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    }
  }, [lat, lng, destLat, destLng, zoom, isRouteMode, routeType, routingEngine]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-main)', overflowY: 'auto' }}>
      {/* 검색 헤더 */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-muted)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#34d399" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>오픈스트리트맵(OpenStreetMap 기반)</span>
          </div>
          
          {/* 경로 탐색 모드 전환 체크박스 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isRouteMode}
              onChange={e => {
                setIsRouteMode(e.target.checked);
                setErrorMsg(null);
                if (!e.target.checked) {
                  setDestLat(null);
                  setDestLng(null);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <span>경로 탐색 모드</span>
          </label>
        </div>
        
        {/* 출발지 / 중심지 검색 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchStart();
                }
              }}
              placeholder={isRouteMode ? "출발지 주소 또는 건물명.." : "장소 또는 주소 검색.."}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: '6px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                color: 'var(--text-main)', fontSize: '11px', outline: 'none'
              }}
            />
            <button
              onClick={() => handleSearchStart()}
              disabled={isLoading}
              style={{
                padding: '6px 10px', borderRadius: '6px',
                background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', opacity: isLoading ? 0.6 : 1
              }}
            >
              <Search size={12} /> {isRouteMode ? '출발지 설정' : '검색'}
            </button>
          </div>

          {/* 경로 탐색 모드의 추가 입력창 */}
          {isRouteMode && (
            <>
              {/* 도착지(목적지) 검색창 */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={e => setDestinationQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearchEnd();
                    }
                  }}
                  placeholder="도착지(목적지) 주소 또는 건물명.."
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: '6px',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                    color: 'var(--text-main)', fontSize: '11px', outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSearchEnd()}
                  disabled={isLoading}
                  style={{
                    padding: '6px 10px', borderRadius: '6px',
                    background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                    color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 'bold', opacity: isLoading ? 0.6 : 1
                  }}
                >
                  <Search size={12} /> 목적지 설정
                </button>
              </div>

              {/* 이동 방법 및 길찾기 알고리즘 설정 */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* 이동 방법 선택 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>이동 방법</span>
                  <select
                    value={routeType}
                    onChange={e => setRouteType(e.target.value as any)}
                    style={{
                      padding: '5px', borderRadius: '6px', fontSize: '10.5px',
                      background: '#16161a', border: '1px solid var(--border-muted)', color: 'var(--text-main)'
                    }}
                  >
                    <option value="car">차량 (Car)</option>
                    <option value="bicycle">자전거 (Bicycle)</option>
                    <option value="foot">도보 (Pedestrian)</option>
                  </select>
                </div>

                {/* 길찾기 알고리즘 선택 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>길찾기 알고리즘</span>
                  <select
                    value={routingEngine}
                    onChange={e => setRoutingEngine(e.target.value as any)}
                    style={{
                      padding: '5px', borderRadius: '6px', fontSize: '10.5px',
                      background: '#16161a', border: '1px solid var(--border-muted)', color: 'var(--text-main)'
                    }}
                  >
                    <option value="osrm">OSM 고속 경로엔진 (OSRM)</option>
                    <option value="graphhopper">대체 경로탐색 (GraphHopper)</option>
                    <option value="valhalla">다중 경로엔진 (Valhalla)</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 범례 및 메모 입력창 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={legendText}
            onChange={e => setLegendText(e.target.value)}
            placeholder="지도 범례 (예: 도보 약 15분)"
            style={{
              flex: 1, padding: '6px 10px', borderRadius: '6px',
              background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
              color: 'var(--text-main)', fontSize: '11px', outline: 'none'
            }}
          />
          <input
            type="text"
            value={memoText}
            onChange={e => setMemoText(e.target.value)}
            placeholder="사용자 주석/메모"
            style={{
              flex: 1, padding: '6px 10px', borderRadius: '6px',
              background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
              color: 'var(--text-main)', fontSize: '11px', outline: 'none'
            }}
          />
        </div>

        {/* 지도 확대/축소 슬라이더 (경로 검색이 아닌 경우에만 활성화) */}
        {(!isRouteMode || destLat === null) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>지도 배율 {zoom}x</span>
            <input
              type="range"
              min="10"
              max="18"
              value={zoom}
              onChange={e => setZoom(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer', height: '4px' }}
            />
          </div>
        )}

        {errorMsg && (
          <span style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>⚠️ {errorMsg}</span>
        )}
      </div>

      {/* 지도 iframe */}
      <div style={{ height: '480px', position: 'relative', background: '#16161a', flexShrink: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
            위치 정보 조회 중...
          </div>
        ) : (
          <iframe
            src={mapSrc}
            style={{
              position: 'absolute',
              top: '-50px',
              left: 0,
              width: '100%',
              height: 'calc(100% + 50px)',
              border: 'none',
              filter: 'invert(0.9) hue-rotate(180deg)'
            }}
            title="OpenStreetMap OpenStreetMap View"
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
          />
        )}
      </div>

      {/* 에디터 삽입 버튼 */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-muted)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('app:insert-map', {
              detail: {
                lat,
                lng,
                destLat: isRouteMode ? destLat : null,
                destLng: isRouteMode ? destLng : null,
                zoom,
                locationName: mapQuery,
                destination: isRouteMode ? destinationQuery : '',
                legend: legendText,
                memo: memoText,
                routeType: isRouteMode ? routeType : 'none',
                routingEngine: isRouteMode ? routingEngine : 'osrm'
              }
            }))
          }}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            color: 'var(--primary)', cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
        >
          글 본문에 지도 블록 삽입
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div>출발지: {mapQuery}</div>
          {isRouteMode && destinationQuery && <div>도착지: {destinationQuery}</div>}
          {isRouteMode && <div>수단: {routeType === 'car' ? '차량' : routeType === 'bicycle' ? '자전거' : '도보'} ({routingEngine.toUpperCase()})</div>}
          {legendText && <div>범례: {legendText}</div>}
          {memoText && <div>메모: {memoText}</div>}
        </div>
      </div>
    </div>
  );
}
