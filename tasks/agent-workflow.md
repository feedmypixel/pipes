# Agent Workflow

How we build Pipes safely with Claude Code: one implementer + one reviewer, sequential,
branch + PR per feature. Solo + agent-assisted.

## Contents

- [TL;DR](#tldr)
- [The loop](#the-loop)
- [Branching + PRs](#branching--prs)
- [Safety rules](#safety-rules)
- [PRD changes mid-build](#prd-changes-mid-build)

## TL;DR

- **One implementer agent + one reviewer agent, sequential.** Not parallel.
- **Branch + PR per feature** (the PRD's task list starts with `0.0 Create feature branch`).
- **Husky pre-push enforces `check + lint + test + security-audit`.** Never `--no-verify`.
- **Load the extension and use it** as surfaces land, your eyes catch what agents miss.
- **≤30 min unsupervised agent runs.** Checkpoint, review, course-correct.

## The loop

```
1. Implementer builds one task (tight scope) against the task list
2. Run tests; skim the diff
3. Reviewer agent scans the diff
4. Read findings; apply HIGH + MEDIUM, defer LOW with a reason
5. Commit; push to the feature branch
6. PR; you gate the merge
7. Next task
```

### Implementer

The default Claude Code agent (this conversation, or a fresh one per feature). Give it tight
scope: "Implement task 1.2 in `tasks-design-foundation.md`, the `StatusIcon` component per
the PRD. Don't touch other tasks. Run tests when done." Avoid "build the whole thing".

### Reviewer

`pr-review-toolkit:code-reviewer` on the diff before each PR. Brief it with the feature, the
PRD section, and the conventions likely to apply (no suppressions, comments-minimal, tokens-not-hex,
Svelte 5 runes, no em-dashes). Other useful agents:

- `pr-review-toolkit:silent-failure-hunter`, error-handling-heavy changes
- `pr-review-toolkit:type-design-analyzer`, new/refactored types
- `feature-dev:code-explorer`, understand existing patterns before integrating
- `Explore`, fast read-only search

## Branching + PRs

```bash
git checkout -b feature/design-foundation
# ... build, commit ...
git push -u origin feature/design-foundation
gh pr create --title "feat: design foundation" --body "..."
gh pr merge --squash --delete-branch   # after you've gated it
```

CI runs `lint + check + test + security-audit` as separate checks on every PR; husky runs
the same gate on pre-push. The repo is free + private, so GitHub server-side **required**
status checks aren't available (Pro or public only). The merge gate is therefore: husky
pre-push (never `--no-verify`) + CI as a visible signal + your review. One feature, one PR.
Skip the ceremony only for trivial single-line/doc fixes.

## Safety rules

1. Husky pre-push runs the gate. Never bypass with `--no-verify`; fix the underlying issue.
2. Push after every meaningful commit.
3. One feature, one PR.
4. Trust but verify agent "done" claims, read the files, run the tests yourself.
5. Test-driven for non-trivial logic, the test goes in first (or the agent writes it).
6. Copy patterns explicitly when delegating ("match `Row.svelte`'s shape").
7. Functional check: load the unpacked extension and exercise the surface before the PR.

## PRD changes mid-build

- **User-facing change** (a surface behaviour, a new permission, copy) → update the PRD first,
  commit the doc, then code to it.
- **Internal refactor** (rename, file split, type tweak) → just code.

Don't "update the PRD later". It never happens.
