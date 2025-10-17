# SillyTavern WeatherPack

A [SillyTavern](https://docs.sillytavern.app/) extension that automatically fixes and normalizes markdown formatting in chat messages.

## Features

- **Granular Markdown Simplification**: Offers detailed control over text normalization, including:
    - Normalizing fancy quotes (`“”` to `""`).
    - Consolidating multiple asterisks (`**` to `*`).
    - Cleaning italics from within quotes.
    - Unwrapping HTML/JS from code blocks for proper rendering.
- **Quote Processing**: Handles quoted dialogue properly without adding italic formatting.
- **HTML Processing**: Safely processes HTML content with JavaScript security analysis (Read [Security](#security) section).
- **Auto Mode**: Automatically applies fixes to incoming responses, outgoing messages, or both.

## Installation

Install via the SillyTavern extension installer:

```txt
https://github.com/bmen25124/SillyTavern-WeatherPack
```

## Usage

### Manual Fix
Click the screwdriver button (🔧) next to any message to apply markdown fixes manually.

![icon](images/icon.png)

### Demo

https://github.com/user-attachments/assets/eeb5b442-5e82-4408-8753-070b11db1ad5

### Auto Mode
Configure the extension to automatically process messages:
- **Responses Only**: Fix incoming AI messages
- **Input Only**: Fix your outgoing messages
- **Both**: Fix all messages
- **Off**: Manual mode only

### Settings

Access settings through Extensions > WeatherPack:

- **Enable Markdown Simplification**: Toggle all markdown processing features.
- **Wrap Regular Text with Italic**: Wraps non-quoted text in italics.
- **Remove Name Prefix**: Removes the character's name from the start of messages.
- **Normalize Fancy Quotes**: Converts curly quotes (`“”`) to standard straight quotes (`""`).
- **Normalize Multiple Asterisks**: Consolidates multiple asterisks (e.g., `**`, `***`) into a single asterisk.
- **Unwrap HTML/JS from Code Blocks**: Fixes HTML/JS that is incorrectly wrapped in backticks.
- **Clean Italics Within Quotes**: Removes asterisks from inside quotation marks.
- **Include HTML**: Process HTML content in messages.
- **Include Code Blocks**: Process content within code blocks.
- **JavaScript Security**: Configure security analysis for embedded scripts.
- **Allowed/Blocked APIs**: Control which JavaScript APIs are permitted.

## Markdown Processing

The extension intelligently processes different types of content blocks:

### Text Processing
- **Regular Text**: Wraps non-quoted text in italics (`*text*`) when "Wrap Regular Text with Italic" is enabled.
- **Quoted Dialogue**: Preserves quotes. Can optionally remove italics from within quotes.
- **Mixed Content**: Handles alternating quotes and narrative text appropriately.

### Normalization Options
- **Fancy Quotes**: Converts `“”` to `""`.
- **Asterisks**: Converts `**` and `***` to `*`.

### Preserved Blocks
The following content types are preserved without modification:

- **Fenced Code Blocks**: Content within ` ```...``` ` remains untouched.
- **Inline Code**: Content within `` `...` `` is preserved. If it contains HTML and "Unwrap HTML/JS" is enabled, the backticks are removed.
- **HTML Tags**: All HTML elements (`<div>`, `<span>`, etc.) are preserved with their content.
- **OOC Blocks**: Out-of-character content `(OOC: ...)` is left unchanged.

### Processing Examples

**Input:**
```md
*The old car gave a sudden *lurch*, its rusty frame *groaning* loudly.* *"Will it *even run*?!"* she exclaimed.
```

**Output:**
```md
*The old car gave a sudden lurch, its rusty frame groaning loudly.* "Will it even run?!" *she exclaimed.*
```

## Security

The extension includes JavaScript security analysis to safely process HTML content while blocking potentially harmful scripts. You need to install [JS-Analyzer](https://github.com/bmen25124/SillyTavern-JS-Analyzer) before using this feature.

## FAQ

> I only here for the markdown processing, what the hell is HTML/JS stuff?

You don't need to worry about it. HTML processing is disabled by default.

> What is the cool cat UI in the video?

It is just HTML/CSS/JS blocks. See original post [here](https://www.reddit.com/r/SillyTavernAI/comments/1l7bsd2/some_html_animations_and_interactive_elements/). [My comment](https://www.reddit.com/r/SillyTavernAI/comments/1l7bsd2/comment/mx0bo3p/)
