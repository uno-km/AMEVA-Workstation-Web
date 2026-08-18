import { trackEvent } from '../common/analytics.js';
import { showToast } from '../utils/toast.js';

export function initPricing() {
  trackEvent('PageLoad', 'Pricing');

  const billingToggle = document.getElementById('billing-toggle');
  const priceValues = document.querySelectorAll('.price-val');

  if (billingToggle) {
    billingToggle.addEventListener('change', (e) => {
      const isYearly = e.target.checked;
      trackEvent('Action', 'PricingToggle', isYearly ? 'yearly' : 'monthly');
      
      priceValues.forEach(price => {
        const monthlyVal = parseInt(price.getAttribute('data-monthly'));
        const yearlyVal = parseInt(price.getAttribute('data-yearly'));
        
        if (isYearly) {
          animateValue(price, monthlyVal, yearlyVal, 300);
        } else {
          animateValue(price, yearlyVal, monthlyVal, 300);
        }
      });
      
      showToast(isYearly ? '연간 구독 할인(20%)이 적용되었습니다.' : '월간 구독 기준으로 전환되었습니다.', 'info');
    });
  }
}

// 부드러운 숫자 변경 효과
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
