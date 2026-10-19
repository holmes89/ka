# Vendored firmware

`altirraos-xl-xe.rom` is **AltirraOS (XL/XE)**, a clean-room replacement for the Atari XL/XE operating system, so Ka needs no copyrighted Atari ROM.

- Author: Avery Lee (AltirraOS kernel, Copyright (C) 2008-2016), distributed with the Altirra emulator.
- Licence: FSF all-permissive licence. Copying and distribution of this file, with or without modification, are permitted in any medium without royalty provided the copyright notice and this notice are preserved. This file is offered as-is, without any warranty.
- Source of this copy: `apps/a8-web/library/firmware/AltirraOS XL-XE.rom` in https://github.com/cyco130/sfotty-pie at commit `7eda66e5590c7cbd604eda8350ce509de7443daf`.
- Size: 16384 bytes. SHA-256: `b037d8741ee489f7cf92486e2d483b565323abad6c01b25b7ca0cfb97abe07fc` (a test fails if `src/firmware.ts` drifts from this).

`src/firmware.ts` embeds the image as base64 so the package needs no asset loading. Regenerate it with `npm run gen:firmware -w @holmes89/ka-atari8` after replacing the ROM, then update the commit and hash above.

Not affiliated with or endorsed by Atari or the Altirra project.
