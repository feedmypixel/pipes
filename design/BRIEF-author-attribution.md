# Pipes design brief — author attribution on rows ("who caused this?")

Extends `design/v4` (current locked direction) + `design/v1`. Same system (tokens in
`design/v4/assets/pipes.css`, OKLCH status palette, cool-slate neutrals, Pixel Blue `#3194FC` for
identity/focus only, system font, Lucide). Mock in **light + dark**, annotate colours/spacing (4px
rhythm). One small addition to existing row components — no new bundle expected.

## The request

When a default branch or a PR/MR goes red, the user wants to see **who caused it at a glance**,
without clicking through to the PR/run. Add an **author** to **every row**: a small **avatar +
truncated name**, hover for the full name, click to the person's provider profile.

This is display only — it's separate from the **All | Mine** scope filter (which decides *whether* a
row shows). Attribution answers *who*; Mine answers *is it mine*. A `main` row gets a name even
though Mine never hides it.

## What the data is (engineering — for context)

- **PR/MR rows** → the **opener** (GitHub `user.login` + `avatar_url`; GitLab `author.username` +
  `avatar_url`). Login → profile URL (`github.com/<login>` / `gitlab.com/<user>`).
- **Default-branch rows** → who triggered / authored the breaking commit (GitHub run `actor`; GitLab
  pipeline `user`). Same shape: name + avatar + profile URL.
- **Bots** (Dependabot, Renovate) → show as the bot. **Unknown / no author** → render nothing.

So every row can supply: avatar image, display name, and a profile URL.

## Where it lives

Two existing components, both a side-panel/popup list row:

- `Row.svelte` — the default-branch + ref rows. Grid today: `[status icon] [⭐/branch + ref name]
  [relative time]`.
- `ChangeRow.svelte` — PR/MR rows. Grid today: `[status icon] [PR icon + #num + title] [branch chip]
  [relative time]`.

Rows are already tight (side panel ~360px, popup ~440px). The avatar+name needs a home in that line.

```
 ✓  ⭐ main                              alex ◑   2h ago
 ✗  ⎇ #210  Retry flaky integration…   ⎇ pr/210   sam ◑   6m ago
```
(illustrative — placement is yours to decide)

## ⚠️ The one real constraint — read this

**The whole row is a single `<a>` linking to the run/PR.** An author link to a *profile* is a
second, different destination — and **a nested `<a>` inside an `<a>` is invalid HTML.** So the
author element **cannot** just be an inline link in the row.

Design needs to account for the author having **its own click target** distinct from the row link.
Options to weigh (pick/guide):
- **Author is its own affordance** sitting *outside* the row's anchor region (e.g. the row anchor
  covers the left/centre, the avatar+name is a sibling link on the right) — visually one row, two
  targets.
- **Author is non-linking** — avatar + name + tooltip only, no profile link (simplest; loses the
  click-to-profile). Acceptable fallback if the split-target treatment is fiddly.

Tell us which, and how the two targets read as one coherent row (hover/focus states for each).

## Decisions needed from design

1. **Placement** — where in the row does avatar+name sit? (before the time? its own slot? under the
   title?) It must survive 360px without shoving the status/time.
2. **Avatar + truncated name vs avatar-only** — lean is **avatar + truncated name**, with
   **avatar-only** as the narrow-width fallback. Confirm the breakpoint / behaviour.
3. **Truncation** — ellipsis + full name in the tooltip. Max width?
4. **The nested-anchor resolution** (above) — split target vs non-linking.
5. **Same treatment for `main` and PR/MR rows?** (lean: identical, so "who" reads consistently.)
6. **Avatar**: size (~16–18px?), round, fallback when no image (initials-on-swatch, like stat? or a
   neutral glyph).

## Constraints

- Tokens only, no hex / utility classes. Sentence case. Pixel Blue for focus/identity only.
- **Avatars are user photos** — fine (not a provider brand mark; the "no GitHub/GitLab marks" rule is
  about *provider* logos, not user avatars).
- Side panel ~360px + popup ~440px — must not crowd the status icon or time.
- WCAG 2.1 AA: the profile target (if a link) needs a real focusable element + accessible name
  ("Open <name>'s profile"); tooltip is supplementary, not the only name source. `focus-visible`,
  keyboard reachable, both colour schemes, `prefers-reduced-motion`.

## Deliver

The row treatment for **both** `Row` and `ChangeRow`, light + dark, at panel + popup widths, in
tokens — including the avatar + name + truncation + the two-target (or non-linking) resolution, with
hover/focus states. Enough to build the Svelte rows to match.

## Out of scope

Data fetching + the avatar/profile plumbing (engineering — no new token permissions needed), and the
All | Mine filter (unchanged).
