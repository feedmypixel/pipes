/* ============================================================
   Pipes — forms & notifications handoff renderer
   ============================================================ */
(function () {
  const UI = window.PIPES_UI;
  const I = UI.I;
  const tick = s => window.logoSVG('tick', s);

  const xIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const infoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v5M12 7.5h.01"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  /* solid-fill status icons with white symbol (match the status circles) */
  const solidCheck = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="var(--p-success)"/><path d="M17 8.6 10.6 15.4 7 11.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const solidTri = v => `<svg viewBox="0 0 24 24"><path d="M12 3.4 22.4 21H1.6Z" fill="var(${v})" stroke="var(${v})" stroke-width="2.8" stroke-linejoin="round"/><path d="M12 9.6v4.4" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.3" fill="#fff"/></svg>`;

  /* light + dark side by side */
  function pair(label, innerFn) {
    const stage = theme => `<div class="frame-col">
      <div class="frame-label"><span class="dot ${theme}"></span>${label} <span class="px">${theme}</span></div>
      <div class="fstage" data-theme="${theme}">${innerFn(theme)}</div>
    </div>`;
    return `<div class="frames">${stage('light')}${stage('dark')}</div>`;
  }
  function mount(id, label, innerFn) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = pair(label, innerFn);
  }

  /* ---------- a single Field in its various states ---------- */
  function field(opts) {
    opts = opts || {};
    const id = opts.name || 'f';
    const optional = opts.optional ? ' <span class="opt">(optional)</span>' : '';
    const hint = opts.hint ? `<span class="hint" id="${id}-hint">${opts.hint}</span>` : '';
    const err = opts.error ? `<span class="ferror" id="${id}-err">${opts.error}</span>` : '';
    const below = opts.below ? `<span class="below ${opts.below.state}" aria-live="polite">${opts.below.text}</span>` : '';
    const describedBy = [opts.hint ? `${id}-hint` : '', opts.error ? `${id}-err` : ''].filter(Boolean).join(' ');
    const aria = `${describedBy ? ` aria-describedby="${describedBy}"` : ''}${opts.error ? ' aria-invalid="true"' : ''}${opts.required === false ? '' : ' required'}`;
    const input = opts.password
      ? `<div class="pw-wrap"><input id="${id}" type="password" value="${opts.value || ''}"${aria}/><button class="pw-toggle" type="button">Show</button></div>`
      : `<input id="${id}" type="${opts.type || 'text'}"${opts.value ? ` value="${opts.value}"` : ''}${opts.placeholder ? ` placeholder="${opts.placeholder}"` : ''}${aria}/>`;
    return `<div class="field${opts.error ? ' has-error' : ''}${opts.password ? ' field-mono' : ''}">
      <label for="${id}">${opts.label}${optional}</label>
      ${hint}${err}${input}${below}
    </div>`;
  }

  /* ---------- 1 · Field anatomy & states ---------- */
  mount('f-anatomy', 'Field states', () => `
    ${field({ name: 'label1', label: 'Label', optional: true, hint: 'Hint — only when there’s something useful to say', placeholder: 'default field' })}
    ${field({ name: 'host1', label: 'Host', hint: 'github.com, gitlab.com or a self-hosted origin', value: 'github.com' })}
    ${field({ name: 'host2', label: 'Host', hint: 'github.com, gitlab.com or a self-hosted origin', value: 'github', error: 'Enter a valid host, e.g. github.com' })}
    <p class="fcap"><b>order</b> label → hint → error → input → below · <b>error</b> above the input, --failed, no icon · <b>focus</b> brand ring (third field is in error)</p>
  `);

  /* ---------- 2 · password + below async ---------- */
  mount('f-async', 'Password & async below', () => `
    ${field({ name: 'tok1', label: 'Personal access token', hint: 'read-only scope, never synced, never logged', password: true, value: 'ghp_••••••••••••••••••••' })}
    ${field({ name: 'tok2', label: 'Personal access token', password: true, value: 'ghp_••••••••••••••••••••', below: { state: 'busy', text: 'Validating…' } })}
    ${field({ name: 'tok3', label: 'Personal access token', password: true, value: 'ghp_••••••••••••••••••••', below: { state: 'ok', text: 'GitHub detected, signed in as <span class="who">@feedmypixel</span>' } })}
    ${field({ name: 'tok4', label: 'Personal access token', password: true, value: 'ghp_••••••••••••••••••••', below: { state: 'bad', text: 'Could not validate, check the token and host' } })}
    <p class="fcap"><b>below</b> aria-live, text-only · busy=--text-3 · ok=--text-2 · bad=--failed</p>
  `);

  /* ---------- 3 · FormSummary ---------- */
  mount('f-summary', 'FormSummary (role=alert)', () => `
    <div class="fcard"><div class="fcard-pad">
      <div class="form-summary" role="alert">
        <h4>There’s a problem</h4>
        <ul>
          <li><a href="#host2">Enter a valid host, e.g. github.com</a></li>
          <li><a href="#tok5">Enter your personal access token</a></li>
        </ul>
      </div>
      ${field({ name: 'host2b', label: 'Host', hint: 'github.com, gitlab.com or a self-hosted origin', value: 'github', error: 'Enter a valid host, e.g. github.com' })}
      ${field({ name: 'tok5', label: 'Personal access token', hint: 'read-only scope, never synced, never logged', password: true, value: '', error: 'Enter your personal access token' })}
    </div></div>
    <p class="fcap">client validation only · each item links to <b>#field</b> · server errors render in a banner <b>above</b> this</p>
  `);

  /* ---------- 4 · inline banners (form-message) ---------- */
  mount('f-banner', 'Inline banner (form-message)', () => `
    <div class="form-message err"><span>${solidTri('--p-failed')}</span><span><b>Couldn’t add connection.</b> GitHub returned 401 — the token may be expired or lack <code style="font-family:var(--d-mono)">repo:status</code> scope</span></div>
    <div class="form-message ok"><span>${solidCheck}</span><span><b>Connection added.</b> Now watching 5 repositories under <span style="font-family:var(--d-mono)">feedmypixel</span></span></div>
    <p class="fcap">in document flow (not floating) · server <b>$message</b> sits at the very top of the form, above FormSummary</p>
  `);

  /* ---------- 5 · add-connection — all states composite ---------- */
  mount('f-addconn', 'Add a connection — error state', () => `
    <div class="fcard">
      <h3>${I.plus} Add a connection</h3>
      <div class="fcard-pad">
        <div class="form-message err"><span>${solidTri('--p-failed')}</span><span><b>Couldn’t reach that host.</b> Check the origin and try again</span></div>
        <div class="form-summary" role="alert">
          <h4>There’s a problem</h4>
          <ul><li><a href="#ac-host">Enter a valid host, e.g. github.com</a></li></ul>
        </div>
        ${field({ name: 'ac-label', label: 'Label', optional: true, placeholder: 'e.g. work' })}
        ${field({ name: 'ac-host', label: 'Host', hint: 'github.com, gitlab.com or a self-hosted origin', value: 'github', error: 'Enter a valid host, e.g. github.com' })}
        ${field({ name: 'ac-token', label: 'Personal access token', hint: 'read-only scope, never synced, never logged', password: true, value: 'ghp_••••••••••••••••••••', below: { state: 'ok', text: 'GitHub detected, signed in as <span class="who">@feedmypixel</span>' } })}
        <div class="permnote">${solidTri('--p-pending')}<span>Self-hosted origins request <strong>host permission</strong> when you validate — your browser prompts once</span></div>
        <div class="button-group">
          <button class="btn btn-primary">${I.plus} Add connection</button>
          <button class="btn btn-secondary">${I.bolt} Validate</button>
        </div>
      </div>
    </div>
    <p class="fcap">all states on one real form · submit is <b>never disabled</b> (block via validation, not greying)</p>
  `);

  /* ---------- 6 · toasts ---------- */
  function toast(kind, title, msg, action, opts) {
    opts = opts || {};
    const ic = kind === 'info'
      ? `<span class="toast-ic info">${infoIcon}</span>`
      : `<span class="toast-ic">${UI.pill(kind === 'error' ? 'failed' : 'success', { label: false })}</span>`;
    return `<div class="toast ${kind} enter">
      ${ic}
      <div class="toast-main">
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
        ${action ? `<button class="toast-action">${action}</button>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss">${xIcon}</button>
    </div>`;
  }
  mount('f-toasts', 'Toast variants', () => `
    <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">
      ${toast('success', 'Saved', 'Poll interval set to 1 min')}
      ${toast('error', 'Couldn’t save', 'Network error — changes were not stored', 'Retry')}
      ${toast('info', 'Re-checking pipelines', 'Forcing a refresh across 5 repos')}
    </div>
    <p class="fcap">icon + message + optional action + dismiss · left edge carries the status colour</p>
  `);

  /* ---------- 7 · stacking + anchor + undo ---------- */
  mount('f-anchor', 'Anchored & stacked (bottom-right)', () => `
    <div class="toast-anchor">
      <div class="toast-stack">
        ${toast('undo', 'Connection removed', '', 'Undo')}
        ${toast('success', 'Saved', 'Now watching 6 repositories')}
      </div>
    </div>
    <p class="fcap">corner-anchored on the <b>options</b> surface · newest on top · undo dismisses with a <b>subtle fade</b> (no timer)</p>
  `);

  /* ---------- 8 · side panel live · 10s ---------- */
  mount('f-live', 'Active-poll indicator', () => `
    <div class="fcard"><div class="fcard-pad" style="display:flex;align-items:center;gap:14px">
      <span class="live10"><span class="lz"></span> live · 10s</span>
      <span style="font-size:12px;color:var(--p-text-2)">faster polling while the panel is open (vs 1 min idle)</span>
    </div></div>
    <p class="fcap">pulsing dot + label · sits in the side-panel footer/summary · respects reduced-motion</p>
  `);

  /* ---------- submit-button states ---------- */
  mount('f-submit', 'Submit button — states', () => `
    <div style="display:flex;flex-direction:column;gap:18px">
      <div>
        <div class="button-group">
          <button class="btn btn-primary">${I.plus} Add connection</button>
          <button class="btn btn-secondary">${I.bolt} Validate</button>
        </div>
        <p class="fcap"><b>default</b> always pressable — pressing an incomplete form surfaces errors, it never sits dead</p>
      </div>
      <div>
        <div class="button-group">
          <button class="btn btn-primary submitting" aria-busy="true" aria-label="Adding connection">Adding connection…</button>
          <button class="btn btn-secondary" disabled>${I.bolt} Validate</button>
        </div>
        <p class="fcap"><b>submitting</b> the only time it’s disabled — in-flight, so the click can’t fire twice. Spinner + “…” label</p>
      </div>
    </div>
    <p class="fcap" style="margin-top:14px"><b>never</b> disabled-until-valid · <b>never</b> greyed waiting for input · a user is never left at a dead end</p>
  `);

  /* ---------- interactions ---------- */
  document.addEventListener('click', e => {
    const pw = e.target.closest('.pw-toggle');
    if (pw) {
      const inp = pw.parentElement.querySelector('input');
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      pw.textContent = show ? 'Hide' : 'Show';
      return;
    }
    const close = e.target.closest('.toast-close, .toast-action');
    if (close) {
      const t = close.closest('.toast');
      if (!t) return;
      t.classList.add('fading');
      setTimeout(() => {
        const host = t.parentElement;
        t.remove();
        // replay so the demo persists
        setTimeout(() => { if (host && host.children.length === 0) location.reload(); }, 50);
      }, 380);
    }
  });
})();
