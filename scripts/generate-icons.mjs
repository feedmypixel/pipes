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
const SOURCE = join(ROOT, 'design/v1/assets/logo-pipes.svg')
const OUT_DIR = join(ROOT, 'icons')
const SIZES = [16, 32, 48, 128]

const svg = await readFile(SOURCE)
await mkdir(OUT_DIR, { recursive: true })

for (const size of SIZES) {
  const png = await sharp(svg).resize(size, size).png().toBuffer()
  await writeFile(join(OUT_DIR, `icon-${size}.png`), png)
  console.log(`icons/icon-${size}.png (${size}x${size})`)
}
