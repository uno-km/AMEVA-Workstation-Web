/**
 * @file useModalResize.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useModalResize.ts
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

import React, { useState } from 'react'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useModalResize`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useModalResize(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function useModalResize(initialWidth = 820, initialHeight = 580) {
  const [modalSize, setModalSize] = useState({ width: initialWidth, height: initialHeight })

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleResizeMouseDown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleResizeMouseDown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleResizeMouseDown = (dir: 'e' | 's' | 'se', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `startX`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const startX = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const startX = e.clientX
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `startY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const startY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const startY = e.clientY
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `startW`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const startW = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const startW = modalSize.width
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `startH`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const startH = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const startH = modalSize.height

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleMouseMove = (moveEvent: MouseEvent) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `deltaX`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const deltaX = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const deltaX = moveEvent.clientX - startX
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `deltaY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const deltaY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const deltaY = moveEvent.clientY - startY
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nextW`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nextW = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let nextW = startW
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nextH`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nextH = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let nextH = startH

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `dir.includes('e')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (dir.includes('e'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (dir.includes('e')) {
        nextW = Math.max(500, startW + deltaX)
      }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `dir.includes('s')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (dir.includes('s'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (dir.includes('s')) {
        nextH = Math.max(380, startH + deltaY)
      }

      setModalSize({ width: nextW, height: nextH })
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseUp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseUp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return {
    modalSize,
    handleResizeMouseDown
  }
}

