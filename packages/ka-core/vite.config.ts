/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ include: ['src'], exclude: ['src/**/*.test.*', 'src/test'], rollupTypes: false })],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es', 'cjs'], fileName: (format) => `ka-core.${format === 'es' ? 'js' : 'cjs'}` },
    rollupOptions: { external: ['react', 'react/jsx-runtime'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
