// Minimal typings for the parts of the nes-js fork that Ka uses.
declare module 'nes-js' {
  interface Joypad {
    pressButton(button: number): void
    releaseButton(button: number): void
  }
  interface Audio {
    context: { state: string; resume(): Promise<void> } | null
  }
  interface Nes {
    pad1: Joypad
    /** The requestAnimationFrame callback that steps one frame and schedules the next. */
    runFunc: FrameRequestCallback
    rafId: number | null
    setRom(rom: unknown): void
    setDisplay(display: unknown): void
    setAudio(audio: unknown): void
    bootup(): void
    run(): void
    stop(): void
    destroy(): void
  }
  const NesJs: {
    Nes: new () => Nes
    Rom: new (buffer: ArrayBuffer) => unknown
    Display: new (canvas: HTMLCanvasElement) => unknown
    Audio: new () => Audio
    Joypad: { BUTTONS: Record<'A' | 'B' | 'SELECT' | 'START' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', number> }
  }
  export default NesJs
}
