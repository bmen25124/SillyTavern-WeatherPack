import { simplifyMarkdown } from '../markdown.js';

describe('simplifyMarkdown', () => {
  test('adds italic to plain text', () => {
    const input = 'The old house creaked loudly.';
    const expected = '*The old house creaked loudly.*';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('does not add italic when disabled', () => {
    const input = 'The old house creaked loudly.';
    const expected = 'The old house creaked loudly.';
    expect(simplifyMarkdown(input, false)).toBe(expected);
  });

  test('removes excess italic without adding new italic when disabled', () => {
    const input = 'The *cat* was sleeping soundly.';
    const expected = 'The cat was sleeping soundly.';
    expect(simplifyMarkdown(input, false)).toBe(expected);
  });

  test('preserves quotes without adding italic when disabled', () => {
    const input = '"Hello," she whispered. "How are you?"';
    const expected = '"Hello," she whispered. "How are you?"';
    expect(simplifyMarkdown(input, false)).toBe(expected);
  });

  test('preserves existing italic', () => {
    const input = '*The cat was sleeping soundly.*';
    expect(simplifyMarkdown(input, true)).toBe(input);
  });

  test('removes excess italic', () => {
    const input = 'The *cat* was sleeping soundly.';
    const expected = '*The cat was sleeping soundly.*';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('preserves quotes without adding italic', () => {
    const input = '"In this case, I guess we will hang together."';
    expect(simplifyMarkdown(input, true)).toBe(input);
  });

  test('removes italic from quoted text', () => {
    const input = '"*The old house creaked loudly.*"';
    const expected = '"The old house creaked loudly."';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('handles mixed quoted and non-quoted sentences', () => {
    const input = '*The cat was sleeping soundly.* "In this case, I guess we will hang together."';
    expect(simplifyMarkdown(input, true)).toBe(input);
  });

  test('adds italic to non-quoted part in mixed content', () => {
    const input = '"Hello," she whispered. "How are you?"';
    const expected = '"Hello," *she whispered.* "How are you?"';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('handles multiple sentences with quotes', () => {
    const input = 'She looked at him. "What do you mean?" He shrugged.';
    const expected = '*She looked at him.* "What do you mean?" *He shrugged.*';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('handles sentences with multiple quotes', () => {
    const input = '"Start" then middle "end."';
    const expected = '"Start" *then middle* "end."';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('preserves punctuation marks', () => {
    const input = 'What happened? "I don\'t know!" Then everything went quiet...';
    const expected = '*What happened?* "I don\'t know!" *Then everything went quiet...*';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('Quote prioritization 1', () => {
    const input = '*"P-please—*gasp*—be careful with *that* vase..."*';
    const expected = '"P-please—gasp—be careful with that vase..."';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('Mixed 1', () => {
    const input =
      'The old car gave a sudden *lurch*, its rusty frame *groaning* loudly as she tried (and failed) to start the engine. *"W-will it *even run*?!*"* she exclaimed, voice trembling. *"T-this isn\'t—*sputter*—some *reliable* machine, you—*clank*—you *lemon!*"*';
    const expected =
      '*The old car gave a sudden lurch, its rusty frame groaning loudly as she tried (and failed) to start the engine.* "W-will it even run?!" *she exclaimed, voice trembling.* "T-this isn\'t—sputter—some reliable machine, you—clank—you lemon!"';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('handles edge cases', () => {
    expect(simplifyMarkdown('', true)).toBe('');
    expect(simplifyMarkdown('"quoted"', true)).toBe('"quoted"');
    expect(simplifyMarkdown('*italic*', true)).toBe('*italic*');
    expect(simplifyMarkdown('single word', true)).toBe('*single word*');
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
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test("don't break complex 1", () => {
    const input = `*The old library was silent save for the rustle of pages, a quiet* "Shhh—!" *echoing from the far end as a book cart rumbled by. Her fingers traced the spines, searching for adventure and mystery.*`;
    expect(simplifyMarkdown(input, true)).toBe(input);
  });
  test("don't break complex 2", () => {
    const input = `"P-pardon—excuse me—could you please not block the—ahem—the history section?!" *a librarian whispered sternly, even as her eyes twinkled kindly behind her spectacles. A faint chuckle escaped her before she could stop it, making her cheeks flush.*`;
    expect(simplifyMarkdown(input, true)).toBe(input);
  });
  test("don't break complex 3", () => {
    const input = `*The grandfather clock gave a resonant chime, its ancient gears whirring softly as it marked the hour.* "D-did it strike three already?!" *she murmured, voice surprised.* "T-this isn't—tick-tock—some short visit, I—oh dear—I lost track!"`;
    expect(simplifyMarkdown(input, true)).toBe(input);
  });
  test("don't break complex 4", () => {
    const input = `*Her gaze swept wildly across the shelves before landing on a worn, leather-bound volume.* "T-this is it," *she breathed, her heart thumping as her fingers found just the right title on the dusty shelf.* "S-so I'd better—hush—get started reading this too..."`;
    expect(simplifyMarkdown(input, true)).toBe(input);
  });
  test("don't break complex 5", () => {
    const input = `*Her gaze swept wildly across the shelves before landing on a worn, leather-bound volume.* "T-this is it," *she breathed, her heart thumping as her fingers found just the right title on the dusty shelf.* "S-so I'd better—hush—get started reading this too..."`;
    expect(simplifyMarkdown(input, true)).toBe(input);
  });
  test("don't break complex 6", () => {
    const input = `"...W-wow," *she added softly, leaning back in the comfy armchair, her imagination (filled with dragons, castles, and magic now) soaring far away.*`;
    expect(simplifyMarkdown(input, true)).toBe(input);
  });
  test("don't break complex 7", () => {
    const input = `*The old library was silent save for the rustle of pages, a quiet* "Shhh—!" *echoing from the far end as a book cart rumbled by. Her fingers traced the spines, searching for adventure and mystery.*

"P-pardon—excuse me—could you please not block the—ahem—the history section?!" *a librarian whispered sternly, even as her eyes twinkled kindly behind her spectacles. A faint chuckle escaped her before she could stop it, making her cheeks flush.*

*The grandfather clock gave a resonant chime, its ancient gears whirring softly as it marked the hour.* "D-did it strike three already?!" *she murmured, voice surprised.* "T-this isn't—tick-tock—some short visit, I—oh dear—I lost track!"`;
    expect(simplifyMarkdown(input, true)).toBe(input);
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
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('replaces fancy quotes with standard quotes', () => {
    const input = '“Hello,” she said. “How are you?”';
    const expected = '"Hello," *she said.* "How are you?"';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('handles complex dialogue with mixed quotes and italics', () => {
    const input = `"YOU!" *Callie exploded, the sound tearing from her throat, raw and furious.** Her voice cracked, fury overriding her pitch control. The sniper flinched, whipping around with wide, startled eyes, dropping his rifle with a clatter.* "You cowardly, alley-sniping PIECE OF GARBAGE!"`;
    const expected =
      '"YOU!" *Callie exploded, the sound tearing from her throat, raw and furious. Her voice cracked, fury overriding her pitch control. The sniper flinched, whipping around with wide, startled eyes, dropping his rifle with a clatter.* "You cowardly, alley-sniping PIECE OF GARBAGE!"';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('preserves fenced code blocks', () => {
    const input = '```\nconst x = 1;\nconst y = 2;\n```';
    expect(simplifyMarkdown(input, true)).toBe(input);
  });

  test('removes asterisks from inline code blocks', () => {
    const input = 'This is some code: `const x = "*";`';
    const expected = '*This is some code:* `const x = "";`';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });

  test('handles mixed content with code blocks', () => {
    const input = 'Here is some text. `*remove this*` and a code block:\n\n```\n*preserve this*\n```';
    const expected = '*Here is some text.* `remove this` *and a code block:*\n\n```\n*preserve this*\n```';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });
});

test('preserves OOC blocks', () => {
  const input = 'This is a test. (OOC: This should not be *italicized*.)';
  const expected = '*This is a test.* (OOC: This should not be *italicized*.)';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves OOC block only', () => {
  const input = '(OOC: This should not be *italicized*.)';
  expect(simplifyMarkdown(input, true)).toBe(input);
});

test('preserves multi-line OOC blocks', () => {
  const input = 'This is a test.\n(OOC: This should not be *italicized*.\nAnd this is a new line.)\nMore text.';
  const expected = '*This is a test.*\n(OOC: This should not be *italicized*.\nAnd this is a new line.)\n*More text.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves HTML tags', () => {
  const input = 'This is <em>emphasized</em> text with <strong>bold</strong> content.';
  const expected = '*This is* <em>emphasized</em> *text with* <strong>bold</strong> *content.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves self-closing HTML tags', () => {
  const input = 'Line break here<br/>and continue. Image here <img src="test.jpg"/> too.';
  const expected = '*Line break here*<br/>*and continue. Image here* <img src="test.jpg"/> *too.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves HTML tags with attributes', () => {
  const input = 'This has <span class="highlight">highlighted text</span> inside.';
  const expected = '*This has* <span class="highlight">highlighted text</span> *inside.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves nested HTML tags', () => {
  const input = 'Text with <div><span>nested tags</span></div> here.';
  const expected = '*Text with* <div><span>nested tags</span></div> *here.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves XML tags', () => {
  const input = 'Some XML <config><setting>value</setting></config> content.';
  const expected = '*Some XML* <config><setting>value</setting></config> *content.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('handles mixed HTML and quotes', () => {
  const input = '"Hello," she said with <em>emphasis</em>. "How are you?"';
  const expected = '"Hello," *she said with* <em>emphasis</em>*.* "How are you?"';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves HTML tags only (no other text)', () => {
  const input = '<div>Only HTML content</div>';
  expect(simplifyMarkdown(input, true)).toBe(input);
});

test('handles complex mixed content with HTML', () => {
  const input = 'Regular text with <strong>*asterisks*</strong> and "quotes" plus <em>more</em> content.';
  const expected = '*Regular text with* <strong>*asterisks*</strong> *and* "quotes" *plus* <em>more</em> *content.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves code blocks inside HTML tags', () => {
  const input = 'Text with <div>`code with *asterisks*`</div> and more.';
  const expected = '*Text with* <div>`code with *asterisks*`</div> *and more.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves OOC blocks inside HTML tags', () => {
  const input = 'Text with <span>(OOC: *keep asterisks*)</span> here.';
  const expected = '*Text with* <span>(OOC: *keep asterisks*)</span> *here.*';
  expect(simplifyMarkdown(input, true)).toBe(expected);
});

test('preserves nested structures in HTML', () => {
  const input = '<details><summary>Code: `*asterisks*` and (OOC: *more*)</summary>Content</details>';
  expect(simplifyMarkdown(input, true)).toBe(input);
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

  expect(simplifyMarkdown(input, true)).toBe(expected);
});

describe('name prefix removal', () => {
  test('removes character name prefix when provided', () => {
    const input = 'Alice: *Hello* there!';
    const expected = '*Hello there!*';
    expect(simplifyMarkdown(input, true, 'Alice')).toBe(expected);
  });

  test('removes name prefix case insensitively and with asterisks', () => {
    const input = '*aLiCe: *Hello* there!';
    const expected = '*Hello there!*';
    expect(simplifyMarkdown(input, true, 'Alice')).toBe(expected);
  });
  test('removes name prefix on its own line', () => {
    {
      const input = 'Alice:\n\n*Hello* there!';
      const expected = '*Hello there!*';
      expect(simplifyMarkdown(input, true, 'Alice')).toBe(expected);
    }
    {
      const input = '*Alice:*\n\n*Hello* there!';
      const expected = '*Hello there!*';
      expect(simplifyMarkdown(input, true, 'Alice')).toBe(expected);
    }
  });

  test('does not remove non-matching name prefix', () => {
    const input = 'Bob: *Hello* there!';
    const expected = '*Bob: Hello there!*';
    expect(simplifyMarkdown(input, true, 'Alice')).toBe(expected);
  });

  test('works without name parameter', () => {
    const input = 'Alice: *Hello* there!';
    const expected = '*Alice: Hello there!*';
    expect(simplifyMarkdown(input, true)).toBe(expected);
  });
});
