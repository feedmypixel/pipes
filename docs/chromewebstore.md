# Chrome Web Store Listing: Pipes

> Last Updated: 2026-06-23

Single source of truth for the Chrome Web Store listing: copy each field into the
[Developer Dashboard](https://chrome.google.com/webstore/devconsole) at submission. Excluded from
the shipped zip (it's internal). See also [`releasing-to-chrome-web-store.md`](releasing-to-chrome-web-store.md).

## Store Listing

**Extension Name**
Pipes: watch your CI/CD pipelines

**Short Description** (≤132 chars)
Watch GitHub Actions and GitLab CI/CD pipeline status across the repos you care about.

**Detailed Description**
Pipes watches your GitHub Actions and GitLab CI/CD pipelines and shows you the moment a default branch breaks, so you find out from your browser, not from a teammate.

Pick the repositories you care about and Pipes shows, at a glance, the status of each default branch plus its open pull requests and merge requests. When a branch you watch starts failing, you get a desktop notification and a count on the toolbar; when it goes green again, Pipes tells you that too.

Key features

- One unified view of GitHub and GitLab pipeline status, grouped by owner
- Desktop notifications the instant a default branch fails or recovers
- Open pull requests and merge requests shown with their pipeline status
- A live timer on in-progress runs, so you can see how long a build has been going
- Side panel, popup, and a full options page
- Self-hosted GitLab and GitHub Enterprise supported (added on demand)

How to use it

1. Add a read-only access token for GitHub (fine-grained: Actions + Pull requests) or GitLab (read_api).
2. Choose the repositories you want to watch.
3. Leave Pipes running. It polls in the background and notifies you when something breaks.

Privacy
Pipes is fully client-side. There is no Pipes server. Your token and all settings stay on your device in local storage, and your token is sent only to the Git host you connected it to. No analytics, no tracking, no third parties. Full policy: https://feedmypixel.com/pipes/privacy

Support and feedback
Report bugs or request features: https://github.com/feedmypixel/pipes/issues

**Category**
Developer Tools

**Single Purpose**
Shows the CI/CD pipeline status of the GitHub and GitLab repositories you choose, and notifies you when a watched default branch fails.

**Primary Language**
English

## Graphics & Assets

| Asset                          | Dimensions  | Status   | Filename                                        |
| ------------------------------ | ----------- | -------- | ----------------------------------------------- |
| Store Icon [REQUIRED]          | 128×128 PNG | ✅ Ready | `icons/icon-128.png`                            |
| Screenshot 1 [REQUIRED]        | 1280×800    | ✅ Ready | `store-screenshots/framed/1-sidepanel-dark.png` |
| Screenshot 2 [RECOMMENDED]     | 1280×800    | ✅ Ready | `store-screenshots/framed/2-author-light.png`   |
| Screenshot 3 [RECOMMENDED]     | 1280×800    | ✅ Ready | `store-screenshots/framed/3-popup-dark.png`     |
| Screenshot 4                   | 1280×800    | ✅ Ready | `store-screenshots/framed/4-notification.png`   |
| Screenshot 5                   | 1280×800    | ✅ Ready | `store-screenshots/framed/5-options-dark.png`   |
| Small Promo Tile [RECOMMENDED] | 440×280     | ✅ Ready | `store-screenshots/framed/6-promo-tile.png`     |
| Marquee Promo Tile             | 1400×560    | ✅ Ready | `store-screenshots/framed/7-marquee-tile.png`   |

### Screenshot Notes

Screenshots 1-3 and 5 (plus the marquee tile) are regenerated from a curated mock scene via
`pnpm capture` → `pnpm frame` — see [`screenshots.md`](screenshots.md). They spread light and dark
and show the surfaces in use, not empty: the side panel with a failing default branch, author
attribution ("see who broke it"), the popup, and the options page. The notification (4) is a
standalone toast mock. 1280×800 is the safest size.

## Permissions Justification

| Permission                 | Type                        | Justification                                                                                                                                                                                              |
| -------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                  | permissions                 | Stores your accounts, read-only token, watched repositories, settings, and cached pipeline status locally on your device.                                                                                  |
| `alarms`                   | permissions                 | Schedules the periodic background poll that refreshes pipeline status while Chrome is running.                                                                                                             |
| `notifications`            | permissions                 | Shows a desktop notification when a watched default branch starts failing or recovers.                                                                                                                     |
| `sidePanel`                | permissions                 | Renders the pipeline dashboard in Chrome's side panel.                                                                                                                                                     |
| `https://api.github.com/*` | host_permissions            | Calls the GitHub REST API to read Actions run status and open pull requests for the repos you watch.                                                                                                       |
| `https://gitlab.com/*`     | host_permissions            | Calls the GitLab REST API to read pipeline status and open merge requests for the repos you watch.                                                                                                         |
| `https://*/*`              | host_permissions (optional) | Requested only at runtime, on a user gesture, when you add a self-hosted GitLab or GitHub Enterprise account, so Pipes can call that server's API. Never requested or used unless you add such an account. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes (handled locally; nothing is sent to us, since there is no Pipes server).

| Data Type                          | Collected?     | Transmitted Off-Device?                            | Purpose                                              | Shared with Third Parties? |
| ---------------------------------- | -------------- | -------------------------------------------------- | ---------------------------------------------------- | -------------------------- |
| Authentication info (access token) | Stored locally | Only to the user's chosen Git host (GitHub/GitLab) | Authenticate read-only API calls for pipeline status | No                         |
| Personally identifiable info       | No             | —                                                  | —                                                    | —                          |
| Web history                        | No             | —                                                  | —                                                    | —                          |
| User activity                      | No             | —                                                  | —                                                    | —                          |
| Website content                    | No             | —                                                  | —                                                    | —                          |

All other categories: not collected.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**: https://feedmypixel.com/pipes/privacy

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name**: Ben Chidgey (feedmypixel)
**Contact Email**: pipes@feedmypixel.com
**Support URL**: https://github.com/feedmypixel/pipes/issues
**Homepage URL**: https://github.com/feedmypixel/pipes

## Additional fields (dashboard)

These appear on the listing form, not the sections above. All optional except where noted.

- **Official URL**: None — only selectable if `feedmypixel.com` is verified in Google Search
  Console; leave None otherwise.
- **Homepage URL**: https://github.com/feedmypixel/pipes
- **Support URL**: https://github.com/feedmypixel/pipes/issues
- **Mature content**: Off (no mature content).
- **Item support visibility**: On — so the Support URL shows on the store listing.

## Version History

| Version | Date       | Changes           | Status |
| ------- | ---------- | ----------------- | ------ |
| 0.1.0   | 2026-06-13 | First submission. | Draft  |

## Review Notes

### Known Issues / Limitations

- The optional `https://*/*` host permission is broad on paper but is requested at runtime only,
  on a user gesture, when adding a self-hosted instance whose origin can't be known at build time.
  Flag this proactively in the review notes, since a broad optional host draws scrutiny.

### Rejection History

<!-- None yet. -->
