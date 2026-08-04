import { trackEvent } from '../common/analytics.js';
import { showToast } from '../utils/toast.js';
import { openModal } from '../utils/modal.js';

export function initContact() {
  trackEvent('PageLoad', 'Contact');

  const contactForm = document.getElementById('promo-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('contact-email').value;
      const name = document.getElementById('contact-name').value;
      const company = document.getElementById('contact-company').value;
      const message = document.getElementById('contact-message').value;

      if (!email || !name) {
        showToast('필수 인풋 항목들을 모두 입력해 주세요.', 'error');
        return;
      }

      trackEvent('Action', 'ContactFormSubmit', company);
      
      // 가상 전송 처리 모달 기동
      openModal('contact-success-modal', {
        title: '데모 요청 완료',
        body: `<div class="modal-success-content">
          <p>감사합니다, <strong>${name}</strong>님! (${company})</p>
          <p>등록하신 이메일 <strong>${email}</strong> 로 24시간 내에 전문 엔지니어가 AMEVA Workstation 데모 다운로드 링크와 가이드를 송부해 드릴 예정입니다.</p>
        </div>`
      });

      contactForm.reset();
      showToast('성공적으로 문의가 접수되었습니다.', 'success');
    });
  }
}
