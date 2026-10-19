import {
  Atari,
  AtrImage,
  CYCLES_PER_LINE,
  FRAME_BUFFER_HEIGHT,
  FRAME_BUFFER_WIDTH,
  Joystick,
  NTSC_CYCLES_PER_SECOND,
  NTSC_PIXEL_ASPECT_RATIO,
  buildBootDisk,
  createCartridge,
  detectFileFormat,
  paletteFor,
} from '@sfotty-pie/a8'
import type { PadButton } from '@holmes89/ka-core'
import { altirraOsXlXe } from './firmware'

/** Direction bits of `Joystick.direction`. */
const DIRECTION: Partial<Record<PadButton, number>> = { up: 1, down: 2, left: 4, right: 8 }

const SAMPLE_RING = 16384
// Audio is produced on the wall clock and consumed by the audio clock; keep the queue short so latency stays low.
const MAX_QUEUED_SAMPLES = 8192
// After a stall (hidden tab, debugger) lose the time instead of replaying it.
const MAX_CATCH_UP_MS = 50
const SCANLINES_PER_MS = NTSC_CYCLES_PER_SECOND / CYCLES_PER_LINE / 1000

/** The CSS aspect ratio the frame should be shown at: Atari pixels are not square. */
export const SCREEN_ASPECT = (FRAME_BUFFER_WIDTH * NTSC_PIXEL_ASPECT_RATIO) / FRAME_BUFFER_HEIGHT

/** Builds the machine's media from the file bytes, whichever Atari format they are in. */
function attach(machine: Atari, rom: Uint8Array): void {
  const format = detectFileFormat(rom)
  switch (format) {
    case 'atr':
      machine.insertDisk(new AtrImage(rom))
      return
    case 'xex':
      machine.insertDisk(buildBootDisk(rom))
      return
    case 'raw-cart-8k-8000-9fff':
    case 'raw-cart-8k-a000-bfff':
    case 'raw-cart-16k':
    case 'cart':
      machine.cartridge = createCartridge(rom)
      return
    case null:
      throw new Error('Not an Atari 8-bit program: expected an .xex, .atr or cartridge image')
    default:
      throw new Error(`"${format}" is firmware, not a game`)
  }
}

/** Plays one Atari 8-bit program on a canvas. Owns the animation loop and the audio output until `destroy()`. */
export class Atari8Machine {
  readonly #machine: Atari
  readonly #joystick: Joystick
  readonly #ctx: CanvasRenderingContext2D
  readonly #image: ImageData
  readonly #pixels: Uint32Array
  readonly #palette = paletteFor('ntsc')
  readonly #held = new Set<PadButton>()
  #raf = 0
  #last = 0
  #debt = 0
  #running = false

  #audio: { context: AudioContext; node: ScriptProcessorNode } | null = null
  readonly #ring = new Float32Array(SAMPLE_RING)
  #read = 0
  #write = 0
  #queued = 0
  #cyclesPerSample = 0
  #phase = 0
  #sum = 0
  #count = 0
  #dcIn = 0
  #dcOut = 0

  constructor(canvas: HTMLCanvasElement, rom: Uint8Array) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not available')
    this.#ctx = ctx
    canvas.width = FRAME_BUFFER_WIDTH
    canvas.height = FRAME_BUFFER_HEIGHT
    canvas.style.aspectRatio = String(SCREEN_ASPECT)
    this.#image = ctx.createImageData(FRAME_BUFFER_WIDTH, FRAME_BUFFER_HEIGHT)
    this.#pixels = new Uint32Array(this.#image.data.buffer)

    // An XL/XE with no built-in BASIC, so programs boot straight away without holding OPTION.
    this.#machine = new Atari({ xl: true, os: altirraOsXlXe(), tvSystem: 'ntsc' })
    attach(this.#machine, rom)
    this.#joystick = new Joystick(this.#machine.joysticks[0])
    this.#startAudio()
  }

  start(): void {
    if (this.#running) return
    this.#running = true
    this.#last = 0
    this.#raf = requestAnimationFrame(this.#tick)
  }

  /** Browsers start audio suspended until a gesture; the first key press counts as one. */
  resumeAudio(): void {
    const context = this.#audio?.context
    if (context && context.state === 'suspended') void context.resume()
  }

  press(button: PadButton): void {
    this.#set(button, true)
  }

  release(button: PadButton): void {
    this.#set(button, false)
  }

  /** The console OPTION key, which has no place on the shared pad. */
  setOption(pressed: boolean): void {
    this.#machine.console.option = pressed
  }

  destroy(): void {
    this.#running = false
    cancelAnimationFrame(this.#raf)
    const audio = this.#audio
    this.#audio = null
    if (audio) {
      audio.node.onaudioprocess = null
      audio.node.disconnect()
      void audio.context.close()
    }
  }

  #set(button: PadButton, pressed: boolean): void {
    if (pressed) this.#held.add(button)
    else this.#held.delete(button)
    const bit = DIRECTION[button]
    if (bit !== undefined) {
      if (pressed) this.#joystick.press(bit)
      else this.#joystick.release(bit)
    } else if (button === 'a' || button === 'b') {
      this.#joystick.trigger = this.#held.has('a') || this.#held.has('b')
    } else if (button === 'start') {
      this.#machine.console.start = pressed
    } else if (button === 'select') {
      this.#machine.console.select = pressed
    }
  }

  readonly #tick = (now: number): void => {
    if (!this.#running) return
    this.#raf = requestAnimationFrame(this.#tick)
    // The first tick only anchors the clock, whatever timebase the host's frame timestamps use.
    if (this.#last === 0) this.#last = now
    this.#debt += Math.min(now - this.#last, MAX_CATCH_UP_MS) * SCANLINES_PER_MS
    this.#last = now
    const lines = Math.floor(this.#debt)
    this.#debt -= lines
    for (let i = 0; i < lines; i++) this.#scanline()
  }

  #scanline(): void {
    const machine = this.#machine
    for (let cycle = 0; cycle < CYCLES_PER_LINE; cycle++) {
      machine.cycle()
      this.#sample(machine.audio)
    }
    // vcount wraps to 0 while the last line of the frame is run: the finished frame is complete.
    if (machine.anticGtia.vcount === 0) this.#paint()
  }

  #paint(): void {
    const frame = this.#machine.frame
    const palette = this.#palette
    const pixels = this.#pixels
    for (let i = 0; i < frame.length; i++) pixels[i] = palette[frame[i]]
    this.#ctx.putImageData(this.#image, 0, 0)
  }

  #startAudio(): void {
    const Ctor = globalThis.AudioContext
    if (!Ctor) return
    try {
      const context = new Ctor()
      const node = context.createScriptProcessor(2048, 0, 1)
      node.onaudioprocess = (event) => {
        const out = event.outputBuffer.getChannelData(0)
        for (let i = 0; i < out.length; i++) {
          if (this.#queued > 0) {
            out[i] = this.#ring[this.#read]
            this.#read = (this.#read + 1) % SAMPLE_RING
            this.#queued--
          } else {
            out[i] = 0
          }
        }
      }
      node.connect(context.destination)
      this.#audio = { context, node }
      this.#cyclesPerSample = NTSC_CYCLES_PER_SECOND / context.sampleRate
    } catch {
      this.#audio = null
    }
  }

  /** Averages the per-cycle POKEY level down to the audio rate, removes the DC offset and queues the sample. */
  #sample(level: number): void {
    if (!this.#audio) return
    this.#sum += level
    this.#count++
    this.#phase++
    if (this.#phase < this.#cyclesPerSample) return
    this.#phase -= this.#cyclesPerSample
    const mean = this.#sum / this.#count
    this.#sum = 0
    this.#count = 0
    // One-pole DC blocker: POKEY output is unipolar (0..2).
    this.#dcOut = mean - this.#dcIn + 0.995 * this.#dcOut
    this.#dcIn = mean
    if (this.#queued >= MAX_QUEUED_SAMPLES) {
      this.#read = (this.#read + 1) % SAMPLE_RING
      this.#queued--
    }
    this.#ring[this.#write] = this.#dcOut * 0.5
    this.#write = (this.#write + 1) % SAMPLE_RING
    this.#queued++
  }
}
