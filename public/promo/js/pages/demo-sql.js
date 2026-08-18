import { trackEvent } from '../common/analytics.js';
import { showToast } from '../utils/toast.js';

export function initDemoSQL() {
  trackEvent('PageLoad', 'DemoSQL');

  const sqlBtn = document.getElementById('run-sql-btn');
  const sqlInput = document.getElementById('sql-code-input');
  const sqlOutput = document.getElementById('sql-table-output');

  const mockDatabase = [
    { id: 1, name: 'Antigravity', role: 'AI Assistant', status: 'Active' },
    { id: 2, name: 'User', role: 'Main Lead', status: 'Online' },
    { id: 3, name: 'Ameva-Chan', role: 'UX Designer', status: 'Away' },
    { id: 4, name: 'John Doe', role: 'Developer', status: 'Offline' }
  ];

  if (sqlBtn && sqlInput && sqlOutput) {
    sqlBtn.addEventListener('click', () => {
      const query = sqlInput.value.trim().toLowerCase();
      trackEvent('Action', 'RunSQLQuery');
      sqlOutput.innerHTML = '<span class="status-running">⌛ Querying WASM DB...</span>';

      setTimeout(() => {
        if (query.includes('select *') && query.includes('developers')) {
          // 테이블 빌드
          let html = '<table class="promo-sql-table"><thead><tr>';
          Object.keys(mockDatabase[0]).forEach(key => {
            html += `<th>${key.toUpperCase()}</th>`;
          });
          html += '</tr></thead><tbody>';

          mockDatabase.forEach(row => {
            html += '<tr>';
            Object.values(row).forEach(val => {
              html += `<td>${val}</td>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
          sqlOutput.innerHTML = html;
          showToast('WASM SQLite 데이터베이스 쿼리 성공!', 'success');
        } else {
          sqlOutput.innerHTML = `<span class="status-error">SQL Error: Table not found or syntax error. Try running "SELECT * FROM developers;"</span>`;
          showToast('올바른 SQL 쿼리를 입력해 주세요.', 'error');
        }
      }, 400);
    });
  }
}
