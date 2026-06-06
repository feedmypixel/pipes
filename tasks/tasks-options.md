# Tasks: Options surface

From `tasks/prd-options.md`. Where Pipes is configured (connections, repos, settings).
Design: `design/v1/` (options section). Writes `accounts` / `watchedRepos` / `settings`.

## Tasks

- [x] 0.0 Create feature branch (`feature/options`)
- [ ] 1.0 Pure helpers + tests — `normaliseHost`, `saasProvider` (provider from a SaaS host)
- [ ] 2.0 Options shell — centred 720px column, masthead, card/section primitives, security note
- [ ] 3.0 Connections — list (dot / label / host / token-state / remove) + add-connection form (label / host / token + show-hide), forms-spec layout
- [ ] 4.0 Validate + provider detection (SaaS by host, self-hosted by probe) + host-permission request; persist accounts
- [ ] 5.0 Repo picker — search + grouped checkbox list from `listRepos`; persist `watchedRepos`
- [ ] 6.0 Settings (poll-interval stepper + notify toggle) + save; extend dev-chrome shim (mock validate/listRepos); verify (screenshot) + gates
