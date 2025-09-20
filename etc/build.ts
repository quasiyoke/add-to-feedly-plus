#!/usr/bin/env node

import assert from 'node:assert/strict';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exit } from 'node:process';

import { Change, parser as parseChangelog, Release } from 'keep-a-changelog';
import { build as buildBundle } from 'vite';
import webExt from 'web-ext';

import packageManifest from '../package.json' with { type: 'json' };
import {
  COMMAND_NAME as PAGE_ACTION_COMMAND_NAME,
  PNG_ICON,
  GRAY_PNG_ICON,
} from '../src/pageAction/const.ts';
import { assertExhaustive, type ToJsonObject } from '../src/util.ts';

type Extension = {
  platform: ExtensionPlatform;
  assetsInputDir: string;
  bundlesDir: string;
};

const MODULES = ['src/background.ts', 'src/content.ts', 'src/popup.ts'];
const COMMON_ASSETS_INPUT_DIR = 'assets/common';
const EXTENSIONS = [
  {
    platform: 'web-ext',
    assetsInputDir: 'assets/web-ext',
    bundlesDir: 'dist/web-ext',
  },
  {
    platform: 'chrome',
    assetsInputDir: 'assets/chrome',
    bundlesDir: 'dist/chrome',
  },
] satisfies Extension[];
const OUTPUT_DIR = 'dist';

main().catch((err: unknown) => {
  console.error(err);
  exit(1);
});

async function main() {
  // Clear output directory
  await rm(OUTPUT_DIR, { recursive: true }).catch((err: unknown) => {
    // Ignore the error if it is about the directory not existing
    if (!(err instanceof Error && 'code' in err && err.code === 'ENOENT')) {
      throw err;
    }
  });
  await mkdir(OUTPUT_DIR, { recursive: true });
  const extensions = EXTENSIONS.map(buildExtension);
  await Promise.all(extensions);
}

async function buildExtension(extension: Extension) {
  const { bundlesDir } = extension;
  await mkdir(bundlesDir, { recursive: true });
  await Promise.all([
    ...bundles(extension),
    manifest(extension),
    assets(extension),
    meta(extension),
  ]);
  await pack(extension);
}

function bundles({
  platform,
  bundlesDir: outputDir,
}: Extension): Promise<unknown>[] {
  // As of Firefox v. 141.0, it doesn't support "module" type content scripts, neither in the documentation
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
  // nor in practice. Hence, using ES modules and other methods to require chunks into content scripts is challenging.
  // The simplest approach remains building several bundles without shared chunks. This requires running a separate Vite
  // build process for each bundle.
  return MODULES.map((module) => {
    return buildBundle({
      configFile: false,
      build: {
        rollupOptions: {
          input: module,
          output: {
            entryFileNames: '[name].js',
          },
          treeshake: { moduleSideEffects: false },
        },
        outDir: outputDir,
        emptyOutDir: false,
        target: 'esnext',
      },
      define: {
        EXTENSION_PLATFORM: JSON.stringify(platform),
      },
      resolve: {
        alias: {
          '@': './src/',
        },
      },
      clearScreen: false,
    });
  });
}

async function manifest({ platform, bundlesDir: outputDir }: Extension) {
  const manifest = {
    manifest_version: 3,
    name: packageManifest.title,
    version: packageManifest.version,
    description: packageManifest.description,
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
      },
    ],
    permissions: ['storage'],
  };
  /** Should function as a click on a `pageAction`'s button */
  const PAGE_ACTION_COMMAND = {
    description: 'Subscribe to feeds in Feedly',
    suggested_key: {
      default: 'Ctrl+Shift+F',
    },
  };
  switch (platform) {
    case 'web-ext': {
      /**
       * One of the newest Firefox features we're using in the code appears to be the async functions syntax:
       * https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/52#javascript
       * — however, manifest v. 3 support is a way more recent feature of Firefox:
       * https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/109#changes_for_add-on_developers
       * Firefox v. < 113 did not support the `gecko_android` key in the manifest:
       * https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/113#changes_for_add-on_developers
       */
      const MIN_FIREFOX_VERSION = '113.0';
      /**
       * Despite Firefox supporting SVG for extension icons, it requires specifying several keys for different
       * icon sizes:
       * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/icons#svg
       */
      const ICON = {
        '16': 'assets/icon.svg',
        '32': 'assets/icon.svg',
        '48': 'assets/icon.svg',
        '64': 'assets/icon.svg',
      };
      Object.assign(manifest, {
        background: {
          // As of Firefox v. 141.0, it does not support running background script as a service worker:
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background#browser_support
          // https://bugzil.la/1573659
          scripts: ['background.js'],
          // Starting with Firefox v. 121, it allows specifying a background script for both the background page
          // and as a service worker, and even suggests doing so in the documentation:
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background#browser_support
          // We will also define the background script using both methods, so that future versions of Firefox can run it
          // as a service worker.
          service_worker: 'background.js',
        },
        // `pageAction` represents an action applicable primarily to the current page, rather than all pages.
        // In Firefox, the corresponding button was even located directly in the omnibox or address bar. We'd like
        // to use `pageAction` exclusively for our extension, as the feed subscription button is relevant only
        // for certain pages — this is the canonical use of `pageAction`, exemplified in the documentation.
        // `page_action` key is supported in Firefox for manifest v. 3:
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/page_action
        page_action: {
          // If the `pageAction` icon is difficult to see on a dark omnibox, Firefox changes its fill color
          // to light one and uses only the icon's alpha channel. Therefore, we use a special _mask icon_, the details
          // of which are drawn on the alpha channel, not with color.
          // On light themes, Firefox displays the icon without changing its fill color, so the original icon color
          // remains important. On a light omnibox (usually white), the mask icon's white details should look normal.
          default_icon: 'assets/icon-mask.svg',
        },
        browser_specific_settings: {
          gecko: {
            id: 'jid1-lpXbkGi1kHPDGQ@jetpack',
            strict_min_version: MIN_FIREFOX_VERSION,
            // https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
            data_collection_permissions: { required: ['none'] },
          },
          // Extension's support for the Firefox for Android is declared just using the object
          // under the key `gecko_android`:
          // https://extensionworkshop.com/documentation/publish/version-compatibility/
          gecko_android: {
            // It seems that both variants of Firefox have synchronized version numbering
            strict_min_version: MIN_FIREFOX_VERSION,
          },
        },
        icons: ICON,
        // Firefox for Android displays a warning in the Developer Tools when processing a manifest with commands:
        // "Warning processing `commands`: An unexpected property was found in the WebExtension manifest".
        // This is because the manifest key `commands` is not supported in Firefox for Android as of v. 143:
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/commands#browser_compatibility
        // Since the same manifest is used for both desktop and Android versions of Firefox, we cannot remove `commands`
        // from the manifest.
        commands: {
          // `_execute_page_action` turns on a special handler implemented only in Firefox. It functions as a click
          // on the `pageAction` button:
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/commands#special_shortcuts
          _execute_page_action: PAGE_ACTION_COMMAND,
        },
      } satisfies ToJsonObject);
      break;
    }
    case 'chrome': {
      // https://developer.chrome.com/docs/extensions/reference/manifest#required-web-store
      assert(
        manifest.description.length <= 132,
        'The extension description must not be too long for the Chrome Web Store',
      );
      Object.assign(manifest, {
        // For manifest v. 3, Chrome requires the use of a service worker as a background script:
        // https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#update-bg-field
        background: { service_worker: 'background.js' },
        // `page_action` was supported in Chrome only for manifest v. ≤ 2 — so we're forced to use `action` instead:
        // https://developer.chrome.com/docs/extensions/mv2/reference/pageAction
        action: {
          // The default state of the extension is when there're no feeds available for subscription, or we haven't
          // received list of them yet. Therefore, the default state is `disabled`.
          default_state: 'disabled',
          default_icon: GRAY_PNG_ICON,
        },
        icons: PNG_ICON,
        commands: { [PAGE_ACTION_COMMAND_NAME]: PAGE_ACTION_COMMAND },
      } satisfies ToJsonObject);
      break;
    }
    default:
      assertExhaustive(platform);
  }
  await writeJsonObject(manifest, join(outputDir, 'manifest.json'));
}

async function assets({
  bundlesDir,
  assetsInputDir: platformSpecificInputDir,
}: Extension) {
  const outputDir = join(bundlesDir, 'assets');
  await mkdir(outputDir);
  await Promise.all([
    copyContents(COMMON_ASSETS_INPUT_DIR, outputDir),
    copyContents(platformSpecificInputDir, outputDir),
  ]);
}

async function copyContents(inputDir: string, outputDir: string) {
  const names = await readdir(inputDir);
  const contents = names.map((name) => {
    const input = join(inputDir, name);
    const output = join(outputDir, name);
    return cp(input, output, { recursive: true });
  });
  await Promise.all(contents);
}

async function pack({ platform, bundlesDir }: Extension) {
  switch (platform) {
    case 'web-ext':
      await webExt.cmd.build({
        sourceDir: bundlesDir,
        artifactsDir: OUTPUT_DIR,
        filename: 'web-ext.zip',
        overwriteDest: true,
      });
      break;
    case 'chrome':
      // The `chrome-webstore-upload` utility packs the extension into a ZIP archive by itself before publishing.
      // Debugging also doesn't require packing the extension.
      break;
    default:
      assertExhaustive(platform);
  }
}

async function meta({ platform }: Extension) {
  switch (platform) {
    case 'web-ext': {
      const changelogRaw = await readFile('CHANGELOG.md', 'utf-8');
      const release = parseChangelog(changelogRaw).releases[0];
      if (release.version == null) {
        console.error('Invalid changelog version');
        return;
      }
      if (release.version !== packageManifest.version) {
        console.error(
          `Changelog version "${release.version}" doesn't match package version "${packageManifest.version}"`,
        );
        return;
      }
      // https://mozilla.github.io/addons-server/topics/api/addons.html#version-create
      const meta = { release_notes: releaseNotes(release) };
      await writeJsonObject(meta, join(OUTPUT_DIR, 'web-ext-meta.json'));
      break;
    }
    case 'chrome': {
      break;
    }
    default:
      assertExhaustive(platform);
  }
}

/**
 * Firefox Addons support only a limited subset of Markdown:
 * https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/#make-use-of-markdown
 */
function releaseNotes(release: Release): string {
  return Array.from(release.changes.entries())
    .filter(([_, changes]) => changes.length > 0)
    .map(([changesType, changes]) => {
      const changeRows = changes.map((c: Change) => c.toString()).join('\n');
      return `**${capitalize(changesType)}**\n\n${changeRows}`;
    })
    .join('\n\n');
}

function capitalize(s: string): string {
  return s.substring(0, 1).toUpperCase() + s.substring(1);
}

async function writeJsonObject(content: ToJsonObject, path: string) {
  const json = JSON.stringify(content, null, '  ');
  await writeFile(path, json);
}
