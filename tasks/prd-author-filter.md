# PRD: Filter PRs/MRs by author

> **Stub.** Captured as a title + intent during dogfooding. Flesh out once a week of real
> use shows whether this is needed and in what shape.

Per account (user/org), let the user choose whose PRs/MRs show in Pipes — at minimum "just
mine", ideally a chosen set of authors — so the list is only the work they care about, not
everyone's open PRs across an org.

## Proposed UX (dogfooding note)

A multi-checkbox selector at the top of the main header listing the **distinct authenticated
users across all accounts, deduped** (the same person added under two accounts shows once).
Each option is `@handle — AccountLabel`, e.g.

- `@feedmypixel` — feedMyPixel
- `@ben.chidgey` — WhiskyInvestDirect

Everything below then shows only the checked users' PRs/MRs.

Open questions for dogfooding to answer:

- **Reduce calls or just filter?** Can we fetch only the chosen authors' PRs/MRs (fewer API
  calls), or do the provider list endpoints not support an author filter cheaply, so it's a
  client-side filter over the existing fetch?
- **Default** — all users checked, or "just me"?
- **Default branches** — still always shown, or also filtered? (Lean: always shown — the core
  "is main broken" signal isn't author-scoped.)

## Scope + placement (undecided)

What the filter applies to:

- **Connector (account) level** — set once per account.
- **Repo level** — per watched repo (some repos you want everyone's, some just yours).
- **A named group of people** — pick a set of authors you follow, not only yourself.

Where the control lives:

- **Buried in settings** — set-and-forget.
- **Quick changer on the side panel** — toggle on the fly while working (like the branch-state pills).

Probably not mutually exclusive (e.g. a per-repo default + a side-panel quick override).

Decide after a week on a repo with other people on it — the real need will be obvious then.
