export function initNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  // 1. 데스크톱 액티브 클래스 부여 로직
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath.includes(href) && href !== 'index.html') {
      link.classList.add('active');
    } else if (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
      link.classList.add('active');
    }
  });

  // 2. 🎪 모바일 동적 햄버거 메뉴 주입 및 토글 바인딩
  const header = document.querySelector('header');
  if (header) {
    // 햄버거 단추 유무 확인 후 동적 주입
    let toggleBtn = header.querySelector('.mobile-nav-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'mobile-nav-toggle';
      toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      
      // header-actions 내부에 테마 토글 왼쪽에 삽입
      const headerActions = header.querySelector('.header-actions');
      if (headerActions) {
        headerActions.insertBefore(toggleBtn, headerActions.firstChild);
      } else {
        header.appendChild(toggleBtn);
      }
    }

    // 모바일 전체화면 오버레이 서랍창 유무 확인 후 주입
    let overlay = document.querySelector('.mobile-nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mobile-nav-overlay';
      
      // 기존 nav-menu의 모든 링크를 복사하여 오버레이에 세로 리스트로 담음
      const navMenu = header.querySelector('.nav-menu');
      if (navMenu) {
        const clonedLinks = navMenu.cloneNode(true);
        clonedLinks.className = 'mobile-nav-links';
        
        // 복제된 링크 중에서도 active 클래스가 맞으면 그대로 불빛 켜줌
        overlay.appendChild(clonedLinks);
      }
      
      document.body.appendChild(overlay);
    }

    // 햄버거 클릭 이벤트 처리
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = overlay.classList.toggle('active');
      
      if (isActive) {
        toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
        toggleBtn.style.color = 'var(--accent)';
        document.body.style.overflow = 'hidden'; // 바디 스크롤 차단
      } else {
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.style.color = '';
        document.body.style.overflow = '';
      }
    });

    // 오버레이 클릭 시 자동으로 닫기
    overlay.addEventListener('click', () => {
      overlay.classList.remove('active');
      toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      toggleBtn.style.color = '';
      document.body.style.overflow = '';
    });
  }
}
