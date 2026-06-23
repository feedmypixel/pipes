/* ============================================================
   Pipes — logo lab
   Three ORIGINAL directions, built from geometric primitives only.
   No trademarked artwork. Colours are brand-parametrised so the
   whole set re-themes when the brand swatch changes.
   logoSVG(kind, size, {bare, idle, tile:[c0,c1], ring, bore, pupil, markColour})
   ============================================================ */
(function () {
  let uid = 0;

  // fallback brand (used only if no brand has been applied yet)
  const FALLBACK = { tile: ['#3194fc', '#3194fc'], ring: '#0a1f3d', bore: '#ffffff', pupil: '#0a1f3d', lip: 'oklch(0.82 0.12 256)' };

  function brand(opts) {
    const g = window.__PIPES_BRAND_LOGO || FALLBACK;
    return {
      tile: opts.tile || g.tile,
      ring: opts.ring || g.ring,
      bore: opts.bore || g.bore,
      pupil: opts.pupil || g.pupil,
      lip: opts.lip || g.lip || g.ring,
    };
  }

  function defs(id, tile) {
    return `<defs>
      <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${tile[0]}"/>
        <stop offset="1" stop-color="${tile[1]}"/>
      </linearGradient>
    </defs>`;
  }

  /* ---- C · pipe-eyes (HERO): two top-down pipe openings that read as watching
     eyes. Flat, layered tones (no gradient): bright rim → inner lip → dark bore
     (the look down the pipe = the pupil) → offset catch-light = alive + glancing.
     Discs sized to echo the status circles in the list. ---- */
  function pipeeyes(b) {
    const eye = cx => `
      <circle cx="${cx}" cy="64" r="20" fill="${b.bore}"/>
      <circle cx="${cx}" cy="64" r="14.5" fill="none" stroke="${b.lip}" stroke-width="2.4"/>
      <circle cx="${cx + 3}" cy="64" r="10" fill="${b.ring}"/>
      <circle cx="${cx + 6.5}" cy="60" r="3.1" fill="${b.bore}"/>`;
    return `${eye(44)}${eye(84)}`;
  }

  /* ---- C2 · spinner-eyes: the pipe-wall is a gapped ring (a CI loading
     spinner), the tile shows through as the iris, offset pupil = watching.
     One form, three readings. Can rotate while polling. ---- */
  function spinnereyes(b) {
    const ring = cx => `<circle cx="${cx}" cy="64" r="18" fill="none" stroke="${b.ring}" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="88 25" transform="rotate(-90 ${cx} 64)" class="lspin"/>`;
    const pupil = cx => `<circle cx="${cx + 4}" cy="64" r="6" fill="${b.ring}"/>`;
    return `${ring(45)}${ring(83)}${pupil(45)}${pupil(83)}`;
  }

  /* ---- A · telescope + eye ---- */
  function telescope(b) {
    return `
      <g transform="rotate(-26 64 64)">
        <rect x="26" y="55" width="20" height="26" rx="9" fill="${b.ring}"/>
        <rect x="40" y="58" width="42" height="20" rx="10" fill="${b.ring}"/>
        <circle cx="90" cy="68" r="23" fill="${b.ring}"/>
        <circle cx="90" cy="68" r="15" fill="${b.bore}"/>
        <circle cx="93" cy="68" r="7" fill="${b.pupil}"/>
      </g>
      <path d="M52 96 L42 116 M66 100 L78 116" stroke="${b.ring}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  }

  /* ---- B · aperture / reticle ---- */
  function aperture(b) {
    const ticks = [0, 90, 180, 270].map(a =>
      `<rect x="62" y="20" width="4" height="13" rx="2" fill="${b.bore}" transform="rotate(${a} 64 64)"/>`
    ).join('');
    return `
      <rect x="22" y="58" width="84" height="12" rx="6" fill="${b.ring}" opacity="0.5"/>
      <circle cx="64" cy="64" r="34" fill="none" stroke="${b.ring}" stroke-width="9"/>
      <circle cx="64" cy="64" r="13" fill="${b.bore}"/>
      <circle cx="64" cy="64" r="6" fill="${b.pupil}"/>
      ${ticks}`;
  }

  const KINDS = { pipeeyes, spinnereyes, telescope, aperture };

  // The Pipes mark: a green status tick on a transparent background.
  const TICK_GREEN = '#1aa05a';
  function tickmark(fill) {
    return `<circle cx="64" cy="64" r="60" fill="${fill}"/><path d="M39 66 57 83 89 45" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  window.logoSVG = function (kind, size, opts) {
    opts = opts || {};
    const id = 'L' + (uid++);
    const rx = opts.bare ? 0 : Math.round(size * 0.22);
    const b = brand(opts);

    // Pipes mark — green tick (or greyscale via opts.mono) on a transparent background.
    if (kind === 'tick') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pipes">${tickmark(opts.mono ? '#8a93a0' : TICK_GREEN)}</svg>`;
    }

    // bare mark: monochrome on transparency (for favicons / one-colour use)
    if (opts.bare) {
      const c = opts.markColour || b.tile[1];
      const bb = { tile: b.tile, ring: c, bore: opts.paperColour || '#ffffff', pupil: c };
      const draw = KINDS[kind] || pipeeyes;
      const inner = kind === 'pipeeyes' ? draw(bb, true) : draw(bb);
      return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pipes logo">${inner}</svg>`;
    }

    const draw = KINDS[kind] || pipeeyes;
    const inner = kind === 'pipeeyes' ? draw(b, opts.idle !== false) : draw(b);
    const cls = opts.animate ? ' class="logo-spin"' : '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pipes logo"${cls}>
      <rect width="128" height="128" rx="${rx}" fill="${b.tile[0]}"/>
      ${inner}
    </svg>`;
  };
})();
