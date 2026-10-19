export interface Credit {
  /** EmulatorDefinition id this credit belongs to. */
  id: string
  name: string
  licence: string
  /** The holmes89 fork Ka depends on; absent when Ka uses the upstream project unmodified. */
  fork?: string
  upstream: string
}

export const CREDITS: Credit[] = [
  {
    id: 'nes',
    name: 'nes-js',
    licence: 'MIT',
    fork: 'https://github.com/holmes89/nes-js',
    upstream: 'https://github.com/takahirox/nes-js',
  },
  {
    id: 'gameboy',
    name: 'wasmBoy',
    licence: 'GPL-3.0',
    fork: 'https://github.com/holmes89/wasmboy',
    upstream: 'https://github.com/torch2424/wasmBoy',
  },
  {
    id: 'atari2600',
    name: '6502.ts (Stellerator)',
    licence: 'MIT',
    upstream: 'https://github.com/6502ts/6502.ts',
  },
]

export const KA_REPO = 'https://github.com/holmes89/ka'
