import { createRegistry } from '@holmes89/ka-core'
import { gameBoyEmulator } from '@holmes89/ka-gb'
import { nesEmulator } from '@holmes89/ka-nes'

/** Adding a system is one package plus one entry here. */
export const registry = createRegistry([nesEmulator, gameBoyEmulator])
