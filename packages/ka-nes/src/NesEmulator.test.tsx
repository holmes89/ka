import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import NesEmulator from './NesEmulator'
import { nesEmulator } from './index'

const require = createRequire(import.meta.url)
const pong = new Uint8Array(readFileSync(require.resolve('nes-js/roms/pong1k.nes')))

// jsdom has no canvas, audio or animation frames: fake just enough for the real core to run.
const frames = new Map<number, FrameRequestCallback>()
const audioContexts: Array<{ state: string; closed: boolean; resume: () => Promise<void> }> = []
let nextFrame = 1

beforeEach(() => {
  frames.clear()
  audioContexts.length = 0
  nextFrame = 1
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.set(nextFrame, cb)
    return nextFrame++
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal(
    'AudioContext',
    class {
      sampleRate = 44100
      destination = {}
      state = 'suspended'
      closed = false
      constructor() {
        audioContexts.push(this)
      }
      createScriptProcessor() {
        return { connect() {}, disconnect() {}, onaudioprocess: null }
      }
      resume() {
        this.state = 'running'
        return Promise.resolve()
      }
      close() {
        this.closed = true
        return Promise.resolve()
      }
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () =>
      ({
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: () => {},
      }) as unknown as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('NesEmulator', () => {
  it('boots a ROM, reports ready and runs exactly one frame loop', () => {
    const onReady = vi.fn()
    const { getByRole } = render(<NesEmulator rom={pong} onReady={onReady} />)
    expect(getByRole('img', { name: 'NES game screen' }).tagName).toBe('CANVAS')
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(frames.size).toBe(1)
  })

  it('reports an invalid ROM through onError and does not run', () => {
    const onError = vi.fn()
    const onReady = vi.fn()
    render(<NesEmulator rom={new Uint8Array(32)} onError={onError} onReady={onReady} />)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(onReady).not.toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })

  it('releases the frame loop and audio on unmount', () => {
    const { unmount } = render(<NesEmulator rom={pong} />)
    expect(audioContexts).toHaveLength(1)
    unmount()
    expect(frames.size).toBe(0)
    expect(audioContexts[0].closed).toBe(true)
  })

  it('survives StrictMode mount, unmount, mount without leaking', () => {
    const { unmount } = render(
      <StrictMode>
        <NesEmulator rom={pong} />
      </StrictMode>,
    )
    expect(frames.size).toBe(1)
    expect(audioContexts.filter((c) => !c.closed)).toHaveLength(1)
    unmount()
    expect(frames.size).toBe(0)
    expect(audioContexts.every((c) => c.closed)).toBe(true)
  })

  it('swaps games when the ROM changes', () => {
    const { rerender } = render(<NesEmulator rom={pong} />)
    rerender(<NesEmulator rom={pong.slice()} />)
    expect(frames.size).toBe(1)
    expect(audioContexts.filter((c) => !c.closed)).toHaveLength(1)
  })

  it('resumes suspended audio on the first key press and ignores unmapped keys', () => {
    render(<NesEmulator rom={pong} />)
    expect(audioContexts[0].state).toBe('suspended')
    expect(fireEvent.keyDown(window, { code: 'F5' })).toBe(true)
    expect(audioContexts[0].state).toBe('suspended')
    expect(fireEvent.keyDown(window, { code: 'KeyZ' })).toBe(false)
    expect(audioContexts[0].state).toBe('running')
    fireEvent.keyUp(window, { code: 'KeyZ' })
  })

  it('stops reading the keyboard after unmount', () => {
    const { unmount } = render(<NesEmulator rom={pong} />)
    unmount()
    expect(fireEvent.keyDown(window, { code: 'KeyZ' })).toBe(true)
  })
})

describe('nesEmulator definition', () => {
  it('describes the NES and lazy-loads the component', async () => {
    expect(nesEmulator).toMatchObject({ id: 'nes', platforms: ['nes'], extensions: ['.nes'] })
    const loaded = await nesEmulator.load()
    expect(loaded.default).toBe(NesEmulator)
  })
})
