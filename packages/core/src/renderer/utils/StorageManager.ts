/**
 * ============================================================================
 * @file StorageManager.ts
 * @system AMEVA OS Desktop Workstation - Storage Subsystem
 * @location packages/core/src/renderer/utils/StorageManager.ts
 * @role Centralized, Type-Safe, Fault-Tolerant LocalStorage Registry & Migration Layer
 * ============================================================================
 */

export const STORAGE_KEYS = {
  // AI & LLM
  SELECTED_LLM_MODEL: 'ameva_selected_llm_model',
  AUTO_LOAD_LLM: 'ameva_auto_load_llm',
  ENGINE_MODE: 'ameva_engine_mode',
  API_ENDPOINT: 'ameva_api_endpoint',
  API_KEY: 'ameva_api_key',
  API_MODEL: 'ameva_api_model',

  // App & Workspace Settings
  APP_SETTINGS: 'app-settings',
  IS_PRO_PLAN: 'is-pro-plan',
  USER_TIER: 'user-tier',
  GRANTED_PERMISSIONS: 'granted-permissions',
  MCP_SERVERS_CONFIG: 'mcp-servers-config',
  ENABLED_PLUGINS: 'enabled-plugins',
  PLUGIN_URLS: 'plugin-urls',
  DESKTOP_INSTALL_PROMPT_DISMISSED: 'ameva_desktop_install_prompt_dismissed',

  // Dynamic Key Prefixes
  PDF_BOOKMARKS_PREFIX: 'pdf_bookmarks_',
  PANEL_RESIZE_PREFIX: 'panel-resize-',
  PDF_ANNOTATIONS_PREFIX: 'pdf-annotations-',
} as const;

export class StorageManager {
  /**
   * Safely gets a string value from localStorage.
   */
  static getItem(key: string, defaultValue: string = ''): string {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : defaultValue;
    } catch (e) {
      console.warn(`[StorageManager] getItem failed for key "${key}":`, e);
      return defaultValue;
    }
  }

  /**
   * Safely sets a string value in localStorage.
   */
  static setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[StorageManager] setItem failed for key "${key}":`, e);
    }
  }

  /**
   * Safely gets and parses a JSON value from localStorage.
   */
  static getJSON<T>(key: string, defaultValue: T): T {
    const raw = this.getItem(key, '');
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[StorageManager] JSON.parse failed for key "${key}", using default value:`, e);
      return defaultValue;
    }
  }

  /**
   * Safely serializes and sets a JSON value in localStorage.
   */
  static setJSON<T>(key: string, value: T): void {
    try {
      const raw = JSON.stringify(value);
      this.setItem(key, raw);
    } catch (e) {
      console.warn(`[StorageManager] JSON.stringify failed for key "${key}":`, e);
    }
  }

  /**
   * Safely removes a key from localStorage.
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageManager] removeItem failed for key "${key}":`, e);
    }
  }

  /**
   * Helpers for dynamic prefix keys
   */
  static getPdfBookmarks(fileName: string): any[] {
    return this.getJSON(`${STORAGE_KEYS.PDF_BOOKMARKS_PREFIX}${fileName}`, []);
  }

  static setPdfBookmarks(fileName: string, bookmarks: any[]): void {
    this.setJSON(`${STORAGE_KEYS.PDF_BOOKMARKS_PREFIX}${fileName}`, bookmarks);
  }
}
