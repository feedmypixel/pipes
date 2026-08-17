# Dependencies

`pnpm security-audit` (`pnpm audit --audit-level=moderate`) gates every push and runs in CI. It must
stay green, so anything that cannot be fixed is recorded here rather than left to rot silently.

## Overrides

Transitive packages pinned forward in `pnpm-workspace.yaml`, because the package that depends on them
still asks for a vulnerable range:

| Package       | Pinned to | Pulled in by                     |
| ------------- | --------- | -------------------------------- |
| `adm-zip`     | `^0.6.0`  | build tooling                    |
| `shell-quote` | `^1.8.5`  | build tooling                    |
| `fast-uri`    | `^3.1.5`  | `stylelint > table > ajv`        |
| `js-yaml`     | `^4.3.1`  | `stylelint > cosmiconfig`        |
| `nanoid`      | `^3.3.18` | `eslint-plugin-svelte > postcss` |

All are dev-only. Nothing here reaches the packaged extension, whose only runtime dependencies are
`@lucide/svelte` and `pino`.

## Accepted advisories

Two advisories are ignored in `pnpm-workspace.yaml` under `auditConfig.ignoreGhsas`:

| Advisory              | Package      | Why accepted                                                                            |
| --------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `GHSA-w3rx-r6r6-pgpr` | `image-size` | No fixed version exists — the advisory asks for `>= 2.0.3` and npm's latest is `2.0.2`. |
| `GHSA-5p2g-fcmc-qvqq` | `image-size` | Same package, same missing release.                                                     |

`image-size` arrives via `web-ext > addons-linter`, which only runs when linting or packaging the
Firefox build locally. It never touches user data and is not shipped.

**Remove both entries as soon as `image-size` publishes a patched release** and let the audit fail
loudly again if anything regresses.
