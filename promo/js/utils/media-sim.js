/**
 * @file media-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role Monumental 15~20s Ultra-Realistic Video Trimmer, Audio DSP, and Image AI BG Removal Simulator
 */

(function () {
  // ── 1. Monumental Video Trimmer Studio (15~20s continuous scrub & timeline loop) ──
  const videoTimeStart = document.getElementById('video-sim-start');
  const videoTimeEnd = document.getElementById('video-sim-end');
  const videoPreview = document.getElementById('video-sim-preview');
  const videoMdOutput = document.getElementById('video-sim-md');
  const videoPlayhead = document.getElementById('video-sim-playhead');
  const videoTimerCurrent = document.getElementById('video-sim-current');
  const videoCanvasScrubber = document.getElementById('video-waveform-scrubber');

  let vStart = 2.4;
  let vEnd = 14.8;
  let currentTime = 2.4;
  let isPlaying = true;
  let videoSceneIndex = 0;

  const scenes = [
    'Scene 1: WebGPU Shader Tensor Core Initialized',
    'Scene 2: Audio DSP Silence Boundary Detected',
    'Scene 3: On-Device Qwen2.5 Local Inference @ 35 tok/s',
    'Scene 4: Fabric.js Vector Canvas & Layer Synthesis'
  ];

  function drawVideoScrubberCanvas() {
    if (!videoCanvasScrubber) return;
    const ctx = videoCanvasScrubber.getContext('2d');
    const w = videoCanvasScrubber.width = videoCanvasScrubber.parentElement.clientWidth || 600;
    const h = videoCanvasScrubber.height = 36;

    ctx.clearRect(0, 0, w, h);

    // Draw background track
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, w, h);

    // Draw trimmed range highlight
    const startX = (vStart / 30.0) * w;
    const endX = (vEnd / 30.0) * w;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(startX, 0, endX - startX, h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, endX - startX, h);

    // Draw mini audio waveform bars
    for (let x = 4; x < w - 4; x += 6) {
      const barH = (Math.sin(x * 0.08) * 0.5 + 0.5) * (h - 12) + 4;
      const inRange = x >= startX && x <= endX;
      ctx.fillStyle = inRange ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, (h - barH) / 2, 3, barH);
    }
  }

  function updateVideoSim() {
    if (videoTimeStart) videoTimeStart.textContent = `00:${vStart < 10 ? '0' : ''}${vStart.toFixed(2)}s`;
    if (videoTimeEnd) videoTimeEnd.textContent = `00:${vEnd < 10 ? '0' : ''}${vEnd.toFixed(2)}s`;
    if (videoMdOutput) {
      videoMdOutput.textContent = `:::video[src="project_demo.mp4" start=${vStart.toFixed(2)} end=${vEnd.toFixed(2)} width="100%" filter="gpu-hq" res="1080p"]:::`;
    }
    drawVideoScrubberCanvas();
  }

  // 15-second continuous playhead scrubber loop
  setInterval(() => {
    if (!isPlaying) return;
    currentTime += 0.1;
    if (currentTime > vEnd) {
      currentTime = vStart;
      videoSceneIndex = (videoSceneIndex + 1) % scenes.length;
      const sceneLabel = document.getElementById('video-scene-label');
      if (sceneLabel) sceneLabel.textContent = scenes[videoSceneIndex];
    }
    if (videoTimerCurrent) {
      videoTimerCurrent.textContent = `00:${currentTime < 10 ? '0' : ''}${currentTime.toFixed(2)}s`;
    }
    if (videoPlayhead) {
      const pct = ((currentTime - vStart) / (vEnd - vStart)) * 100;
      videoPlayhead.style.left = `${Math.max(0, Math.min(100, pct))}%`;
    }
  }, 100);

  window.adjustVideoTrim = function (deltaStart, deltaEnd) {
    vStart = Math.max(0, Math.min(vEnd - 1.5, vStart + deltaStart));
    vEnd = Math.max(vStart + 1.5, Math.min(30.0, vEnd + deltaEnd));
    currentTime = vStart;
    updateVideoSim();
    if (videoPreview) {
      videoPreview.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.5)';
      setTimeout(() => { videoPreview.style.boxShadow = 'none'; }, 250);
    }
  };

  window.toggleVideoPlayback = function () {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('video-play-btn');
    if (playBtn) {
      playBtn.innerHTML = isPlaying ? `<i class="fas fa-pause"></i> 일시정지` : `<i class="fas fa-play"></i> 재생`;
    }
  };

  // ── 2. Monumental Audio DSP Spectrum & Silence Purge Studio (15~20s live FFT loop) ──
  const audioCanvas = document.getElementById('audio-waveform-canvas');
  let isPurged = false;
  let audioTick = 0;

  const sampleBars = [
    14, 30, 48, 65, 88, 98, 72, 54, 22, 5, 2, 2, 2, 2, 6, 20, 44, 78, 94, 82, 64, 32, 7, 2, 2, 2, 2, 12, 38, 68, 84, 96, 88, 58, 28, 9,
    16, 34, 52, 70, 90, 95, 76, 50, 24, 6, 2, 2, 2, 2, 8, 24, 48, 80, 92, 80, 60, 30, 8, 2
  ];

  function drawWaveform(purged = false) {
    if (!audioCanvas) return;
    const ctx = audioCanvas.getContext('2d');
    const width = audioCanvas.width = audioCanvas.parentElement.clientWidth || 500;
    const height = audioCanvas.height = 120;

    ctx.clearRect(0, 0, width, height);

    const bars = purged ? sampleBars.filter(b => b > 8) : sampleBars;
    const barWidth = width / bars.length - 2.5;

    // Draw center line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    bars.forEach((val, idx) => {
      const x = idx * (barWidth + 2.5);
      const isSilence = !purged && val <= 8;
      const dynamicVal = isSilence ? val : Math.max(12, val + Math.sin(audioTick + idx * 0.4) * 12);
      const barHeight = (dynamicVal / 100) * (height - 30) + 6;
      const y = (height - barHeight) / 2;

      // Gradient color for bars
      const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
      if (isSilence) {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#991b1b');
      } else if (purged) {
        grad.addColorStop(0, '#34d399');
        grad.addColorStop(1, '#059669');
      } else {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#2563eb');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 3);
      ctx.fill();

      if (isSilence) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(x, 0, barWidth, height);
      }
    });

    const statusEl = document.getElementById('audio-purge-status');
    if (statusEl) {
      statusEl.innerHTML = purged 
        ? `<span style="color:#10b981; font-weight:700;"><i class="fas fa-check-circle"></i> 8개 무음 구간 압축 완료 — 원본 42초 ➔ 압축 24초 (재생시간 42.8% 단축 & -48dB 침묵 제거)</span>`
        : `<span style="color:#f87171; font-weight:600;"><i class="fas fa-wave-pulse fa-beat"></i> 무음 8구간 [Mute: 3.2s, -48dB] 감지됨 — 1-클릭 일괄 삭제 가능</span>`;
    }
  }

  // Animate audio waveform continuously
  setInterval(() => {
    audioTick += 0.18;
    drawWaveform(isPurged);
  }, 70);

  window.triggerAudioPurge = function () {
    const btn = document.getElementById('audio-purge-btn');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Web Audio 40밴드 주파수 압축 중...`;
      btn.disabled = true;
    }

    setTimeout(() => {
      isPurged = true;
      drawWaveform(true);
      if (btn) {
        btn.innerHTML = `<i class="fas fa-rotate-left"></i> 원본 파형 복원하기`;
        btn.disabled = false;
        btn.onclick = () => {
          isPurged = false;
          drawWaveform(false);
          btn.innerHTML = `<i class="fas fa-bolt"></i> 1-클릭 무음 일괄 삭제 (Silence Purge)`;
          btn.onclick = window.triggerAudioPurge;
        };
      }
    }, 900);
  };

  // ── 3. Monumental Image AI Background Removal (ONNX Vision) ──
  window.triggerBgRemoval = function () {
    const imgWrapper = document.getElementById('image-sim-wrapper');
    const scanLine = document.getElementById('image-scan-line');
    const btn = document.getElementById('image-bg-btn');

    if (!imgWrapper || !scanLine) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-wand-magic-sparkles fa-spin"></i> WebGPU ONNX 비전 모델 배경 분리 중...`;
    scanLine.style.display = 'block';
    scanLine.style.top = '0%';

    let pos = 0;
    const interval = setInterval(() => {
      pos += 1.5;
      scanLine.style.top = pos + '%';
      if (pos >= 100) {
        clearInterval(interval);
        scanLine.style.display = 'none';
        imgWrapper.classList.add('bg-transparent-checkered');
        const previewImg = document.getElementById('image-sim-preview');
        if (previewImg) {
          previewImg.style.filter = 'drop-shadow(0 16px 32px rgba(56,189,248,0.6)) scale(1.08)';
        }
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-undo"></i> 원본 배경 복원`;
        btn.onclick = () => {
          imgWrapper.classList.remove('bg-transparent-checkered');
          if (previewImg) previewImg.style.filter = 'none';
          btn.innerHTML = `<i class="fas fa-magic"></i> AI 1초 배경 제거 (Remove BG)`;
          btn.onclick = window.triggerBgRemoval;
        };
      }
    }, 20);
  };

  // Initial render
  window.addEventListener('DOMContentLoaded', () => {
    updateVideoSim();
    drawWaveform(false);
  });
})();
