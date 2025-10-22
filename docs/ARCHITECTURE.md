# Sigmatics Architecture Guide

Sigmatics implements the Atlas Sigil Algebra specification in TypeScript. This guide
summarises the moving parts of the codebase so future contributors can reason about
changes without re-reading the entire source.

## High-Level Pipeline

```
┌──────────────┐   tokenize    ┌─────────────┐   parse    ┌──────────────┐
│ source text  │ ───────────▶ │ Token[]     │ ─────────▶ │ AST (Phrase) │
└──────────────┘              └─────────────┘            └──────────────┘
                                                            │      ▲
                                              evaluateLiteral│      │evaluateOperational
                                                            ▼      │
                                                      ┌───────────────┐
                                                      │ Literal bytes │
                                                      │ Operational   │
                                                      │ words         │
                                                      └───────────────┘
```

1. `atlas-lexer.ts` turns sigil text into tokens, preserving position metadata for
   accurate error messages.
2. `atlas-parser.ts` converts the token stream into an AST shaped by `atlas-types.ts`.
   Transforms (`R`, `T`, `~`) can appear either as prefixes (wrapping subtrees) or
   postfix modifiers on sigils.
3. `atlas-evaluator.ts` interprets the AST twice: `evaluateLiteral` yields canonical
   byte representatives and (optionally) belt addresses, while `evaluateOperational`
   produces human-readable control words.
4. `atlas-class.ts` exposes utilities for translating between bytes, class indices,
   sigil components, and belt addresses. Both evaluators delegate to this module for
   canonicalisation and transform algebra.
5. `atlas.ts` is the façade consumed by library users. It orchestrates the pipeline
   and re-exports core helpers so the published package exposes a single entry point.

## Module Overview

### `atlas-types.ts`

Defines the AST, sigil metadata, result shapes, and class/belt structures. Sequential
composition runs right-to-left; parallel composition holds independent sequential
branches.

### `atlas-lexer.ts`

A single-pass lexer. It skips whitespace/comments, recognises `||` as parallel, and
maps generator keywords to the `GENERATOR` token type. Unexpected characters raise
era-highlighted errors (tests assert on substrings, so preserve message wording).

### `atlas-parser.ts`

Recursive descent parser with explicit lookahead for transforms. It guarantees all
tokens are consumed (final `EOF` check) and emits helpful range validation errors for
classes (`c0..c95`) and pages (`0..47`). Nested transforms use the same AST node as
prefix transforms at the phrase level, so rewrite passes can treat them uniformly.

### `atlas-evaluator.ts`

Contains two mutually independent traversals:

- `evaluateLiteral` walks the AST, pushes transformed sigils through
  `encodeComponentsToByte`, and collects optional belt addresses. Transforms are
  combined via `combineTransforms`, ensuring postfix modifiers apply before prefix
  scopes.
- `evaluateOperational` lowers the AST to a sequence of control words. The walker
  inserts `⊗_*` markers only when actual parallelism is present, mirroring the spec.

Shared helper functions live beside these walkers. The design keeps the evaluator free
from parsing/lexical concerns, making it safe to reuse from other AST producers.

### `atlas-class.ts`

Authoritative implementation of the 96-class resonance structure and belt addressing.
Key exports include:

- `decodeByteToComponents` / `encodeComponentsToByte`
- `componentsToClassIndex` / `classIndexToCanonicalByte`
- `applyTransforms` (`R`, `T`, `M` semantics) and friends
- `computeBeltAddress` / `decomposeBeltAddress`

Both evaluators defer to these helpers for canonical forms and error checking, keeping
transform rules in one place.

### `atlas-test.ts`

The spec-aligned test harness. It uses `runTest` to standardise output, covers all
formal vectors, and doubles as working documentation. Add new unit tests through the
existing sections (lexer/parser/class/evaluator/belt/integration) to keep output
consistent.

### `index.tsx`

React playground that wraps the library for exploratory use. Built with Vite, it
relies on the same bundler configuration as eventual documentation builds. Changing
API surfaces in the core library may require keeping this UI in sync.

## Build & Distribution

- `npm run build` compiles TypeScript sources (`tsconfig.json` includes `atlas-*.ts`).
- `npm run build:site` runs Vite to bundle the playground into `dist/` for GitHub Pages.
- The GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) installs with
  `npm ci`, builds the library and site, and publishes to GitHub Pages using
  `actions/deploy-pages`.
- The published npm package (`@uor-foundation/sigmatics`) exports the façade (`atlas.ts`) and supporting
  modules via package exports, keeping zero direct runtime dependencies.

## Extending the System

1. **New generators**: update `atlas-evaluator.ts` (`lowerOperation`) and extend the
   `GeneratorName` type in `atlas-types.ts`. Tests should cover both literal and
   operational semantics.
2. **Transform logic**: adjust `atlas-class.ts` (never duplicate logic in evaluators) and
   ensure spec wording remains in errors for compatibility with existing tests.
3. **Parser updates**: modify grammar helpers and update tests to assert on ambiguous
   constructs. Lexer changes often require parser/test adjustments in tandem.
4. **Public API**: mirror new helpers in `atlas.ts` and re-export them in `index-1.tsx`
   (the packaging façade).

## Testing Workflow

- `npm test` executes `atlas-test.ts` via `ts-node`, printing sectioned output.
- Provisionary scripts: `npm run lint` (ESLint) and `npm run format` (Prettier).
- CI relies on these being clean before publish; the GitHub Pages workflow will fail on
  build regressions.

## Related Documentation

- `README.md` – high-level introduction and API samples.
- `QUICKSTART.md` – step-by-step install, build, and transform examples.
- `IMPLEMENTATION_SUMMARY.md` – catalogue of included files and artefacts.
- `docs/` – formal specs, byte mappings, and this architecture guide.

Use this document as a starting point when planning significant changes. Update the
relevant sections in tandem with code to keep the repository documentation-driven.
