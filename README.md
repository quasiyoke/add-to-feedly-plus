# Add to Feedly Plus

This Firefox extension allows you to add your favorite sites' feeds to [Feedly](https://feedly.com/).
Add to Feedly Plus is able to handle multiple RSS feeds.
Clicking on “Add to Feedly” button on the address bar opens menu with all feeds available on the current page.
Add to Feedly Plus doesn't require much screen space.

[Install it at addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/add-to-feedly-plus/)

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

1. resulting archive should be in the `web-ext-artifacts` directory:

   ```sh
   ls web-ext-artifacts # Should contain add_to_feedly_plus-XXX.zip
   ```
