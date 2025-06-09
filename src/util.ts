// Using standard asterisks for all operations.
const STANDARD_ASTERISK = /\*/g; // For global replace
const STANDARD_ASTERISK_START = /^\*/;
const STANDARD_ASTERISK_END = /\*$/;

const isQuoted = (text: string): boolean => {
  return text.trim().startsWith('"') && text.trim().endsWith('"');
};

const removeAllStandardAsterisks = (text: string): string => {
  return text.replace(STANDARD_ASTERISK, '');
};

const hasStandardItalic = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.startsWith('*') && trimmed.endsWith('*');
};

const addStandardItalic = (text: string): string => {
  return `*${text}*`;
};

function stage1_processQuotes(text: string): string {
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
        const cleanedInner = removeAllStandardAsterisks(g3_innerContentOfWrapped);
        return `"${cleanedInner}"`; // Return just the cleaned quote
      } else if (g4_standardQuote) {
        // Matched QUOTE
        // g5_innerContentOfStandard is the content inside the quotes, from ("CONTENT")
        const cleanedInner = removeAllStandardAsterisks(g5_innerContentOfStandard);
        return `"${cleanedInner}"`; // Return the cleaned quote
      }
      return match; // Should not be reached if regex is exhaustive for these patterns
    },
  );
}

function processSingleParagraphNonQuotedSegment(paragraphSegment: string): string {
  if (!paragraphSegment.trim()) {
    return paragraphSegment; // Preserve whitespace-only segments
  }

  const leadingSpace = paragraphSegment.match(/^\s*/)?.[0] || '';
  const trailingSpace = paragraphSegment.match(/\s*$/)?.[0] || '';
  const contentToProcess = paragraphSegment.trim();

  if (!contentToProcess) {
    return paragraphSegment; // Return original if only whitespace
  }

  // Remove all existing asterisks and then add a single italic wrapper
  const deItalicizedContent = removeAllStandardAsterisks(contentToProcess);

  if (!deItalicizedContent.trim()) {
    return leadingSpace + deItalicizedContent + trailingSpace;
  } else {
    return leadingSpace + addStandardItalic(deItalicizedContent) + trailingSpace;
  }
}

function processNonQuotedSegment(segment: string): string {
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
      return processSingleParagraphNonQuotedSegment(part);
    }
  });

  return processedParts.join('');
}

// Post-processing step to clean up adjacent italics
function postProcess(text: string): string {
  // Replace "* *" with " " to merge adjacent italics like *foo* *bar* into *foo bar*
  return text.replace(/\* \*/g, ' ');
}

export function simplifyMarkdown(text: string): string {
  // Replace fancy quotes with standard quotes
  text = text.replace(/[“”]/g, '"');
  // Normalize multiple consecutive asterisks with single asterisks at the very beginning
  text = text.replace(/\*{2,}/g, '*');

  if (!text.trim()) {
    return text;
  }

  const originalLeadingSpace = text.match(/^\s*/)?.[0] || '';
  const originalTrailingSpace = text.match(/\s*$/)?.[0] || '';
  let currentText = text.trim();

  // Stage 1: Normalize and clean all quote forms (*QUOTE* or QUOTE)
  currentText = stage1_processQuotes(currentText);

  // Stage 2: Process non-quoted parts for italics
  let resultStage2 = '';
  let lastIndex = 0;
  const cleanedQuoteRegex = /"[^"]*"/g; // Matches "cleaned_quote_content" from Stage 1
  let match: RegExpExecArray | null = null;

  while ((match = cleanedQuoteRegex.exec(currentText)) !== null) {
    const nonQuoteText = currentText.substring(lastIndex, match.index);
    const processedNonQuote = processNonQuotedSegment(nonQuoteText);
    resultStage2 += processedNonQuote;
    resultStage2 += match[0]; // Add the cleaned quote itself
    lastIndex = cleanedQuoteRegex.lastIndex;
  }
  const remainingText = currentText.substring(lastIndex);
  const processedRemaining = processNonQuotedSegment(remainingText);
  resultStage2 += processedRemaining;

  let finalResult = originalLeadingSpace + resultStage2 + originalTrailingSpace;

  // Stage 3: Final post-processing cleanup
  finalResult = postProcess(finalResult);

  return finalResult;
}
