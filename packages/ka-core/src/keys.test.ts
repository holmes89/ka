import { CONTROLS_HINT, KEY_MAP, padButtonForCode } from './keys'

describe('pad keys', () => {
  it('maps the shared layout', () => {
    expect(padButtonForCode('ArrowUp')).toBe('up')
    expect(padButtonForCode('KeyZ')).toBe('b')
    expect(padButtonForCode('KeyX')).toBe('a')
    expect(padButtonForCode('Enter')).toBe('start')
    expect(padButtonForCode('ShiftLeft')).toBe('select')
    expect(padButtonForCode('ShiftRight')).toBe('select')
  })

  it('ignores unmapped keys', () => {
    expect(padButtonForCode('F5')).toBeUndefined()
    expect(padButtonForCode('Space')).toBeUndefined()
  })

  it('has a hint for every button', () => {
    expect(CONTROLS_HINT.map((h) => h.button).sort()).toEqual(Object.keys(KEY_MAP).sort())
  })
})
