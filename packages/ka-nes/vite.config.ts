/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ include: ['src'], exclude: ['src/**/*.test.*', 'src/test'] })],
  build: {
    lib: {
      entry: { index: 'src/index.ts', NesEmulator: 'src/NesEmulator.tsx' },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    // nes-js (MIT) is bundled so consumers need no git dependency.
    rollupOptions: { external: ['react', 'react/jsx-runtime', '@holmes89/ka-core'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
