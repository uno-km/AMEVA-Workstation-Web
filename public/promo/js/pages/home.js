import { trackEvent } from '../common/analytics.js';

export function initHome() {
  trackEvent('PageLoad', 'Home');

  // 🎪 Multi-Word Easing Loop Typing Engine
  const typingEl = document.getElementById('hero-typing');
  if (typingEl) {
    const words = [
      'AI', 
      'Collaboration', 
      'Document', 
      'Email', 
      'Development', 
      'Meeting', 
      'Proposal', 
      'Media'
    ];
    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function loop() {
      const currentWord = words[wordIdx];
      
      if (isDeleting) {
        typingEl.textContent = currentWord.substring(0, charIdx--);
      } else {
        typingEl.textContent = currentWord.substring(0, charIdx++);
      }

      // 타이핑은 부드럽고 딜리팅은 신속하게 속도 튜닝
      let speed = isDeleting ? 40 : 100;

      if (!isDeleting && charIdx > currentWord.length) {
        isDeleting = true;
        speed = 1600; // 완성 단어 노출 홀드 1.6초
      } else if (isDeleting && charIdx < 0) {
        isDeleting = false;
        charIdx = 0;
        wordIdx = (wordIdx + 1) % words.length; // 다음 영단어로 회전
        speed = 400; // 다음 텀 대기
      }

      setTimeout(loop, speed);
    }
    
    // 0.5초 대기 후 루프 기동
    setTimeout(loop, 500);
  }

  // Interactive Graphic Card Hover effect
  const card = document.querySelector('.hero-preview-card');
  if (card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(1000px) rotateY(${x * 0.03}deg) rotateX(${-y * 0.03}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)';
    });
  }
}
