# About Ka

Ka is a small collection of React components that run retro game ROMs in the browser. It exists so Thoth's Library can play the NES, Game Boy and Atari ROMs catalogued in Ibis without iframes or per-system glue, and so a new system can be added later by adding one package.

## Scope

- NES (`ka-nes`), Game Boy / Game Boy Color (`ka-gb`), Atari 2600 (`ka-atari2600`) and Atari 400/800/XL/XE (`ka-atari8`). SNES, Atari 5200/7800 and other systems are not supported: the cores found for them are GPL-only or have no usable browser build.
- Keyboard input only. No save states, battery saves, gamepad or touch support yet.
- The host passes ROM bytes in. Ka never fetches, uploads, stores or bundles ROMs.
- A public dashboard (`apps/dashboard`) lists supported systems, plays a local ROM file and links to the original emulator projects.

## Related

- Design: Rabbit design "Ibis — Retro Game Library & Emulator".
- Consumers: Thoth Library (`ui/`), the Ka dashboard.
