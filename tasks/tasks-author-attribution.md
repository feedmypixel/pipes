# Tasks: Author attribution on rows

From `prd-author-attribution.md`. Design contract: `design/v5/AUTHOR-ATTRIBUTION.md`.

## Relevant Files

- `src/providers/types.ts` - Add the `Author` type + `attribution` on `Change` and `Pipeline`.
- `src/providers/github.ts` - Capture PR `user` (PR/MR rows) + run `actor` (default branch).
- `src/providers/github.test.ts` - Tests for the GitHub attribution capture.
- `src/providers/gitlab.ts` - Capture MR `author` + a default-branch pipeline `user` fetch.
- `src/providers/gitlab.test.ts` - Tests for the GitLab attribution capture.
- `src/background/poll.ts` - Thread `attribution` into the snapshot (Change + default Pipeline).
- `src/background/poll-cycle.test.ts` - Attribution carried through a poll cycle.
- `src/lib/storage.ts` - Bump `SCHEMA_VERSION` (snapshots gain the author fields).
- `src/lib/storage.test.ts` - Schema-version assertion.
- `src/lib/group.ts` - Point the Mine filter's login match at the new attribution shape.
- `src/lib/group.test.ts` - Update fixtures to the attribution shape.
- `src/lib/components/Author.svelte` - New: avatar + name + tooltip + profile link.
- `src/lib/components/Author.svelte.test.ts` - Unit tests for `Author`.
- `src/lib/components/Row.svelte` - Split-target stretched link + the author slot.
- `src/lib/components/Row.svelte.test.ts` - Updated for the author + two-anchor structure.
- `src/lib/components/ChangeRow.svelte` - Split-target stretched link + the author slot.
- `src/lib/components/ChangeRow.svelte.test.ts` - Updated for the author + two-anchor structure.
- `src/sidepanel/App.svelte` / `src/lib/components/RepoList.svelte` - `container-type: inline-size` on the scrolling list for the avatar-only container query.
- `src/showcase/Showcase.svelte` - Show `Author` + the updated rows for local review.

### Notes

- Tests sit next to source. Component tests are `*.svelte.test.ts` (browser project); pure logic is `*.test.ts` (node). Use `test` (not `it`); vitest globals are available (don't import them).
- Run `pnpm test` (both projects). Gate before committing: `pnpm check && pnpm lint && pnpm test && pnpm build`.
- No new token permissions: `actor` / `user` / `pull.user` / `mr.author` are covered by the scopes we already hold.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git checkout main && git pull`, then `git checkout -b feat/author-attribution`

- [x] 1.0 Author data model + types
  - [x] 1.1 Add an `Author` type to `types.ts`: `{ login: string; name?: string; avatarUrl?: string; profileUrl?: string }`
  - [x] 1.2 Add `attribution?: Author` to `Change` and to `Pipeline` (default-branch row); document that `name` falls back to `login` for the tooltip when absent
  - [x] 1.3 Point the Mine filter at the new shape: `isMine` + `viewerLogins` read the login from `attribution` (keep the existing matching behaviour); remove/retire the old `Change.author` login string
  - [x] 1.4 Update the affected fixtures/types so the project still type-checks (`group.ts`, tests using `author`)

- [x] 2.0 Provider capture + schema bump
  - [x] 2.1 GitHub `listOpenChanges`: map `pull.user` → `attribution` (`login`, `avatarUrl` = `avatar_url`, `profileUrl` = `html_url`; `name` absent → omit)
  - [x] 2.2 GitHub default branch: capture the run `actor` (`login`, `avatar_url`, `html_url`) onto the default-branch `Pipeline.attribution` (already in the runs payload — no extra call)
  - [x] 2.3 GitLab `listOpenChanges`: map `mr.author` → `attribution` (`login` = `username`, `name`, `avatarUrl` = `avatar_url`, `profileUrl` = `web_url`)
  - [x] 2.4 GitLab default branch: fetch the pipeline `user` for the default-branch pipeline (one call, cached per pipeline id like `commitTitle`) → `Pipeline.attribution`
  - [x] 2.5 Thread `attribution` through `poll.ts` into the snapshot (Change + default Pipeline)
  - [x] 2.6 Bump `SCHEMA_VERSION` in `storage.ts` (+ the version comment) so stale snapshots are dropped

- [x] 3.0 `Author` component
  - [x] 3.1 Create `Author.svelte` taking an `Author`; render nothing when it's absent
  - [x] 3.2 Avatar: 18px round (16px in a `dense` variant), `--surface-2` fill + inset `--border` ring, `object-fit: cover`, greyscale at rest → full colour on hover/focus, transition off under `prefers-reduced-motion`
  - [x] 3.3 Initials fallback when no `avatarUrl`: derive from `name`/`login`, `.ini` styling (`--text-2`, uppercase, no greyscale)
  - [x] 3.4 Name beside the avatar: truncate (`max-width: 64px`, ellipsis), full name in the `title`; underline + brighten on hover
  - [x] 3.5 Make the component the profile anchor: `<a href={profileUrl} target="_blank" rel="noopener noreferrer" aria-label="Open {name}'s profile — opens in a new tab">`, `position: relative; z-index: 1`, `:focus-visible` brand ring
  - [x] 3.6 `Author.svelte.test.ts`: avatar vs initials, name truncation present, link `href` + `aria-label`, renders nothing for an empty author

- [x] 4.0 Wire into `Row` + `ChangeRow` (split-target + fallback)
  - [x] 4.1 `Row.svelte`: convert the run link to a stretched `<a class="r-link">` (`position: absolute; inset: 0; z-index: 0`); add `<Author>` to the meta line before the time
  - [x] 4.2 `ChangeRow.svelte`: same stretched link; meta line = branch chip (left) + `<Author>` + time (author/time pinned right per the design); keep the two-line layout
  - [x] 4.3 Add `container-type: inline-size` to the scrolling list and the `@container (max-width: 336px) { .author-name { display: none } }` rule so it drops to avatar-only when narrow
  - [x] 4.4 Preserve current behaviour: whole-row click → run/PR (now via the stretched link), status icon + time positions unchanged, draft dimming intact; focus order = run/PR link then author

- [x] 5.0 Tests + verification
  - [x] 5.1 Update `github.test.ts` / `gitlab.test.ts` for the attribution capture (incl. the GitLab pipeline-user fetch)
  - [x] 5.2 Update `poll-cycle.test.ts` (attribution in the snapshot) + `group.test.ts` / Mine fixtures + `storage.test.ts` (version)
  - [x] 5.3 Update `Row.svelte.test.ts` / `ChangeRow.svelte.test.ts` for the author + two-anchor structure
  - [x] 5.4 Full gate: `pnpm check && pnpm lint && pnpm test && pnpm build`
  - [ ] 5.5 Functional pass on `dist/`: light + dark, narrow width (avatar-only kicks in), avatar → profile + row → run both work; **decide name-beside-avatar vs avatar-only** (PRD Req. 6 / Open Q1) and tune the breakpoint
  - [ ] 5.6 Independent review (`pr-review-toolkit`) on the diff, then open the PR off `main`
