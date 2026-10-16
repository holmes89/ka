// Typings for the parts of the wasmboy fork that Ka uses. See VENDORED.md.
export interface WasmBoyOptions {
  headless?: boolean
  isAudioEnabled?: boolean
  disableSaves?: boolean
  disablePauseOnHidden?: boolean
  isGbcEnabled?: boolean
  isGbcColorizationEnabled?: boolean
  enableBootROMIfAvailable?: boolean
  gameboyFrameRate?: number
  frameSkip?: number
}

/** Joypad state; any missing key counts as released. */
export interface JoypadState {
  UP?: boolean
  RIGHT?: boolean
  DOWN?: boolean
  LEFT?: boolean
  A?: boolean
  B?: boolean
  SELECT?: boolean
  START?: boolean
}

export const WasmBoy: {
  config(options?: WasmBoyOptions, canvas?: HTMLCanvasElement): Promise<void>
  loadROM(rom: Uint8Array): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  destroy(): Promise<void>
  disableDefaultJoypad(): void
  setJoypadState(state: JoypadState): void
  isReady(): boolean
}
