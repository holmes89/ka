import { useEffect, useRef } from 'react'
import { emulatorCanvasStyle, useKeyboard } from '@holmes89/ka-core'
import type { EmulatorProps, PadButton } from '@holmes89/ka-core'
import workerSource from './generated/stella-worker.js?raw'
import { Stellerator } from './stellerator'

// Stellerator reads `keyCode` from its keyboard target, so Ka's pad keys are bridged to the codes it expects
// (arrows move, Space fires, Shift+Space is Select, Shift+Enter is Reset) on a private element.
type Bridge = { keyCode: number; shiftKey: boolean }
const BRIDGE: Record<PadButton, Bridge> = {
  up: { keyCode: 38, shiftKey: false },
  down: { keyCode: 40, shiftKey: false },
  left: { keyCode: 37, shiftKey: false },
  right: { keyCode: 39, shiftKey: false },
  a: { keyCode: 32, shiftKey: false },
  b: { keyCode: 32, shiftKey: false },
  start: { keyCode: 13, shiftKey: true },
  select: { keyCode: 32, shiftKey: true },
}

type Session = { keys: HTMLElement; held: Map<PadButton, number> }

/** Releases everything Stellerator 1.1.4 holds; it has no public teardown, so the private handles are reached on purpose. */
async function destroy(stella: Stellerator, workerUrl: string): Promise<void> {
  const internals = stella as unknown as {
    _emulationService?: { _worker?: Worker | null }
    _audioDriver?: { close?: () => void } | null
  }
  try {
    await stella.stop()
  } catch {
    // The core may already have failed; teardown continues regardless.
  }
  stella.releaseCanvas()
  try {
    internals._audioDriver?.close?.()
  } catch {
    // The audio context may already be closed.
  }
  internals._emulationService?._worker?.terminate()
  URL.revokeObjectURL(workerUrl)
}

/** Plays an Atari 2600 cartridge on a canvas. Keyboard only; emulation runs in a worker that is stopped on unmount. */
export default function Atari2600Emulator({ rom, onReady, onError, className }: EmulatorProps) {
  const host = useRef<HTMLDivElement>(null)
  const session = useRef<Session | null>(null)
  const callbacks = useRef({ onReady, onError })
  useEffect(() => {
    callbacks.current = { onReady, onError }
  })

  useEffect(() => {
    const container = host.current
    if (!container) return

    // Each run owns its canvas: Stellerator attaches a WebGL context to it, and a context cannot be shared across runs.
    const canvas = document.createElement('canvas')
    Object.assign(canvas.style, emulatorCanvasStyle)
    container.appendChild(canvas)
    const keys = document.createElement('div')
    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))

    let cancelled = false
    let stella: Stellerator | undefined
    try {
      stella = new Stellerator(canvas, workerUrl, {
        keyboardTarget: keys,
        enableKeyboard: true,
        enableTouch: false,
        enableGamepad: false,
        paddleViaMouse: false,
        pauseViaKeyboard: false,
        pauseViaTouch: false,
        fullscreenViaKeyboard: false,
        fullscreenViaTouch: false,
        resetViaKeyboard: false,
        audio: true,
      })
      session.current = { keys, held: new Map() }
      stella.run(rom.slice(), Stellerator.TvMode.ntsc).then(
        () => {
          if (!cancelled) callbacks.current.onReady?.()
        },
        (e: unknown) => {
          if (!cancelled) callbacks.current.onError?.(e instanceof Error ? e : new Error(String(e)))
        },
      )
    } catch (e) {
      session.current = null
      callbacks.current.onError?.(e instanceof Error ? e : new Error(String(e)))
    }

    return () => {
      cancelled = true
      session.current = null
      if (stella) void destroy(stella, workerUrl)
      else URL.revokeObjectURL(workerUrl)
      canvas.remove()
    }
  }, [rom])

  const send = (type: 'keydown' | 'keyup', button: PadButton) => {
    const current = session.current
    if (!current) return
    const { keyCode, shiftKey } = BRIDGE[button]
    current.keys.dispatchEvent(new KeyboardEvent(type, { keyCode, shiftKey, bubbles: false, cancelable: true }))
  }

  useKeyboard({
    onDown: (button) => send('keydown', button),
    onUp: (button) => send('keyup', button),
  })

  return <div ref={host} className={className} role="img" aria-label="Atari 2600 game screen" />
}
