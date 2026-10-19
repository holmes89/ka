import { fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import Atari2600Emulator from './Atari2600Emulator'
import { atari2600Emulator } from './index'

// Stellerator needs WebGL, audio and a worker, none of which jsdom has: replace it with a recorder that has the same surface.
// `vi.mock` is hoisted above imports, so the fake is created in `vi.hoisted`.
const fake = vi.hoisted(() => {
  const state = { instances: [] as FakeStellerator[], runResult: Promise.resolve() as Promise<unknown> }
  class FakeStellerator {
    static TvMode = { ntsc: 'ntsc', pal: 'pal', secam: 'secam' }
    worker = { terminate: vi.fn() }
    _emulationService = { _worker: this.worker }
    _audioDriver = { close: vi.fn() }
    stop = vi.fn(() => Promise.resolve('stopped'))
    releaseCanvas = vi.fn()
    run = vi.fn(() => state.runResult)
    constructor(
      public canvas: HTMLCanvasElement,
      public workerUrl: string,
      public config: { keyboardTarget: HTMLElement },
    ) {
      state.instances.push(this)
    }
  }
  return { state, FakeStellerator }
})
const instances = fake.state.instances

vi.mock('./stellerator', () => ({ Stellerator: fake.FakeStellerator }))
vi.mock('./generated/stella-worker.js?raw', () => ({ default: '/* worker */' }))

const rom = new Uint8Array(4096).fill(0xea)

type KeyLog = { type: string; keyCode: number; shiftKey: boolean }
function logKeys(target: HTMLElement): KeyLog[] {
  const log: KeyLog[] = []
  for (const type of ['keydown', 'keyup']) {
    target.addEventListener(type, (e) => {
      const k = e as KeyboardEvent
      log.push({ type, keyCode: k.keyCode, shiftKey: k.shiftKey })
    })
  }
  return log
}

beforeEach(() => {
  instances.length = 0
  fake.state.runResult = Promise.resolve()
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:worker'), revokeObjectURL: vi.fn() }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Atari2600Emulator', () => {
  it('runs a private copy of the ROM on its own canvas and reports ready', async () => {
    const onReady = vi.fn()
    const { getByRole } = render(<Atari2600Emulator rom={rom} onReady={onReady} />)
    const screen = getByRole('img', { name: 'Atari 2600 game screen' })
    expect(screen.querySelectorAll('canvas')).toHaveLength(1)
    expect(instances).toHaveLength(1)
    const [core] = instances
    expect(core.canvas.parentElement).toBe(screen)
    expect(core.workerUrl).toBe('blob:worker')
    const [bytes, tvMode] = core.run.mock.calls[0] as unknown as [Uint8Array, string]
    expect(bytes).toEqual(rom)
    expect(bytes).not.toBe(rom)
    expect(tvMode).toBe('ntsc')
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1))
  })

  it('keeps Stellerator off the global document and out of the pause, fullscreen and reset shortcuts', () => {
    render(<Atari2600Emulator rom={rom} />)
    expect(instances[0].config).toMatchObject({
      enableTouch: false,
      enableGamepad: false,
      paddleViaMouse: false,
      pauseViaKeyboard: false,
      fullscreenViaKeyboard: false,
      resetViaKeyboard: false,
    })
    expect(instances[0].config.keyboardTarget).not.toBe(document)
  })

  it('reports a core failure through onError and not onReady', async () => {
    fake.state.runResult = Promise.reject(new Error('bad cartridge'))
    const onError = vi.fn()
    const onReady = vi.fn()
    render(<Atari2600Emulator rom={rom} onError={onError} onReady={onReady} />)
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'bad cartridge' })))
    expect(onReady).not.toHaveBeenCalled()
  })

  it('bridges the shared pad keys to the key codes Stellerator listens for', () => {
    render(<Atari2600Emulator rom={rom} />)
    const log = logKeys(instances[0].config.keyboardTarget)
    const press = (code: string) => {
      expect(fireEvent.keyDown(window, { code })).toBe(false)
      fireEvent.keyUp(window, { code })
    }
    press('ArrowLeft')
    press('ArrowUp')
    press('KeyZ')
    press('KeyX')
    press('Enter')
    press('ShiftLeft')
    expect(log.filter((e) => e.type === 'keydown')).toEqual([
      { type: 'keydown', keyCode: 37, shiftKey: false },
      { type: 'keydown', keyCode: 38, shiftKey: false },
      { type: 'keydown', keyCode: 32, shiftKey: false },
      { type: 'keydown', keyCode: 32, shiftKey: false },
      { type: 'keydown', keyCode: 13, shiftKey: true },
      { type: 'keydown', keyCode: 32, shiftKey: true },
    ])
    expect(log.filter((e) => e.type === 'keyup')).toHaveLength(6)
  })

  it('leaves unmapped keys alone', () => {
    render(<Atari2600Emulator rom={rom} />)
    const log = logKeys(instances[0].config.keyboardTarget)
    expect(fireEvent.keyDown(window, { code: 'F5' })).toBe(true)
    expect(log).toEqual([])
  })

  it('stops the core, closes audio, ends the worker and stops listening on unmount', async () => {
    const { unmount, container } = render(<Atari2600Emulator rom={rom} />)
    const [core] = instances
    const log = logKeys(core.config.keyboardTarget)
    unmount()
    expect(container.querySelector('canvas')).toBeNull()
    await vi.waitFor(() => expect(core.worker.terminate).toHaveBeenCalledTimes(1))
    expect(core.stop).toHaveBeenCalledTimes(1)
    expect(core.releaseCanvas).toHaveBeenCalledTimes(1)
    expect(core._audioDriver.close).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:worker')
    expect(fireEvent.keyDown(window, { code: 'KeyZ' })).toBe(true)
    expect(log).toEqual([])
  })

  it('still ends the worker when stopping the core fails', async () => {
    const { unmount } = render(<Atari2600Emulator rom={rom} />)
    const [core] = instances
    core.stop.mockRejectedValueOnce(new Error('already dead'))
    unmount()
    await vi.waitFor(() => expect(core.worker.terminate).toHaveBeenCalledTimes(1))
  })

  it('survives StrictMode mount, unmount, mount without leaking a core', async () => {
    const { unmount, getByRole } = render(
      <StrictMode>
        <Atari2600Emulator rom={rom} />
      </StrictMode>,
    )
    expect(instances).toHaveLength(2)
    await vi.waitFor(() => expect(instances[0].worker.terminate).toHaveBeenCalledTimes(1))
    expect(instances[1].worker.terminate).not.toHaveBeenCalled()
    expect(getByRole('img').querySelectorAll('canvas')).toHaveLength(1)
    unmount()
    await vi.waitFor(() => expect(instances[1].worker.terminate).toHaveBeenCalledTimes(1))
  })

  it('swaps games when the ROM changes', async () => {
    const { rerender } = render(<Atari2600Emulator rom={rom} />)
    rerender(<Atari2600Emulator rom={rom.slice()} />)
    expect(instances).toHaveLength(2)
    await vi.waitFor(() => expect(instances[0].worker.terminate).toHaveBeenCalledTimes(1))
  })
})

describe('atari2600Emulator definition', () => {
  it('describes the Atari 2600 and lazy-loads the component', async () => {
    expect(atari2600Emulator).toMatchObject({
      id: 'atari2600',
      platforms: ['atari2600'],
      extensions: ['.a26', '.bin'],
    })
    const loaded = await atari2600Emulator.load()
    expect(loaded.default).toBe(Atari2600Emulator)
  })
})
