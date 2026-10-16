# Ka

React components that play retro game ROMs in the browser. Ka powers the Library in [Thoth](https://thoth.holmes.haus): [Ibis](https://github.com/holmes89/ibis) stores the ROMs, Ka renders them.

Keyboard only, no save states. Nothing is uploaded or stored; the host hands a component the ROM bytes.

| Package | System | Core |
|---|---|---|
| `@holmes89/ka-core` | shared contract, key map, keyboard hook, registry | none |
| `@holmes89/ka-nes` | NES / Famicom | [holmes89/nes-js](https://github.com/holmes89/nes-js) |
| `@holmes89/ka-gb` (in progress) | Game Boy / Game Boy Color | [holmes89/wasmboy](https://github.com/holmes89/wasmboy) |

## Original projects

Ka stands on these emulators; the forks add teardown (`destroy()`), scoped key handling and a `disableSaves` option so they can live inside React components.

| Fork | Upstream | Licence |
|---|---|---|
| [holmes89/nes-js](https://github.com/holmes89/nes-js) | [takahirox/nes-js](https://github.com/takahirox/nes-js) | MIT |
| [holmes89/wasmboy](https://github.com/holmes89/wasmboy) | [torch2424/wasmBoy](https://github.com/torch2424/wasmBoy) | GPL-3.0 |

## Controls

Arrow keys = D-pad, **X** = A, **Z** = B, **Enter** = Start, **Shift** = Select.

## Using a component

```tsx
import NesEmulator from '@holmes89/ka-nes/component'

<NesEmulator rom={bytes} onReady={...} onError={...} />
```

Hosts normally go through the registry instead, which lazy-loads the right component for an Ibis platform id (`nes`, `gb`, `gbc`) so each core is only fetched when a game of that system opens:

```ts
import { createRegistry } from '@holmes89/ka-core'
import { nesEmulator } from '@holmes89/ka-nes'

const registry = createRegistry([nesEmulator /* , gameBoyEmulator */])
const emulator = registry.forPlatform(game.platform) // undefined for non-ROM platforms
const { default: Emulator } = await emulator.load()
```

`nes-js` is bundled into `ka-nes`, so installing it needs no extra dependency.

## Development

```
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

## Licence

`ka-core` and `ka-nes` are MIT (see `LICENSE`). `ka-gb` and the dashboard include GPL-3.0 wasmboy code and are GPL-3.0-or-later.
