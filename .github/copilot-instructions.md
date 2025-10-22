## Atlas Orientation

- Atlas implements the Atlas Sigil Algebra spec with a parse→evaluate pipeline in a modular workspace structure.
- **Core package** (`packages/core/`) contains all library code organized into modules: `lexer/`, `parser/`, `evaluator/`, `class-system/`, `types/`, and `api/`.
- Each module has its own directory with implementation file(s) and a barrel export (`index.ts`).
- The main API (`packages/core/src/api/index.ts`) exports the `Atlas` class that orchestrates all modules.
- AST types in `packages/core/src/types/types.ts` encode right-associative sequential nodes, parallel branches, and transform wrappers—inspect these before shaping new features.

## Module Structure

- **`types/`**: TypeScript interfaces and type definitions shared across all modules
- **`lexer/`**: Tokenization logic (`lexer.ts`), converts sigil text to tokens
- **`parser/`**: AST construction (`parser.ts`), depends on lexer and types
- **`class-system/`**: 96-class structure, transforms, belt addressing (`class.ts`)
- **`evaluator/`**: Literal (bytes) and operational (words) backends (`evaluator.ts`)
- **`api/`**: High-level `Atlas` class façade that exposes the public API

## Import Patterns

```typescript
// Within core package, use relative imports
import { tokenize } from '../lexer';
import { Parser } from '../parser';
import type { Phrase } from '../types';

// External packages/apps use package imports
import { Atlas } from '@uor-foundation/sigmatics';
import { tokenize } from '@uor-foundation/sigmatics/lexer';
```

## Semantics Essentials

- Sequential composition executes right-to-left; keep this invariant when adding passes or rewrites (`lowerToWords` iterates backwards).
- Prefix transforms accumulate through `combineTransforms` and apply to subtrees; postfix sigil modifiers are folded before prefix transforms—mimic this order when extending evaluation.
- Literal backend must return canonical bytes (LSB=0) via `encodeComponentsToByte`; transforms flow through `applyTransforms`.
- Operational backend emits control markers (`⊗_*`, `→ρ[...]`, etc.); adding new generators requires updating `lowerOperation` with precise word forms.
- Belt addresses exist only when a sigil carries `page`; `evaluateLiteral` returns `addresses` only when non-empty, so downstream code should guard for `undefined`.

## Class & Validation Rules

- Class indices live in [0,95] and pages in [0,47]; lexer/parser errors mirror this messaging and tests assert substrings—preserve wording when tweaking errors.
- `packages/core/src/class-system/class.ts` treats modality mirroring as XOR on transforms and maps d={0,1,2} to bit pairs {00,10,01}; reuse helpers instead of re-encoding manually.
- `getEquivalenceClass` scans all 0..255 bytes; optimizations must keep deterministic ordering.
- Pretty formatters (`formatBytes`, `formatClassInfo`, etc.) serve both CLI output and React UI—add new formatting helpers here to stay consistent.

## Workflow & Tooling

- **Workspace structure**: Root package.json defines workspaces for `packages/*`, `apps/*`, `examples`, `tools/*`
- **Build core**: `cd packages/core && npm run build` (TypeScript to dist/)
- **Run tests**: `cd packages/core && npm test` (ts-node test/index.ts)
- **Run examples**: `cd examples && npm start`
- **Run CLI playground**: `cd apps/playground-cli && npm start`
- **Dev web playground**: `cd apps/playground-web && npm run dev`
- Tests live in `packages/core/test/index.ts`; add cases using the `runTest` helper for consistent output.

## UI Notes

- The React playground (`apps/playground-web/`) wraps the library for interactive exploration.
- Entry point is `apps/playground-web/src/main.tsx`, main component is `App.tsx`.
- `vite.config.ts` binds to port 3000 and uses path alias to resolve `@uor-foundation/sigmatics` to local core package.
- Browser docs pull copy snippets from README/Quickstart constants—keep those strings short to avoid bloating the UI bundle.

## Contribution Practices

- Maintain the zero-runtime-dependency expectation for the core package; any new runtime helper should live in core modules without introducing third-party libs.
- Exports are centralized in `packages/core/src/index.ts`; it re-exports from all modules (api, types, lexer, parser, evaluator, class-system).
- Each module exports via barrel pattern: module files → `module/index.ts` → `src/index.ts`
- When adjusting evaluation semantics, mirror changes in both literal and operational backends to keep the spec parity guarantees noted in tests and docs.
- New modules can be added to `packages/core/src/` following the same pattern (create directory, implementation files, index.ts export, update main index.ts)
