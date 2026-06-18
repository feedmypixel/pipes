/* ============================================================
   Pipes — shared UI atoms used across popup + side panel + options.
   Exposes window.PIPES_UI
   Status word lives in a title tooltip (icons carry the meaning).
   ============================================================ */
(function () {
  /* ---------- icons (lucide-svelte equivalents; lucide name noted) ---------- */
  const I = {
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>', // refresh-cw
    sidepanel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="15" y1="4" x2="15" y2="20"/></svg>', // panel-right
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8.6a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>', // settings
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>', // git-branch
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>', // external-link
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>', // chevron-down
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>', // search
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>', // check
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>', // plus
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>', // trash-2
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>', // lock
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>', // triangle-alert
    plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0z"/><path d="M12 16v6"/></svg>', // plug
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>', // zap
  };

  function lbl(status) { return window.PIPES_DATA.STATUS_LABEL[status] || status; }

  /* ---------- status glyph (GitHub-style bare circle) ---------- */
  function glyph(status) {
    const c = `var(--p-${status === 'canceled' || status === 'skipped' || status === 'unknown' ? 'neutral' : status})`;
    const disc = `<circle cx="8" cy="8" r="8" fill="${c}"/>`;
    switch (status) {
      case 'success':
        return `<svg class="glyph" viewBox="0 0 16 16">${disc}<path d="M11.5 5.6 7 10.2 4.6 7.8" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case 'failed':
        return `<svg class="glyph" viewBox="0 0 16 16">${disc}<path d="M5.6 5.6 10.4 10.4M10.4 5.6 5.6 10.4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;
      case 'running':
        return `<svg class="glyph spin" viewBox="0 0 16 16">${disc}<path d="M8 3.4a4.6 4.6 0 1 1-4.3 3.1" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;
      case 'pending':
        return `<svg class="glyph" viewBox="0 0 16 16">${disc}<rect x="5.4" y="4.8" width="1.7" height="6.4" rx=".85" fill="#fff"/><rect x="8.9" y="4.8" width="1.7" height="6.4" rx=".85" fill="#fff"/></svg>`;
      case 'canceled':
        return `<svg class="glyph" viewBox="0 0 16 16">${disc}<path d="M5 5 11 11" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;
      case 'skipped':
        return `<svg class="glyph" viewBox="0 0 16 16">${disc}<path d="M4.6 5 7.4 8 4.6 11M8.4 5 11.2 8 8.4 11" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      default:
        return `<svg class="glyph" viewBox="0 0 16 16">${disc}<path d="M6.4 6.3a1.8 1.8 0 0 1 3.3.9c0 1.2-1.6 1.4-1.6 2.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.7" r=".9" fill="#fff"/></svg>`;
    }
  }

  /* ---------- status pill (GitLab-style) ---------- */
  function pillDot(status) {
    if (status === 'running')
      return `<svg class="glyph spin" viewBox="0 0 16 16" style="width:11px;height:11px"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2.6" opacity=".3"/><path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
    if (status === 'success') return `<svg class="pdot" viewBox="0 0 16 16"><path d="M13 4 6.5 11 3 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    if (status === 'failed') return `<svg class="pdot" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
    return `<span class="pdot" style="border-radius:50%;background:currentColor;width:7px;height:7px;margin:0 2px"></span>`;
  }

  /* ---- GitLab-style status symbols (drawn inside the ring) ---- */
  function gli(inner, spin) { return `<svg viewBox="0 0 16 16" class="gli${spin ? ' spin' : ''}">${inner}</svg>`; }
  function gitlabIcon(status) {
    switch (status) {
      case 'success': return gli('<path d="M4 8.4 6.7 11.1 12 5.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');
      case 'failed': return gli('<path d="M5 5 11 11M11 5 5 11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>');
      case 'running': return gli('<path d="M8 2.4a5.6 5.6 0 1 1-5.3 3.8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>', true);
      case 'pending': return gli('<rect x="4.6" y="4.2" width="2.9" height="7.6" rx="1.45" fill="currentColor"/><rect x="8.5" y="4.2" width="2.9" height="7.6" rx="1.45" fill="currentColor"/>');
      case 'canceled': return gli('<path d="M4.6 4.6 11.4 11.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>');
      case 'skipped': return gli('<path d="M4.4 5 7.3 8 4.4 11M8.4 5 11.3 8 8.4 11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>');
      default: return gli('<circle cx="8" cy="8" r="2.2" fill="currentColor"/>');
    }
  }

  // opts: {compact, label (default true), title}
  function pill(status, opts) {
    opts = opts || {};
    const showLabel = opts.label !== false;
    if (!showLabel) {
      return `<span class="pill ${status} icononly${opts.compact ? ' compact' : ''}" title="${lbl(status)}">${gitlabIcon(status)}</span>`;
    }
    const title = opts.title ? ` title="${opts.title}"` : '';
    return `<span class="pill ${status}${opts.compact ? ' compact' : ''}"${title}>${pillDot(status)}${lbl(status)}</span>`;
  }

  /* ---------- status mark: one unified icon everywhere; word in title ---------- */
  function statusMark(status, opts) {
    opts = opts || {};
    return pill(status, { compact: opts.compact, label: false });
  }

  /* ---------- provider mark ----------
     window.__PIPES_MARKS: 'official' (real GitHub/GitLab logo) | 'neutral' (GH/GL chip) */
  function providerMark(provider) {
    const cls = provider === 'github' ? 'gh' : 'gl';
    const name = provider === 'github' ? 'GitHub' : 'GitLab';
    if ((window.__PIPES_MARKS || 'official') === 'official') {
      return `<span class="acct-mark official ${cls}" title="${name}"><img class="pmark ${cls}" src="assets/${provider}-mark.png" alt="${name}"/></span>`;
    }
    return `<span class="acct-mark ${cls}" title="${name}">${provider === 'github' ? 'GH' : 'GL'}</span>`;
  }

  function refLabel(ref) {
    const tag = ref.tag ? `<span class="reftag">${ref.tag}</span>` : '';
    return `<span class="ref ${ref.isDefault ? 'default' : ''}">${tag}${I.branch}<span class="reftext">${ref.ref}</span></span>`;
  }

  /* ---------- the reusable repo row (popup + side panel) ----------
     Whole row links to the EXACT run/pipeline in a new tab; failures go to the
     failed job log. Provider-agnostic. shortName drops the owner (it's the group). */
  function rowAttrs(status) {
    const dest = status === 'failed' ? 'failed job log'
      : status === 'running' ? 'live run'
        : status === 'pending' ? 'queued run'
          : 'run';
    return `href="#" target="_blank" rel="noopener noreferrer" title="Open the ${dest} — opens in a new tab"`;
  }

  function row(repo, ref, opts) {
    opts = opts || {};
    const headline = opts.headline && ref.status === 'failed';
    let nameHtml;
    if (opts.shortName) {
      nameHtml = repo.name.split('/').slice(1).join('/');
    } else {
      const [owner, ...rest] = repo.name.split('/');
      nameHtml = rest.length ? `<span class="owner">${owner}/</span>${rest.join('/')}` : repo.name;
    }
    return `
      <a class="row${opts.dense ? ' dense' : ''}${headline ? ' headline' : ''}" data-status="${ref.status}" ${rowAttrs(ref.status)} tabindex="0">
        <span class="row-status">${pill(ref.status, { compact: opts.dense, label: false })}</span>
        <span class="row-main">
          <span class="row-name">${nameHtml}</span>
          <span class="row-meta">
            ${refLabel(ref)}
            <span class="dotsep"></span>
            <span class="row-time">${ref.rel === 'now' ? 'just now' : ref.rel + ' ago'}</span>
          </span>
        </span>
        <span class="row-end"><span class="row-go" aria-hidden="true">${I.external}</span></span>
      </a>`;
  }

  function subrow(repo, ref, opts) {
    return `
      <a class="subrow" data-status="${ref.status}" ${rowAttrs(ref.status)} tabindex="0">
        <span class="row-status">${pill(ref.status, { compact: true, label: false })}</span>
        <span class="row-main">
          <span class="row-meta" style="margin-top:0">
            ${refLabel(ref)}
            <span class="dotsep"></span>
            <span class="row-time">${ref.rel === 'now' ? 'just now' : ref.rel + ' ago'}</span>
          </span>
        </span>
        <span class="row-end"><span class="row-go" aria-hidden="true">${I.external}</span></span>
      </a>`;
  }

  window.PIPES_UI = { I, glyph, pill, statusMark, providerMark, row, subrow, refLabel };
})();
