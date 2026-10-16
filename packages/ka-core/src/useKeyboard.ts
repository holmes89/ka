import { useEffect, useRef } from 'react'
import { padButtonForCode, type PadButton } from './keys'

export interface KeyboardHandlers {
  onDown?: (button: PadButton, event: KeyboardEvent) => void
  onUp?: (button: PadButton, event: KeyboardEvent) => void
}

/**
 * Listens for the shared Ka pad keys on `window` while mounted.
 * Only mapped keys are `preventDefault`-ed, so browser shortcuts keep working,
 * and held-key auto repeat is ignored. Listeners are removed on unmount.
 */
export function useKeyboard(handlers: KeyboardHandlers, enabled = true): void {
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    if (!enabled) return

    const handle = (kind: 'onDown' | 'onUp') => (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const button = padButtonForCode(event.code)
      if (!button) return
      event.preventDefault()
      if (kind === 'onDown' && event.repeat) return
      latest.current[kind]?.(button, event)
    }
    const down = handle('onDown')
    const up = handle('onUp')

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [enabled])
}
