import { useEffect, useRef } from 'react'
import { emulatorCanvasStyle, useKeyboard } from '@holmes89/ka-core'
import type { EmulatorProps, PadButton } from '@holmes89/ka-core'
import { WasmBoy } from '../vendor/wasmboy.wasm.esm.js'
import type { JoypadState } from '../vendor/wasmboy.wasm.esm.js'

const PAD_TO_JOYPAD: Record<PadButton, keyof JoypadState> = {
  up: 'UP',
  down: 'DOWN',
  left: 'LEFT',
  right: 'RIGHT',
  a: 'A',
  b: 'B',
  start: 'START',
  select: 'SELECT',
}

// wasmboy is a process-wide singleton, so starting and stopping is serialised: a StrictMode
// remount or a quick game switch must never interleave one game's start with another's destroy.
let queue: Promise<unknown> = Promise.resolve()
const enqueue = (task: () => Promise<void>) => {
  queue = queue.then(task, task)
  return queue
}

/**
 * Plays a Game Boy / Game Boy Color ROM on a canvas. Keyboard only, no saves.
 * wasmboy is a singleton: render one GameBoyEmulator at a time.
 */
export default function GameBoyEmulator({ rom, onReady, onError, className }: EmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const running = useRef(false)
  const pressed = useRef<JoypadState>({})
  const callbacks = useRef({ onReady, onError })
  useEffect(() => {
    callbacks.current = { onReady, onError }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    pressed.current = {}

    void enqueue(async () => {
      if (cancelled) return
      try {
        await WasmBoy.config(
          { headless: false, isAudioEnabled: true, disableSaves: true, enableBootROMIfAvailable: false },
          canvas,
        )
        // Hand the core a private, exactly-sized copy: callers often pass a view into a larger buffer
        // (e.g. bytes decoded from an RPC response) and wasmboy ships the underlying buffer to its workers.
        await WasmBoy.loadROM(rom.slice())
        // loadROM turns wasmboy's own key handling on; Ka drives the pad from the shared key map instead.
        WasmBoy.disableDefaultJoypad()
        if (cancelled) return
        await WasmBoy.play()
        running.current = true
        callbacks.current.onReady?.()
      } catch (e) {
        if (!cancelled) callbacks.current.onError?.(e instanceof Error ? e : new Error(String(e)))
      }
    })

    // wasmboy pauses when the tab is hidden; pick the game back up when it returns.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && running.current) void WasmBoy.play()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      running.current = false
      document.removeEventListener('visibilitychange', onVisible)
      void enqueue(() => WasmBoy.destroy())
    }
  }, [rom])

  const setButton = (button: PadButton, down: boolean) => {
    if (!running.current) return
    pressed.current = { ...pressed.current, [PAD_TO_JOYPAD[button]]: down }
    WasmBoy.setJoypadState(pressed.current)
  }

  useKeyboard({
    onDown: (button) => setButton(button, true),
    onUp: (button) => setButton(button, false),
  })

  return <canvas ref={canvasRef} className={className} style={emulatorCanvasStyle} aria-label="Game Boy game screen" role="img" />
}
