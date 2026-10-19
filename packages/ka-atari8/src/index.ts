import type { EmulatorDefinition } from '@holmes89/ka-core'

/**
 * Registry entry for the Atari 8-bit computers (400/800/XL/XE). The component is loaded on demand, so the core is fetched only when a game opens.
 * Cartridge images (`.car`, `.rom`) are recognised by content, not extension, so `.rom` is also left to other systems' hosts to decide.
 */
export const atari8Emulator: EmulatorDefinition = {
  id: 'atari8',
  label: 'Atari 8-bit',
  platforms: ['atari8'],
  extensions: ['.xex', '.atr', '.car', '.com'],
  load: () => import('./Atari8Emulator'),
}
