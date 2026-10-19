# ka

React emulator components (NES, Game Boy, Atari 2600, Atari 8-bit) for the holmes89 stack. Consumed by Thoth's Library to play Ibis ROMs in the browser.

The common agent policy (branches and worktrees, PR-only changes, real checks, Rabbit ticket lifecycle) is installed at user level and applies here; this file only adds facts specific to this repository.

## Layout

- `packages/ka-core`: shared contract (`EmulatorProps`, `EmulatorDefinition`), key map, `useKeyboard`, `createRegistry`.
- `packages/ka-nes`: NES component; bundles the MIT `nes-js` fork (pinned by commit tarball in devDependencies).
- `packages/ka-atari2600`: Atari 2600 component; bundles the MIT `6502.ts` Stellerator core (pinned exactly, because teardown reaches its private worker and audio handles) plus a worker script that `npm run build:worker` bundles into the gitignored `src/generated/` (the build and test scripts run it first).
- `packages/ka-atari8`: Atari 400/800/XL/XE component; bundles the MIT `@sfotty-pie/a8` core and runs its own frame loop and audio. `src/firmware.ts` is generated from the vendored AltirraOS ROM (`vendor/VENDORED.md`); rerun `npm run gen:firmware -w @holmes89/ka-atari8` when the ROM changes.
- `packages/ka-gb`: Game Boy / Game Boy Color component; inlines a vendored, prebuilt GPL-3.0 wasmboy bundle (`vendor/VENDORED.md` records the fork commit, sha256 and rebuild steps; update them together).
- `apps/dashboard`: public demo app (Vite, React). Builds the registry from the packages above, plays a local ROM, credits the original projects. GPL-3.0-or-later because it bundles wasmboy.

## Commands

- `npm ci`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Checks before opening a PR

- `npm run lint`
- `npm run build`
- `npm run typecheck`
- `npm test`

Build comes before typecheck and test: packages import each other through their built `dist/` (`ka-core` first), so a clean checkout fails typecheck until `npm run build` has run.

## Rules specific to this repo

- The repository is public: CI uses GitHub-hosted runners only (`ubuntu-latest`); never a self-hosted runner.
- Emulator components never fetch, store or bundle ROMs, and never persist saves (no localStorage/IndexedDB).
- Every component must clean up its listeners, audio and workers on unmount and survive React StrictMode double mounting.
- Licences: `ka-core`, `ka-nes`, `ka-atari2600` and `ka-atari8` are MIT; `ka-gb` wraps wasmboy and is GPL-3.0-or-later; the dashboard bundles both and is GPL-3.0-or-later (its `LICENSE`).
- Packages publish to GitHub Packages via a `v*` tag (see `.github/workflows/publish.yml`).

## Docs

- [`docs/ABOUT.md`](docs/ABOUT.md)
- [`docs/ARCH.md`](docs/ARCH.md)
- [`docs/context.md`](docs/context.md)
