import { ExtensionSettingsManager } from 'sillytavern-utils-lib';
import { EventNames } from 'sillytavern-utils-lib/types';
import { st_echo } from 'sillytavern-utils-lib/config';
import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';
import { simplifyMarkdown } from './markdown.js';
import { ExtensionSettings, st_updateMessageBlock, st_updateMessageHTML } from './config.js';
import { postProcess } from './html.js';

const VERSION = '0.1.0';
const FORMAT_VERSION = 'F_1.0';

const defaultSettings: ExtensionSettings = {
  version: VERSION,
  formatVersion: FORMAT_VERSION,
  autoMode: AutoModeOptions.RESPONSES,
  enableMarkdownSimplification: true,
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
const EXTENSION_KEY = 'markdownFixer';

const globalContext = SillyTavern.getContext();
const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(EXTENSION_KEY, defaultSettings);

const incomingTypes = [AutoModeOptions.RESPONSES, AutoModeOptions.BOTH];
const outgoingTypes = [AutoModeOptions.INPUT, AutoModeOptions.BOTH];

async function initUI() {
  // Render and append settings UI
  const settingsHtml = await globalContext.renderExtensionTemplateAsync(
    `third-party/SillyTavern-Markdown-Fixer`,
    'templates/settings',
    {},
  );
  const extensionsSettings = document.getElementById('extensions_settings');
  if (extensionsSettings) {
    extensionsSettings.insertAdjacentHTML('beforeend', settingsHtml);
  }

  // Initialize settings UI
  await initSettingsUI();

  // Add process all messages button to options menu
  const processAllButton = document.createElement('a');
  processAllButton.className = 'interactable';
  processAllButton.textContent = 'Process all messages';
  const optionsContent = document.querySelector('#options .options-content');
  if (optionsContent) {
    optionsContent.appendChild(processAllButton);
  }

  // Add click handler for process all button
  processAllButton.addEventListener('click', async function () {
    if (
      !(await globalContext.Popup.show.confirm('This will process all messages in the chat. Do you want to continue?'))
    ) {
      return;
    }
    await processAllMessages();
  });

  const showFixButton = document.createElement('div');
  showFixButton.title = 'Markdown Fixer';
  showFixButton.className = 'mes_button mes_markdown_fix_button fa-solid fa-screwdriver interactable';
  showFixButton.tabIndex = 0;
  const messageTemplate = document.querySelector('#message_template .mes_buttons .extraMesButtons');
  if (messageTemplate) {
    messageTemplate.prepend(showFixButton);
  }

  document.addEventListener('click', async function (event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('mes_markdown_fix_button')) {
      const messageBlock = target.closest('.mes');
      if (messageBlock) {
        const messageId = Number(messageBlock.getAttribute('mesid'));
        await formatMessage(messageId);
      }
    }
  });

  const settings = settingsManager.getSettings();
  globalContext.eventSource.on(EventNames.MESSAGE_UPDATED, async (messageId: number) => {
    if (incomingTypes.includes(settings.autoMode)) {
    }
  });

  globalContext.eventSource.on(EventNames.IMPERSONATE_READY, async (messageId: number) => {
    if (outgoingTypes.includes(settings.autoMode)) {
    }
  });

  // @ts-ignore
  globalContext.eventSource.makeFirst(EventNames.CHARACTER_MESSAGE_RENDERED, async (messageId: number) => {
    if (incomingTypes.includes(settings.autoMode)) {
      // await formatMessage(messageId);
      // await globalContext.saveChat();
    }
  });
  // @ts-ignore
  globalContext.eventSource.makeFirst(EventNames.USER_MESSAGE_RENDERED, async (messageId: number) => {
    if (outgoingTypes.includes(settings.autoMode)) {
    }
  });
}

async function initSettingsUI() {
  const settingsContainer = document.querySelector('.markdown-fixer-settings');
  if (!settingsContainer) {
    console.error('Settings container not found');
    return;
  }

  const settings = settingsManager.getSettings();

  // Auto Mode
  const autoModeSelect = settingsContainer.querySelector('#markdown_fixer_auto_mode') as HTMLSelectElement;
  if (autoModeSelect) {
    autoModeSelect.value = settings.autoMode;
    autoModeSelect.addEventListener('change', () => {
      settings.autoMode = autoModeSelect.value as AutoModeOptions;
      settingsManager.saveSettings();
    });
  }

  // Enable Markdown Simplification
  const enableSimplificationCheckbox = settingsContainer.querySelector(
    '#markdown_fixer_enable_simplification',
  ) as HTMLInputElement;
  if (enableSimplificationCheckbox) {
    enableSimplificationCheckbox.checked = settings.enableMarkdownSimplification;
    enableSimplificationCheckbox.addEventListener('change', () => {
      settings.enableMarkdownSimplification = enableSimplificationCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Include HTML
  const includeHTMLCheckbox = settingsContainer.querySelector('#markdown_fixer_include_html') as HTMLInputElement;
  if (includeHTMLCheckbox) {
    includeHTMLCheckbox.checked = settings.includeHTML;
    includeHTMLCheckbox.addEventListener('change', () => {
      settings.includeHTML = includeHTMLCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Include Code Blocks
  const includeCodeBlocksCheckbox = settingsContainer.querySelector(
    '#markdown_fixer_include_code_blocks',
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
    '#markdown_fixer_enable_js_analysis',
  ) as HTMLInputElement;
  if (enableJSAnalysisCheckbox) {
    enableJSAnalysisCheckbox.checked = settings.enableJSAnalysis;
    enableJSAnalysisCheckbox.addEventListener('change', () => {
      settings.enableJSAnalysis = enableJSAnalysisCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Allow Obfuscation
  const allowObfuscationCheckbox = settingsContainer.querySelector(
    '#markdown_fixer_allow_obfuscation',
  ) as HTMLInputElement;
  if (allowObfuscationCheckbox) {
    allowObfuscationCheckbox.checked = settings.allowObfuscation;
    allowObfuscationCheckbox.addEventListener('change', () => {
      settings.allowObfuscation = allowObfuscationCheckbox.checked;
      settingsManager.saveSettings();
    });
  }

  // Max Script Length
  const maxScriptLengthInput = settingsContainer.querySelector('#markdown_fixer_max_script_length') as HTMLInputElement;
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
  const allowedAPIsTextarea = settingsContainer.querySelector('#markdown_fixer_allowed_apis') as HTMLTextAreaElement;
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
  const blockedAPIsTextarea = settingsContainer.querySelector('#markdown_fixer_blocked_apis') as HTMLTextAreaElement;
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
}

async function processAllMessages() {
  const chat = globalContext.chat;
  for (let i = 0; i < chat.length; i++) {
    await formatMessage(i);
  }
  await globalContext.saveChat();
  st_echo('info', 'Processed all messages');
}

async function formatMessage(id: number) {
  const message = SillyTavern.getContext().chat[id];
  if (!message) {
    st_echo('error', `Message with ID ${id} not found.`);
    return;
  }
  const settings = settingsManager.getSettings();

  if (settings.enableMarkdownSimplification) {
    const newMessageText = simplifyMarkdown(message.mes);
    if (newMessageText !== message.mes) {
      st_updateMessageBlock(id, message);
      await globalContext.saveChat();
    }
  }

  if (settings.includeHTML) {
    const htmlResult = postProcess(id, message.name, message.mes);
    await st_updateMessageHTML(id, htmlResult, settings);
  }
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
      .confirm('Data migration failed. Do you want to reset the roadway data?', 'Roadway')
      .then((result: any) => {
        if (result) {
          settingsManager.resetSettings();
          main();
        }
      });
  });
