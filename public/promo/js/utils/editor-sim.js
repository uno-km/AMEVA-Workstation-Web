// Optimized Virtual Editor Typing Simulator (Anti-Lag & Speed Tuning)
export function simulateTyping(element, text, speed = 20, onComplete = null) {
  element.value = '';
  let i = 0;
  
  // input 이벤트를 한 글자씩 매번 발생시키면 돔 리플로우 랙이 발생하므로
  // 성능 최적화 버퍼 프레임 방식을 도입합니다.
  function step() {
    if (i < text.length) {
      element.value += text[i++];
      
      // 스무스하게 커서 포커스를 항상 텍스트 맨 뒤로 가져감
      element.scrollTop = element.scrollHeight;
      
      // 가상 이벤트 트리거
      element.dispatchEvent(new Event('input'));
      
      // requestAnimationFrame 과 연계해 브라우저 렌더링 동기화
      requestAnimationFrame(() => {
        setTimeout(step, speed);
      });
    } else if (onComplete) {
      onComplete();
    }
  }
  step();
}
