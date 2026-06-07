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
- **Where it lives** — the header multi-select above vs a per-account setting.

Decide scope after the dogfood week.
