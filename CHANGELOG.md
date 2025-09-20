# Changelog

All notable changes to this project will be documented in this file.
Add to Feedly Plus adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.1.3 - 2025-08-31

### Changed

- Switch sources to TypeScript from Flow.js typings.
- Fix subscription links: aggregator now URL-encodes feed URL in it.
- Stop considering XML sitemaps as feeds ([#4](https://github.com/quasiyoke/add-to-feedly-plus/issues/4)).
- Put the direct feed URLs in the links within the popup instead of a link encoded for the aggregator, so they are easier to preview on hover.

### Added

- Extension version for the Chrome browser platform.
- Support for Firefox for Android.
- Dark theme for the popup. Switching to a light/dark theme is determined by the selected browser theme.

## 2.0.0 - 2019-04-06

### Changed

- The add-on was rewritten using WebExtensions API,
- main add-on button is a `pageAction` instead of `browserAction` now,
- the source code was rewritten on Flow JS.

### Removed

- Smart handling of several feeds' common title.

## 1.9.0 - 2015-04-16

### Added

- A bunch of RSS and Atom MIME types.

## 1.8.0 - 2015-02-26

### Changed

- Smart handling of several feeds' common title was improved.

## 1.7.0 - 2015-02-21

### Changed

- Popup appearance was improved,
- feeds count was appended to the `browserAction`'s title.

## 1.6.0 - 2015-02-20

### Added

- Smart handling of several feeds' common title.
