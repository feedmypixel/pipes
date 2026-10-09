# PRD: Replace token

## Introduction / Overview

When a connection's personal access token expires or is revoked, Pipes shows a connection problem
but the only fix today is to delete the connection and add it again. Deleting drops every watched
repo for that connection, so the user has to re-tick them all.

This feature lets the user **replace the token on the existing connection**. The connection keeps
its id, label, host and watched repos; only the token changes. The panel's connection-problem
banner gains a **Replace token** action that jumps straight to the right row in Options.

Design contract: **`design/v6/REPLACE-TOKEN.md`** (+ `design/v6/Pipes - Replace token.html`).

## Goals

1. Swap a token in place without losing watched repos or settings.
2. Make a rejected token obvious in Options (row state + what it costs).
3. Get from the panel's 401/403 banner to the fix in one click.
4. Never point a connection at a different account by accident (would mis-scope "Mine").

## User Stories

- As a user whose token expired, I want to paste a new one on the same connection so my watched
  repos keep working.
- As a user who sees "connection problem: HTTP 401" in the panel, I want one click to the place I
  fix it.
- As a user who pastes a token for the wrong account, I want to be stopped and offered "add it as
  a new connection" instead.

## Functional Requirements

1. **Auth failure is a typed fact.** Non-2xx responses carry their HTTP status (`HttpError`).
   `validateToken` returns it; connection health stores it. A connection's token is failing when
   its health is not ok with status **401 or 403** (rate limits are already separate).
2. **Account identity.** `Account.user` (optional) is captured from `validateToken().user` when a
   connection is added. Legacy accounts without it skip the same-account check and the
   "Must sign in as" hint; it is set on their first successful replace.
3. **Connection row (Options).** Order: dot · label/host · token state · Replace token · remove.
   - Healthy: success dot, `token-ok` icon + "token saved".
   - Token failing: failed dot, inset failed edge, `token-bad` icon + "token rejected", and a note:
     "{Provider} returned **HTTP {status}**. {n} watched repos are paused until you replace the
     token."
   - After a successful replace: "token replaced" until reload.
   - Replace trigger: icon-only key button, `aria-label="Replace token for {label}"`, tooltip
     "Replace token", `aria-expanded` + `aria-controls`; hidden while that row is open.
   - Remove: tooltip "Remove" (not native `title`), `aria-label="Remove {label} connection"`.
   - One row open at a time; row wraps at narrow widths.
4. **Inline replace form** (below the row): Banner (server failure) · FormSummary (client errors)
   · token Field "New personal access token" with the sign-in hint + token help · Save token /
   Validate / Cancel.
   - Validate empty → field error "Enter a token", focus the field.
   - Validate → "Validating…" → "Signed in as @user" | "Could not validate, check the token and its
     permissions" | "Signed in as @x, not @user".
   - Save empty → FormSummary + field error.
   - Save → "Saving token…" (the only disabled moment) → validate →
     - 401/403: Banner "Couldn't replace token. {Provider} returned HTTP {status}, the token may be
       expired or missing a permission".
     - different account: Banner "Couldn't replace token. It signs in as @x, not @user." + link
       "Add it as a new connection instead" (scrolls to the add form, prefilled with host + token).
     - ok: write token (+ `user`), mark health ok, collapse, focus the trigger, toast "Token
       replaced" / "{label} is watching {n} repos again", clear the row's repo-load failure, reload
       its repos, ask the worker to poll now (forced).
   - Cancel / Esc → collapse, discard input, focus the trigger. Field errors clear on input.
5. **Forced poll is never dropped.** A forced poll requested while a cycle is in flight runs a
   fresh forced cycle after it, so the new token is re-validated straight away.
6. **Panel banner (TopAlerts).** For token failures the strip is a `role="status"` region with a
   trailing "Replace token" button (`aria-label="Replace token for {label}"`) that opens Options at
   that row. Other connection errors keep the whole-strip button to Settings. Strip copy and action
   use `--text`; the icon is the solid warning MessageIcon.
7. **Deep link.** `options/index.html#replace={accountId}` opens that row, scrolls it into view,
   focuses the field, flashes a 1.4s `--brand-soft` highlight (none under reduced motion), then
   clears the hash. Works on load and on `hashchange`. An already-open Options tab is reused and
   focused rather than opening a second one.
8. **MessageIcon v2.** Solid circle style (StatusIcon geometry) with variants success, error,
   warning, info, token-ok, token-bad, lock. Banners use 16px, toasts 18px; the Options security
   note uses `lock`.

## Non-Goals (Out of Scope)

- Editing a connection's label (token only for now).
- Changing host or provider of an existing connection.
- Pausing logic changes: unhealthy connections are already skipped by the poll.
- The light-theme contrast of `--failed` on `--failed-bg` and `--success` on `--surface` (flagged
  in the design for a separate ticket).
- PermissionNote's icon (the design table mentions `warning`; left as is pending a decision).

## Design Considerations

- Reuse `Field`, `PasswordInput`, `Button`, `FormSummary`, `Banner`, toasts and `tooltip`; no new
  tokens. The token-help disclosure becomes one shared component for both forms.
- The prototype's negative-margin key↔bin gap becomes an inner button group with `--space-2xs`
  gap; the note indent follows a component-local dot-size property instead of a magic `9px`.

## Technical Considerations

- `HttpError` replaces the plain `Error` thrown for non-2xx in `providers/http.ts`; message text is
  unchanged so existing banners read the same.
- Health entries written before this change have no status, so they read as "not a token failure"
  until the next health pass (≤ 5 min). No `SCHEMA_VERSION` bump: no snapshot derivation changes.
- Options opens via `extension.getViews({ type: 'tab' })` to find an open Options page (set its
  hash, then `runtime.openOptionsPage()` focuses it) or `tabs.create` with the hashed URL. No new
  permissions.
- The DEV chrome shim gains `runtime.getURL` + `extension.getViews` so the showcase/dev surfaces
  keep working.

## Success Metrics

- Replacing an expired token restores polling for all of that connection's watched repos with no
  re-ticking.
- The panel banner clears within one poll of a successful replace.

## Open Questions

- Should PermissionNote switch to the `warning` icon as the design table suggests?
