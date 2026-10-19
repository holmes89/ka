import type StelleratorType from '6502.ts/lib/web/embedded/stellerator/Stellerator'
import * as module from '6502.ts/lib/web/embedded/stellerator/Stellerator'

type Ctor = typeof StelleratorType

/**
 * 6502.ts is CommonJS (`exports.default = Stellerator`). Depending on the bundler, the default import is either the
 * class or the CommonJS exports object that wraps it, so unwrap whichever arrives.
 */
const ns = module as unknown as { default: Ctor | { default: Ctor } }
export const Stellerator: Ctor = 'default' in ns.default ? ns.default.default : ns.default
export type Stellerator = StelleratorType
