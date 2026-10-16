# Architecture

npm workspaces monorepo, TypeScript, Vite library builds (ESM + CJS + types), React 19 as a peer dependency, Vitest + Testing Library.

## ka-core

- `EmulatorProps { rom: Uint8Array; onReady?; onError?; className? }`: the contract every emulator component implements.
- `EmulatorDefinition { id, label, platforms, extensions, load }`: describes a system; `load()` is a dynamic import so cores and wasm are fetched only when a game of that system is opened.
- `createRegistry(definitions)`: lookups by Ibis platform id and by ROM file name; rejects duplicate platforms/extensions.
- `KEY_MAP` / `CONTROLS_HINT` / `padButtonForCode`: the one keyboard layout (arrows, X=A, Z=B, Enter=Start, Shift=Select).
- `useKeyboard(handlers, enabled)`: window key listeners for mapped keys only (`preventDefault` just for those, repeat ignored, removed on unmount, StrictMode safe).
- `emulatorCanvasStyle`: crisp pixel scaling.

## Emulator packages

Each `ka-*` package exports one component plus its `EmulatorDefinition`. A host assembles the definitions it wants with `createRegistry`. Adding a system means a new package and one line in the host's definition list; Ibis' schema is untouched because `Game.platform` is a free-form string.

## Lifecycle rules

Components own their listeners, audio and workers, release them on unmount and must survive mount, unmount, mount (StrictMode). Core forks expose `destroy()` for that.

## Publishing

`v*` tag triggers `.github/workflows/publish.yml`, which publishes to GitHub Packages (`@holmes89` scope), like archaea-ui. Needs the `GH_PAT` repository secret.
