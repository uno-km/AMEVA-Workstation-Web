import localforage from 'localforage'

// 첨부파일 전용 로컬 IndexedDB 스토어 생성
const attachmentStore = localforage.createInstance({
  name: 'ameva-workstation',
  storeName: 'doc_attachments'
})

/**
 * 임시 파일을 IndexedDB에 저장합니다. (새로고침해도 유지됨)
 */
export async function saveAttachment(id: string, file: File | Blob): Promise<void> {
  await attachmentStore.setItem(id, file)
}

/**
 * 저장된 임시 파일을 가져옵니다.
 */
export async function getAttachment(id: string): Promise<Blob | null> {
  return await attachmentStore.getItem<Blob>(id)
}

/**
 * 저장된 임시 파일을 삭제합니다.
 */
export async function deleteAttachment(id: string): Promise<void> {
  await attachmentStore.removeItem(id)
}
