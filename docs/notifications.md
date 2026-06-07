# Notifications

How Pipes surfaces pipeline changes as desktop notifications, and what the platform lets
us control. Implementation: `src/lib/notify.ts` (sends), `src/background/poll.ts` (decides
when), `src/background/service-worker.ts` (click handling).

Notifications are the product's core value: loud the moment a watched pipeline breaks, and a
click takes you straight to the failing job.

- [When they fire](#when-they-fire)
- [Click → the job](#click--the-job)
- [What we control](#what-we-control)
- [Permissions](#permissions)

## When they fire

The poll loop diffs each fresh pipeline against the last snapshot and only notifies on a
**transition** — never on steady state. See `decideAction` in `poll.ts`.

| Transition                  | Function             | Priority | Sticky                     |
| --------------------------- | -------------------- | -------- | -------------------------- |
| Default branch → failed     | `notifyMainFailed`   | 2        | yes (`requireInteraction`) |
| Open PR/MR → failed         | `notifyChangeFailed` | 1        | no                         |
| Previously-failed → success | `notifyRecovered`    | 0        | no                         |

- **First sight is silent.** A repo whose pipelines are already red when you add it seeds the
  baseline without firing — no notification storm.
- **Recovery** only fires when the previous state was `failed`, and only if `notifyOnSuccess`
  is on (Settings).

## Click → the job

Each notification stores its target URL (`notifLinks` in `chrome.storage`) keyed by the
notification id. Clicking the body or the `Open` button (`onClicked` / `onButtonClicked`) opens
that URL in a new tab and clears the link; a dismissal (`onClosed`) just clears it. So a click
always lands on the exact run / PR / MR, even much later.

## What we control

`chrome.notifications` gives us full control over **text**, partial over **icon**, and almost
none over **sound** or **visual style** — the rest is the OS.

| Aspect               | Control | Notes                                                                                                                                                                                                              |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`              | full    | `<repo> · <ref> failed` / `<repo> · #<n> failed` / `<repo> · <ref> recovered` (repo without owner). State lives in the word + the icon, no emoji.                                                                  |
| `message`            | full    | The run / PR / MR title; `Back to green` on recovery.                                                                                                                                                              |
| `contextMessage`     | full    | The greyed third line: full `owner/repo`, or the head branch for a PR/MR failure.                                                                                                                                  |
| `buttons`            | full    | One `Open` button; clicking it (or the body) opens the run / PR / MR.                                                                                                                                              |
| `type`               | full    | `basic` today; `list` could group several failures, `image`/`progress` also exist.                                                                                                                                 |
| `priority`           | full    | -2…2. Higher = more prominent / persistent.                                                                                                                                                                        |
| `requireInteraction` | full    | Sticky until dismissed. Used for default-branch failures.                                                                                                                                                          |
| `iconUrl`            | partial | A packaged status glyph (`/icons/status-{failed,success}.png`) so the toast leads with a red cross / green tick. **macOS still shows the Chrome icon on the left** (OS rule); our glyph is the image on the right. |
| **Sound**            | none    | `chrome.notifications` has no sound option and no reliable per-notification mute. Plays the macOS default for Chrome (System Settings › Notifications › Google Chrome).                                            |
| Visual style         | none    | Native OS notification — no theming of fonts/colours/layout.                                                                                                                                                       |

### Custom sound (if ever needed)

A service worker can't play audio. A custom sound would require an MV3 **offscreen document**
hosting an `<audio>` element, triggered from the worker. Extra machinery; not built.

## Permissions

`notifications` is declared in the manifest. The OS still gates delivery: macOS must allow
notifications for Google Chrome, or nothing shows regardless of what we send.
