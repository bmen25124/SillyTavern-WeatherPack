interface SecurityViolation {
  type: string;
  node: string;
  position: { row: number; column: number };
  severity: 'error' | 'warning';
  message: string;
}

interface SecurityAnalysisResult {
  safe: boolean;
  violations: SecurityViolation[];
  sanitizedCode?: string;
}

/**
 * JavaScript Security Analyzer using HTTP API
 */
interface SecuritySettings {
  enableJSAnalysis: boolean;
  allowedAPIs: string[];
  blockedAPIs: string[];
  maxScriptLength: number;
  allowObfuscation: boolean;
  debugMode?: boolean;
  serverEndpoint?: string;
}

export class JavaScriptSecurityAnalyzer {
  private settings: SecuritySettings;

  constructor(settings?: Partial<SecuritySettings>) {
    // Default settings
    this.settings = {
      enableJSAnalysis: true,
      allowedAPIs: ['console', 'Math', 'Date', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite'],
      blockedAPIs: ['fetch', 'XMLHttpRequest', 'eval', 'Function', 'WebSocket', 'localStorage', 'sessionStorage'],
      maxScriptLength: 50000,
      allowObfuscation: false,
      debugMode: false,
      serverEndpoint: '/api/plugins/js-security/analyze',
      ...settings,
    };
  }

  updateSettings(newSettings: Partial<SecuritySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  async analyzeScript(code: string): Promise<SecurityAnalysisResult> {
    try {
      // Skip analysis if disabled
      if (!this.settings.enableJSAnalysis) {
        return { safe: true, violations: [], sanitizedCode: code };
      }

      // Send HTTP request to analyze endpoint
      const response = await fetch(this.settings.serverEndpoint!, {
        method: 'POST',
        headers: SillyTavern.getContext().getRequestHeaders(),
        body: JSON.stringify({
          code: code,
          settings: this.settings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis server responded with status: ${response.status}`);
      }

      const result: SecurityAnalysisResult = await response.json();
      return result;
    } catch (error) {
      const violations: SecurityViolation[] = [
        {
          type: 'analysis_error',
          node: 'root',
          position: { row: 0, column: 0 },
          severity: 'error',
          message: `Failed to analyze JavaScript: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ];
      return { safe: false, violations };
    }
  }
}

/**
 * Replaces complete HTML blocks with placeholders
 * @param text - The input text containing HTML
 * @param htmlParts - Array to store the extracted HTML parts
 * @returns Text with HTML blocks replaced by placeholders
 */
export function replaceHtmlBlocks(text: string, htmlParts: string[]): string {
  let result = text;

  // Function to find the matching closing tag position
  function findMatchingClosingTag(text: string, startPos: number, tagName: string): number {
    const openTag = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
    const closeTag = new RegExp(`<\\/${tagName}>`, 'gi');

    let openCount = 1;
    let pos = startPos;

    while (openCount > 0 && pos < text.length) {
      openTag.lastIndex = pos;
      closeTag.lastIndex = pos;

      const nextOpen = openTag.exec(text);
      const nextClose = closeTag.exec(text);

      if (!nextClose) break;

      if (!nextOpen || nextClose.index < nextOpen.index) {
        openCount--;
        pos = nextClose.index + nextClose[0].length;
      } else {
        openCount++;
        pos = nextOpen.index + nextOpen[0].length;
      }
    }

    return openCount === 0 ? pos : -1;
  }

  // Process from start to end
  let i = 0;
  while (i < result.length) {
    const tagMatch = result.slice(i).match(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/);
    if (!tagMatch) break;

    const fullTagMatch = tagMatch[0];
    const tagName = tagMatch[1];
    const tagStart = i + tagMatch.index!;
    const tagEnd = tagStart + fullTagMatch.length;

    // Check if it's a self-closing tag
    if (fullTagMatch.endsWith('/>')) {
      htmlParts.push(fullTagMatch);
      result = result.slice(0, tagStart) + `<!--HTML_PLACEHOLDER_${htmlParts.length - 1}-->` + result.slice(tagEnd);
      i = tagStart + `<!--HTML_PLACEHOLDER_${htmlParts.length - 1}-->`.length;
      continue;
    }

    // Check if it's a void element (no closing tag needed)
    if (/^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i.test(tagName)) {
      htmlParts.push(fullTagMatch);
      result = result.slice(0, tagStart) + `<!--HTML_PLACEHOLDER_${htmlParts.length - 1}-->` + result.slice(tagEnd);
      i = tagStart + `<!--HTML_PLACEHOLDER_${htmlParts.length - 1}-->`.length;
      continue;
    }

    // Find matching closing tag
    const closingPos = findMatchingClosingTag(result, tagEnd, tagName);
    if (closingPos > 0) {
      const fullBlock = result.slice(tagStart, closingPos);
      htmlParts.push(fullBlock);
      result = result.slice(0, tagStart) + `<!--HTML_PLACEHOLDER_${htmlParts.length - 1}-->` + result.slice(closingPos);
      i = tagStart + `<!--HTML_PLACEHOLDER_${htmlParts.length - 1}-->`.length;
    } else {
      i = tagEnd;
    }
  }

  return result;
}

/**
 * For HTML parts, it does not do anything.
 * For text parts, uses context.messageFormatting(message: string, ch_name: string, false, false, messageId: number)
 */
export function postProcess(id: number, ch_name: string, text: string): string {
  const context = SillyTavern.getContext();
  const htmlParts: string[] = [];

  // Replace HTML blocks with placeholders (e.g., <!--HTML_PLACEHOLDER_0-->)
  const textWithPlaceholders = replaceHtmlBlocks(text, htmlParts);

  const placeholderRegex = /(<!--HTML_PLACEHOLDER_(\d+)-->)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  // Iterate through the text, processing non-placeholder parts
  while ((match = placeholderRegex.exec(textWithPlaceholders)) !== null) {
    // Add the text before the current placeholder
    const textBeforePlaceholder = textWithPlaceholders.substring(lastIndex, match.index);
    if (textBeforePlaceholder.length > 0) {
      result += context.messageFormatting(textBeforePlaceholder, ch_name, false, false, id);
    }

    // Add the placeholder itself (which will be replaced later)
    result += match[0];
    lastIndex = placeholderRegex.lastIndex;
  }

  // Add any remaining text after the last placeholder
  const remainingText = textWithPlaceholders.substring(lastIndex);
  if (remainingText.length > 0) {
    result += context.messageFormatting(remainingText, ch_name, false, false, id);
  }

  // Replace placeholders with original HTML parts
  result = result.replace(/<!--HTML_PLACEHOLDER_(\d+)-->/g, (_, index) => {
    return htmlParts[parseInt(index, 10)];
  });

  return result;
}
