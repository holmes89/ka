import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/vendor/**', '**/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['**/scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Worker sources run in a Web Worker, where `postMessage` and `onmessage` are globals.
    files: ['**/src/worker/**/*.ts'],
    languageOptions: { globals: { ...globals.worker } },
  },
)
