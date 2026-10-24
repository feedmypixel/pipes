/* ============================================================
   Pipes — sample data (mirrors src/providers/types.ts shapes)
   Accounts -> watched repos -> latest pipeline per ref.
   ============================================================ */
(function () {
  // Two accounts: a GitHub personal account and a GitLab work account.
  const ACCOUNTS = [
    { id: 'gh1', provider: 'github', label: 'personal', host: 'https://github.com' },
    { id: 'gl1', provider: 'gitlab', label: 'work',     host: 'https://gitlab.com' },
  ];

  // repo: {id, accountId, name, defaultBranch, refs:[{ref,isDefault,status,title,sha,rel}]}
  const REPOS = [
    {
      id: 'feedmypixel/status-api', accountId: 'gh1',
      name: 'feedmypixel/status-api', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'failed', title: 'Bump glob 10.4.5 → 10.5.0 in npm_and_yarn group', sha: 'a1dc0018', rel: '4m' },
        { ref: 'feat/webhooks', isDefault: false, status: 'running', title: 'add delivery retries + signature header', sha: '3edd09b8', rel: '1m' },
        { ref: 'pr/210-retry-budget', isDefault: false, status: 'failed', tag: 'PR #210', title: 'cap retry budget per endpoint', sha: '77aa12c', rel: '9m' },
        { ref: 'fix/timeout-retry', isDefault: false, status: 'success', title: 'raise upstream timeout to 30s', sha: '0afdb7cb', rel: '2h' },
      ],
    },
    {
      id: 'feedmypixel/pixel-cli', accountId: 'gh1',
      name: 'feedmypixel/pixel-cli', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'success', title: 'release: v2.4.0', sha: 'bf51d46f', rel: '5h' },
      ],
    },
    {
      id: 'feedmypixel/marketing-site', accountId: 'gh1',
      name: 'feedmypixel/marketing-site', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'success', title: 'copy tweaks on pricing page', sha: 'da7e2989', rel: '1d' },
        { ref: 'preview/redesign', isDefault: false, status: 'pending', title: 'new hero + nav', sha: '4a9731a5', rel: '12m' },
      ],
    },
    {
      id: '481922', accountId: 'gl1',
      name: 'whiskyinvestdirect/database', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'failed', title: 'WID-404: Migration 433 + postprocessing', sha: '4a9731a5', rel: '8m' },
        { ref: 'WID-254-client-passkey', isDefault: false, status: 'success', title: 'add client_passkey table', sha: 'bf51d46f', rel: '2h' },
      ],
    },
    {
      id: '481930', accountId: 'gl1',
      name: 'whiskyinvestdirect/api', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'success', title: 'WID-261: rate-limit referral endpoint', sha: '1defc339', rel: '40m' },
        { ref: 'WID-263-payout-webhook', isDefault: false, status: 'failed', tag: 'MR !88', title: 'WID-263: payout webhook signing', sha: 'c41be90', rel: '15m' },
      ],
    },
    {
      id: '481945', accountId: 'gl1',
      name: 'whiskyinvestdirect/web', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'running', title: 'WID-439: referral_payouts — add schema', sha: '465cb26c', rel: 'now' },
      ],
    },
    {
      id: '481960', accountId: 'gl1',
      name: 'whiskyinvestdirect/infra', defaultBranch: 'main',
      refs: [
        { ref: 'main', isDefault: true, status: 'canceled', title: 'terraform: bump provider pins', sha: '02d8e074', rel: '3h' },
        { ref: 'spike/arm-runners', isDefault: false, status: 'skipped', title: 'try graviton runners', sha: 'fb50512d', rel: '1d' },
      ],
    },
  ];

  function reposFor(accountId) { return REPOS.filter(r => r.accountId === accountId); }
  function defaultRef(repo) { return repo.refs.find(r => r.isDefault); }
  function accountOf(repo) { return ACCOUNTS.find(a => a.id === repo.accountId); }
  function ownerOf(repo) { return repo.name.split('/')[0]; }
  function projectOf(repo) { return repo.name.split('/').slice(1).join('/'); }
  /** Group every watched repo by owner; owners A–Z, repos A–Z within. Provider-agnostic. */
  function ownerGroups() {
    const map = {};
    REPOS.forEach(r => { const o = ownerOf(r); (map[o] = map[o] || []).push(r); });
    return Object.keys(map).sort((a, b) => a.localeCompare(b)).map(owner => ({
      owner,
      repos: map[owner].slice().sort((a, b) => projectOf(a).localeCompare(projectOf(b))),
    }));
  }
  function failingOnMain() {
    return REPOS.filter(r => { const d = defaultRef(r); return d && d.status === 'failed'; });
  }
  function failingBranches() {
    const out = [];
    REPOS.forEach(r => r.refs.forEach(ref => { if (!ref.isDefault && ref.status === 'failed') out.push({ repo: r, ref }); }));
    return out;
  }

  // catalogue used by the options repo-picker (a watched flag drives the checkbox)
  const REPO_CATALOGUE = {
    gh1: [
      { id: 'feedmypixel/status-api', name: 'feedmypixel/status-api', branch: 'main', watched: true },
      { id: 'feedmypixel/pixel-cli', name: 'feedmypixel/pixel-cli', branch: 'main', watched: true },
      { id: 'feedmypixel/marketing-site', name: 'feedmypixel/marketing-site', branch: 'main', watched: true },
      { id: 'feedmypixel/dotfiles', name: 'feedmypixel/dotfiles', branch: 'main', watched: false },
      { id: 'feedmypixel/sandbox', name: 'feedmypixel/sandbox', branch: 'trunk', watched: false },
    ],
  };

  window.PIPES_DATA = {
    ACCOUNTS, REPOS, REPO_CATALOGUE,
    reposFor, defaultRef, failingOnMain, accountOf, failingBranches, ownerGroups, ownerOf, projectOf,
    STATUS_ORDER: ['success', 'failed', 'running', 'pending', 'canceled', 'skipped', 'unknown'],
    STATUS_LABEL: {
      success: 'success', failed: 'failed', running: 'running', pending: 'pending',
      canceled: 'canceled', skipped: 'skipped', unknown: 'unknown',
    },
  };
})();
