// AMEVA Workstation - AI & Marketplace Simulation Engine
import { showToast } from '../utils/toast.js';

let activeTimers = [];
let currentScenario = 1;

function clearAllTimers() {
  activeTimers.forEach(t => clearTimeout(t));
  activeTimers = [];
}

export function initMcpSimulation() {
  const btn1 = document.getElementById('btn-scenario-1');
  const btn2 = document.getElementById('btn-scenario-2');
  const replayBtn = document.getElementById('mcp-replay-btn');

  if (!btn1 || !btn2 || !replayBtn) return;

  btn1.addEventListener('click', () => {
    switchScenario(1);
  });

  btn2.addEventListener('click', () => {
    switchScenario(2);
  });

  replayBtn.addEventListener('click', () => {
    runScenario(currentScenario);
  });

  // 초기 자동 시작 (시나리오 1)
  switchScenario(1);
}

function switchScenario(scNo) {
  currentScenario = scNo;
  const btn1 = document.getElementById('btn-scenario-1');
  const btn2 = document.getElementById('btn-scenario-2');

  if (scNo === 1) {
    btn1.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    btn1.style.color = '#ffffff';
    btn1.style.borderColor = 'transparent';

    btn2.style.background = 'var(--bg-glass)';
    btn2.style.color = 'var(--text-muted)';
    btn2.style.borderColor = 'var(--border-muted)';
  } else {
    btn2.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    btn2.style.color = '#ffffff';
    btn2.style.borderColor = 'transparent';

    btn1.style.background = 'var(--bg-glass)';
    btn1.style.color = 'var(--text-muted)';
    btn1.style.borderColor = 'var(--border-muted)';
  }

  runScenario(scNo);
}

function runScenario(scNo) {
  clearAllTimers();

  // DOM 초기화
  const editorBody = document.getElementById('mock-editor-body');
  const insertionPoint = document.getElementById('editor-insertion-point');
  const rightPanel = document.getElementById('mcp-right-panel');
  const tabMarket = document.getElementById('mcp-tab-btn-market');
  const tabAi = document.getElementById('mcp-tab-btn-ai');
  const replayBtn = document.getElementById('mcp-replay-btn');
  const editorTools = document.getElementById('mock-editor-tools');

  if (!editorBody || !insertionPoint || !rightPanel || !tabMarket || !tabAi || !replayBtn || !editorTools) return;

  replayBtn.style.display = 'none';
  insertionPoint.innerHTML = '';
  
  // 기본 에디터 툴바 복원 (추가 툴 제거)
  editorTools.innerHTML = `
    <span style="font-size:11px; background:var(--bg-glass); border:1px solid var(--border-muted); padding:3px 6px; border-radius:4px; color:var(--text-main);"><i class="fas fa-bold"></i></span>
    <span style="font-size:11px; background:var(--bg-glass); border:1px solid var(--border-muted); padding:3px 6px; border-radius:4px; color:var(--text-main);"><i class="fas fa-italic"></i></span>
    <span style="font-size:11px; background:var(--bg-glass); border:1px solid var(--border-muted); padding:3px 6px; border-radius:4px; color:var(--text-main);"><i class="fas fa-underline"></i></span>
  `;

  if (scNo === 1) {
    // 🎬 시나리오 1: 수동 마켓플레이스 연동 & 구글/유튜브 수동 주입
    tabMarket.style.color = 'var(--primary)';
    tabMarket.style.borderBottom = '2px solid var(--primary)';
    tabAi.style.color = 'var(--text-muted)';
    tabAi.style.borderBottom = '2px solid transparent';

    rightPanel.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; width:100%; animation:popIn 0.3s ease;">
        <div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
          <i class="fas fa-store"></i> AMEVA Extension Marketplace
        </div>
        
        <!-- 유튜브 검색기 플러그인 카드 -->
        <div id="card-yt" style="background:var(--bg-main); border:1px solid var(--border-muted); border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:space-between; transition:all 0.3s;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; background:rgba(239,68,68,0.1); color:#ef4444; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:14px;"><i class="fab fa-youtube"></i></div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-main);">YouTube Search Tool</div>
              <div style="font-size:9px; color:var(--text-muted);">유튜브 동영상 실시간 검색 및 본문 임베드</div>
            </div>
          </div>
          <button id="install-yt-btn" style="font-size:10px; padding:4px 10px; border-radius:4px; border:1px solid var(--border-muted); background:var(--bg-glass); color:var(--text-main); font-weight:600; cursor:pointer; transition:all 0.2s;">설치</button>
        </div>

        <!-- 주식 조회기 플러그인 카드 -->
        <div id="card-stock" style="background:var(--bg-main); border:1px solid var(--border-muted); border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:space-between; transition:all 0.3s; opacity:0.6;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; background:rgba(16,185,129,0.1); color:#10b981; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:14px;"><i class="fas fa-chart-line"></i></div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-main);">Stock Query Tool</div>
              <div style="font-size:9px; color:var(--text-muted);">글로벌 주가 시세 및 리치 대시보드 조회</div>
            </div>
          </div>
          <button style="font-size:10px; padding:4px 10px; border-radius:4px; border:1px solid var(--border-muted); background:var(--bg-glass); color:var(--text-muted); font-weight:600; cursor:default;" disabled>대기</button>
        </div>
      </div>
    `;

    // 1. YouTube Search Tool 설치 연출 (1.5초 후 시작)
    const t1 = setTimeout(() => {
      const installBtn = document.getElementById('install-yt-btn');
      const cardYt = document.getElementById('card-yt');
      if (installBtn && cardYt) {
        installBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 설치 중...';
        cardYt.style.borderColor = 'var(--primary)';
        
        const t2 = setTimeout(() => {
          installBtn.innerHTML = '<span style="color:#10b981; font-weight:700;"><i class="fas fa-check"></i> 설치됨</span>';
          installBtn.style.borderColor = '#10b981';
          showToast('유튜브 검색 툴이 설치되어 탭에 추가되었습니다.', 'success');

          // 에디터 툴바에 탭 추가 연출
          const mockToolYt = document.createElement('span');
          mockToolYt.id = 'mock-tool-yt';
          mockToolYt.style.cssText = `
            font-size:11px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); 
            padding:3px 6px; border-radius:4px; color:#ef4444; margin-left:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          `;
          mockToolYt.innerHTML = '<i class="fab fa-youtube"></i> 유튜브 검색';
          editorTools.appendChild(mockToolYt);

          // 2. 유튜브 검색기 탭 클릭 및 검색 창 활성화 (3.5초 후)
          const t3 = setTimeout(() => {
            mockToolYt.style.transform = 'scale(1.05)';
            mockToolYt.style.borderColor = 'var(--primary)';
            
            tabMarket.style.color = 'var(--text-muted)';
            tabMarket.style.borderBottom = '2px solid transparent';
            tabAi.style.color = 'var(--text-muted)';
            tabAi.style.borderBottom = '2px solid transparent';

            // 우측 패널을 유튜브 검색 팝업창으로 치환
            rightPanel.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:8px; width:100%; height:100%; animation:popIn 0.3s ease;">
                <div style="font-size:11px; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                  <i class="fab fa-youtube" style="color:#ef4444;"></i> 유튜브 통합 검색 연동
                </div>
                <div style="display:flex; gap:6px;">
                  <input type="text" id="mcp-yt-search-input" disabled style="flex:1; background:var(--bg-main); border:1px solid var(--border-muted); border-radius:6px; padding:6px 10px; color:var(--text-main); font-size:11px;" value="">
                  <button id="mcp-yt-search-btn" style="background:#ef4444; border:none; border-radius:6px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:white; font-size:11px;"><i class="fas fa-search"></i></button>
                </div>
                <div id="mcp-yt-results" style="flex:1; display:flex; flex-direction:column; gap:8px; overflow-y:auto; min-height:160px; padding-top:6px;">
                  <div style="font-size:10px; color:var(--text-dark); text-align:center; padding-top:20px;">검색어를 입력하고 검색 버튼을 누르세요.</div>
                </div>
              </div>
            `;

            // 검색 타이핑 효과 (4.5초 후 시작)
            const t4 = setTimeout(() => {
              const ytInput = document.getElementById('mcp-yt-search-input');
              const searchStr = 'AMEVA Workstation 공식 시연';
              let charIdx = 0;
              
              const typingInterval = setInterval(() => {
                if (ytInput && charIdx < searchStr.length) {
                  ytInput.value += searchStr[charIdx++];
                } else {
                  clearInterval(typingInterval);
                  
                  // 검색 클릭 및 결과 노출 (6.5초 후)
                  const t5 = setTimeout(() => {
                    const resultsBox = document.getElementById('mcp-yt-results');
                    if (resultsBox) {
                      resultsBox.innerHTML = `
                        <div id="yt-result-item" style="background:var(--bg-main); border:1px solid var(--border-muted); border-radius:8px; padding:8px; display:flex; gap:8px; align-items:center; animation:popIn 0.3s ease;">
                          <div style="width:70px; height:45px; background:linear-gradient(135deg, #ef4444, #991b1b); border-radius:4px; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; flex-shrink:0; position:relative;">
                            <i class="fas fa-play"></i>
                          </div>
                          <div style="flex:1; overflow:hidden;">
                            <div style="font-size:10px; font-weight:700; color:var(--text-main); text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">[시연] AMEVA Workstation 실시간 협업 & 샌드박스 시연</div>
                            <div style="font-size:8px; color:var(--text-muted); margin-bottom:4px;">조회수 12만회 · 5일 전</div>
                            <button id="yt-share-btn" style="background:var(--primary); color:white; border:none; border-radius:4px; font-size:9px; padding:3px 8px; font-weight:600; cursor:pointer;">본문 주입 (Share)</button>
                          </div>
                        </div>
                      `;

                      // 공유 버튼 클릭 및 에디터에 주입 (8초 후)
                      const t6 = setTimeout(() => {
                        const shareBtn = document.getElementById('yt-share-btn');
                        if (shareBtn) {
                          shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 주입 중...';
                          shareBtn.style.background = 'var(--secondary)';
                          
                          const t7 = setTimeout(() => {
                            shareBtn.innerHTML = '<i class="fas fa-check"></i> 주입 완료';
                            shareBtn.style.background = '#10b981';
                            
                            // 좌측 에디터에 유튜브 렌더링 카드 주입!
                            insertionPoint.innerHTML = `
                              <div style="background:var(--bg-glass); border:1.5px dashed var(--primary); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; margin-bottom:10px; animation:popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 15px var(--primary-glow);">
                                <div style="height:140px; background:linear-gradient(135deg, #1e1b4b, #311042); position:relative; display:flex; align-items:center; justify-content:center; color:white;">
                                  <div style="width:44px; height:44px; border-radius:50%; background:rgba(239,68,68,0.95); display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 12px rgba(239,68,68,0.4);"><i class="fas fa-play"></i></div>
                                  <span style="position:absolute; bottom:6px; right:8px; background:black; color:white; font-size:9px; padding:2px 4px; border-radius:3px;">05:40</span>
                                </div>
                                <div style="padding:10px; font-family:var(--font-sans);">
                                  <div style="font-size:12px; font-weight:700; color:var(--text-main); margin-bottom:3px;">[시연] AMEVA Workstation 실시간 협업 & 샌드박스 시연</div>
                                  <div style="font-size:10px; color:var(--text-muted); display:flex; justify-content:space-between;">
                                    <span>조회수 12만회 · 5일 전</span>
                                    <span style="color:#ef4444; font-weight:700;"><i class="fab fa-youtube"></i> YouTube Embed</span>
                                  </div>
                                </div>
                              </div>
                            `;
                            showToast('에디터 본문에 비디오 카드가 삽입되었습니다.', 'success');
                            
                            // 완료
                            replayBtn.style.display = 'inline-block';
                          }, 1000);
                          activeTimers.push(t7);
                        }
                      }, 1500);
                      activeTimers.push(t6);
                    }
                  }, 800);
                  activeTimers.push(t5);
                }
              }, 60);
            }, 1000);
            activeTimers.push(t4);
          }, 2000);
          activeTimers.push(t3);
        }, 1000);
        activeTimers.push(t2);
      }
    }, 1500);
    activeTimers.push(t1);

  } else {
    // 🎬 시나리오 2: AI 에이전트 MCP 연동 자동화
    tabMarket.style.color = 'var(--text-muted)';
    tabMarket.style.borderBottom = '2px solid transparent';
    tabAi.style.color = 'var(--primary)';
    tabAi.style.borderBottom = '2px solid var(--primary)';

    // AI 어시스턴트 채팅 박스 로드
    rightPanel.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; width:100%; height:100%; font-family:var(--font-sans); animation:popIn 0.3s ease;">
        <div style="font-size:11px; font-weight:700; color:var(--text-muted); border-bottom:1px solid var(--border-muted); padding-bottom:6px; display:flex; align-items:center; justify-content:space-between;">
          <span><i class="fas fa-robot"></i> AI Agent (MCP Enabled)</span>
          <span style="font-size:9px; background:var(--primary-glow); color:var(--primary); padding:2px 6px; border-radius:4px; font-weight:700;">Turbo Mode</span>
        </div>
        
        <div id="mcp-ai-chat-history" style="flex:1; display:flex; flex-direction:column; gap:8px; overflow-y:auto; min-height:180px; padding:4px;">
          <!-- 동적 대화 삽입 -->
        </div>

        <div style="display:flex; gap:6px; border-top:1px solid var(--border-muted); padding-top:8px; margin-top:auto;">
          <input type="text" id="mcp-mock-input" disabled style="flex:1; background:var(--bg-textarea); border:1px solid var(--border-muted); border-radius:6px; padding:6px 10px; color:var(--text-main); font-size:11px;" value="">
          <button style="background:var(--primary); border:none; border-radius:6px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:white; font-size:11px;"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;

    const chatHistory = document.getElementById('mcp-ai-chat-history');

    // 1. 프롬프트 타이핑 시작 (1초 후)
    const t1 = setTimeout(() => {
      const mockInput = document.getElementById('mcp-mock-input');
      const promptStr = '삼성전자 실시간 주가 정보 가져와서 보고서에 요약해줘.';
      let charIdx = 0;

      const typingInterval = setInterval(() => {
        if (mockInput && charIdx < promptStr.length) {
          mockInput.value += promptStr[charIdx++];
        } else {
          clearInterval(typingInterval);

          // 2. 사용자가 전송 버튼 누른 연출 (3초 후)
          const t2 = setTimeout(() => {
            if (mockInput && chatHistory) {
              mockInput.value = '';
              chatHistory.innerHTML += `
                <div style="align-self:flex-end; background:var(--primary); color:white; padding:8px 12px; border-radius:12px 12px 0 12px; font-size:11px; max-width:85%; line-height:1.4; animation:popIn 0.2s ease-out; box-shadow:0 4px 10px rgba(124,58,237,0.2);">
                  삼성전자 실시간 주가 정보 가져와서 보고서에 요약해줘.
                </div>
              `;
              chatHistory.scrollTop = chatHistory.scrollHeight;

              // 3. AI의 MCP 도구 백그라운드 호출 연출 (4초 후)
              const t3 = setTimeout(() => {
                chatHistory.innerHTML += `
                  <div id="mcp-ai-thinking" style="align-self:flex-start; background:var(--bg-glass); border:1px solid var(--border-muted); padding:10px; border-radius:12px 12px 12px 0; font-size:11px; max-width:90%; line-height:1.5; color:var(--text-main); display:flex; flex-direction:column; gap:6px; animation:popIn 0.2s ease-out;">
                    <div style="font-weight:700; color:var(--secondary); display:flex; align-items:center; gap:6px;">
                      <i class="fas fa-cog fa-spin"></i> AI Agent가 MCP 도구를 구동하는 중...
                    </div>
                    <div id="mcp-log-step-1" style="color:var(--text-muted); font-size:9.5px; opacity:0; transition:all 0.3s;">⚙️ [MCP Client] stock_query("삼성전자") 실행...</div>
                    <div id="mcp-log-step-2" style="color:var(--text-muted); font-size:9.5px; opacity:0; transition:all 0.3s;">📈 API 호출 성공: KOSPI 005930 시세 응답 수신 완료.</div>
                  </div>
                `;
                chatHistory.scrollTop = chatHistory.scrollHeight;

                // 4. MCP 실행 로그 표시 1단계 (5초 후)
                const t4 = setTimeout(() => {
                  const log1 = document.getElementById('mcp-log-step-1');
                  if (log1) {
                    log1.style.opacity = '1';
                    log1.style.color = 'var(--primary)';
                  }

                  // 5. MCP 실행 로그 표시 2단계 (6초 후)
                  const t5 = setTimeout(() => {
                    const log2 = document.getElementById('mcp-log-step-2');
                    if (log2) {
                      log2.style.opacity = '1';
                      log2.style.color = '#10b981';
                    }

                    // 6. AI 최종 답변 및 가상 에디터에 주가 카드 자동 렌더링 삽입 (7.5초 후)
                    const t6 = setTimeout(() => {
                      const thinkingBox = document.getElementById('mcp-ai-thinking');
                      if (thinkingBox) {
                        thinkingBox.style.display = 'none';
                      }

                      chatHistory.innerHTML += `
                        <div style="align-self:flex-start; background:var(--bg-glass); border:1px solid var(--border-muted); padding:10px; border-radius:12px 12px 12px 0; font-size:11px; max-width:90%; line-height:1.5; color:var(--text-main); animation:popIn 0.3s ease-out;">
                          <div style="font-weight:700; color:#10b981; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                            <i class="fas fa-check-circle"></i> MCP 데이터 연동 완료
                          </div>
                          삼성전자(005930)의 실시간 주가 데이터 수집을 성공했습니다. <strong>Stock Query Tool (MCP)</strong>을 통해 최신 시세와 변동률 대시보드 표를 가상 에디터 본문에 즉시 동적으로 생성해 두었습니다!
                        </div>
                      `;
                      chatHistory.scrollTop = chatHistory.scrollHeight;

                      // 좌측 에디터에 주가 대시보드 카드 주입!
                      insertionPoint.innerHTML = `
                        <div style="background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08)); border:1.5px solid rgba(16,185,129,0.3); border-radius:10px; padding:14px; animation:popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow:0 6px 20px rgba(16,185,129,0.15);">
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-size:12px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                              <i class="fas fa-chart-line" style="color:#10b981;"></i> 삼성전자 (005930) 시세 정보
                            </span>
                            <span style="font-size:9px; background:rgba(16,185,129,0.15); color:#10b981; padding:2px 6px; border-radius:4px; font-weight:700;"><i class="fas fa-bolt"></i> MCP Live</span>
                          </div>
                          <div style="display:flex; align-items:baseline; gap:6px; margin-bottom:8px;">
                            <span style="font-size:22px; font-weight:900; color:var(--text-main); letter-spacing:-0.5px;">78,500원</span>
                            <span style="font-size:12px; color:#10b981; font-weight:700;"><i class="fas fa-caret-up"></i> 900원 (+1.16%)</span>
                          </div>
                          <table style="width:100%; border-top:1px solid rgba(16,185,129,0.15); padding-top:6px; font-size:10px; color:var(--text-muted); line-height:1.6;">
                            <tr>
                              <td>전일가: 77,600원</td>
                              <td>고가: 78,900원</td>
                            </tr>
                            <tr>
                              <td>거래량: 14,242,100주</td>
                              <td>외인비중: 56.4%</td>
                            </tr>
                          </table>
                        </div>
                      `;
                      showToast('에디터 본문에 실시간 주가 리치 카드가 삽입되었습니다.', 'success');

                      // 완료
                      replayBtn.style.display = 'inline-block';

                    }, 1500);
                    activeTimers.push(t6);
                  }, 1000);
                  activeTimers.push(t5);
                }, 1000);
                activeTimers.push(t4);
              }, 1000);
              activeTimers.push(t3);
            }
          }, 1200);
          activeTimers.push(t2);
        }
      }, 60);
    }, 1000);
    activeTimers.push(t1);
  }
}
