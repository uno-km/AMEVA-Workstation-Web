// Virtual Promo Analytics
export function trackEvent(category, action, label = '') {
  console.log(`[AMEVA Analytics] Event Tracked -> Category: ${category}, Action: ${action}, Label: ${label}`);
  let logs = JSON.parse(localStorage.getItem('promo-analytics-logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    category,
    action,
    label
  });
  localStorage.setItem('promo-analytics-logs', JSON.stringify(logs.slice(-50)));
}
