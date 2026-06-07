# FAQ

- [Why isn't status instant?](#why-isnt-status-instant)
- [Will watching lots of repos blow my rate limit?](#will-watching-lots-of-repos-blow-my-rate-limit)
- [What token scopes do I need?](#what-token-scopes-do-i-need)
- [Self-hosted GitHub Enterprise or GitLab?](#self-hosted-github-enterprise-or-gitlab)

## Why isn't status instant?

GitHub caches its Actions runs API (`/actions/runs`) for about **60 seconds**
(`cache-control: max-age=60`) — a request returns the same data for up to a minute regardless of
how often you poll, and an ETag doesn't change that. So Pipes is "live within ~a minute," not
instant. GitLab's pipelines API behaves similarly. The failure **notification** is the point, and
firing within a minute is fine for "is main broken?".

While a panel is open, the service worker polls every ~10s; most of those are free `304 Not
Modified` responses, and the panel updates as soon as the provider's cache refreshes.

## Will watching lots of repos blow my rate limit?

Unlikely. Idle polls are conditional (`304`s barely touch the budget — GitHub allows 5000/hr).
If a connection's remaining budget does run low, Pipes **pauses that connection automatically and
resumes when the limit resets**, showing a "rate limited" banner meanwhile. Very large watch lists
just get choppier updates, not errors.

## What token scopes do I need?

- **GitHub** — a fine-grained token with **Actions: read** + **Pull requests: read**.
- **GitLab** — a PAT with **read_api**.

Read-only, stored in `chrome.storage.local`, never synced, never sent anywhere except your Git host.

## Self-hosted GitHub Enterprise or GitLab?

Add the account with its full origin. Pipes requests permission for that host at the moment you
add it (a one-time browser prompt), so no extra setup.
