# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sigmatics is the reference implementation of the **Atlas Sigil Algebra** formal specification v1.0 - a symbolic computation system built on 7 fundamental generators and a 96-class resonance structure (≡₉₆). This is a TypeScript monorepo maintained by the UOR Foundation.

**Core concepts:**

- The algebra operates on a 96-class equivalence structure over 256 bytes
- Each class is identified by a triple (h₂, d, ℓ) where h₂ ∈ {0,1,2,3} is the quadrant, d ∈ {0,1,2} is the modality, and ℓ ∈ {0..7} is the context ring position
- Seven generators: `mark`, `copy`, `swap`, `merge`, `split`, `quote`, `evaluate`
- Dual evaluation semantics: literal backend (produces bytes) and operational backend (produces words)
- Transform algebra: R (rotate quadrants), D (triality/modality rotation), T (twist context ring), M (mirror)

## Repository Structure

**Monorepo workspace** organized as:

- `packages/core/` - Main library (`@uor-foundation/sigmatics`), published to npm
- `apps/playground-web/` - React/Vite interactive web UI
- `apps/playground-cli/` - Command-line exploration tool
- `examples/` - Usage demonstrations
- `tools/` - Development utilities
- `docs/` - Specifications and architecture docs

## Common Commands

### Build and Test

```bash
# Build core library (from root)
npm run build
# or: npm run build:core
# or: cd packages/core && npm run build

# Run tests
npm test
# or: cd packages/core && npm test

# Run tests with coverage
cd packages/core && npm run coverage

# Run examples
npm run example

# Benchmark performance
cd packages/core && npm run benchmark
```

### Development

```bash
# Start web playground (Vite dev server on port 3000)
npm run dev:web

# Start CLI playground
npm run dev:cli

# Lint
npm run lint
npm run lint:fix

# Format with Prettier
npm run format

# Check for unused exports
npm run unused-exports
```

### Run tests without build (using ts-node)

```bash
cd packages/core && npx ts-node test/index.ts
```

### Single test run

Individual tests are defined in `packages/core/test/index.ts` using the `runTest` helper. To run a specific test subset, edit the test file to comment out unwanted test calls, then run `npm test`.

## Core Package Architecture

**Module organization** in `packages/core/src/`:

```
api/              # Main Atlas class - user-facing façade
types/            # TypeScript type definitions (AST, results, class system)
lexer/            # Tokenization (text → tokens)
parser/           # Parser (tokens → AST)
evaluator/        # Dual backends (AST → bytes/words)
class-system/     # 96-class structure, transforms, belt addressing
sga/              # v0.3.0: Sigmatics Geometric Algebra (Cl(0,7), Z₄, Z₃, octonions, Fano plane)
bridge/           # v0.3.0: lift/project between class indices and SGA elements
model/            # v0.4.0: Declarative model system (schemas, registry)
compiler/         # v0.4.0: Compiler (schemas → IR → backend plans)
server/           # v0.4.0: Model registry and standard library
```

Each module exports via barrel pattern: `module/*.ts` → `module/index.ts` → `src/index.ts`.

**Import patterns within core:**

```typescript
// Relative imports for internal modules
import { tokenize } from '../lexer';
import type { Phrase } from '../types';
```

**Import patterns from external packages/apps:**

```typescript
import { Atlas } from '@uor-foundation/sigmatics';
import { tokenize } from '@uor-foundation/sigmatics/lexer';
```

## Critical Implementation Invariants

### Sequential Composition is Right-to-Left

The expression `s2 . s1` executes `s1` first, then `s2`. This matches mathematical composition: `(f ∘ g)(x) = f(g(x))`. When adding evaluation logic or transforms, maintain this ordering. The `evaluateLiteral` and `lowerToWords` functions iterate backwards through Sequential.items arrays.

### Canonical Bytes Must Have LSB=0

All bytes returned by `evaluateLiteral` must be canonical (LSB cleared). Use `encodeComponentsToByte` from `class-system/class.ts` which enforces this. Never manually construct output bytes.

### Transform Application Order

Postfix sigil transforms (e.g., `c42^+3~`) are applied before prefix transforms (e.g., `R+1@ (...)`). The parser builds `Transformed` AST nodes for prefix transforms that wrap subtrees. `combineTransforms` merges multiple transforms correctly. Mimic this order when extending evaluation.

### Modality Encoding

Modality d={0,1,2} maps to bit pairs via: 0→(b4=0,b5=0), 1→(b4=1,b5=0), 2→(b4=0,b5=1). Modality mirroring uses XOR on these bits. Never hardcode modality transformations - use helpers in `class-system/class.ts`.

### Belt Addresses Only When Page Specified

Belt addresses exist only when a sigil carries a `page` field (λ ∈ {0..47}). `evaluateLiteral` returns `addresses?: number[]` which may be undefined. Downstream code must guard for this.

### Test Vectors Are Authoritative

All 8 specification test vectors in `packages/core/test/index.ts` must pass. Error messages in tests assert exact substring matches - preserve wording when modifying errors.

## v0.4.0 Declarative Model System

**Key architectural change:** Operations are compiled from declarative schemas → IR → backend execution plans.

**Compilation pipeline:**

1. Schema (JSON/TypeScript descriptor) → ModelDescriptor
2. Compiler rewrites to IR (intermediate representation)
3. IR fusion optimizes by complexity class (C0/C1/C2/C3)
4. Lowering selects backend (class or SGA) and generates execution plan
5. Backend dispatcher runs the plan

**Complexity classes:**

- **C0**: Fully compiled, no runtime parameters - maximum fusion
- **C1**: Few runtime degrees - prefer class backend (permutations/rank-1)
- **C2**: Bounded mixed-grade - selective SGA backend
- **C3**: General case - full SGA backend

**Standard library models** are registered in `packages/core/src/server/registry.ts` and exposed via `Atlas.Model` namespace.

**Adding new models:**

1. Define schema in `packages/core/src/model/schemas/`
2. Register in `server/registry.ts`
3. Add test in `packages/core/test/model/`
4. If introducing new IR atoms or rewrites, update `compiler/ir.ts` and `compiler/rewrites.ts`

**Performance optimizations:**

Some operations benefit from **compile-time precomputation**. For bounded-domain operations like `factor96` in ℤ₉₆:

- Generate precomputed lookup tables from algebraic structure
- Example: `FACTOR96_TABLE` achieves ~130M ops/sec (19.56× speedup)
- Memory: 473 bytes (fits in L1 cache)
- See `packages/core/src/compiler/lowering/class-backend.ts` for implementation
- See `docs/EXCEPTIONAL-FACTORIZATION-SUMMARY.md` for research details

## AST Type System

AST types in `packages/core/src/types/types.ts` encode:

- **Operation**: Generator applied to ClassSigil
- **Sequential**: Right-associative composition (`items` array, last item executes first)
- **Parallel**: Parallel branches (⊗ operator)
- **Transformed**: Prefix transform wrapper with Transform object
- **Group**: Parenthesized subexpression
- **Phrase**: Top-level (Transformed | Parallel)

**ClassSigil** carries:

- `classIndex` (0..95)
- Optional transforms: `rotate`, `triality`, `twist`, `mirror`
- Optional `page` (0..47) for belt addressing

## Specification Compliance

This implementation must maintain 100% compliance with:

- Atlas Sigil Algebra — Formal Specification v1.0
- Atlas Sigil Parser Spec + Test Vectors v1.0

All 8 test vectors must pass. Never modify core evaluation semantics without verifying against the formal spec in `docs/atlas_sigil_algebra_formal_specification_v_1.md`.

## Adding New Functionality

### New Generator or Transform

1. Update `types/types.ts` to add type definitions
2. Update `lexer/lexer.ts` to tokenize syntax
3. Update `parser/parser.ts` to parse into AST
4. Update `evaluator/evaluator.ts` for both literal and operational backends
5. If it affects class structure, update `class-system/class.ts`
6. Add test cases in `packages/core/test/index.ts`
7. Mirror changes in both backends to preserve dual-semantics guarantee

### New Module

1. Create directory in `packages/core/src/`
2. Add implementation files
3. Create `index.ts` barrel export
4. Update `packages/core/src/index.ts` to re-export the module
5. Update `package.json` exports map if module should be separately importable
6. Add tests in `packages/core/test/`

### New Model for Standard Library

1. Define schema in `model/schemas/`
2. Register in `server/registry.ts` (add to `StdlibModels` map)
3. Ensure proper complexity classification
4. Add comprehensive tests
5. Document usage in API docs

## Operational Backend Word Format

The operational backend emits control markers with specific formatting:

- Phase markers: `phase[h₂=<n>]`
- Generator words: `<generator>[d=<n>]` (e.g., `copy[d=0]`)
- Rotation markers: `→ρ[<k>]`, `←ρ[<k>]`
- Parallel markers: `⊗_<n>`, `⊗^<n>`
- Context markers: `→τ[<k>]`, `←τ[<k>]`
- Modality mirror: `M_d`

When extending `lowerToWords` in `evaluator/evaluator.ts`, follow these precise conventions.

## Zero Runtime Dependencies

The core package must have zero runtime dependencies. All utilities must be implemented in-house. Only devDependencies (TypeScript, ts-node, c8 for coverage) are allowed. This ensures the library can be used in any environment without pulling in third-party code.

## Pretty Formatters

Formatting helpers in `evaluator/evaluator.ts` (`formatBytes`, `formatAddresses`, `formatWords`, etc.) and `class-system/class.ts` (`formatClassInfo`) serve both CLI and React UI. When adding formatters, ensure they produce concise, readable output suitable for both contexts.

## Web Playground Notes

- Entry point: `apps/playground-web/src/main.tsx`
- Main component: `apps/playground-web/src/App.tsx`
- Vite config uses path alias to resolve `@uor-foundation/sigmatics` to local core package
- Dev server runs on port 3000
- Keep UI-copied documentation snippets short to avoid bundle bloat

## Version History

- **v0.1.x**: Initial implementation with 7 generators, 96-class system, dual backends
- **v0.2.x**: Added belt addressing, test vectors, monorepo structure
- **v0.3.0**: Added SGA module (geometric algebra foundations), bridge for lift/project
- **v0.4.0**: Declarative model system with compilation pipeline, IR, fusion optimizer, dual backends (class/SGA)

Current branch: `claude/sigmatics-0.4.0-declarative-refactor-011CUvhgaoeGwi5EkjdPBUxu`
Main branch: `main`

## SGA as Universal Constraint Language

**Key Insight:** SGA (Sigmatics Geometric Algebra) is not just for computing with the 96-class structure - it serves as a **universal constraint composition language** that generalizes to arbitrary taxonomies.

### The Meta-Level Abstraction

The 96-class structure (≡₉₆) is the **canonical instantiation** that Sigmatics uses internally, but the algebraic framework extends to any domain:

**SGA provides:**

- Universal composition operators: `∘` (sequential), `⊗` (parallel/tensor), `⊕` (merge)
- Universal transforms: `R` (rotate scope), `D` (change modality), `T` (twist context), `M` (mirror)
- Constraint propagation rules that work across taxonomies
- A language for expressing compositional constraints without heuristics

**Example taxonomies:**

- **Factorization**: `model(integer) = ⊗(model(prime_i))` with constraint `product(primes) === integer`
- **NLP**: `model(sentence) = ∘(model(word_i))` with constraint `meaning(sentence) ⊃ ⋃(meaning(word_i))`
- **Program synthesis**: `model(program) = ∘(model(statement_i))` with constraint `spec(program) ⇒ ∀ invariant(statement_i)`

### Models and Constraint-Driven Compilation

**Models are arbitrary computational operations** compiled to SGA:

1. User defines model schema with **rich constraints** (types, invariants, properties)
2. Compiler uses constraints for **fusion optimization** - more constraints enable more fusion
3. Models become **algebraic objects** that SGA can compose using `∘`, `⊗`, `R`, `D`, `T`, `M`
4. Constraints fully specify the problem - **no heuristics needed**

**Key principle:** Constraints are what the consumer (successor in pipeline) expects from the producer (predecessor). More constraints = tighter interface contract = more optimization opportunities.

**Example constraint composition:**

```typescript
// Language model taxonomy
[model(prompt) = model(message) ∘ model(user)] + model(language) = model(response)

// Constraints fully specify:
// - How user context composes with message
// - How language rules combine with prompt
// - What properties the response must satisfy
// - All without heuristic search!
```

### SGA vs. Model System

**SGA (Foundation Layer):**

- Implements the mathematical structure that defines Sigmatics
- Embodies the ≡₉₆ equivalence structure and formal specification
- Provides canonical transforms (R, D, T, M) and algebraic operations
- NOT arbitrary - this IS what Sigmatics is

**Model System (Application Layer):**

- Compiles arbitrary operations from declarative schemas
- Can represent operations beyond Sigmatics-specific primitives
- Uses SGA as the semantic backend when needed
- Enables composition of arbitrary computational models via SGA algebra

The model server **uses** SGA as the algebraic substrate for composing arbitrary models, but SGA itself remains the foundational algebra of Sigmatics.
