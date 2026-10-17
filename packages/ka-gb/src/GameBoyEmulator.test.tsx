import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'

const calls: string[] = []
const wasmboy = vi.hoisted(() => ({
  config: vi.fn(),
  loadROM: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  destroy: vi.fn(),
  disableDefaultJoypad: vi.fn(),
  setJoypadState: vi.fn(),
  isReady: vi.fn(),
}))

vi.mock('../vendor/wasmboy.wasm.esm.js', () => ({ WasmBoy: wasmboy }))

import GameBoyEmulator from './GameBoyEmulator'
import { gameBoyEmulator } from './index'

const rom = new Uint8Array([1, 2, 3, 4])
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })

beforeEach(() => {
  calls.length = 0
  for (const [name, fn] of Object.entries(wasmboy)) {
    fn.mockReset()
    fn.mockImplementation(async () => {
      calls.push(name)
    })
  }
  // setJoypadState is sync and noisy: keep it out of the call log
  wasmboy.setJoypadState.mockImplementation(() => {})
  wasmboy.disableDefaultJoypad.mockImplementation(() => {
    calls.push('disableDefaultJoypad')
  })
})

describe('GameBoyEmulator', () => {
  it('configures without saves, loads the ROM, takes over the keyboard and plays', async () => {
    const onReady = vi.fn()
    const { getByRole } = render(<GameBoyEmulator rom={rom} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1))

    const canvas = getByRole('img', { name: 'Game Boy game screen' })
    expect(canvas.tagName).toBe('CANVAS')
    expect(wasmboy.config).toHaveBeenCalledWith(
      expect.objectContaining({ disableSaves: true, headless: false, isAudioEnabled: true }),
      canvas,
    )
    expect(wasmboy.loadROM).toHaveBeenCalledWith(rom) // equal bytes
    expect(calls).toEqual(['config', 'loadROM', 'disableDefaultJoypad', 'play'])
  })

  it('gives the core a private exactly-sized copy, even for a view into a larger buffer', async () => {
    const backing = new Uint8Array([9, 9, 1, 2, 3, 4, 9, 9])
    const view = backing.subarray(2, 6) // like bytes decoded from an RPC response
    const onReady = vi.fn()
    render(<GameBoyEmulator rom={view} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalled())

    const passed = wasmboy.loadROM.mock.calls[0][0] as Uint8Array
    expect(Array.from(passed)).toEqual([1, 2, 3, 4])
    expect(passed.buffer.byteLength).toBe(4)
    expect(passed.buffer).not.toBe(backing.buffer)
    expect(Array.from(view)).toEqual([1, 2, 3, 4]) // the caller's bytes are untouched
  })

  it('maps the shared keys to joypad state and keeps held buttons held', async () => {
    const onReady = vi.fn()
    render(<GameBoyEmulator rom={rom} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalled())

    expect(fireEvent.keyDown(window, { code: 'ArrowRight' })).toBe(false)
    expect(wasmboy.setJoypadState).toHaveBeenLastCalledWith({ RIGHT: true })
    fireEvent.keyDown(window, { code: 'KeyX' })
    expect(wasmboy.setJoypadState).toHaveBeenLastCalledWith({ RIGHT: true, A: true })
    fireEvent.keyUp(window, { code: 'ArrowRight' })
    expect(wasmboy.setJoypadState).toHaveBeenLastCalledWith({ RIGHT: false, A: true })
    fireEvent.keyDown(window, { code: 'ShiftRight' })
    expect(wasmboy.setJoypadState).toHaveBeenLastCalledWith({ RIGHT: false, A: true, SELECT: true })
    fireEvent.keyDown(window, { code: 'Enter' })
    expect(wasmboy.setJoypadState).toHaveBeenLastCalledWith(expect.objectContaining({ START: true }))

    wasmboy.setJoypadState.mockClear()
    expect(fireEvent.keyDown(window, { code: 'F5' })).toBe(true)
    expect(wasmboy.setJoypadState).not.toHaveBeenCalled()
  })

  it('ignores keys until the game is running', async () => {
    render(<GameBoyEmulator rom={rom} />)
    fireEvent.keyDown(window, { code: 'KeyZ' })
    expect(wasmboy.setJoypadState).not.toHaveBeenCalled()
    await settle()
  })

  it('reports a failing core through onError and not onReady', async () => {
    wasmboy.loadROM.mockRejectedValue(new Error('bad rom'))
    const onError = vi.fn()
    const onReady = vi.fn()
    render(<GameBoyEmulator rom={rom} onError={onError} onReady={onReady} />)
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'bad rom' })))
    expect(onReady).not.toHaveBeenCalled()
  })

  it('destroys the core and stops reading keys on unmount', async () => {
    const onReady = vi.fn()
    const { unmount } = render(<GameBoyEmulator rom={rom} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    unmount()
    await waitFor(() => expect(wasmboy.destroy).toHaveBeenCalledTimes(1))
    wasmboy.setJoypadState.mockClear()
    expect(fireEvent.keyDown(window, { code: 'KeyZ' })).toBe(true)
    expect(wasmboy.setJoypadState).not.toHaveBeenCalled()
  })

  it('serialises StrictMode mount, unmount, mount: destroy always finishes before the next start', async () => {
    const onReady = vi.fn()
    render(
      <StrictMode>
        <GameBoyEmulator rom={rom} onReady={onReady} />
      </StrictMode>,
    )
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1))
    expect(calls).toEqual(['destroy', 'config', 'loadROM', 'disableDefaultJoypad', 'play'])
  })

  it('tears one game down before starting the next when the ROM changes', async () => {
    const onReady = vi.fn()
    const { rerender } = render(<GameBoyEmulator rom={rom} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1))
    calls.length = 0
    rerender(<GameBoyEmulator rom={new Uint8Array([9, 9])} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(2))
    expect(calls).toEqual(['destroy', 'config', 'loadROM', 'disableDefaultJoypad', 'play'])
  })

  it('resumes when the tab becomes visible again', async () => {
    const onReady = vi.fn()
    render(<GameBoyEmulator rom={rom} onReady={onReady} />)
    await waitFor(() => expect(onReady).toHaveBeenCalled())
    wasmboy.play.mockClear()
    fireEvent(document, new Event('visibilitychange'))
    expect(wasmboy.play).toHaveBeenCalledTimes(1)
  })
})

describe('gameBoyEmulator definition', () => {
  it('describes both Game Boy platforms and lazy-loads the component', async () => {
    expect(gameBoyEmulator).toMatchObject({ id: 'gameboy', platforms: ['gb', 'gbc'], extensions: ['.gb', '.gbc'] })
    expect((await gameBoyEmulator.load()).default).toBe(GameBoyEmulator)
  })
})
