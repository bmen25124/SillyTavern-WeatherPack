import { ExtensionSettings } from './config.js';

// Using standard asterisks for all operations.
const STANDARD_ASTERISK = /\*/g; // For global replace

const removeAllStandardAsterisks = (text: string): string => {
  return text.replace(STANDARD_ASTERISK, '');
};

const addStandardItalic = (text: string): string => {
  return `*${text}*`;
};

function stage1_processQuotes(text: string, cleanItalicsInQuotes: boolean): string {
  // Regex to find:
  // 1. *QUOTE* (asterisk, quote, content, quote, asterisk - no spaces between * and ")
  // 2. QUOTE (standard quote)
  // It prioritizes the *QUOTE* form if nested/ambiguous.
  // Content inside quotes can contain asterisks.
  const quotePattern = /(\*+("((?:[^"]|\*)*?)")\*+)|("((?:[^"]|\*)*?)")/g;

  return text.replace(
    quotePattern,
    (
      match,
      g1_fullWrappedQuote,
      g2_quotedContentOfWrapped,
      g3_innerContentOfWrapped, // For *QUOTE*
      g4_standardQuote,
      g5_innerContentOfStandard, // For QUOTE
    ) => {
      if (g1_fullWrappedQuote) {
        // Matched *QUOTE*
        // g3_innerContentOfWrapped is the content inside the quotes, from *("CONTENT")*
        const content = cleanItalicsInQuotes
          ? removeAllStandardAsterisks(g3_innerContentOfWrapped)
          : g3_innerContentOfWrapped;
        return `"${content}"`; // Return just the cleaned quote
      } else if (g4_standardQuote) {
        // Matched QUOTE
        // g5_innerContentOfStandard is the content inside the quotes, from ("CONTENT")
        const content = cleanItalicsInQuotes
          ? removeAllStandardAsterisks(g5_innerContentOfStandard)
          : g5_innerContentOfStandard;
        return `"${content}"`; // Return the cleaned quote
      }
      return match; // Should not be reached if regex is exhaustive for these patterns
    },
  );
}

function processSingleParagraphNonQuotedSegment(
  paragraphSegment: string,
  settings: { wrapRegularTextWithItalic: boolean; normalizeMultipleAsterisks: boolean },
): string {
  if (!paragraphSegment.trim()) {
    return paragraphSegment; // Preserve whitespace-only segments
  }

  const leadingSpace = paragraphSegment.match(/^\s*/)?.[0] || '';
  const trailingSpace = paragraphSegment.match(/\s*$/)?.[0] || '';
  const contentToProcess = paragraphSegment.trim();

  if (!contentToProcess) {
    return paragraphSegment; // Return original if only whitespace
  }

  // Conditionally remove asterisks based on settings
  const contentToWorkWith = settings.normalizeMultipleAsterisks
    ? removeAllStandardAsterisks(contentToProcess)
    : contentToProcess;

  if (!contentToWorkWith.trim()) {
    return leadingSpace + contentToWorkWith + trailingSpace;
  } else {
    if (settings.wrapRegularTextWithItalic) {
      return leadingSpace + addStandardItalic(contentToWorkWith) + trailingSpace;
    } else {
      return leadingSpace + contentToWorkWith + trailingSpace;
    }
  }
}

function processNonQuotedSegment(
  segment: string,
  settings: { wrapRegularTextWithItalic: boolean; normalizeMultipleAsterisks: boolean },
): string {
  if (!segment.trim() && !segment.includes('\n')) {
    // Preserve segments that are only whitespace unless they contain newlines
    return segment;
  }

  // Split by any sequence of one or more newlines, keeping the newline sequences
  const parts = segment.split(/(\n+)/g);
  const processedParts = parts.map((part) => {
    if (/\n+/.test(part)) {
      // This part is a newline sequence, keep it as is
      return part;
    } else {
      // This part is actual text content, process it
      return processSingleParagraphNonQuotedSegment(part, settings);
    }
  });

  return processedParts.join('');
}

// Post-processing step to clean up adjacent italics
function postProcess(text: string): string {
  // Replace "* *" with " " to merge adjacent italics like *foo* *bar* into *foo bar*
  return text.replace(/\* \*/g, ' ');
}

export function simplifyMarkdown(text: string, settings: ExtensionSettings, name?: string): string {
  if (!text.trim()) {
    return text;
  }

  const fencedBlocks: string[] = [];
  const inlineBlocks: string[] = [];
  const oocBlocks: string[] = [];
  const htmlBlocks: string[] = [];

  // The text being processed for placeholders should be the full text.
  let textWithPlaceholders = text;

  // Stage 0a: Preserve fenced code blocks (```...```)
  textWithPlaceholders = textWithPlaceholders.replace(/(```[\s\S]*?```)/g, (match) => {
    fencedBlocks.push(match);
    return `__FENCED_${fencedBlocks.length - 1}__`;
  });

  // Stage 0b: Process and preserve inline code blocks (`...`)
  // This is done before general HTML extraction to give it priority.
  textWithPlaceholders = textWithPlaceholders.replace(/(`[^`\n]*?`)/g, (match) => {
    const content = match.substring(1, match.length - 1);
    const trimmedContent = content.trim();

    // Check if the content is likely HTML
    if (settings.unwrapHtmlJs && trimmedContent.startsWith('<') && trimmedContent.endsWith('>')) {
      // It looks like HTML, so unwrap it and let the HTML processor handle it.
      return content;
    }

    // For other code blocks, preserve them as is. Stripping asterisks was incorrect.
    inlineBlocks.push(match);
    return `__INLINE_${inlineBlocks.length - 1}__`;
  });

  // Stage 0c: Preserve HTML/XML tags FIRST to keep their content intact
  // This regex matches:
  // 1. Paired tags with content: <tag ...>content</tag>  - Using balanced parentheses approach
  // 2. Self-closing tags: <tag ... />
  // Updated to handle deeply nested structures properly
  function extractHtmlTags(text: string): string {
    let result = text;
    let iteration = 0;
    const maxIterations = 50; // Prevent infinite loops

    while (iteration < maxIterations) {
      let foundMatch = false;

      // Match self-closing tags first
      result = result.replace(/<([a-zA-Z][^\/\s>]*)(?:\s+[^>]*)?\s*\/>/g, (match) => {
        htmlBlocks.push(match);
        foundMatch = true;
        return `__HTML_${htmlBlocks.length - 1}__`;
      });

      // Match paired tags (innermost first for nested structures)
      result = result.replace(
        /<([a-zA-Z][^\/\s>]*)(?:\s+[^>]*)?>((?:(?!<\1[^>]*>|<\/\1>)[\s\S])*?)<\/\1>/g,
        (match) => {
          htmlBlocks.push(match);
          foundMatch = true;
          return `__HTML_${htmlBlocks.length - 1}__`;
        },
      );

      if (!foundMatch) break;
      iteration++;
    }

    return result;
  }

  // Normalization should happen *after* unwrapping but *before* HTML preservation.
  if (settings.normalizeFancyQuotes) {
    textWithPlaceholders = textWithPlaceholders.replace(/[“”]/g, '"');
  }
  if (settings.normalizeMultipleAsterisks) {
    textWithPlaceholders = textWithPlaceholders.replace(/\*{2,}/g, '*');
  }

  textWithPlaceholders = extractHtmlTags(textWithPlaceholders);

  // Stage 0d: Preserve OOC blocks ((OOC:...))
  textWithPlaceholders = textWithPlaceholders.replace(/\(OOC:[\s\S]*?\)/gi, (match) => {
    oocBlocks.push(match);
    return `__OOC_${oocBlocks.length - 1}__`;
  });

  // Now, process the text with placeholders using the existing logic
  const originalLeadingSpace = textWithPlaceholders.match(/^\s*/)?.[0] || '';
  const originalTrailingSpace = textWithPlaceholders.match(/\s*$/)?.[0] || '';
  let currentText = textWithPlaceholders.trim();

  // Stage 1: Normalize and clean all quote forms (*QUOTE* or QUOTE)
  currentText = stage1_processQuotes(currentText, settings.cleanItalicsInQuotes);

  // Stage 2: Process non-quoted parts for italics
  let resultStage2 = '';
  let lastIndex = 0;
  const boundaryRegex = /"[^"]*"|“[^”]*”|__FENCED_\d+__|__INLINE_\d+__|__OOC_\d+__|__HTML_\d+__/g;
  let match: RegExpExecArray | null = null;

  while ((match = boundaryRegex.exec(currentText)) !== null) {
    const nonQuoteText = currentText.substring(lastIndex, match.index);
    const processedNonQuote = processNonQuotedSegment(nonQuoteText, {
      wrapRegularTextWithItalic: settings.wrapRegularTextWithItalic,
      normalizeMultipleAsterisks: settings.normalizeMultipleAsterisks,
    });
    resultStage2 += processedNonQuote;
    resultStage2 += match[0]; // Add the cleaned quote or placeholder itself
    lastIndex = boundaryRegex.lastIndex;
  }
  const remainingText = currentText.substring(lastIndex);
  const processedRemaining = processNonQuotedSegment(remainingText, {
    wrapRegularTextWithItalic: settings.wrapRegularTextWithItalic,
    normalizeMultipleAsterisks: settings.normalizeMultipleAsterisks,
  });
  resultStage2 += processedRemaining;

  let finalResult = originalLeadingSpace + resultStage2 + originalTrailingSpace;

  // Stage 3: Final post-processing cleanup
  finalResult = postProcess(finalResult);

  // Restore blocks
  // Iteratively restore placeholders to handle nesting.
  // This is necessary because placeholders can be inside other placeholders (e.g., an inline code block inside an HTML tag).
  let iterations = 0;
  // A generous safety break to prevent infinite loops.
  const maxIterations = (fencedBlocks.length + htmlBlocks.length + inlineBlocks.length + oocBlocks.length) * 2 + 10;

  // Keep looping as long as there are placeholders to restore.
  while (
    /__FENCED_\d+__/.test(finalResult) ||
    /__HTML_\d+__/.test(finalResult) ||
    /__INLINE_\d+__/.test(finalResult) ||
    /__OOC_\d+__/.test(finalResult)
  ) {
    // The order of restoration matters for deeply nested content.
    // We are restoring from the inside out implicitly by replacing all types in each pass.
    finalResult = finalResult.replace(/__HTML_(\d+)__/g, (_match, index) => htmlBlocks[parseInt(index, 10)]);
    finalResult = finalResult.replace(/__INLINE_(\d+)__/g, (_match, index) => inlineBlocks[parseInt(index, 10)]);
    finalResult = finalResult.replace(/__OOC_(\d+)__/g, (_match, index) => oocBlocks[parseInt(index, 10)]);
    finalResult = finalResult.replace(/__FENCED_(\d+)__/g, (_match, index) => fencedBlocks[parseInt(index, 10)]);

    iterations++;
    if (iterations > maxIterations) {
      console.warn('WeatherPack: Max restoration iterations reached. Result might be incomplete.');
      break;
    }
  }

  if (name) {
    // Handle name prefix removal for all cases
    const nameRegex = new RegExp(`^\\s*(\\*?)\\s*${name}:\\s*(?:\\*\\s*)?(.*)$`, 'is');

    finalResult = finalResult.replace(nameRegex, (match, asterisk, rest) => {
      // Check if rest starts with asterisk
      const trimmedRest = rest.trim();
      if (trimmedRest.startsWith('*')) {
        return trimmedRest;
      }
      return (asterisk || '') + trimmedRest;
    });
  }

  return finalResult;
}
