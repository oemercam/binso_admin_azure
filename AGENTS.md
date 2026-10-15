<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Batched validation

- Treat follow-up prompts for the same feature as one work package. Continue from
  the existing branch and documented evidence; a prompt alone does not invalidate tests.
- During implementation use `pnpm qa:fast` (optionally `--typecheck`) and focused
  non-browser tests. `qa:fast` and `qa:integration` start browsers only with `--browser`.
- Keep incomplete work in a draft PR. Quality still runs static, security, database
  and build gates; browser jobs run when the PR becomes ready for review.
- Once a coherent package is complete, run the scoped browser gate for affected
  behavior. Repeat only after relevant changes, failures or unresolved concerns.
- Standard/full QA, ready PRs, main, nightly and release coverage remain enforced.
  Never present deferred browser checks as passed or as release acceptance.
- Record tested commit/scope, results and remaining checks in the existing work report.
  Do not deploy production or change production infrastructure without authorization.
