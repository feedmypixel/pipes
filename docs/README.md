# Docs

Reference docs for Pipes. Implementation details live next to the code; these cover the
cross-cutting behaviour.

- [`faq.md`](faq.md) — why status isn't instant (60s cache), rate limits, token scopes, notifications.
- [`notifications.md`](notifications.md) — when notifications fire, what we control, platform limits.
- [`releasing-to-chrome-web-store.md`](releasing-to-chrome-web-store.md) — package + publish to the CWS.

## Principles (WIP)

The shared engineering **principles** (CSS architecture, forms, and the rest) are being
authored in `~/Projects/status/status-ui/principles` and will be referenced from here once
ready. The previous in-repo `css.md` and `forms.md` were removed in favour of that single
source of truth.

Being created:

- **CSS** — tokens, scales, vertical rhythm, scoped-component rules.
- **Forms** — field order, validation, banners/toasts, ARIA wiring.
- **Progressive enhancement** — works-without, layer-on-top.
- **UX** — interaction + content conventions (no disabled buttons, sentence case, etc.).
