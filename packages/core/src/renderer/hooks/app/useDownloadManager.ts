/**
 * @file useDownloadManager.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useDownloadManager.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import { useEffect, useRef } from 'react'
import * as ipc from '../../services/ipc/electronApiAdapter'
import { useProcessStore } from '../../stores/useProcessStore'

export interface DownloadQueueItem {
  id: string
  url: string
  filename: string
  type: 'llm' | 'code' | 'stt'
  sizeBytes?: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  progress?: number
  speed?: number
  timeRemaining?: number
  error?: string
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useDownloadManager`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useDownloadManager(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useDownloadManager() {
  const {
    downloadQueue,
    updateDownloadInQueue,
    addDownloadToQueue
  } = useProcessStore()

  // 백그라운드 큐 처리루프를 여러 번 중복 실행하지 않도록 Guard
  const isProcessingRef = useRef(false)

  // 1. IPC 다운로드 이벤트 구독 (전역)
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv()) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `unsub`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const unsub = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const unsub = ipc.onLLMDownloadProgress?.((status: any) => {
      // status: { filename, progress, speed, downloadedBytes, totalBytes, timeRemaining }
      const activeItem = useProcessStore.getState().downloadQueue.find(
        (q: DownloadQueueItem) => q.status === 'downloading' && q.filename === status.filename
      )
      
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeItem`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeItem)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (activeItem) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `status.progress >= 100`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (status.progress >= 100)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (status.progress >= 100) {
          updateDownloadInQueue(activeItem.id, {
            status: 'completed',
            progress: 100,
            speed: 0,
            timeRemaining: 0,
            sizeBytes: status.totalBytes
          })
          isProcessingRef.current = false // 다운로드 끝남
        } else {
          updateDownloadInQueue(activeItem.id, {
            progress: status.progress,
            speed: status.speed,
            timeRemaining: status.timeRemaining,
            sizeBytes: status.totalBytes
          })
        }
      }
    })

    return () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `unsub) unsub(`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (unsub) unsub()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (unsub) unsub()
    }
  }, [updateDownloadInQueue])

  // 2. 큐 프로세서 루프
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isProcessingRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isProcessingRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isProcessingRef.current) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pendingItem`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pendingItem = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const pendingItem = downloadQueue.find((q: DownloadQueueItem) => q.status === 'pending')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `activeItem`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const activeItem = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const activeItem = downloadQueue.find((q: DownloadQueueItem) => q.status === 'downloading')

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!activeItem && pendingItem`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!activeItem && pendingItem)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!activeItem && pendingItem) {
      isProcessingRef.current = true
      startNextDownload(pendingItem)
    }
  }, [downloadQueue])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `startNextDownload`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const startNextDownload = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const startNextDownload = async (item: DownloadQueueItem) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv()) {
      isProcessingRef.current = false
      return
    }

    try {
      updateDownloadInQueue(item.id, { status: 'downloading', progress: 0 })
      
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `res`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const res = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const res = await ipc.llmDownloadModel?.({
        url: item.url,
        filename: item.filename,
        type: item.type
      })

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `res && !res.success`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (res && !res.success)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (res && !res.success) {
        updateDownloadInQueue(item.id, {
          status: 'error',
          error: res.error || '다운로드 실패'
        })
        isProcessingRef.current = false
      }
      
      // 성공하면 IPC progress 100% 이벤트에서 completed 처리됨
    } catch (err: any) {
      updateDownloadInQueue(item.id, {
        status: 'error',
        error: err.message
      })
      isProcessingRef.current = false
    }
  }

  // 외부(컴포넌트)에서 다운로드 큐에 추가하는 함수
  const enqueueDownload = (url: string, filename: string, type: 'llm' | 'code') => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `existing`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const existing = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const existing = useProcessStore.getState().downloadQueue.find(
      (q: DownloadQueueItem) => q.filename === filename && (q.status === 'pending' || q.status === 'downloading')
    )
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `existing`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (existing)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (existing) {
      // 이미 큐에 있거나 다운로드 중
      return false
    }

    const newItem: DownloadQueueItem = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      filename,
      type,
      status: 'pending',
      progress: 0
    }
    
    addDownloadToQueue(newItem)
    return true
  }

  return { enqueueDownload }
}

