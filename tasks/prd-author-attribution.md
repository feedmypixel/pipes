# PRD: Author attribution on rows ("who caused this?")

## Introduction / Overview

When a watched default branch or a PR/MR goes red in Pipes, the user currently can't tell **who**
is behind it without clicking through to the run/PR. This feature adds an **author** to every row —
a small **avatar** (with the person's name in a tooltip, and a link to their provider profile) — so
the user sees who at a glance, in both the side panel and the popup.

It is display-only and independent of the existing **All | Mine** scope filter: attribution answers
_who_, the Mine toggle answers _is it mine_. A `main` row gets an author even though Mine never
hides it.

Design contract: **`design/v5/AUTHOR-ATTRIBUTION.md`** (+ `design/v5/Pipes - Author attribution.html`).

## Goals

1. On every row (default branch + PR/MR), show who is attributed, recognisable at a glance.
2. Make the person reachable: tooltip with their full name, click through to their provider profile.
3. Add zero new token permissions and no per-PR fan-out beyond what we already do.
4. Work in light + dark, in the side panel (~360px) and popup (~440px), down to narrow widths.

## User Stories

- As a developer watching repos, when **main goes red** I want to see **who triggered the breaking
  run** so I know who to nudge, without opening GitHub/GitLab.
- As a reviewer, when a **PR/MR is failing** I want to see **whose PR** it is at a glance.
- As any user, I want to **click the avatar** to open that person's profile, and **hover** to read
  their full name when the avatar alone isn't enough.

## Functional Requirements

1. The system must show an **author avatar** on every default-branch row and every PR/MR row.
2. **Attribution source:**
   1. **PR/MR rows** → the **opener** (GitHub `pull.user`, GitLab `mr.author`) — login already
      captured; also capture avatar URL, profile URL, and display name.
   2. **Default-branch rows** → **whoever triggered the run/pipeline** (GitHub run `actor`; GitLab
      pipeline `user`) — login + avatar URL + profile URL + display name.
3. Each author must carry: a **login**, a **display name** (for the tooltip), an **avatar URL**, and
   a **profile URL**. When any are missing, degrade gracefully (see 7, 8).
4. The avatar must **link to the person's provider profile** (`github.com/<login>` /
   `gitlab.com/<login>`), opening in a new tab. Because the whole row is already a link to the
   run/PR, the author link must be a **separate, valid click target** (per the design's
   split-target stretched-link approach) — not a nested anchor.
5. **Hovering / focusing** the author must surface the **full display name** (tooltip), and the
   avatar must reveal full colour (greyscale at rest per the design).
6. The author **name text** may appear beside the avatar per the v5 design, but is **to be evaluated
   locally** — if it crowds the row at ~360px, fall back to **avatar-only** (name in the tooltip).
   The design's **container-query avatar-only fallback** must be in place either way.
7. **Bots** (Dependabot, Renovate, etc.) must show with their own avatar, attributed as the bot.
8. When there is **no resolvable author** (empty), the row must **render nothing** in the author slot
   and keep the rest of the row (status, ref, time) unmoved.
9. Attribution must show on **all rows**, not only failing ones, and must be **independent of the
   All | Mine filter and the status filter**.
10. The feature must work in **light + dark** and not break the existing whole-row click-through to
    the run/PR.

## Non-Goals (Out of Scope)

- **Store-screenshot refresh** — tracked separately (released together later); see
  `update-store-screenshots` memory.
- **Commit-author attribution** for the default branch (we attribute the run/pipeline triggerer, not
  the commit author) — possible future refinement.
- Per-PR network fan-out to enrich authors beyond the existing list/commit/pipeline fetches.
- Changing the **All | Mine** filter behaviour or the status filter.
- Avatars/attribution anywhere other than the side panel + popup rows (e.g. options, notifications).

## Design Considerations

- Build to **`design/v5/AUTHOR-ATTRIBUTION.md`**: 18px round avatar (16px dense), `--surface-2` fill
  - 1px inset `--border` ring; greyscale at rest → full colour on hover/focus (killed under
    `prefers-reduced-motion`); **initials swatch** as the only no-image fallback (`--text-2`,
    uppercase). Name `--font-size-2xs`, `--text-2`, `max-width: 64px` truncate + ellipsis, full name in
    the `title`. **No new tokens.** Pixel Blue for focus only.
- **Split-target:** the row link is a stretched, absolutely-positioned `<a>` (run/PR, `z-index:0`);
  the author is a sibling `<a>` raised above it (profile, `z-index:1`). Two real anchors, valid HTML,
  two tab stops — no regression to today's whole-row click.
- **Avatar-only fallback:** container query (`@container (max-width: 336px)`) hides the name; requires
  `container-type: inline-size` on the scrolling list.
- Author treatment is **identical on `Row` and `ChangeRow`**; `ChangeRow` keeps its two-line layout
  (title line, then meta line with branch chip left + author/time pinned right).

## Technical Considerations

- Extend the captured author into a small shape (login, name, avatarUrl, profileUrl). `Change.author`
  (login string, used by the Mine filter) must keep working — add the richer fields alongside, don't
  break the Mine match.
- Add attribution to the **default-branch `Pipeline`**: GitHub from the runs list (`actor` /
  `triggering_actor` already in the response — no extra call); **GitLab needs one extra fetch** for
  the pipeline `user` on the default-branch pipeline, mirroring the existing commit-title lookup.
- **Bump `SCHEMA_VERSION`** (snapshots gain the new author fields, like the Mine work did).
- No new scopes: GitHub Actions:read + Pull requests:read, GitLab `read_api` already cover
  `actor` / `user` / `pull.user` / `mr.author`.
- New shared **`Author` Svelte component** (avatar + name + tooltip + profile link), used by both
  `Row` and `ChangeRow`.

## Success Metrics

- On a red main or PR/MR, the user can identify the responsible person (and reach their profile)
  **without leaving Pipes**.
- No new permission prompt for existing users; no measurable extra rate-limit cost (GitLab adds one
  cached fetch per default-branch pipeline, same as the title lookup).
- Rows remain readable at ~360px (status + time never shoved; author degrades to avatar-only).

## Open Questions

1. **Name beside the avatar** — keep it (per v5) or go avatar-only by default? Decide by eyeballing
   locally at 360px (Req. 6). Build supports both via the container-query fallback.
