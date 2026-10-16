/** Buttons of the classic pad shared by every Ka system. */
export type PadButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select'

/**
 * Keyboard layout shared by every emulator (and shown in the UI).
 * Values are `KeyboardEvent.code` values; Shift matches either side.
 */
export const KEY_MAP: Readonly<Record<PadButton, readonly string[]>> = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  a: ['KeyX'],
  b: ['KeyZ'],
  start: ['Enter'],
  select: ['ShiftLeft', 'ShiftRight'],
}

/** Human readable controls hint, in display order. */
export const CONTROLS_HINT: ReadonlyArray<{ button: PadButton; keys: string }> = [
  { button: 'up', keys: '↑' },
  { button: 'down', keys: '↓' },
  { button: 'left', keys: '←' },
  { button: 'right', keys: '→' },
  { button: 'a', keys: 'X' },
  { button: 'b', keys: 'Z' },
  { button: 'start', keys: 'Enter' },
  { button: 'select', keys: 'Shift' },
]

/** Returns the pad button bound to a `KeyboardEvent.code`, if any. */
export function padButtonForCode(code: string): PadButton | undefined {
  for (const button of Object.keys(KEY_MAP) as PadButton[]) {
    if (KEY_MAP[button].includes(code)) return button
  }
  return undefined
}
