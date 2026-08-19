/**
 * @file media-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role 10~20s Ultra-Realistic Video Trimmer, Audio Silence Purge, and Image AI BG Removal Simulator
 */

(function () {
  // ── 1. Video Trimmer Simulation (15-second animated playback loop) ──
  const videoTimeStart = document.getElementById('video-sim-start');
  const videoTimeEnd = document.getElementById('video-sim-end');
  const videoPreview = document.getElementById('video-sim-preview');
  const videoMdOutput = document.getElementById('video-sim-md');
  const videoPlayhead = document.getElementById('video-sim-playhead');
  const videoTimerCurrent = document.getElementById('video-sim-current');

  let vStart = 2.4;
  let vEnd = 14.8;
  let currentTime = 2.4;
  let isPlaying = true;

  function updateVideoSim() {
    if (videoTimeStart) videoTimeStart.textContent = `00:${vStart < 10 ? '0' : ''}${vStart.toFixed(1)}s`;
    if (videoTimeEnd) videoTimeEnd.textContent = `00:${vEnd < 10 ? '0' : ''}${vEnd.toFixed(1)}s`;
    if (videoMdOutput) {
      videoMdOutput.textContent = `:::video[src="project_demo.mp4" start=${vStart.toFixed(1)} end=${vEnd.toFixed(1)} width="100%"]:::`;
    }
  }

  // 15-second playhead scrubber animation loop
  setInterval(() => {
    if (!isPlaying) return;
    currentTime += 0.1;
    if (currentTime > vEnd) {
      currentTime = vStart;
    }
    if (videoTimerCurrent) {
      videoTimerCurrent.textContent = `00:${currentTime < 10 ? '0' : ''}${currentTime.toFixed(1)}s`;
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
      videoPreview.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.4)';
      setTimeout(() => { videoPreview.style.boxShadow = 'none'; }, 200);
    }
  };

  // ── 2. Audio Waveform & Silence Purge Simulation (12-second live FFT audio loop) ──
  const audioCanvas = document.getElementById('audio-waveform-canvas');
  let isPurged = false;
  let audioTick = 0;

  const sampleBars = [
    12, 28, 45, 60, 85, 95, 70, 50, 20, 4, 2, 2, 2, 2, 5, 18, 40, 75, 90, 80, 60, 30, 6, 2, 2, 2, 2, 10, 35, 65, 80, 95, 85, 55, 25, 8
  ];

  function drawWaveform(purged = false) {
    if (!audioCanvas) return;
    const ctx = audioCanvas.getContext('2d');
    const width = audioCanvas.width = audioCanvas.parentElement.clientWidth || 400;
    const height = audioCanvas.height = 90;

    ctx.clearRect(0, 0, width, height);

    const bars = purged ? sampleBars.filter(b => b > 8) : sampleBars;
    const barWidth = width / bars.length - 3;

    bars.forEach((val, idx) => {
      const x = idx * (barWidth + 3);
      const isSilence = !purged && val <= 8;
      // Slight lively oscillation
      const dynamicVal = isSilence ? val : Math.max(10, val + Math.sin(audioTick + idx) * 8);
      const barHeight = (dynamicVal / 100) * (height - 24) + 4;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = isSilence ? 'rgba(239, 68, 68, 0.85)' : (purged ? '#10b981' : '#0ea5e9');
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
        ? `<span style="color:#10b981; font-weight:700;"><i class="fas fa-check-circle"></i> 8개 무음 구간 압축 완료 (재생시간 42% 절감)</span>`
        : `<span style="color:#f87171; font-weight:600;"><i class="fas fa-wave-pulse fa-beat"></i> 무음 8구간 감지됨 [Mute: 3.2s] — 1-클릭 일괄 삭제 가능</span>`;
    }
  }

  // Animate audio waveform continuously
  setInterval(() => {
    audioTick += 0.15;
    drawWaveform(isPurged);
  }, 80);

  window.triggerAudioPurge = function () {
    const btn = document.getElementById('audio-purge-btn');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Web Audio 주파수 압축 중...`;
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
    }, 800);
  };

  // ── 3. Image AI Background Removal (누끼) Simulation ──
  window.triggerBgRemoval = function () {
    const imgWrapper = document.getElementById('image-sim-wrapper');
    const scanLine = document.getElementById('image-scan-line');
    const btn = document.getElementById('image-bg-btn');

    if (!imgWrapper || !scanLine) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-wand-magic-sparkles fa-spin"></i> WebGPU 비전 모델 배경 분리 중...`;
    scanLine.style.display = 'block';
    scanLine.style.top = '0%';

    let pos = 0;
    const interval = setInterval(() => {
      pos += 2;
      scanLine.style.top = pos + '%';
      if (pos >= 100) {
        clearInterval(interval);
        scanLine.style.display = 'none';
        imgWrapper.classList.add('bg-transparent-checkered');
        const previewImg = document.getElementById('image-sim-preview');
        if (previewImg) {
          previewImg.style.filter = 'drop-shadow(0 12px 24px rgba(56,189,248,0.5)) scale(1.05)';
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
