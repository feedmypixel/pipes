/* ============================================================
   Pipes — handoff page assembly + interactivity
   ============================================================ */
(function () {
  const S = window.PIPES_SURFACES;
  const UI = window.PIPES_UI;
  const D = window.PIPES_DATA;
  let brandKey = 'pixelblue';

  /* ---------- brand palettes (system colour; neutrals are theme-level) ---------- */
  const BRANDS = {
    pixelblue: {
      label: 'Pixel Blue', dot: '#3194fc',
      logo: { tile: ['#3194fc', '#3194fc'], ring: '#0a1f3d', bore: '#ffffff', pupil: '#0a1f3d', lip: 'oklch(0.82 0.12 256)' },
      light: { brand: '#3194fc', ink: '#ffffff', soft: 'oklch(0.95 0.04 256)', link: 'oklch(0.55 0.17 256)' },
      dark: { brand: '#5aa8ff', ink: '#06152b', soft: 'oklch(0.30 0.07 256)', link: 'oklch(0.78 0.13 256)' },
      doc: { l: ['oklch(0.55 0.17 256)', 'oklch(0.95 0.04 256)'], d: ['#5aa8ff', 'oklch(0.30 0.07 256)'] },
    },
  };

  function applyBrand(key) {
    brandKey = key;
    const b = BRANDS[key];
    window.__PIPES_BRAND_LOGO = b.logo;
    const css = `
[data-theme="light"]{--p-brand:${b.light.brand};--p-brand-ink:${b.light.ink};--p-brand-soft:${b.light.soft};--p-link:${b.light.link};}
[data-theme="dark"]{--p-brand:${b.dark.brand};--p-brand-ink:${b.dark.ink};--p-brand-soft:${b.dark.soft};--p-link:${b.dark.link};}
:root{--d-accent:${b.doc.l[0]};--d-accent-soft:${b.doc.l[1]};}
@media (prefers-color-scheme: dark){:root{--d-accent:${b.doc.d[0]};--d-accent-soft:${b.doc.d[1]};}}`;
    let st = document.getElementById('brand-style');
    if (!st) { st = document.createElement('style'); st.id = 'brand-style'; document.head.appendChild(st); }
    st.textContent = css;
    renderLogos();
    mountSurfaces();
  }

  /* ---------- logo lab ---------- */
  const LOGOS = [
    { kind: 'tick', hero: true, name: 'Pipes mark', tag: 'Logo',
      desc: 'A green status tick on a transparent background — the resting “all clear” signal, and exactly what the extension is for. Legible to 16px; pairs with the red ✗ / amber states.' },
  ];
  const SIZES = [16, 32, 48, 128];

  function renderLogos() {
    document.getElementById('hero-logo').innerHTML = window.logoSVG('tick', 64);
    const markCol = BRANDS[brandKey].doc.l[0];
    document.getElementById('logo-grid').innerHTML = LOGOS.map(l => `
      <div class="logo-card${l.hero ? ' hero' : ''}">
        <div class="logo-stage">
          ${window.logoSVG(l.kind, 96, { animate: l.animate })}
          ${window.logoSVG(l.kind, 48, { animate: l.animate })}
        </div>
        <div class="lc-body">
          <span class="lc-tag">${l.hero ? '<span class="star">★</span> ' : ''}${l.tag}</span>
          <h3>${l.name}</h3>
          <p>${l.desc}</p>
        </div>
        <div class="size-strip">
          ${SIZES.map(s => `<div class="size-item"><span style="display:inline-block;width:${s}px;height:${s}px">${window.logoSVG(l.kind, s)}</span><span class="sz">${s}px</span></div>`).join('')}
          <div class="size-item" style="margin-left:auto"><span>${window.logoSVG(l.kind, 34, { bare: true, markColour: markCol })}</span><span class="sz">bare</span></div>
        </div>
      </div>`).join('');
  }

  /* ---------- colour tokens (neutrals are brand-independent) ---------- */
  const SURF_TOK = [
    ['Brand · #3194FC', '#3194fc', '#5aa8ff'],
    ['Background', '#ffffff', '#0b0f17'],
    ['Canvas / sunken', '#eef1f7', '#070a10'],
    ['Surface / card', '#ffffff', '#121826'],
    ['Border', '#e3e8f1', '#242d3e'],
    ['Text primary', '#0f1620', '#e7ecf3'],
    ['Text secondary', '#545e6e', '#98a3b4'],
    ['Text muted', '#939dad', '#687284'],
  ];
  const STATUS_TOK = [
    ['Success', 'oklch(0.64 0.15 152)', 'oklch(0.76 0.16 152)'],
    ['Failed', 'oklch(0.60 0.20 27)', 'oklch(0.70 0.19 27)'],
    ['Running', 'oklch(0.66 0.17 256)', 'oklch(0.74 0.15 256)'],
    ['Pending / other', 'oklch(0.72 0.14 80)', 'oklch(0.80 0.13 85)'],
  ];
  function swatch([name, l, d]) {
    return `<div class="swatch">
      <div class="chip" style="background:linear-gradient(135deg, ${l} 0 50%, ${d} 50% 100%)"></div>
      <div class="sw-meta">
        <div class="sw-name">${name}</div>
        <div class="sw-hex"><span><b>L</b> ${l}</span><span><b>D</b> ${d}</span></div>
      </div>
    </div>`;
  }
  document.getElementById('tok-surface').innerHTML = SURF_TOK.map(swatch).join('');
  document.getElementById('tok-status').innerHTML = STATUS_TOK.map(swatch).join('');

  /* ---------- icon legend (lucide names) ---------- */
  const ICON_MAP = [
    ['refresh', 'refresh-cw', 'Refresh now'],
    ['sidepanel', 'panel-right', 'Open side panel'],
    ['gear', 'settings', 'Options'],
    ['branch', 'git-branch', 'Branch / ref'],
    ['external', 'external-link', 'Open run (new tab)'],
    ['chevron', 'chevron-down', 'Expand refs'],
    ['search', 'search', 'Search repos'],
    ['check', 'check', 'Valid / watched'],
    ['plus', 'plus', 'Add'],
    ['trash', 'trash-2', 'Remove'],
    ['lock', 'lock', 'Token security'],
    ['alert', 'triangle-alert', 'Error / warning'],
    ['plug', 'plug', 'Accounts'],
    ['bolt', 'zap', 'Validate'],
  ];
  document.getElementById('icon-legend').innerHTML = ICON_MAP.map(([k, name, use]) =>
    `<div class="ic-item"><span class="ic-glyph">${UI.I[k]}</span><div class="ic-meta"><code>${name}</code><span>${use}</span></div></div>`
  ).join('');

  /* ---------- status vocabulary table ---------- */
  const STATUS_META = {
    success: ['oklch 0.64/0.76 · 152', 'Latest run passed.'],
    failed: ['oklch 0.60/0.70 · 27', 'Run failed. On a default branch this is the headline alarm.'],
    running: ['oklch 0.66/0.74 · 256', 'In progress — animated spinner.'],
    pending: ['oklch 0.72/0.80 · 80', 'Queued / waiting for a runner.'],
    canceled: ['#6e7781 / #8b949e', 'Manually or auto-cancelled.'],
    skipped: ['#6e7781 / #8b949e', 'Skipped by rules / conditions.'],
    unknown: ['#6e7781 / #8b949e', 'Unmapped or unreachable state.'],
  };
  document.getElementById('status-rows').innerHTML = D.STATUS_ORDER.map(s => `
    <tr data-theme="light">
      <td style="text-transform:none;color:var(--d-ink)">${s}</td>
      <td><div class="skin-cell">${UI.pill(s, { label: false })}</div></td>
      <td style="font-family:var(--d-mono);font-size:11.5px;color:var(--d-ink-2)">${STATUS_META[s][0]}</td>
      <td class="desc">${STATUS_META[s][1]}</td>
    </tr>`).join('');

  /* ---------- frame helper ---------- */
  function frame(label, px, theme, ctx, inner) {
    return `<div class="frame-col">
      <div class="frame-label"><span class="dot ${theme}"></span>${label} <span class="px">${px}</span></div>
      <div class="device" data-theme="${theme}">
        <div class="device-bar"><span class="tl r"></span><span class="tl y"></span><span class="tl g"></span><span class="ctx">${ctx}</span></div>
        ${inner}
      </div>
    </div>`;
  }

  /* ---------- mount surfaces ---------- */
  function mountSurfaces() {
    const pop = (state, lbl) => [
      frame(lbl, 'light', 'light', 'extension popup', S.popup(state)),
      frame(lbl, 'dark', 'dark', 'extension popup', S.popup(state)),
    ].join('');
    document.getElementById('popup-frames').innerHTML =
      pop('failing', 'Failing on main · default') +
      pop('pr-failing', 'Main green · PR/MR failing') +
      pop('healthy', 'Healthy') +
      pop('unconfigured', 'Unconfigured') +
      pop('error', 'Error / token');

    document.getElementById('sidepanel-frames').innerHTML =
      frame('Side panel', 'light', 'light', 'side panel', S.sidepanel()) +
      frame('Side panel', 'dark', 'dark', 'side panel', S.sidepanel());

    document.getElementById('options-frames').innerHTML =
      frame('Options', 'light', 'light', 'options', S.options()) +
      frame('Options', 'dark', 'dark', 'options', S.options());

    const nf = document.getElementById('notif-frames');
    if (nf) nf.innerHTML =
      `<div class="frame-col"><div class="frame-label"><span class="dot light"></span>OS notifications <span class="px">light</span></div><div class="notif-stage" data-theme="light">${S.notifications()}</div></div>` +
      `<div class="frame-col"><div class="frame-label"><span class="dot dark"></span>OS notifications <span class="px">dark</span></div><div class="notif-stage" data-theme="dark">${S.notifications()}</div></div>`;
    const bf = document.getElementById('badge-frames');
    if (bf) bf.innerHTML =
      `<div class="notif-stage" data-theme="light">${S.badges()}</div>` +
      `<div class="notif-stage" data-theme="dark">${S.badges()}</div>`;

    wireSurfaceInteractions();
  }

  /* ---------- interactions inside surfaces ---------- */
  function wireSurfaceInteractions() {
    document.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const sub = btn.nextElementSibling;
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if (sub) sub.hidden = open;
        const span = btn.querySelector('span');
        if (span) span.textContent = span.textContent.replace(open ? 'Hide' : 'Show', open ? 'Show' : 'Hide');
      });
    });
    document.querySelectorAll('[data-watch]').forEach(item => {
      item.addEventListener('click', () => item.classList.toggle('on'));
    });
    document.querySelectorAll('.prov-toggle').forEach(tg => {
      tg.querySelectorAll('.prov-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          tg.querySelectorAll('.prov-opt').forEach(o => o.setAttribute('aria-pressed', 'false'));
          opt.setAttribute('aria-pressed', 'true');
        });
      });
    });
    document.querySelectorAll('.pw-toggle').forEach(t => {
      t.addEventListener('click', () => {
        const inp = t.parentElement.querySelector('input');
        if (!inp) return;
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        t.textContent = show ? 'Hide' : 'Show';
      });
    });
    document.querySelectorAll('.toggle').forEach(t => {
      t.addEventListener('click', () => t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'));
    });
    document.querySelectorAll('.surface a[href="#"], .opt a[href="#"]').forEach(a => {
      a.addEventListener('click', e => e.preventDefault());
    });
  }

  /* ---------- type switcher (clean / technical options) ---------- */
  const FONTS = {
    system: ['-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', 'ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace'],
    geist: ["'Geist',sans-serif", "'Geist Mono',ui-monospace,monospace"],
    plex: ["'IBM Plex Sans',sans-serif", "'IBM Plex Mono',ui-monospace,monospace"],
    space: ["'Space Grotesk',sans-serif", "'Space Mono',ui-monospace,monospace"],
  };
  const fontSeg = document.getElementById('font-seg');
  if (fontSeg) fontSeg.addEventListener('click', e => {
    const b = e.target.closest('button[data-font]');
    if (!b) return;
    const [s, m] = FONTS[b.dataset.font];
    document.documentElement.style.setProperty('--d-sans', s);
    document.documentElement.style.setProperty('--d-mono', m);
    fontSeg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });

  applyBrand(brandKey);
})();
