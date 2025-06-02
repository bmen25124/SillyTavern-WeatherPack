import { ExtensionSettingsManager } from 'sillytavern-utils-lib';
import { EventNames } from 'sillytavern-utils-lib/types';
import { st_echo } from 'sillytavern-utils-lib/config';
import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';
import { simplifyMarkdown } from './util.js';
import { st_updateMessageBlock } from './config.js';

interface ExtensionSettings {
  version: string;
  formatVersion: string;
  autoMode: AutoModeOptions;
}

const VERSION = '0.1.0';
const FORMAT_VERSION = 'F_1.0';

const defaultSettings: ExtensionSettings = {
  version: VERSION,
  formatVersion: FORMAT_VERSION,
  autoMode: AutoModeOptions.RESPONSES,
};

// Keys for extension settings
const EXTENSION_KEY = 'markdownFixer';

const globalContext = SillyTavern.getContext();
const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(EXTENSION_KEY, defaultSettings);

const incomingTypes = [AutoModeOptions.RESPONSES, AutoModeOptions.BOTH];
const outgoingTypes = [AutoModeOptions.INPUT, AutoModeOptions.BOTH];

async function initUI() {
  // Add process all messages button to options menu
  const processAllButton = $('<a class="interactable">Process all messages</a>');
  $('#options .options-content').append(processAllButton);

  // Add click handler for process all button
  processAllButton.on('click', async function () {
    if (
      !(await globalContext.Popup.show.confirm('This will process all messages in the chat. Do you want to continue?'))
    ) {
      return;
    }
    await processAllMessages();
  });

  const showFixButton = $(
    `<div title="Markdown Fixer" class="mes_button mes_markdown_fix_button fa-solid fa-screwdriver interactable" tabindex="0"></div>`,
  );
  $('#message_template .mes_buttons .extraMesButtons').prepend(showFixButton);
  $(document).on('click', '.mes_markdown_fix_button', async function () {
    const messageBlock = $(this).closest('.mes');
    const messageId = Number(messageBlock.attr('mesid'));
    await formatMessage(messageId);
    await globalContext.saveChat();
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
  message.mes = simplifyMarkdown(message.mes);
  st_updateMessageBlock(id, message);
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
