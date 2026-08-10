export interface OutputParser {
  /**
   * Parses the incoming stream chunk or accumulated text and returns the displayable content.
   * @param accumulatedText The full accumulated text from the LLM stream so far.
   * @returns The parsed and sanitized string to display in the UI.
   */
  parseStream(accumulatedText: string): string;
}
