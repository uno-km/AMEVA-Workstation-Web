/**
 * @file GlobalDownloadProgress.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/download/GlobalDownloadProgress.tsx
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

import React, { useState } from 'react'
import { Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useProcessStore } from '../../stores/useProcessStore'
import type { DownloadQueueItem } from '../../hooks/app/useDownloadManager'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `formatBytes`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `formatBytes(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function formatBytes(bytes: number = 0): string {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `bytes === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (bytes === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (bytes === 0) return '0 B'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `k`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const k = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const k = 1024
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `sizes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const sizes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `i`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const i = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `GlobalDownloadProgress`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `GlobalDownloadProgress(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function GlobalDownloadProgress() {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `downloadQueue`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const downloadQueue = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const downloadQueue = useProcessStore(state => state.downloadQueue)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clearCompletedDownloads`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clearCompletedDownloads = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const clearCompletedDownloads = useProcessStore(state => state.clearCompletedDownloads)
  const [isHovered, setIsHovered] = useState(false)

  // 진행 중이거나 대기 중인 항목
  const activeDownloads = downloadQueue.filter((q: DownloadQueueItem) => q.status !== 'completed' && q.status !== 'error')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `completedOrError`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const completedOrError = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const completedOrError = downloadQueue.filter((q: DownloadQueueItem) => q.status === 'completed' || q.status === 'error')
  
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `downloadQueue.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (downloadQueue.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (downloadQueue.length === 0) return null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const currentActive = downloadQueue.find((q: DownloadQueueItem) => q.status === 'downloading')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isAllDone`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isAllDone = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isAllDone = activeDownloads.length === 0

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '46px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* 팝업 오버레이 (Hover 시 노출) */}
      {isHovered && (
        <div style={{
          marginBottom: '10px',
          background: 'rgba(5, 5, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          width: '320px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> 다운로드 매니저
            </span>
            {completedOrError.length > 0 && (
              <button
                onClick={clearCompletedDownloads}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', padding: '2px 6px' }}
              >
                기록 지우기
              </button>
            )}
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto' }}>
            {downloadQueue.map((item: DownloadQueueItem, idx: number) => (
              <div key={item.id} style={{
                padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idx + 1}. {item.filename}
                  </span>
                  {item.status === 'downloading' && <Loader2 size={12} className="animate-spin text-primary" />}
                  {item.status === 'completed' && <CheckCircle size={12} style={{ color: '#34d399' }} />}
                  {item.status === 'error' && <XCircle size={12} style={{ color: '#ef4444' }} />}
                  {item.status === 'pending' && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>대기 중</span>}
                </div>
                
                {item.status === 'downloading' && (
                  <>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.progress || 0}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      <span>{formatBytes(item.speed ? item.speed * 1024 * 1024 : 0)}/s</span>
                      <span>{item.progress} %</span>
                    </div>
                  </>
                )}
                {item.status === 'error' && (
                  <span style={{ fontSize: '10px', color: '#ef4444' }}>{item.error}</span>
                )}
                {(item.status === 'pending' || item.status === 'completed') && item.sizeBytes ? (
                  <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{formatBytes(item.sizeBytes)}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 축소된 상태의 배지 바 */}
      <div style={{
        background: isAllDone ? 'rgba(52, 211, 153, 0.15)' : 'rgba(139, 92, 246, 0.15)',
        border: `1px solid ${isAllDone ? 'rgba(52, 211, 153, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
        backdropFilter: 'blur(10px)',
        padding: '8px 14px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
      }}>
        {isAllDone ? (
          <>
            <CheckCircle size={14} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>다운로드 완료</span>
          </>
        ) : (
          <>
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: 'var(--text-main)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                  {currentActive?.filename || '대기 중...'}
                </span>
                <span>{currentActive?.progress || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '1.5px', overflow: 'hidden' }}>
                <div style={{ width: `${currentActive?.progress || 0}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s' }} />
              </div>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px' }}>
              대기 {activeDownloads.length - (currentActive ? 1 : 0)}건
            </span>
          </>
        )}
      </div>
    </div>
  )
}

