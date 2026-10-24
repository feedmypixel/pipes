# Pipes — "Mine" scope filter spec

Companion to `README.md`. Visual reference: **`Pipes - Mine filter.html`** (interactive, light + dark,
shows the recommendation in the real cluster plus the A/B/C comparison). This file is the build contract
for the Svelte control. Author-detection, persistence, and the data model are out of scope (handled in
engineering) — **this is the control's visual + interaction design only.**

## What it is
A new **binary scope axis** on the side panel / popup filter row: show **everyone's** PRs/MRs, or **just mine**.
It is a *different axis* from the multi-select status chips — not an eighth status. The **default branch always
stays visible** regardless of scope (the headline "is main broken?" question isn't author-scoped).

## Decisions (final)
1. **Treatment — A: segmented control `[ All | Mine ]`.** Leads the `.filters` row, divided from the status pills by a right-hand border (mirroring how `toggle-all` uses a left divider). A joined pick-one shape can't be mistaken for a status pill — which was the brief's central requirement. (B, a single "Mine" toggle chip, risks reading as an 8th status; C, its own row, spends scarce vertical height. Both rejected — see the HTML comparison.)
2. **Label — "All | Mine".** "Mine" is the one word true for **both** GitHub PRs and GitLab MRs. ("My PRs" breaks on GitLab; "Owned by me" / "Just mine" wrap at 320px.) The off-state names the other half explicitly: **All**.
3. **Count — silent by default.** At ~320px a count crowds the row. If wanted, show it only as a **muted suffix on the active "Mine" segment** (`Mine · 3`), never a separate badge — variant shown in the HTML. Recommendation: ship without.
4. **Empty state — leave as-is.** Scope on + you own nothing in a repo → `main` shows alone (correct). An optional one-line `no open PRs of yours` is not needed.

## Markup
A `role="group"` wrapper with two `aria-pressed` segment buttons. The wrapper carries the right divider.
```html
<div class="scope-wrap">
  <div class="scope" role="group" aria-label="Show whose PRs and MRs">
    <button class="seg" data-scope="all"  aria-pressed="true">All</button>
    <button class="seg" data-scope="mine" aria-pressed="false">
      <!-- lucide: user-round (13px) -->
      <svg …></svg><span>Mine</span>
    </button>
  </div>
</div>
<!-- then the existing .pills status group -->
```
- Icon: lucide **`user-round`** (or `user`) at 13px, leading the **Mine** segment only. Signals the authorship axis without a brand mark. "All" has no icon.
- It's a **two-state segmented control**: exactly one of All/Mine is pressed at a time (not two independent toggles).

## Styling — tokens only
```css
.scope-wrap{                       /* divider echoing toggle-all, on the other side */
  display:inline-flex; align-items:center; gap:var(--space-sm); flex:none;
  padding-right:var(--space-sm); border-right:1px solid var(--border);
}
.scope{
  display:inline-flex; align-items:center; flex:none;
  border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; background:var(--bg);
}
.scope .seg{
  display:inline-flex; align-items:center; gap:var(--space-2xs);
  padding:var(--space-3xs) var(--space-sm); border:0; background:transparent; cursor:pointer;
  color:var(--text-3);
  font:var(--weight-regular) var(--font-size-sm)/var(--leading-none) var(--font-sans);
}
.scope .seg + .seg{ border-left:1px solid var(--border); }   /* internal divider */
.scope .seg svg{ width:13px; height:13px; flex:none; }
.scope .seg:hover{ color:var(--text-2); }
.scope .seg[aria-pressed="true"]{        /* the SAME filled-control tokens as status chips + sort */
  background:var(--control-on); color:var(--control-on-ink); font-weight:var(--weight-medium);
}
.scope .seg:focus-visible{ outline:2px solid var(--brand); outline-offset:-2px; border-radius:2px; }
```
- **No new tokens, no hex.** Active fill = `--control-on` / `--control-on-ink` / `--control-on-edge` (identical to the status chips, so the two controls feel related but the *shape* keeps them distinct). Padding `--space-3xs` matches the chips so heights line up.
- Focus is `--brand` (Pixel Blue, identity/focus only — never a status colour), inset so it reads inside the joined control.

## Layout & wrapping (tight widths)
The `.filters` row is `display:flex; align-items:flex-start`. The scope is `flex:none` and anchors top-left; the
status `.pills` group wraps as a unit *after* the divider. **Scope never splits; status never crowds it.** Verified
down to ~320px and at the popup's narrower width — see the HTML at 340px.

## Interaction & accessibility (WCAG 2.1 AA)
- Clicking a segment sets scope; the other segment's `aria-pressed` flips to `false`. Always one active.
- **Keyboard:** group is tab-reachable; ←/→ roving between segments; Enter/Space activates. (Standard radio-group semantics — you may alternatively use `role="radiogroup"` + `role="radio"`/`aria-checked` if it fits the codebase better; `aria-pressed` toggle buttons are fine too. Pick one and be consistent.)
- `focus-visible` ring on each segment; group has an `aria-label`.
- **No transition** needed (instant state); nothing to gate on `prefers-reduced-motion`, but don't add motion that would. Works in both colour schemes (tokens handle it).
- Buttons never disabled (it's a toggle — moot, but consistent with the house rule).
- Hit target ≥ 24px tall via the chip-matched padding.

## Persistence (engineering, noted for context)
Panel-local, like the status chips (`localStorage`). Default scope = **All**.

## Files
- `Pipes - Mine filter.html` — interactive reference (recommendation in-cluster, A/B/C comparison, optional count variant). Open in a browser.
- Reuses the app tokens verbatim (the HTML inlines `tokens.css` for self-containment).
