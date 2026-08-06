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

export const AMEVA_MAGIC = new TextEncoder().encode('AMEVA_ENC_V1')

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

export async function isEncryptedBlob(blob: Blob): Promise<boolean> {
  const slice = blob.slice(0, AMEVA_MAGIC.length)
  const buffer = await slice.arrayBuffer()
  const uint8 = new Uint8Array(buffer)
  return uint8.every((val, i) => val === AMEVA_MAGIC[i])
}

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
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await window.crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
