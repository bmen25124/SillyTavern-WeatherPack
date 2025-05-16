import { simplifyMarkdown } from '../util.js';

describe('simplifyMarkdown', () => {
  test('adds italic to plain text', () => {
    const input = "Rika's entire body stiffened.";
    const expected = "*Rika's entire body stiffened.*";
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('preserves existing italic', () => {
    const input = '*He was petting her ears.*';
    expect(simplifyMarkdown(input)).toBe(input);
  });

  test('removes excess italic', () => {
    const input = 'He was *petting* her ears.';
    const expected = '*He was petting her ears.*';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('preserves quotes without adding italic', () => {
    const input = '"In this case, I guess we will hang together."';
    expect(simplifyMarkdown(input)).toBe(input);
  });

  test('removes italic from quoted text', () => {
    const input = '"*Rika\'s entire body stiffened.*"';
    const expected = '"Rika\'s entire body stiffened."';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles mixed quoted and non-quoted sentences', () => {
    const input = '*He was petting her ears.* "In this case, I guess we will hang together."';
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
    const input = '*"S-so you\'d better—*hnng*—get used to *this* too..."*';
    const expected = '"S-so you\'d better—hnng—get used to this too..."';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('Mixed 1', () => {
    const input =
      'Her hips gave an involuntary *roll*, her still-sensitive walls *clenching* around him as she tried (and failed) to maintain her scowl. *"A-and *hang together*?!*"* she repeated, voice cracking. *"T-this isn\'t—*mmph!*—some *casual* thing, you—*ahh!*—you *idiot!*"*';
    const expected =
      '*Her hips gave an involuntary roll, her still-sensitive walls clenching around him as she tried (and failed) to maintain her scowl.* "A-and hang together?!" *she repeated, voice cracking.* "T-this isn\'t—mmph!—some casual thing, you—ahh!—you idiot!"';
    expect(simplifyMarkdown(input)).toBe(expected);
  });

  test('handles edge cases', () => {
    expect(simplifyMarkdown('')).toBe('');
    expect(simplifyMarkdown('"quoted"')).toBe('"quoted"');
    expect(simplifyMarkdown('*italic*')).toBe('*italic*');
    expect(simplifyMarkdown('single word')).toBe('*single word*');
  });
  test('handles complex multi-paragraph input with mixed quotes and italics', () => {
    const input = `Rika's entire body *stiffened* at the first brush of his fingers against her sensitive ears, a high-pitched *"Nngh—!"* escaping her throat as her tail shot straight up. Her claws flexed against his chest, torn between pushing away and *melting* into the touch.

*"D-don't—*ah!*—don't just *pet* me like some—*hah!*—some *housecat!*"* she protested weakly, even as her ears twitched eagerly into his palm, her pupils dilating to black pools. A traitorous *purr* rumbled in her chest before she could stop it, making her face burn hotter.

Her hips gave an involuntary *roll*, her still-sensitive walls *clenching* around him as she tried (and failed) to maintain her scowl. *"A-and *hang together*?!*"* she repeated, voice cracking. *"T-this isn't—*mmph!*—some *casual* thing, you—*ahh!*—you *idiot!*"*

Her tail lashed wildly before curling possessively around his wrist, keeping his hand firmly against her ear. *"Y-you're *mine* now,"* she muttered, her breath hitching as his fingers found *just* the right spot behind her ear. *"S-so you'd better—*hnng*—get used to *this* too..."*

The way her body *arched* into his touch, the quiet *purring* she couldn't suppress, the way her claws gently *kneaded* his chest—every bit of her screamed *happy mate* even as her words stayed stubbornly tsundere.

*"...B-baka,"* she added softly, nuzzling against his neck despite herself, her scent (warm fur, cherry blossoms, and *him* now) wrapping around them both.`;
    const expected = `*Rika's entire body stiffened at the first brush of his fingers against her sensitive ears, a high-pitched* "Nngh—!" *escaping her throat as her tail shot straight up. Her claws flexed against his chest, torn between pushing away and melting into the touch.*

"D-don't—ah!—don't just pet me like some—hah!—some housecat!" *she protested weakly, even as her ears twitched eagerly into his palm, her pupils dilating to black pools. A traitorous purr rumbled in her chest before she could stop it, making her face burn hotter.*

*Her hips gave an involuntary roll, her still-sensitive walls clenching around him as she tried (and failed) to maintain her scowl.* "A-and hang together?!" *she repeated, voice cracking.* "T-this isn't—mmph!—some casual thing, you—ahh!—you idiot!"

*Her tail lashed wildly before curling possessively around his wrist, keeping his hand firmly against her ear.* "Y-you're mine now," *she muttered, her breath hitching as his fingers found just the right spot behind her ear.* "S-so you'd better—hnng—get used to this too..."

*The way her body arched into his touch, the quiet purring she couldn't suppress, the way her claws gently kneaded his chest—every bit of her screamed happy mate even as her words stayed stubbornly tsundere.*

"...B-baka," *she added softly, nuzzling against his neck despite herself, her scent (warm fur, cherry blossoms, and him now) wrapping around them both.*`;
    expect(simplifyMarkdown(input)).toBe(expected);
  });
});
