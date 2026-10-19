/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ include: ['src'], exclude: ['src/**/*.test.*', 'src/test', 'src/worker'] })],
  build: {
    lib: {
      entry: { index: 'src/index.ts', Atari2600Emulator: 'src/Atari2600Emulator.tsx' },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    // 6502.ts (MIT) and its prebuilt worker are bundled so consumers need no extra dependency or worker URL.
    rollupOptions: { external: ['react', 'react/jsx-runtime', '@holmes89/ka-core'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
