import { createFrameLimiter, NES_FRAME_MS } from './frameLimiter'

/** Emulated frames over `seconds` of display ticks at `hz`. */
function framesAt(hz: number, seconds: number): number {
  const due = createFrameLimiter()
  const tick = 1000 / hz
  let frames = 0
  for (let t = 0; t < seconds * 1000; t += tick) if (due(t)) frames++
  return frames
}

describe('createFrameLimiter', () => {
  it('runs a frame on every tick of a 60 Hz display', () => {
    expect(framesAt(60, 10)).toBeGreaterThanOrEqual(599)
    expect(framesAt(60, 10)).toBeLessThanOrEqual(601)
  })

  it('runs about 60 frames per second on 120, 144 and 240 Hz displays', () => {
    for (const hz of [120, 144, 240]) {
      const fps = framesAt(hz, 10) / 10
      expect(fps).toBeGreaterThan(59)
      expect(fps).toBeLessThan(61)
    }
  })

  it('alternates frames on a 120 Hz display', () => {
    const due = createFrameLimiter()
    const results = [0, 8.33, 16.67, 25, 33.33, 41.67].map(due)
    expect(results).toEqual([true, false, true, false, true, false])
  })

  it('emulates the first tick immediately', () => {
    expect(createFrameLimiter()(123456)).toBe(true)
  })

  it('does not fast-forward after a long stall', () => {
    const due = createFrameLimiter()
    due(0)
    const burst = [5000, 5001, 5002, 5003, 5004].filter((t) => due(t))
    expect(burst.length).toBeLessThanOrEqual(2)
  })

  it('takes a custom frame length', () => {
    const due = createFrameLimiter(NES_FRAME_MS * 2)
    expect([0, 17, 34, 51].map(due)).toEqual([true, false, true, false])
  })
})
