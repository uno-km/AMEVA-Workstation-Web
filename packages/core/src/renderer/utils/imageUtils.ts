/**
 * @file imageUtils.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/imageUtils.ts
 * @role 이미지 처리 공통 유틸리티 모듈
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/exportHtml.ts): HTML 내보내기 시 blob: URL 이미지를 Base64로 변환하여 오프라인/외부 공유 가능한 형태로 임베드.
 * - 소비처 B (exporters/exportPptx.ts): PPTX 내보내기 시 pptxgenjs가 data: URI만 허용하므로 blob URL을 Base64로 강제 변환.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - Blob URL → Base64 Data URI 변환 (blobUrlToBase64)
 * - 이미지 자연 크기(width, height) 비동기 측정 (getImageDimensions)
 * - 중복 구현 제거: exporters/ 하위의 모든 변환 로직을 이 파일 한 곳에서 관리함.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: blob: 타입이 아닌 일반 URL은 변환 없이 원본 그대로 반환할 것.
 * - MUST NOT: 변환 실패 시 예외를 침묵시키지 말고 콘솔에 에러를 남긴 뒤 원본 URL을 폴백으로 반환할 것.
 */

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `blobUrlToBase64`
 * - 역할: Blob URL(브라우저 로컬 메모리 주소)을 외부 공유 가능한 Base64 Data URI 문자열로 변환한다.
 *         Word, PPTX, HTML 내보내기 시 blob: URL은 외부에서 접근이 불가능하기 때문에 반드시 이 함수를 통해 Data URI로 변환해야 한다.
 * - 예시: `blobUrlToBase64('blob:http://localhost/abc...')` → `'data:image/png;base64,iVBOR...'`
 * - 폴백: 변환 실패 시 원본 url을 그대로 반환하고 콘솔에 에러를 남긴다.
 * @param url - 변환할 blob: 또는 일반 이미지 URL
 * @returns Promise<string> - Base64 Data URI 또는 원본 URL (변환 실패 시)
 */
export async function blobUrlToBase64(url: string): Promise<string> {
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `!url.startsWith('blob:')`
   * - 만족 시: Blob이 아닌 일반 URL이므로 변환 불필요. 원본 URL을 즉시 반환한다.
   * - 불만족 시: Blob URL이므로 fetch → ArrayBuffer → btoa 파이프라인을 실행한다.
   */
  if (!url.startsWith('blob:')) return url;

  try {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `res`
     * - 자료형: Response
     * - 시나리오: blob: URL에 fetch 요청을 보내 브라우저 내부 Blob 데이터를 가져온다.
     */
    const res = await fetch(url);

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `blob`
     * - 자료형: Blob
     * - 시나리오: Response에서 Blob 객체를 추출한다. MIME 타입(blob.type)은 Data URI 헤더에 사용된다.
     */
    const blob = await res.blob();

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `buf`
     * - 자료형: ArrayBuffer
     * - 시나리오: Blob의 이진 데이터를 ArrayBuffer로 읽어 바이트 단위 접근이 가능한 형태로 변환한다.
     */
    const buf = await blob.arrayBuffer();

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `uint8`
     * - 자료형: Uint8Array
     * - 시나리오: ArrayBuffer를 1바이트 단위(Uint8Array)로 래핑하여 순차적 문자 변환이 가능하게 한다.
     */
    const uint8 = new Uint8Array(buf);

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `binary`
     * - 자료형: string
     * - 시나리오: Uint8Array의 각 바이트를 문자열(Latin-1)로 변환한다. btoa()가 요구하는 바이너리 문자열 포맷이다.
     */
    let binary = '';
    for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);

    /*
     * [RETURN VALUE]
     * - 설명: 완성된 Base64 Data URI를 반환한다.
     *         형식: `data:<MIME_TYPE>;base64,<BASE64_DATA>`
     * - 예시: `data:image/png;base64,iVBORw0KGgo...`
     */
    return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`;
  } catch (e) {
    console.error('[imageUtils] blobUrlToBase64 변환 실패:', e);
    // 변환 실패 시 원본 URL 그대로 반환 (폴백)
    return url;
  }
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `getImageDimensions`
 * - 역할: 주어진 URL의 이미지를 브라우저에 로드하여 자연 크기(naturalWidth, naturalHeight)를 비동기로 측정한다.
 *         Word(.docx) 내보내기 시 ImageRun의 transformation 속성(width, height)에 사용된다.
 * - 폴백: 로드 실패 시 기본값 { width: 500, height: 300 }을 반환한다.
 * @param url - 크기를 측정할 이미지 URL
 * @returns Promise<{ width: number; height: number }> - 이미지의 픽셀 단위 너비와 높이
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: Promise 반환
   * - 시나리오: 브라우저의 Image 객체를 활용해 onload/onerror 이벤트로 비동기 크기를 측정한다.
   *             Promise로 래핑하여 async/await 패턴을 지원한다.
   */
  return new Promise((resolve) => {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `img`
     * - 자료형: HTMLImageElement
     * - 시나리오: 화면에 표시되지 않는 인메모리 Image 객체를 생성하여 URL을 할당하면 브라우저가 백그라운드에서 이미지를 로드한다.
     */
    const img = new Image();

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `img.onload`
     * - 만족 시: 이미지 로드 성공. naturalWidth, naturalHeight로 실제 픽셀 크기를 resolve한다.
     */
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `img.onerror`
     * - 만족 시: 이미지 로드 실패. 기본값 { width: 500, height: 300 }으로 폴백 resolve한다.
     */
    img.onerror = () => resolve({ width: 500, height: 300 });

    img.src = url;
  });
}
