import sharp from 'sharp'

const [input, output, ...flags] = process.argv.slice(2)
if (!input || !output) {
  console.error('usage: node scripts/frame-screenshots.mjs <input.png> <output.png> [--dark]')
  process.exit(1)
}

const dark = flags.includes('--dark')
const WIDTH = 1280
const HEIGHT = 800
const MARGIN = 80
const RADIUS = 12
const canvas = dark ? '#0b0f17' : '#eef1f7'

const capture = sharp(input)
const { width = 0, height = 0 } = await capture.metadata()

const maxWidth = WIDTH - MARGIN * 2
const maxHeight = HEIGHT - MARGIN * 2
const scale = Math.min(maxWidth / width, maxHeight / height, 1)
const w = Math.round(width * scale)
const h = Math.round(height * scale)

const resized = await capture.resize(w, h).png().toBuffer()
const mask = Buffer.from(
  `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}" ry="${RADIUS}"/></svg>`
)
const rounded = await sharp(resized)
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer()

await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: canvas } })
  .composite([
    { input: rounded, left: Math.round((WIDTH - w) / 2), top: Math.round((HEIGHT - h) / 2) }
  ])
  .png()
  .toFile(output)

console.log(`framed ${output} (${WIDTH}x${HEIGHT}, ${dark ? 'dark' : 'light'})`)
