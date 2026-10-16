import { fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { useKeyboard, type KeyboardHandlers } from './useKeyboard'

function Harness({ handlers, enabled }: { handlers: KeyboardHandlers; enabled?: boolean }) {
  useKeyboard(handlers, enabled)
  return null
}

describe('useKeyboard', () => {
  it('reports presses and releases of mapped keys and prevents default', () => {
    const onDown = vi.fn()
    const onUp = vi.fn()
    render(<Harness handlers={{ onDown, onUp }} />)

    const notPrevented = fireEvent.keyDown(window, { code: 'KeyZ' })
    expect(notPrevented).toBe(false)
    expect(onDown).toHaveBeenCalledWith('b', expect.any(KeyboardEvent))

    fireEvent.keyUp(window, { code: 'KeyZ' })
    expect(onUp).toHaveBeenCalledWith('b', expect.any(KeyboardEvent))
  })

  it('leaves unmapped keys and browser shortcuts alone', () => {
    const onDown = vi.fn()
    render(<Harness handlers={{ onDown }} />)

    expect(fireEvent.keyDown(window, { code: 'F5' })).toBe(true)
    expect(fireEvent.keyDown(window, { code: 'KeyZ', ctrlKey: true })).toBe(true)
    expect(onDown).not.toHaveBeenCalled()
  })

  it('ignores auto repeat', () => {
    const onDown = vi.fn()
    render(<Harness handlers={{ onDown }} />)
    fireEvent.keyDown(window, { code: 'Enter' })
    fireEvent.keyDown(window, { code: 'Enter', repeat: true })
    expect(onDown).toHaveBeenCalledTimes(1)
  })

  it('removes its listeners on unmount, also under StrictMode', () => {
    const onDown = vi.fn()
    const { unmount } = render(
      <StrictMode>
        <Harness handlers={{ onDown }} />
      </StrictMode>,
    )
    fireEvent.keyDown(window, { code: 'ArrowUp' })
    expect(onDown).toHaveBeenCalledTimes(1)

    unmount()
    fireEvent.keyDown(window, { code: 'ArrowUp' })
    expect(onDown).toHaveBeenCalledTimes(1)
  })

  it('does nothing while disabled', () => {
    const onDown = vi.fn()
    render(<Harness handlers={{ onDown }} enabled={false} />)
    fireEvent.keyDown(window, { code: 'ArrowUp' })
    expect(onDown).not.toHaveBeenCalled()
  })
})
