import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      // Floor sits just below current so a dep bump won't break the build, but dropping a
      // test or regressing covered code does. Ratchet up as coverage grows.
      thresholds: {
        statements: 79,
        branches: 68,
        functions: 83,
        lines: 77
      }
    },
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.svelte.test.ts']
        }
      },
      {
        plugins: [svelte()],
        test: {
          name: 'browser',
          globals: true,
          include: ['src/**/*.svelte.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
})
