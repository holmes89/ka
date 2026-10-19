// Worker entry: runs the Stellerator emulation backend off the main thread.
// Adapted from 6502.ts worker/src/main/stellerator.ts (MIT).
import * as backendModule from '6502.ts/lib/web/stella/service/worker/EmulationBackend'
import { getRpc } from './rpc'

type Backend = new (rpc: ReturnType<typeof getRpc>) => { startup(): void }

// The package is CommonJS and this package is `type: module`, so the bundler hands over either the class or its
// CommonJS exports object; unwrap whichever it is.
const ns = backendModule as unknown as { default: Backend | { default: Backend } }
const EmulationBackend: Backend = 'default' in ns.default ? ns.default.default : ns.default

new EmulationBackend(getRpc()).startup()
