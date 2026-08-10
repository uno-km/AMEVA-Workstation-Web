/**
 * ============================================================================
 * @file NewDocumentConfirmModal.tsx
 * @description NewDocumentConfirmModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './NewDocumentConfirmModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file NewDocumentConfirmModal.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/ui/modals/NewDocumentConfirmModal.tsx
 * @role Confirmation Popup Modal before Creating a New Document
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { FilePlus } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ./ConfirmModal]
import { ConfirmModal } from './ConfirmModal'

/**
 * NewDocumentConfirmModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface NewDocumentConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * NewDocumentConfirmModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function NewDocumentConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: NewDocumentConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="새로 작성하시겠습니까?"
      description="저장하지 않은 데이터(로컬 임시 버퍼)는 모두 삭제됩니다."
      confirmText="새로 만들기"
      confirmButtonColor="#10b981" // Emerald green color for new document
      icon={<FilePlus size={20} color="#10b981" />}
    />
  )
}
