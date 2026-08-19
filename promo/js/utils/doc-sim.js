/**
 * @file doc-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role PDF 3-Stage Map-Reduce & 3s Fast-Pass Intelligence Simulation
 */

(function () {
  const steps = [
    { title: 'Stage 1: Fast-Pass High-Speed Tokenization', desc: 'PDF 128페이지 텍스트 & 수식 클라이언트 메모리 매핑 중...', pct: 33 },
    { title: 'Stage 2: WebGPU Parallel Cluster Map-Reduce', desc: '16개 청크 병렬 텐서 요약 연산 진행 중 (0 byte 외부 전송)...', pct: 75 },
    { title: 'Stage 3: Hierarchical Knowledge Deck Generation', desc: '4대 도메인(핵심 요약, 기술 명세, 리스크 분석, 후속 과제) 카드 생성 완료!', pct: 100 }
  ];

  window.runDocMapReduceSim = function () {
    const btn = document.getElementById('doc-mapreduce-btn');
    const progressFill = document.getElementById('doc-progress-fill');
    const statusText = document.getElementById('doc-status-text');
    const deckContainer = document.getElementById('doc-deck-container');

    if (!btn || !progressFill || !statusText || !deckContainer) return;

    btn.disabled = true;
    deckContainer.style.display = 'none';
    deckContainer.innerHTML = '';

    let currentStep = 0;
    progressFill.style.width = '10%';
    statusText.textContent = steps[0].desc;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        progressFill.style.width = steps[currentStep].pct + '%';
        statusText.innerHTML = `<strong>${steps[currentStep].title}</strong>: ${steps[currentStep].desc}`;
      } else {
        clearInterval(interval);
        progressFill.style.width = '100%';
        statusText.innerHTML = `<span style="color:#10b981; font-weight:700;"><i class="fas fa-check-circle"></i> 128페이지 3단계 맵리듀스 완료 (소요시간: 2.8초)</span>`;
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-redo"></i> 다시 시뮬레이션`;

        // Render Summary Deck Cards
        deckContainer.style.display = 'grid';
        deckContainer.innerHTML = `
          <div class="deck-card" style="animation: fadeInUp 0.3s ease;">
            <div class="deck-badge" style="background:rgba(56,189,248,0.2); color:#38bdf8;">📌 Executive Summary</div>
            <h4>핵심 사업 및 비전 개요</h4>
            <p>100% 온디바이스 WebGPU 연산 기반 데이터 유출 0% 보장. 클라우드 API 토큰 비용 $0 실현.</p>
          </div>
          <div class="deck-card" style="animation: fadeInUp 0.4s ease;">
            <div class="deck-badge" style="background:rgba(16,185,129,0.2); color:#34d399;">⚡ Technical Moat</div>
            <h4>WebGPU Zero-Copy 텐서 브릿지</h4>
            <p>WASM-WGSL 직결 파이프라인으로 초당 35+ 토큰 로컬 추론 및 실시간 DSP 미디어 파이프라인 구축.</p>
          </div>
          <div class="deck-card" style="animation: fadeInUp 0.5s ease;">
            <div class="deck-badge" style="background:rgba(245,158,11,0.2); color:#fbbf24;">🛡️ Enterprise Compliance</div>
            <h4>망분리 폐쇄망 규제 적합성</h4>
            <p>외부 네트워크 패킷 0byte. AES-GCM 256 암호화 VFS 및 TPM 하드웨어 키 연동 완비.</p>
          </div>
          <div class="deck-card" style="animation: fadeInUp 0.6s ease;">
            <div class="deck-badge" style="background:rgba(168,85,247,0.2); color:#c084fc;">📈 Financial Projection</div>
            <h4>한계비용 제로 고마진 모델</h4>
            <p>고객 하드웨어 분산 컴퓨팅으로 Gross Margin 92%+ 달성 및 3개년 ARR 280억 원 로드맵 제시.</p>
          </div>
        `;
      }
    }, 700);
  };
})();
