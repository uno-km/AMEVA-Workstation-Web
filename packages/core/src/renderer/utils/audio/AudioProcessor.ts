/**
 * @file AudioProcessor.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/audio/AudioProcessor.ts
 * @role Audio manipulation logic (Silence Trimming, Noise Reduction, AudioBuffer to WAV)
 */

/**
 * AudioBuffer를 WAV 파일 (Blob)로 변환합니다.
 */
export async function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  // Header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArray], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 * Web Audio API를 사용해 Blob을 AudioBuffer로 디코딩합니다.
 */
export async function decodeAudio(blob: Blob, audioCtx: AudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * VAD (Voice Activity Detection) - 무음 제거
 * 데시벨(Threshold) 미만의 소리가 연속되는 구간을 잘라냅니다.
 */
export function removeSilence(buffer: AudioBuffer, audioCtx: AudioContext, threshold: number = 0.02, minSilenceDur: number = 0.5): AudioBuffer {
  const channelData = buffer.getChannelData(0); // 단일 채널 기준으로 판단
  const sampleRate = buffer.sampleRate;
  
  const minSilenceSamples = sampleRate * minSilenceDur;
  const keepRegions: { start: number, end: number }[] = [];
  
  let inSilence = true;
  let currentStart = 0;
  let silenceSamples = 0;

  for (let i = 0; i < channelData.length; i++) {
    const isQuiet = Math.abs(channelData[i]) < threshold;
    
    if (isQuiet) {
      silenceSamples++;
    } else {
      if (inSilence) {
        // 소리가 시작됨
        currentStart = Math.max(0, i - (sampleRate * 0.1)); // 0.1초 앞부터 보존
        inSilence = false;
      }
      silenceSamples = 0;
    }

    if (!inSilence && silenceSamples > minSilenceSamples) {
      // 무음 구간 확정 (0.1초 뒤까지 보존)
      keepRegions.push({ start: currentStart, end: Math.min(channelData.length, i - silenceSamples + (sampleRate * 0.1)) });
      inSilence = true;
    }
  }

  if (!inSilence) {
    keepRegions.push({ start: currentStart, end: channelData.length });
  }

  // 총 길이를 계산해서 새 버퍼 생성
  let totalKeepSamples = 0;
  for (const region of keepRegions) {
    totalKeepSamples += (region.end - region.start);
  }

  if (totalKeepSamples === 0) return buffer; // 모두 무음이면 원본 반환

  const newBuffer = audioCtx.createBuffer(buffer.numberOfChannels, totalKeepSamples, sampleRate);
  
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const origData = buffer.getChannelData(c);
    const newData = newBuffer.getChannelData(c);
    let offset = 0;
    for (const region of keepRegions) {
      const length = Math.floor(region.end - region.start);
      newData.set(origData.subarray(Math.floor(region.start), Math.floor(region.end)), offset);
      offset += length;
    }
  }

  return newBuffer;
}

/**
 * 노이즈 리덕션 (간단한 Bandpass/Lowpass 필터 적용)
 * 오프라인 렌더링 컨텍스트를 사용하여 노이즈 필터링 된 새 AudioBuffer를 반환합니다.
 */
export async function applyNoiseReduction(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  // 하이패스 (저주파 험 노이즈 제거)
  const highpass = offlineCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;

  // 로우패스 (고주파 화이트 노이즈 제거)
  const lowpass = offlineCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 8000;

  // 압축기 (볼륨 평탄화)
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(compressor);
  compressor.connect(offlineCtx.destination);

  source.start(0);
  return await offlineCtx.startRendering();
}

/**
 * 구간 자르기 (Trim)
 */
export function trimAudio(buffer: AudioBuffer, audioCtx: AudioContext, startSec: number, endSec: number): AudioBuffer {
  const startSample = Math.max(0, Math.floor(startSec * buffer.sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(endSec * buffer.sampleRate));
  const newLen = endSample - startSample;

  if (newLen <= 0) return buffer;

  const newBuffer = audioCtx.createBuffer(buffer.numberOfChannels, newLen, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    newBuffer.getChannelData(c).set(buffer.getChannelData(c).subarray(startSample, endSample));
  }
  return newBuffer;
}
