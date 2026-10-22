import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    // Node 25+ ships a global localStorage that is undefined without
    // --localstorage-file and shadows jsdom's, so turn it off in test workers.
    execArgv:
      Number(process.versions.node.split('.')[0]) >= 25
        ? ['--no-experimental-webstorage']
        : [],
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'src-tauri',
      '.git',
      '.cache',
      'build',
    ],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
