import type { ComponentType } from 'react'

/** Props every Ka emulator component accepts. */
export interface EmulatorProps {
  /** The cartridge image. The component never fetches or stores it. */
  rom: Uint8Array
  /** Called once the game is running. */
  onReady?: () => void
  /** Called when the ROM is invalid or the core fails. The component renders nothing playable afterwards. */
  onError?: (error: Error) => void
  className?: string
}

export type EmulatorComponent = ComponentType<EmulatorProps>

/** Describes one emulated system and how to load its component on demand. */
export interface EmulatorDefinition {
  /** Stable id, e.g. "nes", "gameboy". */
  id: string
  /** Human readable name, e.g. "Game Boy / Game Boy Color". */
  label: string
  /** Ibis `Game.platform` values this emulator plays, e.g. ["gb", "gbc"]. */
  platforms: string[]
  /** ROM file extensions including the dot, lower case, e.g. [".gb", ".gbc"]. */
  extensions: string[]
  /** Lazily imports the component so cores and wasm are fetched only when a game opens. */
  load: () => Promise<{ default: EmulatorComponent }>
}
