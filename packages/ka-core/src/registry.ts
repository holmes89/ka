import type { EmulatorDefinition } from './types'

export interface EmulatorRegistry {
  readonly definitions: readonly EmulatorDefinition[]
  /** Finds the emulator for an Ibis `Game.platform` value, or undefined for non-ROM platforms. */
  forPlatform(platform: string): EmulatorDefinition | undefined
  /** Finds the emulator for a ROM file name by extension (case-insensitive). */
  forFileName(fileName: string): EmulatorDefinition | undefined
  /** The platform id for a ROM file name (".gb" -> "gb"), used to classify uploads. */
  platformForFileName(fileName: string): string | undefined
}

/** Builds a lookup over emulator definitions. Throws on duplicate platforms or extensions. */
export function createRegistry(definitions: readonly EmulatorDefinition[]): EmulatorRegistry {
  const byPlatform = new Map<string, EmulatorDefinition>()
  const byExtension = new Map<string, EmulatorDefinition>()

  for (const definition of definitions) {
    for (const platform of definition.platforms) {
      if (byPlatform.has(platform)) throw new Error(`ka: platform "${platform}" is registered twice`)
      byPlatform.set(platform, definition)
    }
    for (const extension of definition.extensions) {
      if (byExtension.has(extension)) throw new Error(`ka: extension "${extension}" is registered twice`)
      byExtension.set(extension, definition)
    }
  }

  const extensionOf = (fileName: string) => {
    const dot = fileName.lastIndexOf('.')
    return dot < 0 ? '' : fileName.slice(dot).toLowerCase()
  }

  return {
    definitions,
    forPlatform: (platform) => byPlatform.get(platform),
    forFileName: (fileName) => byExtension.get(extensionOf(fileName)),
    platformForFileName: (fileName) => {
      const definition = byExtension.get(extensionOf(fileName))
      const extension = extensionOf(fileName).slice(1)
      return definition?.platforms.includes(extension) ? extension : definition?.platforms[0]
    },
  }
}
