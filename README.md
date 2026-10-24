# old-youtube

A Chrome extension that rolls YouTube back to roughly 2023 and drops the newer 2024–2026 changes. The ambient glow is off by default and can be turned back on.

## What it changes

| Setting | Default | What it does |
| --- | --- | --- |
| Classic player controls | on | Turns off YouTube's `delhi_modern_web_player` flags so the old flat control bar comes back, with no pills, frosted glass or hover circles. Letterboxed videos get black bars |
| Classic layout | on | Turns off the side rail and fixed side panels. Description and comments go back under the video, recommendations back on the right, and theater mode comes back |
| Classic details | on | Plain description box, no oversized player rounding, no grey hover blobs on video cards |
| Disable ambient mode | on | Removes the glow behind the player |

## Install

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick this folder.
4. Reload any open YouTube tabs.

Click the toolbar icon to change settings. After a change, a **Reload** button appears that refreshes your YouTube tabs.

## How it works

- `src/flags.js` runs in the page before YouTube boots. It wraps `ytcfg.set` and pins the overridden `EXPERIMENT_FLAGS` so later writes can't flip them back. It also rewrites each player's `serializedExperimentFlags`.
- `src/bridge.js` syncs settings from `chrome.storage` into `localStorage` and sets `old_youtube_*` classes on `<html>`, so the page script can read them at `document_start`.
- `src/watch.js` keeps comments under the video.
- `styles/` holds the CSS for each setting, gated by those classes. `player.css` also flattens the new player if YouTube ever ignores the flags.
