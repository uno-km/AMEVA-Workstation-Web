/**
 * ============================================================================
 * @file binaryUtils.ts
 * @system AMEVA OS Desktop Workstation - Core Binary & Base64 Utility
 * @location packages/core/src/renderer/utils/binaryUtils.ts
 * @role Centralized, High-Performance, Zero-Leak Binary Conversion Helpers
 * ============================================================================
 */

/**
 * Converts a Base64 string (with or without data URI prefix) into a Uint8Array.
 * Optimized for large document payload parsing.
 */
export function base64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) return new Uint8Array(0);
  const cleanBase64 = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  const binaryString = atob(cleanBase64.replace(/\s/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Base64 string directly into a Blob.
 */
export function base64ToBlob(base64String: string, mimeType: string = 'application/octet-stream'): Blob {
  const bytes = base64ToUint8Array(base64String);
  return new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
}

/**
 * Converts an ArrayBuffer into a Base64 string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Blob into a Base64 string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('[binaryUtils] FileReader did not return a string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
