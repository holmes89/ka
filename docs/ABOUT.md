# About Ka

Ka is a small collection of React components that run retro game ROMs in the browser. It exists so Thoth's Library can play the NES and Game Boy ROMs catalogued in Ibis without iframes or per-system glue, and so a new system can be added later by adding one package.

## Scope

- NES (`ka-nes`) and Game Boy / Game Boy Color (`ka-gb`) to start.
- Keyboard input only. No save states, battery saves, gamepad or touch support yet.
- The host passes ROM bytes in. Ka never fetches, uploads, stores or bundles ROMs.
- A public dashboard (`apps/dashboard`) lists supported systems, plays a local ROM file and links to the original emulator projects.

## Related

- Design: Rabbit design "Ibis — Retro Game Library & Emulator".
- Consumers: Thoth Library (`ui/`), the Ka dashboard.
