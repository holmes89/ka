import { Suspense, lazy, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { CONTROLS_HINT } from '@holmes89/ka-core'
import type { EmulatorComponent, EmulatorDefinition } from '@holmes89/ka-core'
import { CREDITS, KA_REPO } from './credits'
import { registry } from './registry'

interface Loaded {
  name: string
  rom: Uint8Array
  definition: EmulatorDefinition
}

const supported = registry.definitions.flatMap((d) => d.extensions).join(', ')

export function App() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const open = async (file: File) => {
    setMessage(null)
    const definition = registry.forFileName(file.name)
    if (!definition) {
      setLoaded(null)
      setMessage(`"${file.name}" is not a supported ROM. Supported: ${supported}`)
      return
    }
    // The file is read in the browser and never leaves it.
    setLoaded({ name: file.name, rom: new Uint8Array(await file.arrayBuffer()), definition })
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void open(file)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void open(file)
  }

  return (
    <>
      <header className="hero">
        <h1>Ka</h1>
        <p>
          React components that play retro game ROMs in the browser. Keyboard only, no saves, and nothing is uploaded:
          the ROM you choose stays on your machine.
        </p>
        <p className="links">
          <a href={KA_REPO}>Source on GitHub</a>
        </p>
      </header>

      <main>
        <section aria-labelledby="systems">
          <h2 id="systems">Systems</h2>
          <ul className="cards">
            {registry.definitions.map((d) => (
              <li key={d.id} className="card">
                <h3>{d.label}</h3>
                <dl>
                  <dt>Platform ids</dt>
                  <dd>{d.platforms.map((p) => <code key={p}>{p}</code>)}</dd>
                  <dt>ROM files</dt>
                  <dd>{d.extensions.map((x) => <code key={x}>{x}</code>)}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="play">
          <h2 id="play">Play a ROM</h2>
          <div
            className={`drop${dragging ? ' drop--over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <label className="button">
              Choose a ROM file
              <input type="file" accept={registry.definitions.flatMap((d) => d.extensions).join(',')} onChange={onPick} />
            </label>
            <span>or drop one here ({supported})</span>
          </div>
          <p className="note">Use ROMs you own or homebrew. None are bundled here.</p>

          {message && <p role="alert" className="error">{message}</p>}

          {loaded && (
            <div className="player">
              <div className="player__bar">
                <strong>{loaded.name}</strong>
                <span className="muted">{loaded.definition.label}</span>
                <button type="button" onClick={() => setLoaded(null)}>Stop</button>
              </div>
              <Player key={`${loaded.name}-${loaded.rom.length}`} loaded={loaded} onError={(e) => setMessage(e.message)} />
            </div>
          )}

          <h3>Controls</h3>
          <ul className="keys">
            {CONTROLS_HINT.map((h) => (
              <li key={h.button}>
                <kbd>{h.keys}</kbd> <span>{h.button === 'a' || h.button === 'b' ? h.button.toUpperCase() : h.button}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credits">
          <h2 id="credits">Built on</h2>
          <p>
            Ka wraps these emulators. The forks add teardown, scoped key handling and a no-saves option so they fit inside
            React components; the original projects did the hard work.
          </p>
          <ul className="credits">
            {CREDITS.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> <span className="muted">({c.licence})</span>
                <br />
                <a href={c.upstream}>{c.fork ? 'Original' : 'Upstream'}</a>
                {c.fork && (
                  <>
                    {' · '}
                    <a href={c.fork}>holmes89 fork</a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}

function Player({ loaded, onError }: { loaded: Loaded; onError: (e: Error) => void }) {
  const Emulator = useMemo<EmulatorComponent>(() => lazy(loaded.definition.load), [loaded.definition])
  return (
    <Suspense fallback={<p className="muted">Loading emulator…</p>}>
      <div className="screen">
        <Emulator rom={loaded.rom} onError={onError} />
      </div>
    </Suspense>
  )
}
