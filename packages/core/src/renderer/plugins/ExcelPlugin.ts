/**
 * @file ExcelPlugin.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/plugins/ExcelPlugin.ts
 * @role Excel Viewer & Editor Plugin Lifecycle Manager
 */

import { useUIStore } from '../stores/useUIStore'

export const ExcelPlugin = {
  id: 'excel-viewer',
  name: 'Excel Viewer & Editor',
  onActivate: () => {
    // 엑셀 블록은 BlockNote 스키마에 자동 등록되므로 상단바 글로벌 모달 메뉴는 제거함.
  },
  onDeactivate: () => {
    // Cleanup if needed
  }
}
