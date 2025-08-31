/**
 * A name for the `pageAction` command (keyboard shortcut). The command should function as a click on the `pageAction`
 * button. This command name is only applicable to Chrome. In Firefox, we use the built-in command implementation
 * `_execute_page_action`.
 */
export const COMMAND_NAME = 'execute-page-action';

/**
 * Chrome supports neither SVG nor WebP icons:
 * https://developer.chrome.com/docs/extensions/reference/manifest/icons
 * https://crbug.com/29683
 */
export const PNG_ICON = {
  '16': 'assets/icon-16x16.png',
  '24': 'assets/icon-24x24.png',
  '32': 'assets/icon-32x32.png',
  '48': 'assets/icon-48x48.png',
  '128': 'assets/icon-128x128.png',
};
