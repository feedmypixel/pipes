/**
 * Generate the extension icon set from the design logo.
 *
 * Source of truth: design/v1/assets/logo-pipes.svg (the green status tick).
 * When a new design bundle lands, point SOURCE at its logo and rerun `pnpm icons`.
 */
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'assets/logo.svg')
const OUT_DIR = join(ROOT, 'icons')
const SIZES = [16, 32, 48, 128]

const svg = await readFile(SOURCE)
await mkdir(OUT_DIR, { recursive: true })

for (const size of SIZES) {
  const png = await sharp(svg).resize(size, size).png().toBuffer()
  await writeFile(join(OUT_DIR, `icon-${size}.png`), png)
  console.log(`icons/icon-${size}.png (${size}x${size})`)
}

// Status glyphs for notifications — the success tick + failed cross, 128px (logo size).
// Imported by src/lib/notify.ts so the bundler ships them; not part of the manifest icon set.
for (const name of ['status-success', 'status-failed']) {
  const statusSvg = await readFile(join(ROOT, 'assets', `${name}.svg`))
  const png = await sharp(statusSvg).resize(128, 128).png().toBuffer()
  await writeFile(join(OUT_DIR, `${name}.png`), png)
  console.log(`icons/${name}.png (128x128)`)
}
