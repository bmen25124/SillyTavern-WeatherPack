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
  const quotePattern = /(\*("((?:[^"]|\*)*?)")\*)|("((?:[^"]|\*)*?)")/g;

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

function processNonQuotedSegment(segment: string): string {
  if (!segment.trim()) {
    return segment; // Preserve whitespace-only segments
  }

  let newProcessedText = '';
  // Split by one or more punctuation characters, keeping them.
  // e.g. "Hi! How are you???" -> ["Hi", "!", " How are you", "???"]
  const parts = segment.split(/([.!?]+)/g);

  let i = 0;
  while (i < parts.length) {
    let currentTextPart = parts[i];
    i++;

    // Skip null/undefined parts, or empty strings that are not the sole content
    if (currentTextPart === null || currentTextPart === undefined) {
      continue;
    }
    if (currentTextPart === '' && parts.length > 1 && !(i === parts.length && parts.every((p) => p === ''))) {
      if (i < parts.length && /^[.!?]+$/.test(parts[i])) {
      } else {
        newProcessedText += currentTextPart;
        continue;
      }
    }

    let currentPunctuation = '';
    if (i < parts.length && /^[.!?]+$/.test(parts[i])) {
      currentPunctuation = parts[i];
      i++;
    }

    const combinedBlock = currentTextPart + currentPunctuation;

    if (!combinedBlock && parts.length === 1) {
      return ''; // Segment was "" or only contained empty parts
    }

    const leadingSpace = combinedBlock.match(/^\s*/)?.[0] || '';
    const trailingSpace = combinedBlock.match(/\s*$/)?.[0] || '';
    const contentToProcess = combinedBlock.trim();

    if (!contentToProcess) {
      newProcessedText += combinedBlock; // Add back the original whitespace
    } else {
      const deItalicizedContent = removeAllStandardAsterisks(contentToProcess);
      if (!deItalicizedContent.trim()) {
        newProcessedText += leadingSpace + deItalicizedContent + trailingSpace;
      } else {
        newProcessedText += leadingSpace + addStandardItalic(deItalicizedContent) + trailingSpace;
      }
    }
  }
  return newProcessedText;
}

export function simplifyMarkdown(text: string): string {
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

  const finalResult = originalLeadingSpace + resultStage2 + originalTrailingSpace;
  return finalResult;
}
