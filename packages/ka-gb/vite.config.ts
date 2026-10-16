/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ include: ['src', 'vendor'], exclude: ['src/**/*.test.*', 'src/test'] })],
  build: {
    lib: {
      entry: { index: 'src/index.ts', GameBoyEmulator: 'src/GameBoyEmulator.tsx' },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    // The vendored wasmboy bundle (GPL-3.0) is inlined so consumers need nothing else.
    rollupOptions: { external: ['react', 'react/jsx-runtime', '@holmes89/ka-core'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
