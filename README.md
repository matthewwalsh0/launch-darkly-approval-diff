# LaunchDarkly Approval Diff

Chrome extension that replaces raw JSON blocks on LaunchDarkly approval pages with a semantic JSON diff view.

![Screenshot](screenshot.png)

## Install

```bash
yarn install
yarn build
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory

## Development

```bash
yarn watch
```

Rebuilds on file changes. Reload the extension in Chrome to pick up updates.

