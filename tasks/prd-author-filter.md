# PRD: Filter PRs/MRs by author

> **Stub.** Captured as a title + intent during dogfooding. Flesh out once a week of real
> use shows whether this is needed and in what shape.

Per account (user/org), let the user choose whose PRs/MRs show in Pipes — at minimum "just
mine", ideally a chosen set of authors — so the list is only the work they care about, not
everyone's open PRs across an org.

Open questions for dogfooding to answer:

- **Reduce calls or just filter?** Can we fetch only the chosen authors' PRs/MRs (fewer API
  calls), or do the provider list endpoints not support an author filter cheaply, so it's a
  client-side filter over the existing fetch?
- **Default** — "just me", or show all with an author filter control?
- **Where it lives** — a per-account setting vs a surface-level filter (like the branch-state pills).

Decide scope after the dogfood week.
