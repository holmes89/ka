/** The NES (NTSC) frame rate. */
export const NES_FRAME_MS = 1000 / 60.0988

/**
 * Decides which display refresh ticks should emulate a frame. Cores that step one frame per
 * `requestAnimationFrame` run at the display's refresh rate (2x on a 120 Hz screen); call the
 * returned function with each tick's timestamp and emulate only when it returns true.
 * Time owed is capped at two frames so a stalled or backgrounded tab does not fast-forward.
 */
export function createFrameLimiter(frameMs = NES_FRAME_MS): (now: number) => boolean {
  let last: number | undefined
  let owed = 0
  return (now) => {
    if (last === undefined) {
      last = now
      return true
    }
    owed = Math.min(owed + (now - last), frameMs * 2)
    last = now
    if (owed < frameMs) return false
    owed -= frameMs
    return true
  }
}
