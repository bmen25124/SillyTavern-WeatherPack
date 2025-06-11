// @ts-ignore
import { updateMessageBlock } from '../../../../../script.js';

import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';
import { JavaScriptSecurityAnalyzer } from './html.js';

export interface ExtensionSettings {
  version: string;
  formatVersion: string;
  autoMode: AutoModeOptions;
  enableMarkdownSimplification: boolean;

  // HTML Processing Settings
  includeHTML: boolean;
  includeCodeBlocks: boolean;
  // JavaScript Security Settings
  enableJSAnalysis: boolean;
  allowedAPIs: string[];
  blockedAPIs: string[];
  maxScriptLength: number;
  allowObfuscation: boolean;
}

export const extensionName = 'SillyTavern-Markdown-Fixer';

export function st_updateMessageBlock(messageId: number, message: object, { rerenderMessage = true } = {}): void {
  updateMessageBlock(messageId, message, { rerenderMessage });
}

export async function st_updateMessageHTML(
  messageId: number,
  message: string,
  settings: ExtensionSettings,
): Promise<void> {
  const messageElement = document.querySelector(`#chat [mesid="${messageId}"]`);
  if (!messageElement) {
    console.error(`Message element with ID ${messageId} not found.`);
    return;
  }

  const messageText = messageElement.querySelector('.mes_text');
  if (!messageText) {
    console.error(`Message text element for message ID ${messageId} not found.`);
    return;
  }

  if (messageText.innerHTML === message) {
    // No changes needed, return early
    console.debug(`No changes needed for message ${messageId}.`);
    return;
  }

  // Parse HTML safely using DOMParser to avoid script execution
  const parser = new DOMParser();
  const doc = parser.parseFromString(message, 'text/html');

  // Extract and analyze all script elements from the parsed document
  const scripts = doc.querySelectorAll('script');
  const executableScripts: string[] = [];

  const securityAnalyzer = new JavaScriptSecurityAnalyzer({
    enableJSAnalysis: settings.enableJSAnalysis,
    allowedAPIs: settings.allowedAPIs,
    blockedAPIs: settings.blockedAPIs,
    maxScriptLength: settings.maxScriptLength,
    allowObfuscation: settings.allowObfuscation,
  });

  for (const script of scripts) {
    const scriptContent = script.innerHTML;
    const scriptSrc = script.getAttribute('src');

    if (!scriptContent.trim() && !scriptSrc) {
      // Empty script, just remove it
      script.remove();
      continue;
    }

    // Handle external scripts
    if (scriptSrc) {
      console.warn(`External script sources are not supported for security reasons: ${scriptSrc}`);
      script.remove();
      continue;
    }

    try {
      // Analyze the script for security violations
      const analysis = await securityAnalyzer.analyzeScript(scriptContent);

      if (analysis.sanitizedCode) {
        // Store sanitized code for later execution
        executableScripts.push(analysis.sanitizedCode);

        // Log warnings if any
        analysis.violations.forEach((violation) => {
          if (violation.severity === 'warning') {
            console.warn(`JavaScript Security Warning [${messageId}]:`, {
              type: violation.type,
              message: violation.message,
              position: `${violation.position.row}:${violation.position.column}`,
              node: violation.node,
            });
          }
        });

        if (analysis.violations.length > 0) {
          console.info(
            `JavaScript executed with ${analysis.violations.length} security warnings for message ${messageId}`,
          );
        }

        // Remove the original script element
        script.remove();
      } else {
        // Block unsafe script and log violations
        console.error(`Blocked unsafe JavaScript in message ${messageId}:`, analysis.violations);

        // Remove the unsafe script
        script.remove();
      }
    } catch (error) {
      console.error(`Error analyzing JavaScript in message ${messageId}:`, error);

      // Remove script on analysis error
      script.remove();
    }
  }

  // Extract the body content from the parsed document (DOMParser wraps content in html/body)
  const sanitizedContent = doc.body ? doc.body.innerHTML : message;

  // Set the innerHTML with sanitized content (without scripts)
  messageText.innerHTML = sanitizedContent;

  // Execute sanitized scripts programmatically
  for (const scriptCode of executableScripts) {
    try {
      // Create a new script element and execute it
      const scriptElement = document.createElement('script');
      scriptElement.textContent = scriptCode;

      // Append to the message element to execute in context
      messageText.appendChild(scriptElement);

      // Remove the script element after execution to keep DOM clean
      scriptElement.remove();
    } catch (error) {
      console.error(`Error executing sanitized script for message ${messageId}:`, error);
    }
  }
}
