import type { EmulatorDefinition } from '@holmes89/ka-core'

/** Registry entry for the NES. The component is loaded on demand, so nes-js is fetched only when a NES game opens. */
export const nesEmulator: EmulatorDefinition = {
  id: 'nes',
  label: 'NES',
  platforms: ['nes'],
  extensions: ['.nes'],
  load: () => import('./NesEmulator'),
}
