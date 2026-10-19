/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ include: ['src'], exclude: ['src/**/*.test.*', 'src/test'] })],
  build: {
    lib: {
      entry: { index: 'src/index.ts', Atari8Emulator: 'src/Atari8Emulator.tsx' },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    // @sfotty-pie/a8 (MIT) is bundled so consumers need no git dependency.
    rollupOptions: { external: ['react', 'react/jsx-runtime', '@holmes89/ka-core'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // The tests boot the real core for a few seconds of emulated time.
    testTimeout: 30_000,
    setupFiles: ['./src/test/setup.ts'],
  },
})
