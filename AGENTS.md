# ka

React emulator components (NES, Game Boy) for the holmes89 stack. Consumed by Thoth's Library to play Ibis ROMs in the browser.

The common agent policy (branches and worktrees, PR-only changes, real checks, Rabbit ticket lifecycle) is installed at user level and applies here; this file only adds facts specific to this repository.

## Layout

- `packages/ka-core`: shared contract (`EmulatorProps`, `EmulatorDefinition`), key map, `useKeyboard`, `createRegistry`.
- `packages/ka-nes`, `packages/ka-gb`, `apps/dashboard`: added by their own tickets.

## Commands

- `npm ci`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Checks before opening a PR

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Rules specific to this repo

- The repository is public: CI uses GitHub-hosted runners only (`ubuntu-latest`); never a self-hosted runner.
- Emulator components never fetch, store or bundle ROMs, and never persist saves (no localStorage/IndexedDB).
- Every component must clean up its listeners, audio and workers on unmount and survive React StrictMode double mounting.
- Licences: `ka-core` and `ka-nes` are MIT; `ka-gb` wraps wasmboy and is GPL-3.0-or-later; the dashboard bundles both and is GPL-3.0-or-later.
- Packages publish to GitHub Packages via a `v*` tag (see `.github/workflows/publish.yml`).

## Docs

- [`docs/ABOUT.md`](docs/ABOUT.md)
- [`docs/ARCH.md`](docs/ARCH.md)
- [`docs/context.md`](docs/context.md)
