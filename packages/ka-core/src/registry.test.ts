import { createRegistry } from './registry'
import type { EmulatorDefinition } from './types'

const load = () => Promise.resolve({ default: () => null })
const nes: EmulatorDefinition = { id: 'nes', label: 'NES', platforms: ['nes'], extensions: ['.nes'], load }
const gb: EmulatorDefinition = { id: 'gameboy', label: 'Game Boy', platforms: ['gb', 'gbc'], extensions: ['.gb', '.gbc'], load }

describe('createRegistry', () => {
  const registry = createRegistry([nes, gb])

  it('finds emulators by platform', () => {
    expect(registry.forPlatform('nes')).toBe(nes)
    expect(registry.forPlatform('gbc')).toBe(gb)
    expect(registry.forPlatform('labyrinth-v2')).toBeUndefined()
  })

  it('finds emulators by file name, case-insensitively', () => {
    expect(registry.forFileName('Pong.NES')).toBe(nes)
    expect(registry.forFileName('game.gbc')).toBe(gb)
    expect(registry.forFileName('readme')).toBeUndefined()
  })

  it('derives the platform id from the extension', () => {
    expect(registry.platformForFileName('a.nes')).toBe('nes')
    expect(registry.platformForFileName('a.gb')).toBe('gb')
    expect(registry.platformForFileName('a.GBC')).toBe('gbc')
    expect(registry.platformForFileName('a.zip')).toBeUndefined()
  })

  it('rejects duplicates', () => {
    expect(() => createRegistry([nes, { ...nes, id: 'other' }])).toThrow(/registered twice/)
  })
})
