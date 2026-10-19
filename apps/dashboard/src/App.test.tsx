import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

// The real emulators need canvas, audio and workers: swap in stand-in components.
vi.mock('@holmes89/ka-nes', () => ({
  nesEmulator: {
    id: 'nes',
    label: 'NES',
    platforms: ['nes'],
    extensions: ['.nes'],
    load: () => Promise.resolve({ default: ({ rom }: { rom: Uint8Array }) => <div data-testid="nes">nes:{rom.length}</div> }),
  },
}))
vi.mock('@holmes89/ka-gb', () => ({
  gameBoyEmulator: {
    id: 'gameboy',
    label: 'Game Boy / Game Boy Color',
    platforms: ['gb', 'gbc'],
    extensions: ['.gb', '.gbc'],
    load: () =>
      Promise.resolve({
        default: ({ rom, onError }: { rom: Uint8Array; onError?: (e: Error) => void }) => (
          <button data-testid="gb" onClick={() => onError?.(new Error('core failed'))}>gb:{rom.length}</button>
        ),
      }),
  },
}))

vi.mock('@holmes89/ka-atari2600', () => ({
  atari2600Emulator: {
    id: 'atari2600',
    label: 'Atari 2600',
    platforms: ['atari2600'],
    extensions: ['.a26', '.bin'],
    load: () => Promise.resolve({ default: ({ rom }: { rom: Uint8Array }) => <div data-testid="a26">a26:{rom.length}</div> }),
  },
}))

const file = (name: string, bytes = 8) => new File([new Uint8Array(bytes)], name)
const choose = (f: File) => fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [f] } })

describe('Ka dashboard', () => {
  it('lists the registered systems with platform ids and extensions', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'NES' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Game Boy / Game Boy Color' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Atari 2600' })).toBeInTheDocument()
    for (const text of ['nes', '.nes', 'gb', 'gbc', '.gb', '.gbc']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0)
    }
  })

  it('shows the shared controls', () => {
    render(<App />)
    expect(screen.getByText('Enter')).toBeInTheDocument()
    expect(screen.getByText('Shift')).toBeInTheDocument()
  })

  it('credits the originals and the forks', () => {
    render(<App />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        'https://github.com/takahirox/nes-js',
        'https://github.com/holmes89/nes-js',
        'https://github.com/torch2424/wasmBoy',
        'https://github.com/holmes89/wasmboy',
        'https://github.com/6502ts/6502.ts',
      ]),
    )
  })

  it('plays a chosen NES ROM with the NES emulator, reading it locally', async () => {
    render(<App />)
    choose(file('pong.nes', 5))
    expect(await screen.findByTestId('nes')).toHaveTextContent('nes:5')
    expect(screen.getByText('pong.nes')).toBeInTheDocument()
  })

  it('plays Atari 2600 cartridges and credits upstream without claiming a fork', async () => {
    render(<App />)
    choose(file('combat.a26', 4))
    expect(await screen.findByTestId('a26')).toHaveTextContent('a26:4')
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links.filter((h) => h === 'https://github.com/6502ts/6502.ts')).toHaveLength(1)
  })

  it('routes .gbc files to the Game Boy emulator', async () => {
    render(<App />)
    choose(file('pokemon.GBC', 3))
    expect(await screen.findByTestId('gb')).toHaveTextContent('gb:3')
  })

  it('rejects unsupported files with the supported list', async () => {
    render(<App />)
    choose(file('notes.txt'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a supported ROM.*\.nes.*\.gb.*\.gbc/)
    expect(screen.queryByTestId('nes')).not.toBeInTheDocument()
  })

  it('surfaces emulator errors and lets you stop', async () => {
    const user = userEvent.setup()
    render(<App />)
    choose(file('a.gb'))
    await user.click(await screen.findByTestId('gb'))
    expect(await screen.findByRole('alert')).toHaveTextContent('core failed')

    await user.click(screen.getByRole('button', { name: 'Stop' }))
    await waitFor(() => expect(screen.queryByTestId('gb')).not.toBeInTheDocument())
  })
})
