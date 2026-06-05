import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.config'

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  server: {
    // Dual-stack bind. crxjs hardcodes the dev SW's fetch to `localhost:5173`,
    // and localhost resolves to BOTH ::1 and 127.0.0.1 on macOS. Binding a single
    // stack leaves the other refused, and Chrome's SW may pick either — so listen
    // on `::` (accepts IPv6 + IPv4-mapped) to cover both.
    host: '::',
    port: 5173,
    strictPort: true,
    // Vite 6 tightened dev-server CORS: it no longer reflects arbitrary origins,
    // so the extension's chrome-extension:// origin gets no Access-Control-Allow-
    // Origin and Chrome blocks the crxjs SW's fetch to localhost:5173. Allow
    // extension origins explicitly.
    cors: { origin: /^chrome-extension:\/\// },
    hmr: { port: 5173 }
  }
})
