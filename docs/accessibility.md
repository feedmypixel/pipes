# Accessibility

Pipes targets **WCAG 2.1 AA**: semantic HTML, focus-visible, keyboard reachability,
4.5:1 contrast, `prefers-reduced-motion` + `prefers-color-scheme`. This doc covers how we
audit accessibility and how to add automated checks.

- [What's in place](#whats-in-place)
- [Auditing: the `/a11y-sweep` command](#auditing-the-a11y-sweep-command)
- [Automated checks with axe-core (not wired yet)](#automated-checks-with-axe-core-not-wired-yet)

## What's in place

- **Accessible names** — pipeline / PR-MR rows carry an `aria-label` built from the polished
  status word (`statusVisual().label`, e.g. "passed") plus the default-branch / draft signals
  that are otherwise visual only.
- **Live regions** — the failure alarm is `role="alert"`; rate-limited + all-clear strips are
  `role="status"`, so state changes are announced. Toasts use `role="status"` under an
  `aria-live="polite"` host.
- **Focus** — base CSS sets a `:focus-visible` outline; search wrappers add `:focus-within`
  since the bare input has `outline: 0`.
- **Forms** — inputs are label-associated (the options page wires `aria-invalid` +
  `aria-describedby` for errors); filter inputs carry an `aria-label`.
- **Landmarks + state** — each surface has a `<main>`; toggles expose `aria-pressed` /
  `aria-expanded`; decorative icons are `aria-hidden`, meaningful ones carry labels.
- **Preferences** — animations respect `prefers-reduced-motion`; both themes ship via
  `prefers-color-scheme`.

## Auditing: the `/a11y-sweep` command

A user-level Claude Code slash command (`~/.claude/commands/a11y-sweep.md`) runs a full
WCAG 2.1 AA pass on any repo:

1. An **Explore** subagent audits every surface (semantics, keyboard, focus, ARIA, names,
   contrast, forms, reduced-motion) and reports `file:line` findings + fixes.
2. The fixes are applied, reusing existing label/status helpers.
3. The gate runs, then a **code-reviewer** subagent checks the diff for ARIA misuse or an
   `aria-label` that hides useful inner content.

**It is expert manual review, not a scanner.** It does not run axe-core / Lighthouse, a real
screen reader, or an in-browser keyboard walkthrough. The axe-core setup below is the
mechanical complement.

## Automated checks with axe-core (not wired yet)

Our `browser` Vitest project already renders components in **real Chromium** (via
`@vitest/browser` + `vitest-browser-svelte`), which is the right environment for axe — it needs
real layout, and jsdom/happy-dom miss rules. So we skip the jsdom route entirely.

**1. Install**

```sh
pnpm add -D axe-core vitest-axe
```

**2. Register the matcher on the browser project.** Add a setup file and point the `browser`
project at it in `vitest.config.ts`:

```ts
// vitest-axe.setup.ts
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)
```

```ts
// vitest.config.ts — inside the `browser` project's test block
setupFiles: ['./vitest-axe.setup.ts'],
```

Leave the `unit` (node) project untouched — axe only makes sense against rendered DOM.

**3. Assert no violations** in a `*.svelte.test.ts` (browser project). Render with
`vitest-browser-svelte`, then run axe over the rendered container:

```ts
import { render } from 'vitest-browser-svelte'
import { axe } from 'vitest-axe'
import RepoCard from './RepoCard.svelte'

test('RepoCard has no axe violations', async () => {
  const { container } = render(RepoCard, {
    props: {
      /* ... */
    }
  })
  expect(await axe(container)).toHaveNoViolations()
})
```

> [!NOTE]
> Confirm the exact render return shape against the installed `vitest-browser-svelte`
> version — if `container` isn't exposed, run axe over `document.body`. axe needs the node
> attached to the document, which the browser provider gives us for free.

Once a couple of components are covered, fold the assertion into the shared component-test
helper so every rendered component is axe-checked, and let `pnpm test` (already in CI) gate it.
This catches the mechanical rules — contrast ratios, duplicate ids, ARIA validity — that
manual review can miss.
