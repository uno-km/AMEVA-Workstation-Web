import { simulateTyping } from './editor-sim.js';
import { showToast } from './toast.js';

export function runCollabSimulation(textareaElement, userListElement) {
  const mockUsers = [
    { name: 'Ameva-Chan', color: '#ec4899' },
    { name: 'Antigravity', color: '#a855f7' }
  ];

  setTimeout(() => {
    // 유저 접속 토스트
    const user = mockUsers[0];
    showToast(`👥 ${user.name} 님이 협업 세션에 참여했습니다!`, 'info');
    
    // 유저 리스트에 뱃지 추가
    if (userListElement) {
      userListElement.innerHTML += `<span class="collab-user-badge" style="border-color:${user.color}; color:${user.color};">${user.name}</span>`;
    }

    // 가상 타이핑 시작
    setTimeout(() => {
      simulateTyping(
        textareaElement,
        textareaElement.value + '\n\n# Ameva-Chan의 수정안\n- AI 워크스테이션 도입 시 팀의 생산성 400% 향상 확인.',
        50,
        () => {
          showToast(`✓ ${user.name} 님이 입력을 완료했습니다.`, 'success');
        }
      );
    }, 1500);

  }, 1000);
}
