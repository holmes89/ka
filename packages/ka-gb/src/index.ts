import type { EmulatorDefinition } from '@holmes89/ka-core'

/** Registry entry for the Game Boy and Game Boy Color. The core and its wasm load only when a game opens. */
export const gameBoyEmulator: EmulatorDefinition = {
  id: 'gameboy',
  label: 'Game Boy / Game Boy Color',
  platforms: ['gb', 'gbc'],
  extensions: ['.gb', '.gbc'],
  load: () => import('./GameBoyEmulator'),
}
