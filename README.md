# Add to Feedly Plus

This browser extension allows you to add your favorite sites' RSS or Atom feeds to [Feedly].
Add to Feedly Plus is able to handle multiple newsfeeds.

Many websites publish content via RSS or Atom feeds, but the links to them are often hidden in the page's code. This extension makes them easy to find and use.

1. Click the “Add to Feedly” button in your toolbar to instantly see all feeds available on the current page.
1. Subscribe to any feed with a couple of clicks.
1. Use the keyboard shortcut `Ctrl+Shift+F` for quick access.
1. Supports both dark and light browser themes.

Supported browsers:

1. Compatible with WebExtension API:
   1. [Desktop Firefox][Firefox Addons]
   1. [Firefox for Android][Firefox Addons]
1. [Chrome][Chrome Web Store]

## How to build the extension by yourself?

The following instruction works on Ubuntu 24.04:

1. Make sure you're using correct version of Nodejs:

   ```sh
   node -v # Should be v22
   ```

1. make sure you're using correct version of NPM:

   ```sh
   npm -v # Should be 10.9
   ```

1. install dependencies:

   ```sh
   npm install
   ```

1. start building process:

   ```sh
   npm run build
   ```

1. resulting archive should be in the `dist` directory:

   ```sh
   ls dist # Should contain web-ext.zip
   ```

## How to try a local extension version in debug mode?

1. Build the extension with the following command:

   ```sh
   npm run build
   ```

1. Launch the extension in debug mode in the browser:
   - Desktop Firefox:

     ```sh
     npx web-ext run -s dist/web-ext/ --devtools
     ```

   - Firefox for Android:
     1. [Set up your computer and Android device][Set up Android].

     1. Print a list of connected Android devices and their IDs:

        ```sh
        adb devices
        ```

     1. Launch the extension on the specified device:

        ```sh
        npx web-ext run -s dist/web-ext/ -t firefox-android --adb-device <DEVICE> --firefox-apk org.mozilla.fenix
        ```

   - Chromium:

     ```sh
     npx web-ext run -s dist/chrome/ -t chromium
     ```

[Feedly]: https://feedly.com/
[Firefox Addons]: https://addons.mozilla.org/en-US/firefox/addon/add-to-feedly-plus/
[Chrome Web Store]: https://chromewebstore.google.com/detail/add-to-feedly-plus/nobjghgocbddnomohngkgebablnfddko/
[Set up Android]: https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/#set-up-your-computer-and-android-emulator-or-device
