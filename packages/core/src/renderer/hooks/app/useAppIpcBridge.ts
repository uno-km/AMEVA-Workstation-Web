/**
 * @file useAppIpcBridge.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useAppIpcBridge.ts
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

/**
 * useAppIpcBridge.ts
 *
 * App 레벨 IPC 이벤트 브리지 훅.
 * App.tsx 내에서 window.electronAPI 이벤트를 구독하여 전역 상태에 반영하는
 * 생애주기 코드를 격리한다.
 *
 * [포함 로직]
 * - onLLMDownloadProgress → downloadStatus, toastMessage 반영
 * - onFileOpenArgv → 파일 열기 OS 인자 처리
 * - onExportProgress → exportProgress 상태 반영
 * - appReady() 호출 (Electron에 렌더러 준비 완료 신호)
 */

import { useEffect } from 'react'
import { useProcessStore } from '../../stores/useProcessStore'
import { useUIStore } from '../../stores/useUIStore'
import * as ipc from '../../services/ipc/electronApiAdapter'

/**
 * FileOpenArgvHandler
 * OS에서 파일을 직접 열 때 호출되는 콜백 함수 타입.
 */
export type FileOpenArgvHandler = (file: { filePath: string; content: string; isBinary?: boolean }) => Promise<void>

/**
 * useAppIpcBridge
 * Electron 글로벌 IPC 이벤트들을 구독하고 전역 상태에 반영한다.
 *
 * @param onFileOpen - OS argv 파일 열기 이벤트 처리 콜백
 */
export function useAppIpcBridge(onFileOpen?: FileOpenArgvHandler) {
  const { setDownloadStatus } = useProcessStore()
  const { setToastMessage } = useUIStore()

  // 1. 모델 다운로드 진행 이벤트 구독
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
    const unsub = ipc.onLLMDownloadProgress((status: any) => {
      setDownloadStatus((prev: any) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `filenameOnly`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const filenameOnly = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const filenameOnly = String(status.filename || '').split(/[/\\]/).pop() || status.filename

        // 신규 다운로드 시작
        if (!prev && status) {
          setToastMessage(`📥 [다운로드 시작] '${filenameOnly}' 다운로드 작업이 시작되었습니다.`)
          setTimeout(() => setToastMessage(null), 3500)
        }

        // 다운로드 완료 (progress 100)
        if (status.progress === 100 && (!prev || prev.progress < 100)) {
          setToastMessage(`🎉 [설치 완료] '${filenameOnly}' 모델 설치가 완료되었습니다!`)
          setTimeout(() => {
            setToastMessage(null)
            setDownloadStatus(null)
          }, 4000)
        }

        return status
      })
    })

    return () => unsub()
  }, [setDownloadStatus, setToastMessage])

  // 2. OS argv 파일 열기 이벤트 구독
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv() || !onFileOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv() || !onFileOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv() || !onFileOpen) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `unsub`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const unsub = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const unsub = ipc.onFileOpenArgv((_event: any, file: any) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `file && file.filePath`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (file && file.filePath)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (file && file.filePath) {
        onFileOpen(file).catch((e: any) => {
          console.error('[useAppIpcBridge] OS argv 파일 열기 처리 실패:', e)
        })
      }
    })

    return () => unsub()
  }, [onFileOpen])

  // 4. 모바일 외부 .adc 파일 열기 Intent 이벤트 구독
  useEffect(() => {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `!onFileOpen`
     * - 만족 시: 파일 파싱 세터가 주입되지 않았으므로 핸들링을 건너뜁니다.
     * - 불만족 시: 모바일 윈도우 인텐트 이벤트를 바인딩해 수신 처리를 대기합니다.
     */
    if (!onFileOpen) return

    const handleMobileFileOpen = (event: any) => {
      const detail = event.detail
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `detail && detail.content && detail.filePath`
       * - 만족 시: 주입된 데이터와 주소를 통해 탭을 열고 마크다운 편집기 세션으로 파싱 전환합니다.
       */
      if (detail && detail.content && detail.filePath) {
        onFileOpen({
          filePath: detail.filePath,
          content: detail.content,
          isBinary: detail.isBinary || false
        }).catch((e: any) => {
          console.error('[useAppIpcBridge] 모바일 외부 파일 열기 처리 실패:', e)
        })
      }
    }

    window.addEventListener('openExternalAdcFile', handleMobileFileOpen)
    return () => window.removeEventListener('openExternalAdcFile', handleMobileFileOpen)
  }, [onFileOpen])

  // 3. 앱 준비 신호 전송 (Electron에게 렌더러 준비 완료를 알림)
  useEffect(() => {
    try {
      ipc.appReady()
    } catch (e) {
      console.warn('[useAppIpcBridge] appReady 호출 실패:', e)
    }
  }, [])
}

