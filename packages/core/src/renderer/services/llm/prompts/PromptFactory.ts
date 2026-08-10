export interface PromptFactory {
  createTonePrompt(): string;
  createSummaryPrompt(): string;
}
