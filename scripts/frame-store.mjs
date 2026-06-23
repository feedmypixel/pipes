import sharp from 'sharp'

const WHITE = '#ffffff'
const GREEN = '#00ae4a'
const GREY = '#aeb6c2'
const WIN_BG = '#161b22'
const TITLE_GREY = '#7d8794'
const TITLEBAR = 36
const WIN_RADIUS = 16

const DEFAULTS = {
  width: 1280,
  height: 800,
  padLeft: 64,
  winRight: 44,
  winTop: 30,
  winMaxWidth: 660,
  headlineSize: 60,
  headlineLead: 72,
  subSize: 21,
  subLead: 30,
  subGap: 30
}

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const background = (width, height) =>
  Buffer.from(
    `<svg width="${width}" height="${height}">
      <defs>
        <radialGradient id="glow" cx="26%" cy="28%" r="95%">
          <stop offset="0%" stop-color="#172a4c"/>
          <stop offset="42%" stop-color="#0e1a2c"/>
          <stop offset="100%" stop-color="#0a0d13"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
    </svg>`
  )

const roundedMask = (width, height, radius, corners = 'all') => {
  const r = radius
  const path =
    corners === 'bottom'
      ? `M0,0 H${width} V${height - r} a${r},${r} 0 0 1 -${r},${r} H${r} a${r},${r} 0 0 1 -${r},-${r} Z`
      : `M${r},0 H${width - r} a${r},${r} 0 0 1 ${r},${r} V${height - r} a${r},${r} 0 0 1 -${r},${r} H${r} a${r},${r} 0 0 1 -${r},-${r} V${r} a${r},${r} 0 0 1 ${r},-${r} Z`
  return Buffer.from(
    `<svg width="${width}" height="${height}"><path d="${path}" fill="#fff"/></svg>`
  )
}

const headlineSvg = (cfg) => {
  const { width, height, padLeft, headlineSize, headlineLead, subSize, subLead, subGap } = cfg
  const blockHeight = cfg.headline.length * headlineLead + subGap + cfg.sub.length * subLead
  let y = Math.round((height - blockHeight) / 2) + headlineSize
  const lines = []
  cfg.headline.forEach((line, index) => {
    const fill = index === cfg.headline.length - 1 ? GREEN : WHITE
    lines.push(
      `<text x="${padLeft}" y="${y}" font-family="Helvetica Neue, Arial, sans-serif" font-size="${headlineSize}" font-weight="800" letter-spacing="-1.5" fill="${fill}">${escape(line)}</text>`
    )
    y += headlineLead
  })
  y += subGap - headlineLead + headlineSize
  cfg.sub.forEach((line) => {
    lines.push(
      `<text x="${padLeft}" y="${y}" font-family="Helvetica Neue, Arial, sans-serif" font-size="${subSize}" font-weight="400" fill="${GREY}">${escape(line)}</text>`
    )
    y += subLead
  })
  return Buffer.from(`<svg width="${width}" height="${height}">${lines.join('')}</svg>`)
}

const titlebarSvg = (width, title) => {
  const dots = ['#ff5f57', '#febc2e', '#28c840']
    .map(
      (fill, index) => `<circle cx="${20 + index * 18}" cy="${TITLEBAR / 2}" r="5" fill="${fill}"/>`
    )
    .join('')
  return Buffer.from(
    `<svg width="${width}" height="${TITLEBAR}">
      <rect width="${width}" height="${TITLEBAR}" fill="${WIN_BG}"/>
      ${dots}
      <text x="${width / 2}" y="${TITLEBAR / 2 + 4}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="13" fill="${TITLE_GREY}">${escape(title)}</text>
    </svg>`
  )
}

const buildWindow = async (cfg) => {
  const maxWidth = cfg.maxWidth ?? cfg.winMaxWidth
  const capture = sharp(cfg.capture)
  const { width = 0, height = 0 } = await capture.metadata()
  const maxHeight = cfg.height - cfg.winTop * 2 - TITLEBAR
  const scale = Math.min(maxHeight / height, maxWidth / width)
  const contentWidth = Math.round(width * scale)
  const contentHeight = Math.round(height * scale)
  const winHeight = TITLEBAR + contentHeight

  const surface = await capture.resize(contentWidth, contentHeight).png().toBuffer()
  const roundedSurface = await sharp(surface)
    .composite([
      { input: roundedMask(contentWidth, contentHeight, WIN_RADIUS, 'bottom'), blend: 'dest-in' }
    ])
    .png()
    .toBuffer()

  const win = await sharp({
    create: { width: contentWidth, height: winHeight, channels: 4, background: WIN_BG }
  })
    .composite([
      { input: titlebarSvg(contentWidth, cfg.title), top: 0, left: 0 },
      { input: roundedSurface, top: TITLEBAR, left: 0 }
    ])
    .png()
    .toBuffer()

  const rounded = await sharp(win)
    .composite([
      { input: roundedMask(contentWidth, winHeight, WIN_RADIUS, 'all'), blend: 'dest-in' }
    ])
    .png()
    .toBuffer()

  return { buffer: rounded, width: contentWidth, height: winHeight }
}

const shadow = async (width, height) => {
  const solid = await sharp({ create: { width, height, channels: 4, background: '#000000' } })
    .composite([{ input: roundedMask(width, height, WIN_RADIUS, 'all'), blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(solid).blur(28).png().toBuffer()
}

const SLOTS = {
  'sidepanel-dark': {
    capture: 'store-screenshots/auto/sidepanel-dark.png',
    title: 'Pipes · side panel',
    headline: ['One panel.', 'Every pipeline.'],
    sub: ['GitHub Actions + GitLab CI/CD,', 'grouped by owner.'],
    out: 'store-screenshots/framed/1-sidepanel-dark.png'
  },
  'author-light': {
    capture: 'store-screenshots/auto/author-light.png',
    title: 'Pipes · side panel',
    headline: ['See who', 'broke it.'],
    sub: ['Every run and PR shows the person', 'who pushed it.'],
    out: 'store-screenshots/framed/2-author-light.png'
  },
  'popup-dark': {
    capture: 'store-screenshots/auto/popup-dark.png',
    title: 'Pipes · popup',
    headline: ['Status from', 'your toolbar.'],
    sub: ['One click through to', 'the run that failed.'],
    out: 'store-screenshots/framed/3-popup-dark.png'
  },
  'options-dark': {
    capture: 'store-screenshots/auto/options-dark.png',
    title: 'Pipes · settings',
    maxWidth: 640,
    headlineSize: 52,
    headlineLead: 62,
    headline: ['Watch exactly', 'what you choose.'],
    sub: ['Read-only token,', 'stored on your device.'],
    out: 'store-screenshots/framed/5-options-dark.png'
  },
  marquee: {
    width: 1400,
    height: 560,
    winTop: 28,
    maxWidth: 680,
    headlineSize: 56,
    headlineLead: 64,
    capture: 'store-screenshots/auto/marquee.png',
    title: 'Pipes · side panel',
    headline: ['main broke?', "you'll know."],
    sub: ['GitHub Actions & GitLab CI.', 'Every repo you watch, one glance.'],
    out: 'store-screenshots/framed/7-marquee-tile.png'
  }
}

const slotKey = process.argv[2]
const slots = slotKey ? [slotKey] : Object.keys(SLOTS)

for (const key of slots) {
  const slot = SLOTS[key]
  if (!slot) {
    console.error(`unknown slot: ${key} (have: ${Object.keys(SLOTS).join(', ')})`)
    process.exit(1)
  }
  const cfg = { ...DEFAULTS, ...slot }
  const win = await buildWindow(cfg)
  const left = cfg.width - cfg.winRight - win.width
  const top = Math.round((cfg.height - win.height) / 2)
  const blockWidth = left - cfg.padLeft - 32

  await sharp(background(cfg.width, cfg.height))
    .composite([
      { input: await shadow(win.width, win.height), top: top + 16, left: left + 4 },
      { input: win.buffer, top, left },
      { input: headlineSvg({ ...cfg, width: blockWidth }), top: 0, left: 0 }
    ])
    .png()
    .toFile(cfg.out)

  console.log(`framed ${cfg.out}`)
}
