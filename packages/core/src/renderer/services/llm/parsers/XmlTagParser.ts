import type { OutputParser } from './OutputParser';

export class XmlTagParser implements OutputParser {
  private tagName: string;

  constructor(tagName: string = 'answer') {
    this.tagName = tagName;
  }

  parseStream(accumulatedText: string): string {
    const openTag = `<${this.tagName}>`;
    const closeTag = `</${this.tagName}>`;
    
    if (accumulatedText.includes(openTag)) {
      // Regex to extract content between <tagName> and </tagName> or end of string if still streaming
      const regex = new RegExp(`<${this.tagName}>([\\s\\S]*?)(?:<\\/${this.tagName}>|$)`, 'i');
      const match = accumulatedText.match(regex);
      return match ? match[1] : '';
    } else if (accumulatedText.length > 50 && !accumulatedText.includes('<')) {
      // Fallback: If the model completely ignored the tag instruction and generated enough text
      return accumulatedText;
    } else {
      // Hide initial conversational filler before <tagName> appears
      return '';
    }
  }
}
