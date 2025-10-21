## Atlas Orientation

- Atlas implements the Atlas Sigil Algebra spec with a parse→evaluate pipeline anchored in `atlas.ts`.
- Core sources follow lexer (`atlas-lexer.ts`), parser (`atlas-parser.ts`), evaluator (`atlas-evaluator.ts`), and class system (`atlas-class.ts`); `Atlas` re-exports everything for consumers.
- AST types in `atlas-types.ts` encode right-associative sequential nodes, parallel branches, and transform wrappers—inspect these before shaping new features.

## Semantics Essentials

- Sequential composition executes right-to-left; keep this invariant when adding passes or rewrites (`lowerToWords` iterates backwards).
- Prefix transforms accumulate through `combineTransforms` and apply to subtrees; postfix sigil modifiers are folded before prefix transforms—mimic this order when extending evaluation.
- Literal backend must return canonical bytes (LSB=0) via `encodeComponentsToByte`; transforms flow through `applyTransforms`.
- Operational backend emits control markers (`⊗_*`, `→ρ[...]`, etc.); adding new generators requires updating `lowerOperation` with precise word forms.
- Belt addresses exist only when a sigil carries `page`; `evaluateLiteral` returns `addresses` only when non-empty, so downstream code should guard for `undefined`.

## Class & Validation Rules

- Class indices live in [0,95] and pages in [0,47]; lexer/parser errors mirror this messaging and tests assert substrings—preserve wording when tweaking errors.
- `atlas-class.ts` treats modality mirroring as XOR on transforms and maps d={0,1,2} to bit pairs {00,10,01}; reuse helpers instead of re-encoding manually.
- `getEquivalenceClass` scans all 0..255 bytes; optimizations must keep deterministic ordering.
- Pretty formatters (`formatBytes`, `formatClassInfo`, etc.) serve both CLI output and React UI—add new formatting helpers here to stay consistent.

## Workflow & Tooling

- Install and build with `npm install` then `npm run build` (plain `tsc` targeting ES2020 CommonJS, strict mode).
- Run the spec-aligned suite via `npm test` (`ts-node atlas-test.ts`); add cases using the `runTest` helper so failures print the friendly checklist format.
- Use `npm run example` to execute `examples.ts`; `playground.ts` is meant for manual demos started with `npx ts-node playground.ts`.
- `tsconfig.json` includes only `atlas-*.ts`; include patterns must be widened if you add new TypeScript entrypoints (e.g., CLI) or they will be skipped by `npm run build`.

## UI Notes

- The React playground (`index.tsx`) wraps the library for interactive exploration; it expects a Vite + React toolchain (`vite`, `react`, `@vitejs/plugin-react`) even though they are not currently declared.
- `vite.config.ts` binds to port 3000 and exposes Atlas via direct imports; update aliases here instead of rewriting relative paths.
- Browser docs pull copy snippets from README/Quickstart constants—keep those strings short to avoid bloating the UI bundle.

## Contribution Practices

- Maintain the zero-runtime-dependency expectation; any new runtime helper should live in core files without introducing third-party libs.
- Exports are centralized in `atlas.ts` and `index-1.tsx`; add new public API there so TypeScript declaration output (`dist/atlas.d.ts`) stays comprehensive.
- When adjusting evaluation semantics, mirror changes in both literal and operational backends to keep the spec parity guarantees noted in tests and docs.
