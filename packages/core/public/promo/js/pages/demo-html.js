import { trackEvent } from '../common/analytics.js';
import { showToast } from '../utils/toast.js';

export function initDemoHTML() {
  trackEvent('PageLoad', 'DemoHTML');

  const htmlInput = document.getElementById('html-code-input');
  const previewFrame = document.getElementById('html-preview-frame');

  if (htmlInput && previewFrame) {
    const updatePreview = () => {
      const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
      doc.open();
      doc.write(htmlInput.value);
      doc.close();
    };

    htmlInput.addEventListener('input', updatePreview);
    
    // Initial render
    updatePreview();

    const applySampleBtn = document.getElementById('apply-html-sample-btn');
    if (applySampleBtn) {
      applySampleBtn.addEventListener('click', () => {
        trackEvent('Action', 'ApplyHTMLSample');
        htmlInput.value = `<div style="padding: 20px; font-family: sans-serif; background: #8b5cf6; color: white; border-radius: 8px; text-align: center; box-shadow: 0 4px 15px rgba(139,92,246,0.4);">
  <h3 style="margin:0 0 10px 0;">🌟 AMEVA HTML Live Render</h3>
  <p style="margin:0; opacity: 0.9;">코드를 직접 수정하여 실시간 변화를 느껴보세요!</p>
</div>`;
        updatePreview();
        showToast('샘플 코드가 적용되었습니다.', 'info');
      });
    }
  }
}
