import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
    server: {
      deps: {
        inline: true,
      },
    },
  },
  resolve: {
    alias: {
      obsidian: path.resolve(__dirname, '__mocks__/obsidian.ts'),
      main: path.resolve(__dirname, 'src/main'),
      provider: path.resolve(__dirname, 'src/provider'),
      lib: path.resolve(__dirname, 'src/lib'),
      settings: path.resolve(__dirname, 'src/settings'),
      classifier: path.resolve(__dirname, 'src/classifier'),
    },
  },
})
