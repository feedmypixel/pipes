import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'

const ORIGIN = 'http://localhost:5173'
const OUT_DIR = 'store-screenshots/auto'
const SCALE = 2

const TARGETS = [
  { name: 'sidepanel-dark', surface: 'sidepanel', width: 540, height: 440, theme: 'dark' },
  { name: 'author-light', surface: 'sidepanel', width: 540, height: 392, theme: 'light' },
  { name: 'popup-dark', surface: 'popup', width: 440, height: 500, theme: 'dark' },
  { name: 'options-dark', surface: 'options', width: 680, height: 600, theme: 'dark' },
  { name: 'marquee', surface: 'sidepanel', width: 480, height: 360, theme: 'dark' }
]

const urlFor = (surface) => `${ORIGIN}/src/${surface}/index.html`

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(urlFor('sidepanel'))
      if (response.ok) {
        return
      }
    } catch {
      void 0
    }
    await sleep(500)
  }
  throw new Error('dev server did not come up on :5173')
}

await mkdir(OUT_DIR, { recursive: true })

const dev = spawn('pnpm', ['dev'], { stdio: 'ignore', detached: true })
const teardown = () => {
  try {
    process.kill(-dev.pid, 'SIGTERM')
  } catch {
    void 0
  }
}
process.on('exit', teardown)

try {
  await waitForServer()
  const browser = await chromium.launch({ headless: false })
  for (const target of TARGETS) {
    const context = await browser.newContext({
      viewport: { width: target.width, height: target.height },
      deviceScaleFactor: SCALE,
      colorScheme: target.theme,
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    await page.goto(urlFor(target.surface), { waitUntil: 'networkidle' })
    await sleep(600)
    await page.screenshot({ path: `${OUT_DIR}/${target.name}.png` })
    await context.close()
    console.log(
      `captured ${target.name} (${target.width}x${target.height} @${SCALE}x ${target.theme})`
    )
  }
  await browser.close()
} finally {
  teardown()
}
