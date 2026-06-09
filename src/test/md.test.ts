import { simplifyMarkdown } from '../markdown.js';
import { ExtensionSettings } from '../config.js';
import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';

const baseSettings: ExtensionSettings = {
  version: '0.1.0',
  formatVersion: 'F_1.0',
  autoMode: AutoModeOptions.NONE,
  enableMarkdownSimplification: true,
  removeNamePrefix: false,
  wrapRegularTextWithItalic: true,
  normalizeFancyQuotes: true,
  normalizeMultipleAsterisks: true,
  unwrapHtmlJs: true,
  cleanItalicsInQuotes: true,
  includeHTML: false,
  includeCodeBlocks: true,
  enableJSAnalysis: true,
  allowedAPIs: [],
  blockedAPIs: [],
  maxScriptLength: 50000,
  allowObfuscation: false,
};

describe('simplifyMarkdown', () => {
  describe('New Toggles', () => {
    describe('wrapRegularTextWithItalic', () => {
      test('adds italic to plain text', () => {
        const settings = { ...baseSettings, wrapRegularTextWithItalic: true };
        const input = 'The old house creaked loudly.';
        const expected = '*The old house creaked loudly.*';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });

      test('does not add italic when disabled', () => {
        const settings = { ...baseSettings, wrapRegularTextWithItalic: false };
        const input = 'The old house creaked loudly.';
        const expected = 'The old house creaked loudly.';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });
    });

    describe('normalizeFancyQuotes', () => {
      test('replaces fancy quotes with standard quotes', () => {
        const settings = { ...baseSettings, normalizeFancyQuotes: true };
        const input = '“Hello,” she said. “How are you?”';
        const expected = '"Hello," *she said.* "How are you?"';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });

      test('does not replace fancy quotes when disabled', () => {
        const settings = { ...baseSettings, normalizeFancyQuotes: false };
        const input = '“Hello,” she said. “How are you?”';
        const expected = '“Hello,” *she said.* “How are you?”';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });
    });

    describe('normalizeMultipleAsterisks', () => {
      test('consolidates multiple asterisks', () => {
        const settings = { ...baseSettings, normalizeMultipleAsterisks: true };
        const input = 'This is **bold** and ***italic bold***.';
        const expected = '*This is bold and italic bold.*';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });

      test('does not consolidate multiple asterisks when disabled', () => {
        const settings = { ...baseSettings, normalizeMultipleAsterisks: false };
        const input = 'This is **bold** and ***italic bold***.';
        const expected = '*This is **bold** and ***italic bold***.*';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });
    });

    describe('unwrapHtmlJs', () => {
      test('unwraps HTML from code blocks', () => {
        const settings = { ...baseSettings, unwrapHtmlJs: true };
        const input = 'This is a test with `<font color=FF69B4>“Coffee strong. Sleep more. Idiot.”</font>`';
        const expected = '*This is a test with* <font color=FF69B4>"Coffee strong. Sleep more. Idiot."</font>';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });

      test('does not unwrap HTML from code blocks when disabled', () => {
        const settings = { ...baseSettings, unwrapHtmlJs: false };
        const input = 'This is a test with `<font color=FF69B4>“Coffee strong. Sleep more. Idiot.”</font>`';
        const expected = '*This is a test with* `<font color=FF69B4>“Coffee strong. Sleep more. Idiot.”</font>`';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });
    });

    describe('cleanItalicsInQuotes', () => {
      test('removes italic from quoted text', () => {
        const settings = { ...baseSettings, cleanItalicsInQuotes: true };
        const input = '"*The old house creaked loudly.*"';
        const expected = '"The old house creaked loudly."';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });

      test('preserves italic in quoted text when disabled', () => {
        const settings = { ...baseSettings, cleanItalicsInQuotes: false };
        const input = '"*The old house creaked loudly.*"';
        const expected = '"*The old house creaked loudly.*"';
        expect(simplifyMarkdown(input, settings)).toBe(expected);
      });
    });
  });

  describe('Legacy Tests (Adapted)', () => {
    test('preserves existing italic', () => {
      const input = '*The cat was sleeping soundly.*';
      expect(simplifyMarkdown(input, baseSettings)).toBe(input);
    });

    test('removes excess italic', () => {
      const input = 'The *cat* was sleeping soundly.';
      const expected = '*The cat was sleeping soundly.*';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('preserves quotes without adding italic', () => {
      const input = '"In this case, I guess we will hang together."';
      expect(simplifyMarkdown(input, baseSettings)).toBe(input);
    });

    test('handles mixed quoted and non-quoted sentences', () => {
      const input = '*The cat was sleeping soundly.* "In this case, I guess we will hang together."';
      expect(simplifyMarkdown(input, baseSettings)).toBe(input);
    });

    test('adds italic to non-quoted part in mixed content', () => {
      const input = '"Hello," she whispered. "How are you?"';
      const expected = '"Hello," *she whispered.* "How are you?"';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('handles multiple sentences with quotes', () => {
      const input = 'She looked at him. "What do you mean?" He shrugged.';
      const expected = '*She looked at him.* "What do you mean?" *He shrugged.*';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('handles sentences with multiple quotes', () => {
      const input = '"Start" then middle "end."';
      const expected = '"Start" *then middle* "end."';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('preserves punctuation marks', () => {
      const input = 'What happened? "I don\'t know!" Then everything went quiet...';
      const expected = '*What happened?* "I don\'t know!" *Then everything went quiet...*';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('Quote prioritization 1', () => {
      const input = '*"P-please—*gasp*—be careful with *that* vase..."*';
      const expected = '"P-please—gasp—be careful with that vase..."';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('Mixed 1', () => {
      const input =
        'The old car gave a sudden *lurch*, its rusty frame *groaning* loudly as she tried (and failed) to start the engine. *"W-will it *even run*?!*"* she exclaimed, voice trembling. *"T-this isn\'t—*sputter*—some *reliable* machine, you—*clank*—you *lemon!*"*';
      const expected =
        '*The old car gave a sudden lurch, its rusty frame groaning loudly as she tried (and failed) to start the engine.* "W-will it even run?!" *she exclaimed, voice trembling.* "T-this isn\'t—sputter—some reliable machine, you—clank—you lemon!"';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('handles edge cases', () => {
      expect(simplifyMarkdown('', baseSettings)).toBe('');
      expect(simplifyMarkdown('"quoted"', baseSettings)).toBe('"quoted"');
      expect(simplifyMarkdown('*italic*', baseSettings)).toBe('*italic*');
      expect(simplifyMarkdown('single word', baseSettings)).toBe('*single word*');
    });

    test('handles complex multi-paragraph input with mixed quotes and italics', () => {
      const input = `The old library was *silent* save for the rustle of pages, a quiet *"Shhh—!"* echoing from the far end as a book cart rumbled by. Her fingers traced the spines, searching for *adventure* and *mystery*.

*"P-pardon—*excuse me*—could you please *not* block the—*ahem*—the *history section*?!*"* a librarian whispered sternly, even as her eyes twinkled kindly behind her spectacles. A faint *chuckle* escaped her before she could stop it, making her cheeks flush.

The grandfather clock gave a resonant *chime*, its ancient gears *whirring* softly as it marked the hour. *"D-did it *strike three* already?!*"* she murmured, voice surprised. *"T-this isn't—*tick-tock*—some *short* visit, I—*oh dear*—I *lost track!*"*

Her gaze swept wildly across the shelves before landing on a worn, leather-bound volume. *"T-this is *it*,"* she breathed, her heart thumping as her fingers found *just* the right title on the dusty shelf. *"S-so I'd better—*hush*—get started *reading* this too..."*

The way the story *unfolded* before her, the quiet *anticipation* she couldn't suppress, the way her fingers gently *turned* the fragile pages—every bit of her signaled *happy reader* even as her expression stayed studiously neutral.

*"...W-wow,"* she added softly, leaning back in the comfy armchair, her imagination (filled with dragons, castles, and *magic* now) soaring far away.`;
      const expected = `*The old library was silent save for the rustle of pages, a quiet* "Shhh—!" *echoing from the far end as a book cart rumbled by. Her fingers traced the spines, searching for adventure and mystery.*

"P-pardon—excuse me—could you please not block the—ahem—the history section?!" *a librarian whispered sternly, even as her eyes twinkled kindly behind her spectacles. A faint chuckle escaped her before she could stop it, making her cheeks flush.*

*The grandfather clock gave a resonant chime, its ancient gears whirring softly as it marked the hour.* "D-did it strike three already?!" *she murmured, voice surprised.* "T-this isn't—tick-tock—some short visit, I—oh dear—I lost track!"

*Her gaze swept wildly across the shelves before landing on a worn, leather-bound volume.* "T-this is it," *she breathed, her heart thumping as her fingers found just the right title on the dusty shelf.* "S-so I'd better—hush—get started reading this too..."

*The way the story unfolded before her, the quiet anticipation she couldn't suppress, the way her fingers gently turned the fragile pages—every bit of her signaled happy reader even as her expression stayed studiously neutral.*

"...W-wow," *she added softly, leaning back in the comfy armchair, her imagination (filled with dragons, castles, and magic now) soaring far away.*`;
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('handles complex 2', () => {
      const input = `The shopkeeper smiled, adjusting the items on the shelf.

**"Welcome! *Looking* for anything special?"** he asked, his hands gesturing broadly. **"Or perhaps *just browsing* today?"**

He then pointed to a small, ornate box: **"...This one is quite popular. A new arrival, very intricate."**

A moment of silence. Then, almost a whisper: **"...Unique."**`;
      const expected = `*The shopkeeper smiled, adjusting the items on the shelf.*

"Welcome! Looking for anything special?" *he asked, his hands gesturing broadly.* "Or perhaps just browsing today?"

*He then pointed to a small, ornate box:* "...This one is quite popular. A new arrival, very intricate."

*A moment of silence. Then, almost a whisper:* "...Unique."`;
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('handles complex dialogue with mixed quotes and italics', () => {
      const input = `"YOU!" *Callie exploded, the sound tearing from her throat, raw and furious.** Her voice cracked, fury overriding her pitch control. The sniper flinched, whipping around with wide, startled eyes, dropping his rifle with a clatter.* "You cowardly, alley-sniping PIECE OF GARBAGE!"`;
      const expected =
        '"YOU!" *Callie exploded, the sound tearing from her throat, raw and furious. Her voice cracked, fury overriding her pitch control. The sniper flinched, whipping around with wide, startled eyes, dropping his rifle with a clatter.* "You cowardly, alley-sniping PIECE OF GARBAGE!"';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('preserves fenced code blocks', () => {
      const input = '```\nconst x = 1;\nconst y = 2;\n```';
      expect(simplifyMarkdown(input, baseSettings)).toBe(input);
    });

    test('preserves asterisks in inline code blocks', () => {
      const input = 'This is some code: `const x = "*";`';
      const expected = '*This is some code:* `const x = "*";`';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('handles mixed content with code blocks', () => {
      const input = 'Here is some text. `*remove this*` and a code block:\n\n```\n*preserve this*\n```';
      const expected = '*Here is some text.* `*remove this*` *and a code block:*\n\n```\n*preserve this*\n```';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('preserves fenced code blocks inside HTML tags', () => {
      const input = `*Foobar*
<infoblock>
\`\`\`md
Location: Room
\`\`\`
</infoblock>`;

      expect(simplifyMarkdown(input, baseSettings)).toBe(input);
    });

    test('preserves OOC blocks', () => {
      const input = 'This is a test. (OOC: This should not be *italicized*.)';
      const expected = '*This is a test.* (OOC: This should not be *italicized*.)';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('preserves HTML tags', () => {
      const input = 'This is <em>emphasized</em> text with <strong>bold</strong> content.';
      const expected = '*This is* <em>emphasized</em> *text with* <strong>bold</strong> *content.*';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });

    test('preserves complex nested HTML with multiple divs and scripts', () => {
      const input = `<div id="coffeeSpill_5" onclick="revealNote_5()">
  <div id="thoughtText_5">CRINGE! Why'd I say tragic?!</div>
  <div id="embarrassingNote_5">❤️ TOM NOTES ❤️<br>• Call him KING??<br>• NO deadlifting talk<br>• HIDE lube stash</div>
</div>`;

      const expected = `<div id="coffeeSpill_5" onclick="revealNote_5()">
  <div id="thoughtText_5">CRINGE! Why'd I say tragic?!</div>
  <div id="embarrassingNote_5">❤️ TOM NOTES ❤️<br>• Call him KING??<br>• NO deadlifting talk<br>• HIDE lube stash</div>
</div>`;

      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });
  });

  describe('name prefix removal', () => {
    test('removes character name prefix when provided', () => {
      const input = 'Alice: *Hello* there!';
      const expected = '*Hello there!*';
      expect(simplifyMarkdown(input, baseSettings, 'Alice')).toBe(expected);
    });

    test('removes name prefix case insensitively and with asterisks', () => {
      const input = '*aLiCe: *Hello* there!';
      const expected = '*Hello there!*';
      expect(simplifyMarkdown(input, baseSettings, 'Alice')).toBe(expected);
    });
    test('removes name prefix on its own line', () => {
      {
        const input = 'Alice:\n\n*Hello* there!';
        const expected = '*Hello there!*';
        expect(simplifyMarkdown(input, baseSettings, 'Alice')).toBe(expected);
      }
      {
        const input = '*Alice:*\n\n*Hello* there!';
        const expected = '*Hello there!*';
        expect(simplifyMarkdown(input, baseSettings, 'Alice')).toBe(expected);
      }
    });

    test('does not remove non-matching name prefix', () => {
      const input = 'Bob: *Hello* there!';
      const expected = '*Bob: Hello there!*';
      expect(simplifyMarkdown(input, baseSettings, 'Alice')).toBe(expected);
    });

    test('works without name parameter', () => {
      const input = 'Alice: *Hello* there!';
      const expected = '*Alice: Hello there!*';
      expect(simplifyMarkdown(input, baseSettings)).toBe(expected);
    });
  });
});
