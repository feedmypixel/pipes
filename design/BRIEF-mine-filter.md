# Pipes design brief — "Mine" ownership filter

Extends `design/v1` + `design/v2`. Same system (tokens in `design/v1/assets/pipes.css`, OKLCH
status palette, cool-slate neutrals, Pixel Blue `#3194FC` for identity/focus only — never a
status colour, system font, Lucide). Mock in **light + dark**, annotate colours/spacing (4px
rhythm). One small control slotting into an existing cluster — no new bundle expected.

## The request

A user asked to narrow the side panel to **main + only the PRs/MRs they authored**, to cut noise
in busy repos. Engineering is scoped: "owned" = **I opened this PR/MR** (matched against my
authenticated login per account); the **default branch always stays visible**. This brief is only
the control's look + interaction.

## Where it lives

The side panel (`src/sidepanel/App.svelte`) already stacks a control cluster under the app bar:

```
┌─────────────────────────────────────────────┐
│  Pipes              ● live · 10s   ↻   ⚙     │  app bar
├─────────────────────────────────────────────┤
│  🔍  Filter repositories…                  ✕ │  search
├─────────────────────────────────────────────┤
│  failed running pending success …  | Clear all│  status chips + toggle-all
└─────────────────────────────────────────────┘
```

- **Status chips** — a *multi-select set* (failed / running / pending / success / canceled /
  skipped / unknown). Lowercase pills, `.on` = filled (`--control-on` / `--control-on-ink` /
  `--control-on-edge`).
- **toggle-all** — a text button ("Clear all" / "Select all"), divided by a left border.

The new control is a **different axis** — a binary *scope* (everyone ↔ just me), not an eighth
status. It must read as distinct from the status set.

## Decisions needed

1. **Treatment** — pick one (or better):
   - **A. Segmented** `[ All | Mine ]` in the filters row, divided from the status chips like
     toggle-all is.
   - **B. Single toggle chip** "Mine" that lights `.on` when active, set apart from the status
     pills (own group + divider).
   - **C. Its own thin row** above/below the status chips.
2. **Label** — one universal word that fits GitHub (PRs) + GitLab (MRs): "Mine" / "My PRs" /
   "Owned by me" / "Just mine".
3. **Optional count** — when active, show how many are hidden, or stay silent? (cheap to supply)
4. **Empty state** — filter on, I own nothing in a repo → still shows main alone. Treatment, or
   leave as-is?

## Constraints

- Tokens only, no hex/utility classes. Sentence case, no all-caps. No GitHub/GitLab brand marks —
  universal Lucide glyph only (e.g. `user` / `user-round`).
- **Width is tight**: side panel ~320–360px, status chips already wrap; the popup is narrower.
  Must survive wrapping.
- WCAG 2.1 AA, `focus-visible` (brand ring), keyboard reachable, both schemes,
  `prefers-reduced-motion`. No disabled states (it's a toggle).

## Deliver

A treatment recommendation (A/B/C) + chosen label, light + dark, expressed in tokens against the
cluster above — enough to build the Svelte control to match. Flag any new token.

## Out of scope

Author detection, persistence (panel-local localStorage, like the status chips), data model — all
engineering.
