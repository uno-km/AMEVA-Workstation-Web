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
      response: `| 비교 항목 | 클라우드 SaaS AI | AMEVA On-Device |\n| :--- | :--- | :--- |\n| **데이터 유출 위험** | 심각 (외부 서버 전송) | **0% (100% 로컬 연산)** |\n| **AI 토큰 과금** | 매달 수백만 원 폭증 | **0원 ($0 Marginal Cost)** |\n| **망분리/오프라인** | 구동 불가 | **완벽 네이티브 지원** |\n| **미디어 저작** | 외부 툴 별도 구매 | **인앱 스튜디오 내장** |`
    },
    python: {
      user: "몬테카를로 시뮬레이션 파이썬 코드를 실행하고 Matplotlib 차트를 그려줘.",
      tool: "PyodideWasm.executeCode({ kernel: 'python3' })",
      response: `\`\`\`python\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# 10,000회 몬테카를로 시뮬레이션 연산\nn_points = 10000\nx = np.random.uniform(-1, 1, n_points)\ny = np.random.uniform(-1, 1, n_points)\ninside_circle = (x**2 + y**2) <= 1\npi_estimate = 4 * np.sum(inside_circle) / n_points\nprint(f"추정 원주율: {pi_estimate:.4f}")\n\`\`\`\n\n[Pyodide Kernel Output]: 추정 원주율: 3.1416 (실행 시간: 14ms)`
    },
    diff: {
      user: "아래 비즈니스 제안서 문장을 공학적이고 전문적인 학술 문체로 다듬어줘.",
      tool: "NeuralPolisher.applyStyle({ tone: 'academic' })",
      response: `[문체 변환 완료 - Academic Tone]\n"본 시스템은 클라이언트 사이드 WebGPU 텐서 병렬 파이프라인을 구축함으로써, 외부 네트워크 트래픽 오버헤드를 원천 차단하고 연산 한계 비용을 제로($0)로 수렴시키는 구조적 기술 해자를 입증하였습니다."`
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
    toolMsg.innerHTML = `<i class="fas fa-cog fa-spin"></i> 자율 도구 호출: <code>${data.tool}</code>`;
    chatHistory.appendChild(toolMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Simulate Streaming Response
    setTimeout(() => {
      toolMsg.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'chat-bubble bot-bubble';
      chatHistory.appendChild(botMsg);

      let idx = 0;
      const text = data.response;
      const interval = setInterval(() => {
        botMsg.textContent = text.slice(0, idx);
        idx += 3;
        chatHistory.scrollTop = chatHistory.scrollHeight;
        if (idx > text.length) {
          clearInterval(interval);
          botMsg.textContent = text;
        }
      }, 15);
    }, 600);
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
        <div class="diff-ins" style="margin-top:6px;"><i class="fas fa-plus-circle"></i> <ins>${item.ins}</ins></div>
      </div>
    `;
  };
})();
