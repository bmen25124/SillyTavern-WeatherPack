// @ts-ignore
import { updateMessageBlock } from '../../../../../script.js';

export const extensionName = 'SillyTavern-Markdown-Fixer';

export function st_updateMessageBlock(messageId: number, message: object, { rerenderMessage = true } = {}): void {
  updateMessageBlock(messageId, message, { rerenderMessage });
}
