import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import Atari8Emulator from './Atari8Emulator'
import { atari8Emulator } from './index'
import { paletteFor } from '@sfotty-pie/a8'
import { ALTIRRA_OS_XL_XE_SHA256, altirraOsXlXe } from './firmware'

const colours = new Uint8Array(readFileSync(resolve(__dirname, 'test/roms/colours.xex')))

// jsdom has no canvas, audio or animation frames: fake just enough for the real core to run.
const frames = new Map<number, FrameRequestCallback>()
const audioContexts: Array<{ state: string; closed: boolean; nodes: unknown[] }> = []
let nextFrame = 1
let clock = 0
let painted: Uint8ClampedArray | null = null

/** Runs `count` display frames of emulated time (the loop paces itself on the timestamps it is given). */
function advance(count: number) {
  for (let i = 0; i < count; i++) {
    clock += 1000 / 60
    const pending = [...frames.entries()]
    frames.clear()
    for (const [, cb] of pending) cb(clock)
  }
}

/** The colour (r,g,b) covering most pixels of the last painted frame. */
function dominantColour(): string {
  const counts = new Map<string, number>()
  const d = painted!
  for (let i = 0; i < d.length; i += 4) {
    const key = `${d[i]},${d[i + 1]},${d[i + 2]}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

beforeEach(() => {
  frames.clear()
  audioContexts.length = 0
  nextFrame = 1
  clock = 1000
  painted = null
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
      nodes: unknown[] = []
      constructor() {
        audioContexts.push(this)
      }
      createScriptProcessor() {
        const node = { connect() {}, disconnect() {}, onaudioprocess: null as unknown }
        this.nodes.push(node)
        return node
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
        createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: (image: ImageData) => {
          painted = image.data
        },
      }) as unknown as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('firmware', () => {
  it('is the vendored AltirraOS XL/XE image', () => {
    const bytes = altirraOsXlXe()
    expect(bytes).toHaveLength(16384)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(ALTIRRA_OS_XL_XE_SHA256)
    expect(ALTIRRA_OS_XL_XE_SHA256).toBe('b037d8741ee489f7cf92486e2d483b565323abad6c01b25b7ca0cfb97abe07fc')
  })
})

describe('Atari8Emulator', () => {
  it('boots a program on the real core, reports ready and runs one frame loop', () => {
    const onReady = vi.fn()
    const { getByRole } = render(<Atari8Emulator rom={colours} onReady={onReady} />)
    expect(getByRole('img', { name: 'Atari 8-bit game screen' }).tagName).toBe('CANVAS')
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(frames.size).toBe(1)
    advance(240)
    expect(painted).not.toBeNull()
    expect(frames.size).toBe(1)
  })

  it('answers the joystick: right steps the colour, fire blacks it out', () => {
    render(<Atari8Emulator rom={colours} />)
    advance(240)
    const idle = dominantColour()
    fireEvent.keyDown(window, { code: 'ArrowRight' })
    advance(20)
    const moved = dominantColour()
    fireEvent.keyUp(window, { code: 'ArrowRight' })
    expect(moved).not.toBe(idle)
    fireEvent.keyDown(window, { code: 'KeyZ' })
    advance(10)
    expect(dominantColour()).toBe('0,0,0')
    fireEvent.keyUp(window, { code: 'KeyZ' })
  })

  it('answers the console keys: Start recolours the screen', () => {
    render(<Atari8Emulator rom={colours} />)
    advance(240)
    const idle = dominantColour()
    fireEvent.keyDown(window, { code: 'Enter' })
    advance(10)
    expect(dominantColour()).not.toBe(idle)
    fireEvent.keyUp(window, { code: 'Enter' })
  })

  it('claims Space for OPTION and leaves other keys alone', () => {
    render(<Atari8Emulator rom={colours} />)
    expect(fireEvent.keyDown(window, { code: 'Space' })).toBe(false)
    fireEvent.keyUp(window, { code: 'Space' })
    expect(fireEvent.keyDown(window, { code: 'F5' })).toBe(true)
  })

  it('reports files that are not Atari programs through onError', () => {
    const onError = vi.fn()
    const onReady = vi.fn()
    render(<Atari8Emulator rom={new Uint8Array(32)} onError={onError} onReady={onReady} />)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Not an Atari 8-bit program') }))
    expect(onReady).not.toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })

  it('releases the frame loop and audio on unmount', () => {
    const { unmount } = render(<Atari8Emulator rom={colours} />)
    expect(audioContexts).toHaveLength(1)
    unmount()
    expect(frames.size).toBe(0)
    expect(audioContexts[0].closed).toBe(true)
  })

  it('survives StrictMode mount, unmount, mount without leaking', () => {
    const { unmount } = render(
      <StrictMode>
        <Atari8Emulator rom={colours} />
      </StrictMode>,
    )
    expect(frames.size).toBe(1)
    expect(audioContexts.filter((c) => !c.closed)).toHaveLength(1)
    unmount()
    expect(frames.size).toBe(0)
    expect(audioContexts.every((c) => c.closed)).toBe(true)
  })

  it('swaps programs when the ROM changes', () => {
    const { rerender } = render(<Atari8Emulator rom={colours} />)
    rerender(<Atari8Emulator rom={colours.slice()} />)
    expect(frames.size).toBe(1)
    expect(audioContexts.filter((c) => !c.closed)).toHaveLength(1)
  })

  it('resumes suspended audio on the first key press', () => {
    render(<Atari8Emulator rom={colours} />)
    expect(audioContexts[0].state).toBe('suspended')
    fireEvent.keyDown(window, { code: 'KeyZ' })
    expect(audioContexts[0].state).toBe('running')
    fireEvent.keyUp(window, { code: 'KeyZ' })
  })

  it('stops reading the keyboard after unmount', () => {
    const { unmount } = render(<Atari8Emulator rom={colours} />)
    unmount()
    expect(fireEvent.keyDown(window, { code: 'KeyZ' })).toBe(true)
    expect(fireEvent.keyDown(window, { code: 'Space' })).toBe(true)
  })
})

/** An 8K cartridge whose start routine sets the border/background colour shadow, then idles. */
function cartridge(colour: number): Uint8Array {
  const rom = new Uint8Array(8192)
  rom.set([0xa9, colour, 0x8d, 0xc8, 0x02, 0x4c, 0x05, 0xa0]) // lda #c; sta COLOR4; jmp *
  rom.set([0x00, 0xa0, 0x00, 0x04, 0x00, 0xa0], 0x1ffa) // run $A000, cartridge present, boot it
  return rom
}

/** A 90K single density ATR whose boot sector sets the border/background colour shadow and never returns. */
function disk(colour: number): Uint8Array {
  const image = new Uint8Array(16 + 720 * 128)
  const paragraphs = (720 * 128) / 16
  image.set([0x96, 0x02, paragraphs & 0xff, (paragraphs >> 8) & 0xff, 128, 0, (paragraphs >> 16) & 0xff])
  // flags, sector count, load $0700, init $070E, then at $0706: lda #c; sta COLOR4; jmp *; (init:) rts
  image.set([0x00, 0x01, 0x00, 0x07, 0x0e, 0x07, 0xa9, colour, 0x8d, 0xc8, 0x02, 0x4c, 0x0b, 0x07, 0x60], 16)
  return image
}

/** How many pixels of the last painted frame are exactly this `r,g,b`. */
function pixelsOf(colour: string): number {
  let count = 0
  const d = painted!
  for (let i = 0; i < d.length; i += 4) if (`${d[i]},${d[i + 1]},${d[i + 2]}` === colour) count++
  return count
}

/** The `r,g,b` the GTIA palette gives an Atari colour byte. */
function rgb(colour: number): string {
  const word = paletteFor('ntsc')[colour]
  return `${word & 0xff},${(word >>> 8) & 0xff},${(word >>> 16) & 0xff}`
}

describe.each([
  ['cartridge', cartridge],
  ['ATR disk image', disk],
])('Atari8Emulator with a %s', (_name, make) => {
  it('boots it on the real core and runs its code', () => {
    const onError = vi.fn()
    render(<Atari8Emulator rom={make(0x34)} onError={onError} />)
    // Booting from disk takes several emulated seconds, so wait for the border colour rather than a fixed time.
    let waited = 0
    while (painted === null || pixelsOf(rgb(0x34)) < 1000) {
      expect(waited).toBeLessThan(1200)
      advance(30)
      waited += 30
    }
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('atari8Emulator definition', () => {
  it('describes the Atari 8-bit computers and lazy-loads the component', async () => {
    expect(atari8Emulator).toMatchObject({
      id: 'atari8',
      platforms: ['atari8'],
      extensions: ['.xex', '.atr', '.car', '.com'],
    })
    const loaded = await atari8Emulator.load()
    expect(loaded.default).toBe(Atari8Emulator)
  })
})
