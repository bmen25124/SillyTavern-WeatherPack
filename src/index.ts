import { buildPrompt, ExtensionSettingsManager } from 'sillytavern-utils-lib';
import { EventNames, ExtractedData } from 'sillytavern-utils-lib/types';
import { st_echo, this_chid } from 'sillytavern-utils-lib/config';
import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';
import { simplifyMarkdown } from './markdown.js';
import { ExtensionSettings, st_updateMessageBlock, st_updateMessageHTML } from './config.js';
import { postProcess } from './html.js';
import { POPUP_RESULT, POPUP_TYPE } from 'sillytavern-utils-lib/types/popup';

const VERSION = '0.1.0';
const FORMAT_VERSION = 'F_1.0';

const defaultSettings: ExtensionSettings = {
  version: VERSION,
  formatVersion: FORMAT_VERSION,
  autoMode: AutoModeOptions.NONE,
  enableMarkdownSimplification: true,
  wrapRegularTextWithItalic: true,
  removeNamePrefix: false,
  // HTML Processing Settings
  includeHTML: false,
  includeCodeBlocks: true, // Like "```html" or "```"
  // JavaScript Security Settings
  enableJSAnalysis: true,
  allowedAPIs: ['console', 'Math', 'Date', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite'],
  blockedAPIs: ['fetch', 'XMLHttpRequest', 'eval', 'Function', 'WebSocket', 'localStorage', 'sessionStorage'],
  maxScriptLength: 50000,
  allowObfuscation: false,
};

// Keys for extension settings
const EXTENSION_KEY = 'weatherPack';

const globalContext = SillyTavern.getContext();
const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(EXTENSION_KEY, defaultSettings);

const incomingTypes = [AutoModeOptions.RESPONSES, AutoModeOptions.BOTH];
const outgoingTypes = [AutoModeOptions.INPUT, AutoModeOptions.BOTH];

async function initUI() {
  // Render and append settings UI
  const settingsHtml = await globalContext.renderExtensionTemplateAsync(
    `third-party/SillyTavern-WeatherPack`,
    'templates/settings',
    {},
  );
  const extensionsSettings = document.getElementById('extensions_settings');
  if (extensionsSettings) {
    extensionsSettings.insertAdjacentHTML('beforeend', settingsHtml);
  }

  // Initialize settings UI
  await initSettingsUI();

  // WeatherPack button
  const showFixButton = document.createElement('div');
  showFixButton.title = 'WeatherPack';
  showFixButton.className = 'mes_button mes_weatherpack_button fa-solid fa-screwdriver interactable';
  showFixButton.tabIndex = 0;

  // Ask AI button
  const askAiButton = document.createElement('div');
  askAiButton.title = 'Ask AI';
  askAiButton.className = 'mes_button mes_askai_button fa-regular fa-circle-question interactable';
  askAiButton.tabIndex = 0;

  const messageTemplate = document.querySelector('#message_template .mes_buttons .extraMesButtons');
  if (messageTemplate) {
    messageTemplate.prepend(askAiButton);
    messageTemplate.prepend(showFixButton);
  }

  document.addEventListener('click', async function (event) {
    const target = event.target as HTMLElement;
    // WeatherPack button
    if (target.classList.contains('mes_weatherpack_button')) {
      const messageBlock = target.closest('.mes');
      if (messageBlock) {
        const messageId = Number(messageBlock.getAttribute('mesid'));
        await formatMessage(messageId);
      }
    }
    // Ask AI button
    if (target.classList.contains('mes_askai_button')) {
      const messageBlock = target.closest('.mes');
      if (messageBlock) {
        const messageId = Number(messageBlock.getAttribute('mesid'));
        await askAiAboutMessage(messageId);
      }
    }
  });

  const settings = settingsManager.getSettings();
  globalContext.eventSource.on(EventNames.MESSAGE_UPDATED, async (messageId: number) => {
    const currentSettings = settingsManager.getSettings();
    if (incomingTypes.includes(currentSettings.autoMode)) {
      await formatMessage(messageId);
    }
  });

  // @ts-ignore
  globalContext.eventSource.makeFirst(EventNames.CHARACTER_MESSAGE_RENDERED, async (messageId: number) => {
    const currentSettings = settingsManager.getSettings();
    if (incomingTypes.includes(currentSettings.autoMode)) {
      await formatMessage(messageId);
    }
  });

  // @ts-ignore
  globalContext.eventSource.makeFirst(EventNames.USER_MESSAGE_RENDERED, async (messageId: number) => {
    const currentSettings = settingsManager.getSettings();
    if (outgoingTypes.includes(currentSettings.autoMode)) {
      await formatMessage(messageId);
    }
  });

  globalContext.eventSource.on(EventNames.CHAT_CHANGED, async () => {
    const context = SillyTavern.getContext();
    if (!context.chat.length) {
      return;
    }

    if (settings.includeHTML) {
      for (let i = context.chat.length - 1; i >= 0; i--) {
        const message = context.chat[i];
        const htmlResult = postProcess(i, message.name, message.mes);
        await st_updateMessageHTML(i, htmlResult, settings);
      }
    }
  });
}

async function initSettingsUI() {
  const settingsContainer = document.querySelector('.weatherpack-settings');
  if (!settingsContainer) {
    console.error('Settings container not found');
    return;
  }

  const settings = settingsManager.getSettings();

  // Remove Name Prefix
  const removeNamePrefixCheckbox = settingsContainer.querySelector(
    '#weatherpack_remove_name_prefix',
  ) as HTMLInputElement;
  if (removeNamePrefixCheckbox) {
    removeNamePrefixCheckbox.checked = settings.removeNamePrefix;
    removeNamePrefixCheckbox.addEventListener('change', () => {
      settings.removeNamePrefix = removeNamePrefixCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Auto Mode
  const autoModeSelect = settingsContainer.querySelector('#weatherpack_auto_mode') as HTMLSelectElement;
  if (autoModeSelect) {
    autoModeSelect.value = settings.autoMode;
    autoModeSelect.addEventListener('change', () => {
      settings.autoMode = autoModeSelect.value as AutoModeOptions;
      settingsManager.saveSettings();
    });
  }

  // Enable Markdown Simplification
  const enableSimplificationCheckbox = settingsContainer.querySelector(
    '#weatherpack_enable_simplification',
  ) as HTMLInputElement;
  if (enableSimplificationCheckbox) {
    enableSimplificationCheckbox.checked = settings.enableMarkdownSimplification;
    enableSimplificationCheckbox.addEventListener('change', () => {
      settings.enableMarkdownSimplification = enableSimplificationCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Wrap Regular Text with Italic
  const wrapRegularTextCheckbox = settingsContainer.querySelector('#weatherpack_wrap_regular_text') as HTMLInputElement;
  if (wrapRegularTextCheckbox) {
    wrapRegularTextCheckbox.checked = settings.wrapRegularTextWithItalic;
    wrapRegularTextCheckbox.addEventListener('change', () => {
      settings.wrapRegularTextWithItalic = wrapRegularTextCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Include HTML
  const includeHTMLCheckbox = settingsContainer.querySelector('#weatherpack_include_html') as HTMLInputElement;
  if (includeHTMLCheckbox) {
    includeHTMLCheckbox.checked = settings.includeHTML;
    includeHTMLCheckbox.addEventListener('change', async () => {
      // Show confirmation when enabling HTML processing
      if (includeHTMLCheckbox.checked && !settings.includeHTML) {
        const confirmed = await globalContext.Popup.show.confirm(
          'Enable HTML Processing',
          "Enabling HTML processing can be dangerous and may execute arbitrary code. If you don't know what you are doing, don't do it. Are you sure you want to continue?",
        );

        if (!confirmed) {
          includeHTMLCheckbox.checked = false;
          return;
        }
      }

      settings.includeHTML = includeHTMLCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Include Code Blocks
  const includeCodeBlocksCheckbox = settingsContainer.querySelector(
    '#weatherpack_include_code_blocks',
  ) as HTMLInputElement;
  if (includeCodeBlocksCheckbox) {
    includeCodeBlocksCheckbox.checked = settings.includeCodeBlocks;
    includeCodeBlocksCheckbox.addEventListener('change', () => {
      settings.includeCodeBlocks = includeCodeBlocksCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Enable JS Analysis
  const enableJSAnalysisCheckbox = settingsContainer.querySelector(
    '#weatherpack_enable_js_analysis',
  ) as HTMLInputElement;
  if (enableJSAnalysisCheckbox) {
    enableJSAnalysisCheckbox.checked = settings.enableJSAnalysis;
    enableJSAnalysisCheckbox.addEventListener('change', async () => {
      // Show confirmation when disabling JavaScript security analysis
      if (!enableJSAnalysisCheckbox.checked && settings.enableJSAnalysis) {
        const confirmed = await globalContext.Popup.show.confirm(
          'Disable JavaScript Security Analysis',
          "Disabling JavaScript security analysis removes important safety checks and may allow dangerous code execution. If you don't know what you are doing, don't do it. Are you sure you want to continue?",
        );

        if (!confirmed) {
          enableJSAnalysisCheckbox.checked = true;
          return;
        }
      }

      settings.enableJSAnalysis = enableJSAnalysisCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Allow Obfuscation
  const allowObfuscationCheckbox = settingsContainer.querySelector(
    '#weatherpack_allow_obfuscation',
  ) as HTMLInputElement;
  if (allowObfuscationCheckbox) {
    allowObfuscationCheckbox.checked = settings.allowObfuscation;
    allowObfuscationCheckbox.addEventListener('change', () => {
      settings.allowObfuscation = allowObfuscationCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Max Script Length
  const maxScriptLengthInput = settingsContainer.querySelector('#weatherpack_max_script_length') as HTMLInputElement;
  if (maxScriptLengthInput) {
    maxScriptLengthInput.value = settings.maxScriptLength.toString();
    maxScriptLengthInput.addEventListener('change', () => {
      const value = parseInt(maxScriptLengthInput.value);
      if (!isNaN(value) && value > 0) {
        settings.maxScriptLength = value;
        settingsManager.saveSettings();
      }
    });
  }

  // Allowed APIs
  const allowedAPIsTextarea = settingsContainer.querySelector('#weatherpack_allowed_apis') as HTMLTextAreaElement;
  if (allowedAPIsTextarea) {
    allowedAPIsTextarea.value = settings.allowedAPIs.join(', ');
    allowedAPIsTextarea.addEventListener('blur', () => {
      const apis = allowedAPIsTextarea.value
        .split(',')
        .map((api) => api.trim())
        .filter((api) => api.length > 0);
      settings.allowedAPIs = apis;
      settingsManager.saveSettings();
    });
  }

  // Blocked APIs
  const blockedAPIsTextarea = settingsContainer.querySelector('#weatherpack_blocked_apis') as HTMLTextAreaElement;
  if (blockedAPIsTextarea) {
    blockedAPIsTextarea.value = settings.blockedAPIs.join(', ');
    blockedAPIsTextarea.addEventListener('blur', () => {
      const apis = blockedAPIsTextarea.value
        .split(',')
        .map((api) => api.trim())
        .filter((api) => api.length > 0);
      settings.blockedAPIs = apis;
      settingsManager.saveSettings();
    });
  }

  // Reset Button
  const resetButton = settingsContainer.querySelector('#weatherpack_reset_button') as HTMLButtonElement;
  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      const confirmed = await globalContext.Popup.show.confirm(
        'Reset Settings',
        'This will reset all WeatherPack settings to their default values. Are you sure?',
      );

      if (confirmed) {
        await resetSettingsToDefaults();
      }
    });
  }
}

async function resetSettingsToDefaults() {
  // Reset settings to defaults
  settingsManager.resetSettings();

  // Refresh the UI with default values
  const settingsContainer = document.querySelector('.weatherpack-settings');
  if (!settingsContainer) return;

  const settings = settingsManager.getSettings();

  // Update all UI elements with default values
  const autoModeSelect = settingsContainer.querySelector('#weatherpack_auto_mode') as HTMLSelectElement;
  if (autoModeSelect) autoModeSelect.value = settings.autoMode;

  const enableSimplificationCheckbox = settingsContainer.querySelector(
    '#weatherpack_enable_simplification',
  ) as HTMLInputElement;
  if (enableSimplificationCheckbox) enableSimplificationCheckbox.checked = settings.enableMarkdownSimplification;

  const wrapRegularTextCheckbox = settingsContainer.querySelector('#weatherpack_wrap_regular_text') as HTMLInputElement;
  if (wrapRegularTextCheckbox) wrapRegularTextCheckbox.checked = settings.wrapRegularTextWithItalic;

  const removeNamePrefixCheckbox = settingsContainer.querySelector(
    '#weatherpack_remove_name_prefix',
  ) as HTMLInputElement;
  if (removeNamePrefixCheckbox) removeNamePrefixCheckbox.checked = settings.removeNamePrefix;

  const includeHTMLCheckbox = settingsContainer.querySelector('#weatherpack_include_html') as HTMLInputElement;
  if (includeHTMLCheckbox) includeHTMLCheckbox.checked = settings.includeHTML;

  const includeCodeBlocksCheckbox = settingsContainer.querySelector(
    '#weatherpack_include_code_blocks',
  ) as HTMLInputElement;
  if (includeCodeBlocksCheckbox) includeCodeBlocksCheckbox.checked = settings.includeCodeBlocks;

  const enableJSAnalysisCheckbox = settingsContainer.querySelector(
    '#weatherpack_enable_js_analysis',
  ) as HTMLInputElement;
  if (enableJSAnalysisCheckbox) enableJSAnalysisCheckbox.checked = settings.enableJSAnalysis;

  const allowObfuscationCheckbox = settingsContainer.querySelector(
    '#weatherpack_allow_obfuscation',
  ) as HTMLInputElement;
  if (allowObfuscationCheckbox) allowObfuscationCheckbox.checked = settings.allowObfuscation;

  const maxScriptLengthInput = settingsContainer.querySelector('#weatherpack_max_script_length') as HTMLInputElement;
  if (maxScriptLengthInput) maxScriptLengthInput.value = settings.maxScriptLength.toString();

  const allowedAPIsTextarea = settingsContainer.querySelector('#weatherpack_allowed_apis') as HTMLTextAreaElement;
  if (allowedAPIsTextarea) allowedAPIsTextarea.value = settings.allowedAPIs.join(', ');

  const blockedAPIsTextarea = settingsContainer.querySelector('#weatherpack_blocked_apis') as HTMLTextAreaElement;
  if (blockedAPIsTextarea) blockedAPIsTextarea.value = settings.blockedAPIs.join(', ');

  st_echo('info', 'Settings have been reset to defaults');
}

async function formatMessage(id: number) {
  const message = SillyTavern.getContext().chat[id];
  if (!message) {
    st_echo('error', `Message with ID ${id} not found.`);
    return;
  }
  const settings = settingsManager.getSettings();

  if (settings.enableMarkdownSimplification) {
    const newMessageText = simplifyMarkdown(
      message.mes,
      settings.wrapRegularTextWithItalic,
      settings.removeNamePrefix ? message.name : undefined,
    );
    if (newMessageText !== message.mes) {
      message.mes = newMessageText;
      st_updateMessageBlock(id, message);
      await globalContext.saveChat();
    }
  }

  if (settings.includeHTML) {
    const htmlResult = postProcess(id, message.name, message.mes);
    await st_updateMessageHTML(id, htmlResult, settings);
  }
}

async function askAiAboutMessage(messageId: number) {
  const message = SillyTavern.getContext().chat[messageId];
  if (!message) {
    st_echo('error', `Message with ID ${messageId} not found.`);
    return;
  }
  const settings = settingsManager.getSettings();

  // Render popup HTML
  const popupHtml = await globalContext.renderExtensionTemplateAsync(
    `third-party/SillyTavern-WeatherPack`,
    'templates/ask-ai',
  );
  let abortController: AbortController | null = null;
  globalContext.callGenericPopup(popupHtml, POPUP_TYPE.DISPLAY, undefined, {
    large: true,
    wide: true,
    cancelButton: false,
    okButton: 'Apply to Message',
    // @ts-ignore
    onOpen(popup: any) {
      popup.buttonControls.style.display = 'block';
    },
    async onClose(popup: any) {
      if (abortController) {
        try {
          abortController.abort();
        } catch (error) {
        } finally {
          abortController = null;
        }
      }

      const result = popup.result as POPUP_RESULT;
      if (result === POPUP_RESULT.AFFIRMATIVE) {
        let newContent = resultArea.value;
        if (!newContent) return;
        const currentSettings = settingsManager.getSettings();
        if (currentSettings.enableMarkdownSimplification) {
          newContent = simplifyMarkdown(
            newContent,
            currentSettings.wrapRegularTextWithItalic,
            currentSettings.removeNamePrefix ? message.name : undefined,
          );
        }
        message.mes = newContent;
        st_updateMessageBlock(messageId, message);
        await globalContext.saveChat();
      }
    },
    onClosing(popup: any) {
      const result = popup.result as POPUP_RESULT;
      if (result === POPUP_RESULT.AFFIRMATIVE) {
        let newContent = resultArea.value;
        if (!newContent) {
          st_echo('error', 'AI response is empty.');
          return false;
        }
      }
      return true;
    },
  });

  const popup = document.getElementById('weatherPackAskAiPopup');
  if (!popup) return;

  // Populate profile dropdown
  const profileSelect = popup.querySelector('#ask-ai-profile') as HTMLSelectElement;
  const profiles = globalContext.extensionSettings.connectionManager?.profiles || [];
  profileSelect.innerHTML = '<option value="">Select a Connection Profile</option>';
  profiles.forEach((profile: any) => {
    const opt = document.createElement('option');
    opt.value = profile.id;
    opt.textContent = profile.name || profile.id;
    if (settings.profileId && profile.id === settings.profileId) opt.selected = true;
    profileSelect.appendChild(opt);
  });

  // Set max tokens and include messages
  const maxTokensInput = popup.querySelector('#ask-ai-max-tokens') as HTMLInputElement;
  maxTokensInput.value = (settings.maxResponseToken || 16000).toString();
  const includeMessagesInput = popup.querySelector('#ask-ai-include-messages') as HTMLInputElement;
  includeMessagesInput.value = (settings.includeLastXMessages || 0).toString();

  // Submit handler
  const resultArea = popup.querySelector('#ask-ai-result') as HTMLTextAreaElement;
  const submitBtn = popup.querySelector('#ask-ai-submit') as HTMLButtonElement;

  async function handleSubmit() {
    let question = (popup!.querySelector('#ask-ai-question') as HTMLTextAreaElement).value.trim();
    const profileId = profileSelect.value;
    const maxTokens = parseInt(maxTokensInput.value) || 16000;
    const includeLastXMessages = parseInt(includeMessagesInput.value) || 0;

    // Save values to settings
    settings.includeLastXMessages = includeLastXMessages;
    settings.maxResponseToken = maxTokens;
    settings.profileId = profileId;
    settingsManager.saveSettings();

    if (!profileId) {
      await st_echo('error', 'Please select a connection profile.');
      return;
    }
    question = globalContext.substituteParams(question);
    if (!question) {
      await st_echo('error', 'Please enter a question.');
      return;
    }

    const profile = profiles.find((p: any) => p.id === profileId);
    const apiMap = profile?.api ? globalContext.CONNECT_API_MAP[profile.api] : null;

    // Abort previous request if any
    try {
      abortController?.abort();
    } catch (error) {
    } finally {
      abortController = null;
    }
    abortController = new AbortController();

    submitBtn.textContent = 'Cancel';

    try {
      // Build prompt with context
      const promptResult = await buildPrompt(apiMap?.selected!, {
        targetCharacterId: this_chid,
        messageIndexesBetween: {
          end: messageId,
          start: includeLastXMessages > 0 ? Math.max(0, messageId - includeLastXMessages) : 0,
        },
        presetName: profile?.preset,
        contextName: profile?.context,
        instructName: profile?.instruct,
        syspromptName: profile?.sysprompt,
        includeNames: false,
      });
      let messages = promptResult.result;
      messages.push({
        content: question,
        role: 'user',
      });

      // Send to AI with structured output
      const rest = (await globalContext.ConnectionManagerRequestService.sendRequest(
        profileId,
        messages,
        maxTokens,
        { signal: abortController.signal },
        {
          json_schema: {
            name: 'AskAIResult',
            strict: true,
            value: {
              type: 'object',
              properties: {
                answer: { type: 'string', description: 'The answer to the user question.' },
                reasoning: { type: 'string', description: 'Short reasoning or explanation.' },
              },
              required: ['answer'],
              additionalProperties: false,
            },
          },
        },
      )) as ExtractedData;

      let aiContent: any = rest?.content;
      if (!aiContent || (typeof aiContent === 'object' && Object.keys(aiContent).length === 0)) {
        await st_echo('error', 'No response received from AI.');
        return;
      }
      // Show result in textarea
      resultArea.value = aiContent.answer || '';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        st_echo('info', 'AI request cancelled.');
      } else {
        st_echo('error', 'AI request failed.');
      }
    } finally {
      submitBtn.textContent = 'Ask';
      abortController = null;
    }
  }

  submitBtn.onclick = () => {
    if (submitBtn.textContent === 'Cancel' && abortController) {
      try {
        abortController.abort();
      } catch (error) {
      } finally {
        abortController = null;
      }
      submitBtn.textContent = 'Ask';
      return;
    }
    handleSubmit();
  };
}

function main() {
  initUI();
}

settingsManager
  .initializeSettings()
  .then((_result) => {
    main();
  })
  .catch((error) => {
    st_echo('error', error);
    globalContext.Popup.show
      .confirm('Data migration failed. Do you want to reset the WeatherPack data?', 'Reset WeatherPack')
      .then((result: any) => {
        if (result) {
          settingsManager.resetSettings();
          main();
        }
      });
  });
