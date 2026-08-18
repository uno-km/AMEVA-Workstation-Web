/**
 * ============================================================================
 * @file IPromptStorageService.ts
 * @system AMEVA OS Desktop Workstation - Prompt Architecture
 * @location packages/core/src/renderer/services/prompt/IPromptStorageService.ts
 * @role Abstract Contract for System Prompt & Persona Persistence Layer (Web / Electron / Mobile)
 * ============================================================================
 */

export interface PromptPreset {
  id: string;
  title: string;
  icon: string;
  description: string;
  persona: string;
}

export interface IPromptStorageService {
  /**
   * Retrieves the current active persona/system prompt.
   * If not set by user, returns the fallback default persona.
   */
  getCustomPersona(): Promise<string>;

  /**
   * Persists a newly customized persona/system prompt.
   */
  saveCustomPersona(persona: string): Promise<void>;

  /**
   * Resets the custom persona back to the standard default.
   */
  resetCustomPersona(): Promise<string>;

  /**
   * Returns all available preset personas.
   */
  getPresets(): PromptPreset[];

  /**
   * Gets the hardcoded default fallback persona.
   */
  getDefaultPersona(): string;
}
