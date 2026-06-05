import path from 'node:path'
import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import security from 'eslint-plugin-security'
import svelte from 'eslint-plugin-svelte'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'
import svelteConfig from './svelte.config.js'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  { ignores: ['design/**', 'icons/**'] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  security.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    // Extension code runs in service worker + browser contexts; chrome.* is typed
    // via @types/chrome, so let TypeScript own undefined-symbol checking.
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-undef': 'off',
      curly: ['error', 'all']
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: { globals: { ...globals.vitest } },
    rules: {
      'security/detect-object-injection': 'off'
    }
  }
)
