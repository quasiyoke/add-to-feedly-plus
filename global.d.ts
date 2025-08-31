type ExtensionPlatform = 'web-ext' | 'chrome';

/** Set in the bundler, statically inlined at build time to make tree-shaking effective, see `build.ts` */
declare const EXTENSION_PLATFORM: ExtensionPlatform;
