import { useEffect, useRef } from 'react'
import { emulatorCanvasStyle, useKeyboard } from '@holmes89/ka-core'
import type { EmulatorProps } from '@holmes89/ka-core'
import { Atari8Machine } from './machine'

/** Plays an Atari 8-bit program (.xex, .atr or cartridge) on a canvas. Keyboard only; releases its loop and audio on unmount. */
export default function Atari8Emulator({ rom, onReady, onError, className }: EmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const machine = useRef<Atari8Machine | null>(null)
  const callbacks = useRef({ onReady, onError })
  useEffect(() => {
    callbacks.current = { onReady, onError }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let running: Atari8Machine | undefined
    try {
      // The core keeps its own view of the bytes, so hand it a private copy.
      running = new Atari8Machine(canvas, rom.slice())
      running.start()
      machine.current = running
      callbacks.current.onReady?.()
    } catch (e) {
      running?.destroy()
      machine.current = null
      callbacks.current.onError?.(e instanceof Error ? e : new Error(String(e)))
    }

    return () => {
      running?.destroy()
      machine.current = null
    }
  }, [rom])

  useKeyboard({
    onDown: (button) => {
      machine.current?.resumeAudio()
      machine.current?.press(button)
    },
    onUp: (button) => machine.current?.release(button),
  })

  // OPTION has no place on the shared pad: Space is the Atari's third console key.
  useEffect(() => {
    const handle = (pressed: boolean) => (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.ctrlKey || event.metaKey || event.altKey) return
      event.preventDefault()
      if (pressed) machine.current?.resumeAudio()
      machine.current?.setOption(pressed)
    }
    const down = handle(true)
    const up = handle(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} style={emulatorCanvasStyle} aria-label="Atari 8-bit game screen" role="img" />
}
