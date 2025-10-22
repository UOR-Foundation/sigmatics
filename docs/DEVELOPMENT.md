# Sigmatics Development Reference

This document captures the day-to-day workflows for contributors using a
"documentation-driven" mindset. Every change should update the relevant sections
here or in other docs so the repository remains self-explanatory.

## Project Setup

```bash
npm ci          # install exact dependency tree
npm run build   # compile atlas-*.ts into dist/
npm test        # run spec-aligned test suite (ts-node)
```

Optional tooling:

- `npm run lint` runs ESLint across the TypeScript sources.
- `npm run format` applies Prettier to code and Markdown.
- `npm run build:site` bundles the React playground (requires Vite/React deps).

## Repository Layout

```
atlas-*.ts       core library modules
index.tsx        React playground (Vite entry)
examples.ts      Cookbook-style demonstrations
playground.ts    Interactive CLI showcase
validate.ts      Input validation helpers for bespoke workflows
docs/            Specs, guides, and architecture notes
```

`tsconfig.json` only includes `atlas-*.ts` so new entry points (CLI, additional tooling)
require widening the include patterns.

## Coding Conventions

- **Zero runtime dependencies**: keep the library dependency-free. Utilities must live
  in the existing modules; additional packages are only for tooling or UI builds.
- **Transforms first-class**: centralise rotation/twist/mirror logic in
  `atlas-class.ts`. Evaluators should call into the helpers instead of reimplementing
  algebra.
- **Right-to-left sequencing**: sequential composition (`Seq`) executes last item first.
  Tests assert on both literal and operational outputs—maintain this invariant when
  rewriting traversals.
- **Error messaging**: lexer/parser errors are asserted by substring in tests. Preserve
  wording when changing validation checks.
- **Documentation driven**: whenever behaviour changes, update the test suite and
  relevant Markdown (README, guides, this file) in the same commit.

## Testing Strategy

The handwritten `atlas-test.ts` provides comprehensive coverage:

- **Specification vectors** validate parity with the formal spec.
- **Unit suites** cover lexer, parser, class system, evaluator, belt, and integration
  behaviours.
- `runTest` standardises success/failure reporting. If you add new sections, follow the
  existing pattern so human-readable output stays consistent.

Supplemental testing ideas:

- Extend `examples.ts` with real-world scenarios and verify outputs manually.
- Build the playground (`npm run build:site`) and inspect the UI when making API changes.

## Release Workflow

1. Ensure `npm run lint`, `npm run format`, `npm test`, and `npm run build` succeed.
2. Update version numbers and changelog (if maintained) in a documentation-driven pass.
3. Publish to npm (`npm publish --access public`) after confirming dist/ artefacts exist.
4. Push to `main`; the GitHub Pages workflow publishes the playground automatically.

## GitHub Pages Deployment

The workflow at `.github/workflows/deploy-pages.yml`:

- Checks out code, runs `npm ci`, compiles the library, sets the Vite base path, and
  builds the site.
- Uploads the `dist/` artefact and deploys via `actions/deploy-pages@v4`.
- Automatically adjusts the base path for org/user repositories (`*.github.io`).

Verify changes locally with `npm run build:site` before pushing to avoid deployment
surprises.

## Documentation Checklist

Before merging a feature or fix:

1. Update README snippets if the public API changed.
2. Add or refresh examples/tests demonstrating new behaviour.
3. Touch the most relevant guide (`ARCHITECTURE.md`, `DEVELOPMENT.md`, Quickstart) so
   future contributors can pick up the context without spelunking the git history.
4. Re-run `npm run format` to keep Markdown and code consistent.

Maintaining the docs alongside code keeps Sigmatics accessible and reduces ramp-up time
for new contributors.
