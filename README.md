# SillyTavern WeatherPack

A [SillyTavern](https://docs.sillytavern.app/) extension that automatically fixes and normalizes markdown formatting in chat messages.

## Features

- **Markdown Simplification**: Normalizes italic formatting by removing excess asterisks and applying consistent styling. It is especially useful for Deepseek.
- **Quote Processing**: Handles quoted dialogue properly without adding italic formatting
- **HTML Processing**: Safely processes HTML content with JavaScript security analysis (Read [Security](#security) section)
- **Auto Mode**: Automatically applies fixes to incoming responses, outgoing messages, or both

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



### Auto Mode
Configure the extension to automatically process messages:
- **Responses Only**: Fix incoming AI messages
- **Input Only**: Fix your outgoing messages
- **Both**: Fix all messages
- **Off**: Manual mode only

### Settings

Access settings through Extensions > WeatherPack:

- **Enable Markdown Simplification**: Toggle markdown processing
- **Include HTML**: Process HTML content in messages
- **Include Code Blocks**: Process content within code blocks
- **JavaScript Security**: Configure security analysis for embedded scripts
- **Allowed/Blocked APIs**: Control which JavaScript APIs are permitted

## Markdown Processing

The extension intelligently processes different types of content blocks:

### Text Processing
- **Regular Text**: Wraps non-quoted text in italics (`*text*`)
- **Quoted Dialogue**: Preserves quotes without adding italics
- **Mixed Content**: Handles alternating quotes and narrative text appropriately

### Preserved Blocks
The following content types are preserved without modification:

- **Fenced Code Blocks**: Content within ` ```...``` ` remains untouched
- **Inline Code**: Content within `` `...` `` has asterisks removed but structure preserved
- **HTML Tags**: All HTML elements (`<div>`, `<span>`, etc.) are preserved with their content
- **OOC Blocks**: Out-of-character content `(OOC: ...)` is left unchanged

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
