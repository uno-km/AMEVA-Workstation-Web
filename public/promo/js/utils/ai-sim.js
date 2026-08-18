import { calculateSimpleDiff } from './diff-engine.js';
import { showToast } from './toast.js';

export function runAISimulation(prompt, originalText, outputContainer, onAccept) {
  if (!prompt.trim()) return;

  outputContainer.innerHTML = `
    <div class="ai-sim-card pending">
      <div class="ai-sim-header">
        <i class="fas fa-sparkles"></i> <strong>AMEVA AI Copilot 수정안</strong>
      </div>
      <div class="ai-sim-body">
        <div class="ai-sim-status">💡 "${prompt}" 명령 분석 중...</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    // 쌈뽕한 수정안 도출 시뮬레이션
    let proposedText = originalText;
    if (prompt.includes('개선') || prompt.includes('수정') || prompt.includes('고쳐')) {
      proposedText = originalText.replace('생산성 400%', '글로벌 개발 생산성 650% 초고속')
                                 .replace('도입 시', '엔터프라이즈 도입을 완료한 시점부터');
    } else {
      proposedText = originalText + '\n\n/* AI 확장 주석: 본 플랫폼은 오프라인 및 온프레미스 LLM Gateway를 내장하고 있어 사내 기술 데이터의 실외 유출을 철저히 격리 차단합니다. */';
    }

    const diffs = calculateSimpleDiff(originalText, proposedText);
    
    // Diff 렌더링
    let diffHtml = '<div class="sim-diff-box">';
    diffs.forEach(item => {
      if (item.type === 'removed') {
        diffHtml += `<div class="sim-diff-removed">- ${item.text}</div>`;
      } else if (item.type === 'added') {
        diffHtml += `<div class="sim-diff-added">+ ${item.text}</div>`;
      } else {
        diffHtml += `<div class="sim-diff-normal">  ${item.text}</div>`;
      }
    });
    diffHtml += '</div>';

    outputContainer.innerHTML = `
      <div class="ai-sim-card pending">
        <div class="ai-sim-header">
          <i class="fas fa-sparkles"></i> <strong>AMEVA AI Copilot 제안</strong>
        </div>
        <div class="ai-sim-body">
          ${diffHtml}
          <div class="ai-sim-actions" style="margin-top:10px; display:flex; gap:6px;">
            <button class="sim-btn-accept">수락 (Accept)</button>
            <button class="sim-btn-reject">거절</button>
          </div>
        </div>
      </div>
    `;

    // 이벤트 리스너 바인딩
    outputContainer.querySelector('.sim-btn-accept').addEventListener('click', () => {
      onAccept(proposedText);
      outputContainer.innerHTML = `
        <div class="ai-sim-card accepted">
          <i class="fas fa-check-circle" style="color:#10b981;"></i> 수정안이 가상 에디터에 적용되었습니다.
        </div>
      `;
      showToast('AI 제안 수정안 적용 완료!', 'success');
    });

    outputContainer.querySelector('.sim-btn-reject').addEventListener('click', () => {
      outputContainer.innerHTML = `
        <div class="ai-sim-card rejected">
          <i class="fas fa-times-circle" style="color:#ef4444;"></i> 제안이 거절되었습니다.
        </div>
      `;
      showToast('AI 제안이 취소되었습니다.', 'info');
    });

  }, 1200);
}
