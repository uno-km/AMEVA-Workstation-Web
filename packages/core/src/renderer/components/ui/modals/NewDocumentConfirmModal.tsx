/**
 * @file NewDocumentConfirmModal.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/ui/modals/NewDocumentConfirmModal.tsx
 * @role Confirmation Popup Modal before Creating a New Document
 */

import React from 'react'
import { FilePlus } from 'lucide-react'
import { ConfirmModal } from './ConfirmModal'

export interface NewDocumentConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

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
