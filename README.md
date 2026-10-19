# Ka

React components that play retro game ROMs in the browser. Ka powers the Library in [Thoth](https://thoth.holmes.haus): [Ibis](https://github.com/holmes89/ibis) stores the ROMs, Ka renders them.

Keyboard only, no save states. Nothing is uploaded or stored; the host hands a component the ROM bytes.

| Package | System | Core |
|---|---|---|
| `@holmes89/ka-core` | shared contract, key map, keyboard hook, registry | none |
| `@holmes89/ka-nes` | NES / Famicom | [holmes89/nes-js](https://github.com/holmes89/nes-js) |
| `@holmes89/ka-gb` | Game Boy / Game Boy Color | [holmes89/wasmboy](https://github.com/holmes89/wasmboy) |
| `@holmes89/ka-atari2600` | Atari 2600 | [6502ts/6502.ts](https://github.com/6502ts/6502.ts) (Stellerator) |
| `@holmes89/ka-atari8` | Atari 400/800/XL/XE (not the 5200) | [cyco130/sfotty-pie](https://github.com/cyco130/sfotty-pie) |

## Dashboard

`apps/dashboard` is a small public demo: it lists the supported systems, plays a ROM you pick or drop (read in the browser, never uploaded; no ROMs are bundled) and links to the original emulator projects. Run it with `npm run dev -w ka-dashboard`; the build is static (`apps/dashboard/dist`) and `.github/workflows/pages.yml` can publish it to GitHub Pages (manual trigger; Pages has to be enabled in the repo settings first).

## Original projects

Ka stands on these emulators; the forks add teardown (`destroy()`), scoped key handling and a `disableSaves` option so they can live inside React components.

| Fork | Upstream | Licence |
|---|---|---|
| [holmes89/nes-js](https://github.com/holmes89/nes-js) | [takahirox/nes-js](https://github.com/takahirox/nes-js) | MIT |
| [holmes89/wasmboy](https://github.com/holmes89/wasmboy) | [torch2424/wasmBoy](https://github.com/torch2424/wasmBoy) | GPL-3.0 |

The Atari packages use their upstream projects unmodified: [6502.ts](https://github.com/6502ts/6502.ts) (MIT) and [Sfotty Pie](https://github.com/cyco130/sfotty-pie) (MIT). `ka-atari8` also embeds the AltirraOS firmware (Avery Lee, FSF all-permissive licence; see `packages/ka-atari8/vendor/VENDORED.md`), so no Atari ROM is needed.

## Controls

Arrow keys = D-pad, **X** = A, **Z** = B, **Enter** = Start, **Shift** = Select.

The Atari systems map the same keys onto their hardware:

| System | Keys |
|---|---|
| Atari 2600 | arrows = joystick, **X** or **Z** = fire, **Shift** = Select switch, **Enter** = Reset switch |
| Atari 8-bit | arrows = joystick, **X** or **Z** = trigger, **Enter** = START, **Shift** = SELECT, **Space** = OPTION |

Programs that need the Atari 8-bit keyboard (BASIC, text games) are not supported, and the 2600 plays in NTSC colour.

## Using a component

```tsx
import NesEmulator from '@holmes89/ka-nes/component'

<NesEmulator rom={bytes} onReady={...} onError={...} />
```

Hosts normally go through the registry instead, which lazy-loads the right component for an Ibis platform id (`nes`, `gb`, `gbc`, `atari2600`, `atari8`) so each core is only fetched when a game of that system opens:

```ts
import { createRegistry } from '@holmes89/ka-core'
import { nesEmulator } from '@holmes89/ka-nes'
import { gameBoyEmulator } from '@holmes89/ka-gb'
import { atari2600Emulator } from '@holmes89/ka-atari2600'
import { atari8Emulator } from '@holmes89/ka-atari8'

const registry = createRegistry([nesEmulator, gameBoyEmulator, atari2600Emulator, atari8Emulator])
const emulator = registry.forPlatform(game.platform) // undefined for non-ROM platforms
const { default: Emulator } = await emulator.load()
```

`nes-js` is bundled into `ka-nes` and a prebuilt wasmboy into `ka-gb` (`packages/ka-gb/vendor`, see `VENDORED.md`), so installing them needs no extra dependency. wasmboy is a process-wide singleton: render one Game Boy at a time.

## Development

```
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

## Licence

`ka-core`, `ka-nes`, `ka-atari2600` and `ka-atari8` are MIT (see `LICENSE`). `ka-gb` and the dashboard include GPL-3.0 wasmboy code and are GPL-3.0-or-later.
