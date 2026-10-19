import type { EmulatorDefinition } from '@holmes89/ka-core'

/**
 * Registry entry for the Atari 2600. The component is loaded on demand, so the core and its worker are fetched only when a game opens.
 * `.bin` is shared with other systems and is never inferred from the extension; Ibis stores the platform explicitly.
 */
export const atari2600Emulator: EmulatorDefinition = {
  id: 'atari2600',
  label: 'Atari 2600',
  platforms: ['atari2600'],
  extensions: ['.a26', '.bin'],
  load: () => import('./Atari2600Emulator'),
}
