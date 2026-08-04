import { trackEvent } from '../common/analytics.js';

export function initFeatures() {
  trackEvent('PageLoad', 'Features');

  const featureCards = document.querySelectorAll('.feature-detail-card');
  featureCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h3').textContent;
      trackEvent('Interaction', 'FeatureCardClick', title);
      
      // Toggle expanded info
      const desc = card.querySelector('.expanded-desc');
      if (desc) {
        const isCollapsed = desc.style.maxHeight === '0px' || !desc.style.maxHeight;
        desc.style.maxHeight = isCollapsed ? `${desc.scrollHeight}px` : '0px';
        card.classList.toggle('expanded', isCollapsed);
      }
    });
  });
}
