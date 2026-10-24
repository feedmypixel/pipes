# Pipes — author attribution on rows ("who caused this?")

Companion to `README.md`. Visual reference: **`Pipes - Author attribution.html`** (interactive, light + dark,
panel 360 + popup 440, with the two-target diagram, avatar states, narrow fallback, and a token-only build spec).
This file is the build contract for both row components. **Display only** — author detection, avatar/profile
plumbing, and the data model are engineering's; this is the row's visual + interaction design.

## What it adds
A small **avatar + truncated name** on every row, so a red `main` or PR/MR shows **who** at a glance without a
click-through. Independent of the All | Mine scope filter (that decides *whether* a row shows; this answers *who*).
A `main` row gets a name even though Mine never hides it.

## Decisions (final)
1. **Placement** — author lives on the row's **metadata line, immediately before the relative time**. Status (left) and time (far right) never move; the title/ref takes the flexible middle and truncates first.
2. **Avatar + name** by default (panel + popup); **avatar-only** below ~336px or in a forced dense mode, via a container query on the list.
3. **Truncation** — name ellipsis at **max-width ~64px** (≈ 8–10 chars); **full display name in the `title` tooltip**.
4. **Nested-anchor resolution — split target (stretched link).** The whole row is already one `<a>` to the run/PR; a profile link is a second destination and `<a>`-in-`<a>` is invalid. So the **row link is absolutely positioned to fill the row** (`.r-link { position:absolute; inset:0; z-index:0 }`) and the **author is a sibling `<a>` raised above it** (`.author { position:relative; z-index:1 }`). One visual row, two real anchors, valid HTML, two tab stops, zero regression to today's whole-row click. **Documented fallback:** render the author **non-linking** (avatar + name + `title` only) if the split target is ever fiddly — loses click-to-profile, keeps the "who".
5. **Same author treatment on both** `Row` and `ChangeRow`, so "who" reads consistently.
6. **Avatar** — **18px round** (16px dense). Resolution chain: **photo / bot `avatar_url` → initials swatch** (no third tier). **Greyscale at rest, full colour on hover/focus** so the bright status icons stay the focal point. The **initials fallback is flat neutral** (`--surface-2` fill, `--text-2` ink, `--border` ring) and gets **no filter** (nothing to reveal). Bots (Dependabot/Renovate) use their own `avatar_url` — no special glyph. Unknown / no author → **render nothing** (slot collapses, time stays put).

## ⭐ Layout — one line vs two (important)
The two row components differ in density, so they differ in line count:

- **`Row` (default branch / refs) — stays ONE line.** It's roomy (status · ⭐ · `main` · time, with the repo name on its own line above). Author tucks in just before the time. No structural change.
- **`ChangeRow` (PR/MR) — TWO lines.** Title + long branch names + time genuinely cram at 360px, so it splits into the canonical PR-list shape:
  - **Line 1:** `[status] #num  title…` (title gets the full width, truncates with ellipsis)
  - **Line 2 (meta, indented under the title):** `⎇ branch` on the left · **author + time pinned right**

Author sits on the metadata line near the time in **both** components, so its position reads consistently even though `ChangeRow` is taller.

## Markup
```html
<!-- Row (default branch / ref) — one line -->
<div class="r" data-status="failed">
  <a class="r-link" href={runUrl} target="_blank" rel="noopener noreferrer"
     aria-label="Open the failed job — opens in a new tab"></a>           <!-- ① run/PR, fills row -->
  <span class="r-status">…</span>
  <span class="r-main"><span class="star">★</span><span class="r-name">{repo}</span></span>
  <a class="author" href={profileUrl} target="_blank" rel="noopener noreferrer"   <!-- ② profile, raised -->
     title={fullName} aria-label={`Open ${fullName}'s profile — opens in a new tab`}>
    <span class="avatar"><img src={avatarUrl} alt=""/></span>              <!-- or initials swatch -->
    <span class="author-name">{login}</span>
  </a>
  <span class="r-time">{rel}</span>
</div>

<!-- ChangeRow (PR/MR) — two lines -->
<div class="sub" data-status="failed">
  <a class="r-link" href={prUrl} target="_blank" rel="noopener noreferrer"
     aria-label="Open #152 — opens in a new tab"></a>
  <span class="r-status">…</span>
  <div class="sub-body">
    <div class="sub-title"><span class="pnum">#152</span><span class="r-ref">{title}</span></div>
    <div class="sub-meta">
      <span class="chip-br">⎇ {branch}</span>
      <span class="meta-end">
        <a class="author" …><span class="avatar">…</span><span class="author-name">{login}</span></a>
        <span class="r-time">{rel}</span>
      </span>
    </div>
  </div>
</div>
```

## Key CSS — tokens only
```css
.r, .sub  { position: relative; }
.r-link   { position: absolute; inset: 0; z-index: 0; }       /* run/PR fills the whole row */
.author   { position: relative; z-index: 1; }                 /* island punches above it    */
.r:has(.r-link:focus-visible){ outline: 2px solid var(--brand); outline-offset: -2px; }
.author:focus-visible        { outline: 2px solid var(--brand); outline-offset: 2px;  }

.avatar      { width:18px; height:18px; border-radius:50%; box-shadow:0 0 0 1px var(--border) inset; }
.avatar img  { width:100%; height:100%; object-fit:cover; filter:grayscale(1); opacity:.82; }  /* photos/bots: calm at rest */
.author:hover .avatar img,
.author:focus-visible .avatar img { filter:none; opacity:1; }                                  /* colour on engage */
.avatar .ini { color:var(--text-2); }                                                          /* initials fallback: flat, no filter */
.author-name { max-width:64px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
@container (max-width:336px){ .author-name{ display:none; } }   /* avatar-only fallback */
@media (prefers-reduced-motion:reduce){ .avatar img{ transition:none; } }

/* ChangeRow two-line */
.sub        { align-items: flex-start; }
.sub-body   { flex:1; min-width:0; display:flex; flex-direction:column; gap:var(--space-2xs); }
.sub-meta   { display:flex; align-items:center; gap:var(--space-sm); min-width:0; }
.sub-meta .meta-end { margin-left:auto; display:inline-flex; align-items:center; gap:var(--space-sm); flex:none; }
```
Put `container-type: inline-size` on the scrolling list so the avatar-only query fires per panel/popup width.

## Accessibility (WCAG 2.1 AA)
- Two real focusable anchors per row in DOM order: **run/PR**, then **author**. Row focus ring via `.r:has(.r-link:focus-visible)`; author has its own `--brand` ring.
- Author accessible name comes from **`aria-label="Open {fullName}'s profile — opens in a new tab"`** (a real name, not the tooltip); `title` is supplementary and carries the full name.
- `<img alt="">` (decorative — the link's aria-label names the person). Initials/bot fallbacks are non-text but covered by the same aria-label.
- Greyscale→colour is hover/focus only and respects `prefers-reduced-motion`. Both colour schemes handled by tokens. Hit target ≥ 24px tall.
- Trade-off (no regression): with the stretched `.r-link`, the per-status word tooltip on the status icon isn't surfaced — but the whole row is already one link today, and the link's `aria-label`/`title` describe the destination.

## Tokens
No new tokens. Status circle colours map `canceled/skipped/unknown → --neutral` exactly as `components.js` does — mirror that in the status→token helper. Pixel Blue (`--brand`) for focus/identity only.

## Files
- `Pipes - Author attribution.html` — interactive reference (open in a browser).
- Reuses the app tokens verbatim (inlined for self-containment), the status icon set, and the tick mark.
