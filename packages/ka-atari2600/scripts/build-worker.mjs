// Bundles the Stellerator emulation worker (the 6502.ts npm package ships plain modules, not a worker script)
// into a single string module that the component turns into a Blob URL at runtime.
import { build } from 'esbuild'

await build({
  entryPoints: ['src/worker/entry.ts'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  // thumbulator.ts (ARM cartridge support) is emscripten output with Node-only fs/path branches that never run in a worker.
  external: ['fs', 'path'],
  outfile: 'src/generated/stella-worker.js',
  logLevel: 'warning',
})
