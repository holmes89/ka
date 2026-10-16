import { useEffect, useRef } from 'react'
import NesJs from 'nes-js'
import { emulatorCanvasStyle, useKeyboard } from '@holmes89/ka-core'
import type { EmulatorProps, PadButton } from '@holmes89/ka-core'

const BUTTONS = NesJs.Joypad.BUTTONS

const PAD_TO_NES: Record<PadButton, number> = {
  up: BUTTONS.UP,
  down: BUTTONS.DOWN,
  left: BUTTONS.LEFT,
  right: BUTTONS.RIGHT,
  a: BUTTONS.A,
  b: BUTTONS.B,
  start: BUTTONS.START,
  select: BUTTONS.SELECT,
}

type Session = { nes: InstanceType<typeof NesJs.Nes>; audio: InstanceType<typeof NesJs.Audio> }

/** Plays an iNES ROM on a canvas. Keyboard only; owns its audio and listeners and releases them on unmount. */
export default function NesEmulator({ rom, onReady, onError, className }: EmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const session = useRef<Session | null>(null)
  const callbacks = useRef({ onReady, onError })
  useEffect(() => {
    callbacks.current = { onReady, onError }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let nes: Session['nes'] | undefined
    try {
      // The core keeps its own view of the buffer, so hand it a private copy.
      const copy = rom.slice().buffer
      nes = new NesJs.Nes()
      const audio = new NesJs.Audio()
      nes.setRom(new NesJs.Rom(copy))
      nes.setDisplay(new NesJs.Display(canvas))
      nes.setAudio(audio)
      nes.bootup()
      nes.run()
      session.current = { nes, audio }
      callbacks.current.onReady?.()
    } catch (e) {
      nes?.destroy()
      session.current = null
      callbacks.current.onError?.(e instanceof Error ? e : new Error(String(e)))
    }

    return () => {
      nes?.destroy()
      session.current = null
    }
  }, [rom])

  useKeyboard({
    onDown: (button) => {
      const current = session.current
      if (!current) return
      // Browsers start audio suspended until a gesture; the first key press counts as one.
      if (current.audio.context && current.audio.context.state === 'suspended') void current.audio.context.resume()
      current.nes.pad1.pressButton(PAD_TO_NES[button])
    },
    onUp: (button) => session.current?.nes.pad1.releaseButton(PAD_TO_NES[button]),
  })

  return <canvas ref={canvasRef} className={className} style={emulatorCanvasStyle} aria-label="NES game screen" role="img" />
}
