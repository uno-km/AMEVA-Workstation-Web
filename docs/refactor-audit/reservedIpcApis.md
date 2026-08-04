# AMEVA OS Reserved IPC APIs 명세서

본 문서는 현재 렌더러/어댑터 단에서는 미구현이거나 사용하지 않아 active 어댑터에서 제거되었으나, 추후 기획 및 기능 복구를 위해 예약된 IPC API들을 명세합니다.

## 1. appMinimize / appMaximize
- **성격**: Electron 브라우저 윈도우 조절 (최소화/최대화)
- **과거 채널**: `window:minimize`, `window:maximize` (미확정)
- **보류 사유**: 현재 AMEVA OS의 UI 설계상 상단 타이틀바에 수동 창 최소화/최대화 버튼이 없고, OS 기본 창 프레임을 활용하거나 단축키 형태로 제어하고 있어 active 렌더러에서의 호출 필요성이 소멸됨.
- **복구 방향**: 커스텀 창 타이틀 프레임(Frameless Window)을 도입하게 될 경우, 메인 프로세스에 `ipcMain.on('window:minimize')` 핸들러를 추가하고 프리로드 및 어댑터에 복구하여 활성화함.

## 2. onExportProgress
- **성격**: 문서 내보내기(Export) 진행률(0~100%) 이벤트 수신 리스너
- **과거 채널**: `export:progress` (미확정)
- **보류 사유**: 현재 마크다운을 DOCX/PDF/HTML 등으로 내보내는 기능인 `export:convert` 및 `printToPDF` 가 동기 및 단순 Promise 형태로 빠르게 완료되거나, 렌더러 단에서 가짜 프로그레스 바로 처리하고 있어 메인 프로세스에서 진행도 피드백을 전달할 실시간 소켓/IPC 채널의 필요성이 낮음.
- **복구 방향**: 대용량 문서 변환 및 비동기 원격 변환을 수행할 때, 메인 프로세스의 변환 라이브러리 진행 단계(Phase)마다 `event.sender.send('export:progress', status)` 형태로 이벤트를 발생시키고 렌더러에서 이를 구독하도록 리스너를 복구함.
