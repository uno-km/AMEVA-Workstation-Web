/**
 * ============================================================================
 * @file cryptoUtils.ts
 * @description cryptoUtils.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './cryptoUtils';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file cryptoUtils.ts
 * @system AMEVA OS Desktop Workstation
 * @role AES-GCM 256 기반 클라이언트 사이드 파일/데이터 암복호화 유틸리티
 */

export async function generateKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * AMEVA_MAGIC 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const AMEVA_MAGIC = new TextEncoder().encode('AMEVA_ENC_V1')

/**
 * encryptBlob 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function encryptBlob(blob: Blob, password: string): Promise<Blob> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await generateKeyFromPassword(password, salt)
  
  const buffer = await blob.arrayBuffer()
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    buffer
  )
  
  // 패키징: [MAGIC 12bytes] + [SALT 16bytes] + [IV 12bytes] + [ENCRYPTED DATA]
  const finalBuffer = new Uint8Array(AMEVA_MAGIC.length + salt.length + iv.length + encrypted.byteLength)
  finalBuffer.set(AMEVA_MAGIC, 0)
  finalBuffer.set(salt, AMEVA_MAGIC.length)
  finalBuffer.set(iv, AMEVA_MAGIC.length + salt.length)
  finalBuffer.set(new Uint8Array(encrypted), AMEVA_MAGIC.length + salt.length + iv.length)
  
  return new Blob([finalBuffer], { type: 'application/octet-stream' })
}

/**
 * isEncryptedBlob 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function isEncryptedBlob(blob: Blob): Promise<boolean> {
  const slice = blob.slice(0, AMEVA_MAGIC.length)
  const buffer = await slice.arrayBuffer()
  const uint8 = new Uint8Array(buffer)
  return uint8.every((val, i) => val === AMEVA_MAGIC[i])
}

/**
 * decryptBlob 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function decryptBlob(blob: Blob, password: string): Promise<Blob> {
  const isEnc = await isEncryptedBlob(blob)
  if (!isEnc) throw new Error("암호화된 AMEVA 파일이 아닙니다.")
  
  const buffer = await blob.arrayBuffer()
  const uint8 = new Uint8Array(buffer)
  
  let offset = AMEVA_MAGIC.length
  const salt = uint8.slice(offset, offset + 16); offset += 16
  const iv = uint8.slice(offset, offset + 12); offset += 12
  const data = uint8.slice(offset)
  
  const key = await generateKeyFromPassword(password, salt)
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  return new Blob([decrypted])
}

// 비밀번호 단방향 해시 (검증용)
/**
 * hashPassword 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await window.crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
