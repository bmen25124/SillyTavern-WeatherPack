import { simplifyMarkdown } from '../util.js';

describe('simplifyMarkdown', () => {
  test('adds italic to plain text', () => {
    const input = 'The old house creaked loudly.';
    const expected = '*The old house creaked loudly.*';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('preserves existing italic', () => {
    const input = '*The cat was sleeping soundly.*';
    expect(simplifyMarkdown(input)).toBe(input);
  });

  test('removes excess italic', () => {
    const input = 'The *cat* was sleeping soundly.';
    const expected = '*The cat was sleeping soundly.*';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('preserves quotes without adding italic', () => {
    const input = '"In this case, I guess we will hang together."';
    expect(simplifyMarkdown(input)).toBe(input);
  });

  test('removes italic from quoted text', () => {
    const input = '"*The old house creaked loudly.*"';
    const expected = '"The old house creaked loudly."';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles mixed quoted and non-quoted sentences', () => {
    const input = '*The cat was sleeping soundly.* "In this case, I guess we will hang together."';
    expect(simplifyMarkdown(input)).toBe(input);
  });

  test('adds italic to non-quoted part in mixed content', () => {
    const input = '"Hello," she whispered. "How are you?"';
    const expected = '"Hello," *she whispered.* "How are you?"';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles multiple sentences with quotes', () => {
    const input = 'She looked at him. "What do you mean?" He shrugged.';
    const expected = '*She looked at him.* "What do you mean?" *He shrugged.*';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles sentences with multiple quotes', () => {
    const input = '"Start" then middle "end."';
    const expected = '"Start" *then middle* "end."';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('preserves punctuation marks', () => {
    const input = 'What happened? "I don\'t know!" Then everything went quiet...';
    const expected = '*What happened?* "I don\'t know!" *Then everything went quiet...*';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('Quote prioritization 1', () => {
    const input = '*"P-please—*gasp*—be careful with *that* vase..."*';
    const expected = '"P-please—gasp—be careful with that vase..."';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('Mixed 1', () => {
    const input =
      'The old car gave a sudden *lurch*, its rusty frame *groaning* loudly as she tried (and failed) to start the engine. *"W-will it *even run*?!*"* she exclaimed, voice trembling. *"T-this isn\'t—*sputter*—some *reliable* machine, you—*clank*—you *lemon!*"*';
    const expected =
      '*The old car gave a sudden lurch, its rusty frame groaning loudly as she tried (and failed) to start the engine.* "W-will it even run?!" *she exclaimed, voice trembling.* "T-this isn\'t—sputter—some reliable machine, you—clank—you lemon!"';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles edge cases', () => {
    expect(simplifyMarkdown('')).toBe('');
    expect(simplifyMarkdown('"quoted"')).toBe('"quoted"');
    expect(simplifyMarkdown('*italic*')).toBe('*italic*');
    expect(simplifyMarkdown('single word')).toBe('*single word*');
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
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test("don't break complex 1", () => {
    const input = `*The old library was silent save for the rustle of pages, a quiet* "Shhh—!" *echoing from the far end as a book cart rumbled by. Her fingers traced the spines, searching for adventure and mystery.*`;
    expect(simplifyMarkdown(input)).toBe(input);
  });
  test("don't break complex 2", () => {
    const input = `"P-pardon—excuse me—could you please not block the—ahem—the history section?!" *a librarian whispered sternly, even as her eyes twinkled kindly behind her spectacles. A faint chuckle escaped her before she could stop it, making her cheeks flush.*`;
    expect(simplifyMarkdown(input)).toBe(input);
  });
  test("don't break complex 3", () => {
    const input = `*The grandfather clock gave a resonant chime, its ancient gears whirring softly as it marked the hour.* "D-did it strike three already?!" *she murmured, voice surprised.* "T-this isn't—tick-tock—some short visit, I—oh dear—I lost track!"`;
    expect(simplifyMarkdown(input)).toBe(input);
  });
  test("don't break complex 4", () => {
    const input = `*Her gaze swept wildly across the shelves before landing on a worn, leather-bound volume.* "T-this is it," *she breathed, her heart thumping as her fingers found just the right title on the dusty shelf.* "S-so I'd better—hush—get started reading this too..."`;
    expect(simplifyMarkdown(input)).toBe(input);
  });
  test("don't break complex 5", () => {
    const input = `*Her gaze swept wildly across the shelves before landing on a worn, leather-bound volume.* "T-this is it," *she breathed, her heart thumping as her fingers found just the right title on the dusty shelf.* "S-so I'd better—hush—get started reading this too..."`;
    expect(simplifyMarkdown(input)).toBe(input);
  });
  test("don't break complex 6", () => {
    const input = `"...W-wow," *she added softly, leaning back in the comfy armchair, her imagination (filled with dragons, castles, and magic now) soaring far away.*`;
    expect(simplifyMarkdown(input)).toBe(input);
  });
  test("don't break complex 7", () => {
    const input = `*The old library was silent save for the rustle of pages, a quiet* "Shhh—!" *echoing from the far end as a book cart rumbled by. Her fingers traced the spines, searching for adventure and mystery.*

"P-pardon—excuse me—could you please not block the—ahem—the history section?!" *a librarian whispered sternly, even as her eyes twinkled kindly behind her spectacles. A faint chuckle escaped her before she could stop it, making her cheeks flush.*

*The grandfather clock gave a resonant chime, its ancient gears whirring softly as it marked the hour.* "D-did it strike three already?!" *she murmured, voice surprised.* "T-this isn't—tick-tock—some short visit, I—oh dear—I lost track!"`;
    expect(simplifyMarkdown(input)).toBe(input);
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
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('replaces fancy quotes with standard quotes', () => {
    const input = '“Hello,” she said. “How are you?”';
    const expected = '"Hello," *she said.* "How are you?"';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles complex dialogue with mixed quotes and italics', () => {
    const input = `"YOU!" *Callie exploded, the sound tearing from her throat, raw and furious.** Her voice cracked, fury overriding her pitch control. The sniper flinched, whipping around with wide, startled eyes, dropping his rifle with a clatter.* "You cowardly, alley-sniping PIECE OF GARBAGE!"`;
    const expected =
      '"YOU!" *Callie exploded, the sound tearing from her throat, raw and furious. Her voice cracked, fury overriding her pitch control. The sniper flinched, whipping around with wide, startled eyes, dropping his rifle with a clatter.* "You cowardly, alley-sniping PIECE OF GARBAGE!"';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('preserves fenced code blocks', () => {
    const input = '```\nconst x = 1;\nconst y = 2;\n```';
    expect(simplifyMarkdown(input)).toBe(input);
  });

  test('removes asterisks from inline code blocks', () => {
    const input = 'This is some code: `const x = "*";`';
    const expected = '*This is some code:* `const x = "";`';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles mixed content with code blocks', () => {
    const input = 'Here is some text. `*remove this*` and a code block:\n\n```\n*preserve this*\n```';
    const expected = '*Here is some text.* `remove this` *and a code block:*\n\n```\n*preserve this*\n```';
    expect(simplifyMarkdown(input)).toBe(expected);
  });
});

test('preserves OOC blocks', () => {
  const input = 'This is a test. (OOC: This should not be *italicized*.)';
  const expected = '*This is a test.* (OOC: This should not be *italicized*.)';
  expect(simplifyMarkdown(input)).toBe(expected);
});

test('preserves OOC block only', () => {
  const input = '(OOC: This should not be *italicized*.)';
  expect(simplifyMarkdown(input)).toBe(input);
});

test('preserves multi-line OOC blocks', () => {
  const input = 'This is a test.\n(OOC: This should not be *italicized*.\nAnd this is a new line.)\nMore text.';
  const expected = '*This is a test.*\n(OOC: This should not be *italicized*.\nAnd this is a new line.)\n*More text.*';
  expect(simplifyMarkdown(input)).toBe(expected);
});
