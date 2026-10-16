import type { CSSProperties } from 'react'

/** Crisp, aspect-preserving canvas styling shared by every emulator. */
export const emulatorCanvasStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  imageRendering: 'pixelated',
  backgroundColor: '#000',
}
