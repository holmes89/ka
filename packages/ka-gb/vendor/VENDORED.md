# Vendored: wasmboy

Prebuilt ES bundle of the holmes89 fork of [wasmBoy](https://github.com/torch2424/wasmBoy) (GPL-3.0, see `LICENSE`).

| | |
|---|---|
| Fork | https://github.com/holmes89/wasmboy |
| Source commit | `3f90571105bfa886952acda0b46f21b7122aa6ba` (main, PR #1: `disableSaves` + `destroy()`) |
| File | `wasmboy.wasm.esm.js` (workers and the wasm core are inlined) |
| sha256 | `be1baf8f4f45a2eb962fd38402a5c722c035dd6df16c5bd973a3bdb0570e5eb5` |

## Rebuilding

```
git clone https://github.com/holmes89/wasmboy && cd wasmboy
git checkout 3f90571105bfa886952acda0b46f21b7122aa6ba
npm ci --ignore-scripts --legacy-peer-deps   # plain npm ci hits an upstream rollup peer-dependency ERESOLVE
npm run build
cp dist/wasmboy.wasm.esm.js <ka>/packages/ka-gb/vendor/
```

Update the commit and sha256 above whenever the file changes.
