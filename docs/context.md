# Context

- Ka was created from Rabbit design `5417b05a-19fb-57fa-b7b3-4b62504eb4bc` (IBIS project, tickets IBIS-1..9).
- The emulator cores are forks under the holmes89 account: `nes-js` (MIT) and `wasmboy` (GPL-3.0). Embedding changes live in those forks' PRs; Ka consumes their published builds.
- The wasmboy fork does not commit `dist/`, so `ka-gb` needs a published build of the fork.
- Ka is public. CI must use GitHub-hosted runners only.
