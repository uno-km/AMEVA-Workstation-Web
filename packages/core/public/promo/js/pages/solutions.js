import { trackEvent } from '../common/analytics.js';

export function initSolutions() {
  trackEvent('PageLoad', 'Solutions');

  const tabButtons = document.querySelectorAll('.solution-tab-btn');
  const tabContents = document.querySelectorAll('.solution-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      trackEvent('Action', 'SolutionTabSwitch', target);

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(`solution-${target}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}
