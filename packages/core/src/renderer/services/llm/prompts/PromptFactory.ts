export interface PromptFactory {
  createTonePrompt(contextText?: string): string;
  createSummaryPrompt(contextText?: string): string;
}
