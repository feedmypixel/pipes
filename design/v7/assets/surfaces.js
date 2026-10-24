/* ============================================================
   Pipes — surface renderers. window.PIPES_SURFACES
   Provider-agnostic: repos grouped by owner (A–Z), one unified status
   icon set, word in hover title.
   ============================================================ */
(function () {
  const D = window.PIPES_DATA;
  const UI = window.PIPES_UI;
  const I = UI.I;

  function logoMark(size) { return window.logoSVG('tick', size); }

  function svcBanner(provider, msg) {
    return `<a class="svc-banner" href="#" target="_blank" rel="noopener noreferrer" title="Open the ${provider} status page — new tab">
      ${I.alert}<span><strong>${provider}</strong> ${msg}</span><span class="svc-go">status ↗</span>
    </a>`;
  }

  function header(opts) {
    return `
      <div class="s-header">
        <span class="s-logo">${logoMark(26)}</span>
        <span class="s-title">Pipes</span>
        <span class="s-actions">
          <button class="icon-btn" title="Refresh now" aria-label="Refresh now">${I.refresh}</button>
          <button class="icon-btn" title="Open side panel" aria-label="Open side panel">${I.sidepanel}</button>
          <button class="icon-btn" title="Options" aria-label="Options">${I.gear}</button>
        </span>
      </div>`;
  }

  // group: {owner, repos}; opts: {dense, allGreen, branchFails}
  function ownerBlock(group, opts) {
    opts = opts || {};
    let rows = '';
    group.repos.forEach(repo => {
      const def = opts.allGreen ? Object.assign({}, D.defaultRef(repo), { status: 'success' }) : D.defaultRef(repo);
      rows += UI.row(repo, def, { dense: opts.dense, shortName: true, headline: !opts.allGreen });
      if (opts.branchFails) {
        const fails = repo.refs.filter(r => !r.isDefault && r.status === 'failed');
        if (fails.length) rows += `<div class="subrows">${fails.map(r => UI.subrow(repo, r, {})).join('')}</div>`;
      } else if (!opts.allGreen) {
        const others = repo.refs.filter(r => !r.isDefault);
        if (others.length) {
          const expanded = repo.id === 'feedmypixel/status-api';
          rows += `<button class="more-refs" data-toggle aria-expanded="${expanded}">
            ${I.chevron}<span>${expanded ? 'Hide' : 'Show'} ${others.length} other branch${others.length > 1 ? 'es' : ''}</span>
          </button>`;
          rows += `<div class="subrows" ${expanded ? '' : 'hidden'}>${others.map(r => UI.subrow(repo, r, {})).join('')}</div>`;
        }
      }
    });
    return `<div class="acct">
      <a class="acct-name" href="#" target="_blank" rel="noopener noreferrer" title="Open ${group.owner} — opens in a new tab">${group.owner}</a>
      <span class="acct-count">${group.repos.length}</span>
    </div><div class="orows">${rows}</div>`;
  }

  function groupsHtml(opts) {
    return D.ownerGroups().map(g => ownerBlock(g, opts)).join('');
  }

  /* ---------------- POPUP ---------------- */
  function popup(state) {
    if (state === 'unconfigured') {
      return `<div class="surface" style="width:380px">
        ${header()}
        <div class="s-empty">
          <div class="ill">${I.plug}</div>
          <h3>Nothing watched yet</h3>
          <p>Connect an account and pick the repositories you want Pipes to keep an eye on.</p>
          <a class="btn btn-primary" href="#">${I.plus} Open setup</a>
        </div>
      </div>`;
    }
    if (state === 'error') {
      return `<div class="surface" style="width:380px">
        ${header()}
        ${svcBanner('GitHub', 'is reporting an incident')}
        <div class="alarm" style="background:var(--p-pending-bg);color:var(--p-pending);border-color:var(--p-pending-line)">
          ${I.alert}<span>Can’t reach 1 of 2 connections</span>
        </div>
        <div class="s-empty">
          <div class="ill warn">${I.alert}</div>
          <h3>Token expired</h3>
          <p>A token stopped working (401). Re-validate it to resume watching those repos.</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:18px">
            <a class="btn btn-primary" href="#">${I.gear} Fix in setup</a>
            <a class="btn btn-secondary" href="#">${I.refresh} Retry</a>
          </div>
        </div>
        <div class="s-foot"><span>Last ok 6m ago</span><span class="spacer"></span><a href="#">Troubleshoot</a></div>
      </div>`;
    }

    if (state === 'pr-failing') {
      const fb = D.failingBranches();
      return `<div class="surface" style="width:380px">
        ${header()}
        <div class="alarm soft">
          ${I.alert}
          <span>${fb.length} branch check${fb.length > 1 ? 's' : ''} failing · <code style="font-family:var(--d-mono)">main</code> is healthy</span>
          <span class="spacer"></span>
          <a class="jump" href="#">view</a>
        </div>
        <div class="s-body scroll">${groupsHtml({ allGreen: true, branchFails: true })}</div>
        <div class="s-foot">
          <span class="live"><span class="ring"></span> live</span>
          <span class="spacer"></span>
          <span>updated just now</span>
        </div>
      </div>`;
    }

    const healthy = state === 'healthy';
    const fails = healthy ? [] : D.failingOnMain();
    const alarm = fails.length
      ? `<div class="alarm">
           <span class="blip"></span>
           <span>${fails.length} failing on <code style="font-family:var(--d-mono)">main</code></span>
           <span class="spacer"></span>
           <a class="jump" href="#">jump ↓</a>
         </div>`
      : '';

    return `<div class="surface" style="width:380px">
      ${header()}
      ${healthy
        ? `<div class="alarm" style="background:var(--p-success-bg);color:var(--p-success);border-color:var(--p-success-line)"><svg viewBox="0 0 16 16" style="width:13px;height:13px"><path d="M13 4 6.5 11 3 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>All ${D.REPOS.length} watched pipelines are green</span></div>`
        : alarm}
      <div class="s-body scroll">${groupsHtml(healthy ? { allGreen: true } : {})}</div>
      <div class="s-foot">
        <span class="live"><span class="ring"></span> live</span>
        <span class="spacer"></span>
        <span>updated just now</span>
      </div>
    </div>`;
  }

  /* ---------------- SIDE PANEL ---------------- */
  function sidepanel() {
    let fail = 0, green = 0, other = 0;
    D.REPOS.forEach(r => {
      const s = D.defaultRef(r).status;
      if (s === 'failed') fail++; else if (s === 'success') green++; else other++;
    });
    return `<div class="surface" style="width:360px;height:620px;display:flex;flex-direction:column">
      <div class="s-header">
        <span class="s-logo">${logoMark(26)}</span>
        <span class="s-title">Pipes</span>
        <span class="s-actions">
          <button class="icon-btn" title="Refresh now">${I.refresh}</button>
          <button class="icon-btn" title="Options">${I.gear}</button>
        </span>
      </div>
      <div class="sp-summary">
        <span class="sp-stat fail"><span class="n">${fail}</span><span class="l">failing</span></span>
        <span class="sep"></span>
        <span class="sp-stat ok"><span class="n">${green}</span><span class="l">green</span></span>
        <span class="sep"></span>
        <span class="sp-stat"><span class="n">${other}</span><span class="l">other</span></span>
        <span class="live"><span class="ring"></span> 30s</span>
      </div>
      ${fail ? `<div class="alarm"><span class="blip"></span><span>${fail} on <code style="font-family:var(--d-mono)">main</code></span></div>` : ''}
      <div class="s-body scroll" style="flex:1;max-height:none">${groupsHtml({ dense: true })}</div>
      <div class="s-foot"><span class="live"><span class="ring"></span> live</span><span class="spacer"></span><span>auto-refresh 30s · updated 12s ago</span></div>
    </div>`;
  }

  /* ---------------- NOTIFICATIONS ---------------- */
  function notif({ status, kind, title, msg, time, actions }) {
    return `<div class="notif ${kind}">
      <span class="notif-status">${UI.pill(status, { label: false })}</span>
      <div class="notif-body">
        <div class="notif-head"><span class="notif-app">${window.logoSVG('tick', 15, { mono: true })} Pipes</span><span class="notif-time">${time}</span></div>
        <div class="notif-title">${title}</div>
        <div class="notif-msg">${msg}</div>
        ${actions ? `<div class="notif-actions">${actions.map((a, i) => `<button class="${i === 0 ? 'primary' : ''}">${a}</button>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  function notifications() {
    return `<div class="notif-stack">
      ${notif({
        status: 'failed', kind: 'loud',
        title: 'main is broken — whiskyinvestdirect/database',
        msg: 'Pipeline #2579137 failed · “Migration 433 + postprocessing”',
        time: 'now',
        actions: ['Open failed job', 'Snooze 1h'],
      })}
      ${notif({
        status: 'success', kind: 'recover',
        title: 'Back to green — feedmypixel/status-api',
        msg: 'main recovered after 1 failed run',
        time: '2m',
        actions: ['View run'],
      })}
      ${notif({
        status: 'failed', kind: 'calm',
        title: 'Check failed on a branch — feedmypixel/status-api',
        msg: 'PR #210 “cap retry budget” failed · main is healthy',
        time: '9m',
        actions: ['Open failed job'],
      })}
    </div>`;
  }

  function badges() {
    const item = (status, label) => `<div class="tb-item">
      <span class="tb tb-status">${UI.pill(status, { label: false })}</span>
      <span class="tb-label">${label}</span>
    </div>`;
    return `<div class="badge-row">
      ${item('success', 'all green')}
      ${item('failed', '1+ failing on main')}
      ${item('running', 'runs in progress')}
    </div>`;
  }

  /* ---------------- OPTIONS ---------------- */
  function accountItem(label, host, valid, self) {
    return `<div class="acct-item">
      <span class="ai-dot ${valid ? 'ok' : 'bad'}"></span>
      <span class="ai-main">
        <span class="ai-label">${label}</span>
        <span class="ai-host">${host}${self ? ' <span class="self">· self-hosted</span>' : ''}</span>
      </span>
      <span class="token-state ${valid ? 'ok' : 'bad'}">
        ${valid ? I.check : I.alert}
        ${valid ? 'token valid' : 'token expired'}
      </span>
      <span class="row-act"><button class="icon-btn" title="Remove">${I.trash}</button></span>
    </div>`;
  }

  function options() {
    const cat = D.REPO_CATALOGUE.gh1;
    const repoItems = cat.map(r => `
      <div class="repo-item ${r.watched ? 'on' : ''}" data-watch>
        <span class="checkbox">${I.check}</span>
        <span class="rn">${r.name}</span>
        <span class="rb">${I.branch} ${r.branch}</span>
      </div>`).join('');

    return `<div class="opt">
      <div class="opt-inner">
        <div class="opt-masthead">
          <span class="s-logo">${logoMark(34)}</span>
          <span><h1>Pipes</h1></span>
        </div>

        <!-- CONNECTIONS -->
        <div class="opt-card">
          <h2>${I.plug} Connections <span class="hint">2 active</span></h2>
          ${accountItem('feedmypixel', 'github.com', true, false)}
          ${accountItem('whiskyinvestdirect', 'gitlab.com', true, false)}
          ${accountItem('acme internal CI', 'git.acme-internal.dev', false, true)}
        </div>

        <!-- ADD CONNECTION -->
        <div class="opt-card">
          <h2>${I.plus} Add a connection</h2>
          <div class="opt-pad">
            <div class="form-grid">
              <div class="two-col">
                <div class="field">
                  <label for="conn-label">Label <span class="opt">(optional)</span></label>
                  <input id="conn-label" type="text" placeholder="e.g. work"/>
                </div>
                <div class="field">
                  <label for="conn-host">Host</label>
                  <span class="hint">github.com, gitlab.com or a self-hosted origin</span>
                  <input id="conn-host" type="url" value="https://github.com"/>
                </div>
              </div>
              <div class="field field-mono">
                <label for="conn-token">Personal access token</label>
                <span class="hint">read-only scope - never synced, never logged</span>
                <div class="pw-wrap">
                  <input id="conn-token" type="password" value="ghp_••••••••••••••••••••••••"/>
                  <button class="pw-toggle" type="button">Show</button>
                </div>
                <span class="field-below ok" aria-live="polite"><span class="vk">${UI.pill('success', { label: false })}</span> GitHub detected, signed in as <span class="who">@feedmypixel</span></span>
              </div>
              <div class="permnote">${I.alert}<span>Self-hosted origins request <strong>host permission</strong> when you add them - your browser prompts once to allow <code>git.acme-internal.dev</code></span></div>
              <div class="button-group">
                <a class="btn btn-primary" href="#">${I.plus} Add connection</a>
                <button class="btn btn-secondary" type="button">${I.bolt} Validate</button>
              </div>
            </div>
          </div>
        </div>

        <!-- REPOS -->
        <div class="opt-card">
          <h2>${I.branch} Watched repositories <span class="hint">3 watched</span></h2>
          <div class="opt-pad">
            <div class="repo-search">${I.search}<input type="text" placeholder="Search repositories…"/></div>
            <div class="repo-list">
              <div class="repo-grouphdr">feedmypixel</div>
              ${repoItems}
            </div>
          </div>
        </div>

        <!-- SETTINGS -->
        <div class="opt-card">
          <h2>${I.gear} Settings</h2>
          <div class="opt-pad" style="padding-top:4px;padding-bottom:4px">
            <div class="set-row">
              <span class="si"><span class="t">Poll interval</span><span class="d">How often Pipes checks for new pipeline results. The browser enforces a 0.5 min minimum.</span></span>
              <span class="sc"><span class="stepper"><button>−</button><span class="val">1.0<small> min</small></span><button>+</button></span></span>
            </div>
            <div class="set-row">
              <span class="si"><span class="t">Notify when a pipeline recovers</span><span class="d">Toast when a previously-broken pipeline goes green again.</span></span>
              <span class="sc"><button class="toggle" aria-pressed="true" aria-label="Notify on recovery"></button></span>
            </div>
          </div>
        </div>

        <div class="security-note">${I.lock}<span><b>Your tokens stay on this device.</b> Stored locally, used read-only against the hosts you configure, never synced and never logged.</span></div>

        <div class="opt-save">
          <a class="btn btn-primary" href="#">${I.check} Save changes</a>
          <span class="saved">${I.check} All changes saved</span>
        </div>
      </div>
    </div>`;
  }

  window.PIPES_SURFACES = { popup, sidepanel, options, notifications, badges };
})();
