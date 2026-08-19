/**
 * @file agent-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role WebGPU Autonomous AI Agent, Tool Calling, and Neural Polishing Simulator
 */

(function () {
  // ── 1. Autonomous AI Agent Simulator ──
  const agentPrompts = {
    table: {
      user: "클라우드 SaaS AI와 AMEVA의 보안 및 비용 비교표를 마크다운으로 작성해줘.",
      tool: "Editor.insertMarkdownTable()",
      html: `
        <div style="font-size:12px; color:#38bdf8; font-weight:700; margin-bottom:6px;"><i class="fas fa-table"></i> 마크다운 비교표 생성 완료:</div>
        <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-top:4px; background:rgba(0,0,0,0.3); border-radius:6px; overflow:hidden;">
          <thead>
            <tr style="background:rgba(56,189,248,0.15); color:#38bdf8; text-align:left;">
              <th style="padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.1);">비교 항목</th>
              <th style="padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.1);">클라우드 SaaS AI</th>
              <th style="padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.1); color:#34d399;">AMEVA On-Device</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); font-weight:700;">데이터 유출 위험</td>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); color:#f87171;">심각 (외부 서버 전송)</td>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); color:#34d399; font-weight:700;">0% (100% 로컬 연산)</td>
            </tr>
            <tr>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); font-weight:700;">AI 토큰 과금</td>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); color:#f87171;">매달 수백만 원 폭증</td>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); color:#34d399; font-weight:700;">0원 ($0 Marginal Cost)</td>
            </tr>
            <tr>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); font-weight:700;">망분리/오프라인</td>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); color:#f87171;">구동 불가</td>
              <td style="padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.06); color:#34d399; font-weight:700;">완벽 네이티브 지원</td>
            </tr>
            <tr>
              <td style="padding:6px 10px; font-weight:700;">미디어 저작 환경</td>
              <td style="padding:6px 10px; color:#f87171;">외부 툴 별도 구매</td>
              <td style="padding:6px 10px; color:#34d399; font-weight:700;">인앱 스튜디오 내장</td>
            </tr>
          </tbody>
        </table>
      `
    },
    python: {
      user: "몬테카를로 시뮬레이션 파이썬 코드를 실행하고 Matplotlib 차트를 그려줘.",
      tool: "PyodideWasm.executeCode({ kernel: 'python3' })",
      html: `
        <div style="font-size:12px; color:#38bdf8; font-weight:700; margin-bottom:6px;"><i class="fab fa-python"></i> Pyodide WASM 파이썬 커널 실행:</div>
        <pre style="background:#05070d; border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:10px; font-size:11px; font-family:monospace; color:#a7f3d0; line-height:1.5; margin:0;"><span style="color:#60a5fa;">import</span> numpy <span style="color:#60a5fa;">as</span> np
<span style="color:#94a3b8;"># 10,000회 몬테카를로 원주율 추정</span>
n = <span style="color:#f59e0b;">10000</span>
x, y = np.random.uniform(-1, 1, (2, n))
pi_hat = <span style="color:#f59e0b;">4.0</span> * np.sum(x**2 + y**2 <= 1) / n
<span style="color:#60a5fa;">print</span>(f<span style="color:#f472b6;">"추정 Pi: {pi_hat:.4f}"</span>)</pre>
        <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:6px; padding:8px 12px; margin-top:8px; font-family:monospace; font-size:11.5px; color:#34d399; display:flex; justify-content:space-between;">
          <span><i class="fas fa-check-circle"></i> [Kernel Output]: <strong>추정 Pi: 3.1416</strong></span>
          <span style="color:#94a3b8;">실행시간: 12ms</span>
        </div>
      `
    },
    diff: {
      user: "아래 비즈니스 제안서 문장을 공학적이고 전문적인 학술 문체로 다듬어줘.",
      tool: "NeuralPolisher.applyStyle({ tone: 'academic' })",
      html: `
        <div style="font-size:12px; color:#ec4899; font-weight:700; margin-bottom:6px;"><i class="fas fa-pen-nib"></i> Neural Polisher 문체 변환 (Academic Tone):</div>
        <div style="background:#05070d; border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:12px; font-size:12px; line-height:1.7; color:#f8fafc;">
          "본 시스템은 클라이언트 사이드 WebGPU 텐서 병렬 파이프라인을 구축함으로써, 외부 네트워크 트래픽 오버헤드를 원천 차단하고 연산 한계 비용을 제로($0)로 수렴시키는 구조적 기술 해자를 입증하였습니다."
        </div>
      `
    }
  };

  window.sendAgentPrompt = function (type) {
    const data = agentPrompts[type];
    if (!data) return;

    const chatHistory = document.getElementById('agent-chat-history');
    if (!chatHistory) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user-bubble';
    userMsg.textContent = data.user;
    chatHistory.appendChild(userMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Simulate Agent Tool Calling badge
    const toolMsg = document.createElement('div');
    toolMsg.className = 'agent-tool-calling';
    toolMsg.style.background = 'rgba(56,189,248,0.12)';
    toolMsg.style.border = '1px solid rgba(56,189,248,0.3)';
    toolMsg.style.color = '#38bdf8';
    toolMsg.style.padding = '6px 12px';
    toolMsg.style.borderRadius = '6px';
    toolMsg.style.fontSize = '11.5px';
    toolMsg.style.fontFamily = 'monospace';
    toolMsg.innerHTML = `<i class="fas fa-cog fa-spin"></i> 자율 도구 호출: <code>${data.tool}</code>`;
    chatHistory.appendChild(toolMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Simulate Streaming Response
    setTimeout(() => {
      toolMsg.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'chat-bubble bot-bubble';
      botMsg.innerHTML = data.html;
      chatHistory.appendChild(botMsg);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 700);
  };

  // ── 2. Tone Polishing & AI Diff Engine ──
  const toneData = {
    academic: {
      del: "우리 앱은 진짜 빠르고 보안이 쩔어서 해킹도 안 당하고 서버비도 안 듭니다.",
      ins: "본 시스템은 WebGPU 기반의 완전 격리 샌드박스를 통해 제로-트러스트 보안 표준을 충족하며, 분산 클라이언트 연산으로 서버 인프라 유지비를 제로화합니다."
    },
    business: {
      del: "기존 툴들은 비싸고 쓰기 불편해서 다들 불만이 많습니다.",
      ins: "기존 엔터프라이즈 솔루션의 높은 TCO(총소유비용)와 툴 파편화 문제를 해소하여, 조직의 연간 소프트웨어 구독료를 68% 절감합니다."
    },
    casual: {
      del: "당사의 혁신적 텐서 병렬화 알고리즘은 최적의 연산 수렴 속도를 도출합니다.",
      ins: "무거운 설치나 세팅 없이 브라우저에서 바로 클릭 한 번으로 가볍고 신나게 시작해보세요!"
    }
  };

  window.switchPolishingTone = function (tone) {
    const diffContainer = document.getElementById('tone-diff-output');
    const toneBtns = document.querySelectorAll('.tone-pill-btn');
    if (!diffContainer) return;

    toneBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-tone="${tone}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const item = toneData[tone] || toneData.academic;
    diffContainer.innerHTML = `
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">인라인 실시간 Diff 대조 뷰어:</div>
      <div class="diff-box">
        <div class="diff-del"><i class="fas fa-minus-circle"></i> <del>${item.del}</del></div>
        <div class="diff-ins" style="margin-top:8px;"><i class="fas fa-plus-circle"></i> <ins>${item.ins}</ins></div>
      </div>
    `;
  };

  // ── 3. Slash Command Autocomplete Simulator ──
  const slashCommands = [
    { cmd: '/video', label: '인앱 4K 비디오 컷편집기', icon: 'fa-video', cat: 'Media DSP' },
    { cmd: '/audio', label: '오디오 주파수 & 무음존 삭제', icon: 'fa-waveform-lines', cat: 'Audio DSP' },
    { cmd: '/image', label: '이미지 AI 1초 배경제거', icon: 'fa-wand-magic-sparkles', cat: 'Vision AI' },
    { cmd: '/doc', label: '대용량 PDF 3단계 맵리듀스', icon: 'fa-file-pdf', cat: 'Doc AI' },
    { cmd: '/colab', label: 'WebGPU 텐서 셰이더 연산', icon: 'fa-microchip', cat: 'WebGPU' },
    { cmd: '/excel', label: 'FortuneSheet 엑셀 시트', icon: 'fa-file-excel', cat: 'Office' },
    { cmd: '/map', label: '지오매핑 & 최적 경로 탐색', icon: 'fa-map-location-dot', cat: 'Geo' },
    { cmd: '/kanban', label: '인터랙티브 칸반 보드', icon: 'fa-table-columns', cat: 'Office' }
  ];

  window.selectSlashCommand = function (cmd) {
    const input = document.getElementById('slash-input');
    const preview = document.getElementById('slash-preview-output');
    if (input) input.value = cmd;
    if (preview) {
      preview.innerHTML = `<span style="color:#38bdf8; font-weight:700;"><i class="fas fa-check"></i> 블록 삽입 완료:</span> <code>:::${cmd.replace('/', '')}[autoCreated=true]:::</code>`;
    }
  };
})();
