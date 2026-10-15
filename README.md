# Halftone Press (desktop)

Turns JPEG photos into CMYK or single-ink halftone images. Built with Electron; runs fully offline.

- `app/index.html` – the whole app (UI and halftone renderer)
- `app/main.js` – window, native Save dialogs, network blocking
- `app/preload.js` – the only bridge from the page to the computer (saving files)

## Run from source

```
npm install
npm start
```

## Build the Windows app

```
npm run package:win
```

Output: `dist/Halftone Press-win32-x64/`. Copy `build/READ ME FIRST.txt` into it, then zip it to share. The build is not code-signed, so Windows SmartScreen will warn on first launch.

## Licenses

The bundled fonts (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono) are under the SIL Open Font License; see `app/fonts/OFL-*.txt`.

## Releases

GitHub Actions (`.github/workflows/release.yml`) builds the Windows app on every push to `main`, starts it once as a smoke test, and uploads the zip as a workflow artifact. Pushing a tag like `v1.0.1` also publishes a GitHub release with the zip attached. Bump `version` in `package.json` to match.
