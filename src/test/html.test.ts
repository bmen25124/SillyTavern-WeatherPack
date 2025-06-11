import { replaceHtmlBlocks } from '../html.js';

describe('replaceHtmlBlocks', () => {
  test('should replace complete HTML block with single placeholder', () => {
    const htmlParts: string[] = [];
    const text = `First paragraph
<div>
  <p>Some text</p>
</div>
Second paragraph`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`First paragraph
<!--HTML_PLACEHOLDER_0-->
Second paragraph`);
    expect(htmlParts).toEqual([
      `<div>
  <p>Some text</p>
</div>`,
    ]);
  });

  test('should handle multiple HTML blocks', () => {
    const htmlParts: string[] = [];
    const text = `Text before
<div>Block 1</div>
Middle text
<span>Block 2</span>
Text after`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Text before
<!--HTML_PLACEHOLDER_0-->
Middle text
<!--HTML_PLACEHOLDER_1-->
Text after`);
    expect(htmlParts).toEqual(['<div>Block 1</div>', '<span>Block 2</span>']);
  });

  test('should handle nested HTML blocks as single unit', () => {
    const htmlParts: string[] = [];
    const text = `Before
<div class="outer">
  <div class="inner">
    <p>Nested content</p>
  </div>
</div>
After`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Before
<!--HTML_PLACEHOLDER_0-->
After`);
    expect(htmlParts).toEqual([
      `<div class="outer">
  <div class="inner">
    <p>Nested content</p>
  </div>
</div>`,
    ]);
  });

  test('should handle self-closing tags', () => {
    const htmlParts: string[] = [];
    const text = `Text with <img src="image.jpg" alt="test" /> image`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Text with <!--HTML_PLACEHOLDER_0--> image`);
    expect(htmlParts).toEqual(['<img src="image.jpg" alt="test" />']);
  });

  test('should handle void elements without closing slash', () => {
    const htmlParts: string[] = [];
    const text = `Line 1<br>Line 2<hr>Line 3`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Line 1<!--HTML_PLACEHOLDER_0-->Line 2<!--HTML_PLACEHOLDER_1-->Line 3`);
    expect(htmlParts).toEqual(['<br>', '<hr>']);
  });

  test('should handle complex HTML with style and script blocks', () => {
    const htmlParts: string[] = [];
    const text = `Text before
<style>
  .class { color: red; }
</style>
Middle text
<script>
  alert('Hello');
</script>
Text after`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Text before
<!--HTML_PLACEHOLDER_0-->
Middle text
<!--HTML_PLACEHOLDER_1-->
Text after`);
    expect(htmlParts).toEqual([
      `<style>
  .class { color: red; }
</style>`,
      `<script>
  alert('Hello');
</script>`,
    ]);
  });

  test('should handle mixed HTML blocks and inline tags', () => {
    const htmlParts: string[] = [];
    const text = `Start <div>Block content</div> middle <span>inline</span> end`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Start <!--HTML_PLACEHOLDER_0--> middle <!--HTML_PLACEHOLDER_1--> end`);
    expect(htmlParts).toEqual(['<div>Block content</div>', '<span>inline</span>']);
  });

  test('should handle empty HTML blocks', () => {
    const htmlParts: string[] = [];
    const text = `Text <div></div> more text`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Text <!--HTML_PLACEHOLDER_0--> more text`);
    expect(htmlParts).toEqual(['<div></div>']);
  });

  test('should preserve text without HTML', () => {
    const htmlParts: string[] = [];
    const text = `Just plain text with no HTML tags`;

    const result = replaceHtmlBlocks(text, htmlParts);

    expect(result).toBe(`Just plain text with no HTML tags`);
    expect(htmlParts).toEqual([]);
  });
});
