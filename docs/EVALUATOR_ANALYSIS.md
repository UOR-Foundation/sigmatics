# Evaluator Analysis: Legacy vs. Value-Add

## Current State Assessment

### What the Evaluator Does

The evaluator (`packages/core/src/evaluator/evaluator.ts`) provides:

1. **Literal Backend** (`evaluateLiteral`):
   - Parses sigil expressions into AST
   - Applies transforms to compute canonical bytes
   - Computes belt addresses when page references exist
   - Returns: `{ bytes: number[], addresses?: number[] }`

2. **Operational Backend** (`evaluateOperational`):
   - Parses sigil expressions into AST
   - Lowers to generator words (semantic instructions)
   - Emits control markers for parallelism/transforms
   - Returns: `{ words: string[] }`

3. **Key Feature**: Routes transforms through model registry (v0.4.0 compliance)
   ```typescript
   function applyTransformsViaModels(components, transform) {
     // Applies R, D, T, M via StdlibModels.R/D/T/M()
   }
   ```

### What the Model System Does

The model system (`packages/core/src/model/*`, `compiler/*`, `server/*`):

1. **Declarative Operations**:
   - Define operations as JSON-Schema models
   - Compile to IR (atoms, ∘, ⊗, transforms)
   - Apply rewrites (normalize, fold pure powers)
   - Select backend (class vs SGA) based on complexity
   - Execute optimized plans

2. **Operations Supported**:
   - Ring: add96, sub96, mul96
   - Transforms: R, D, T, M
   - Bridge: lift, project
   - Grade: projectGrade

3. **Entry Points**:
   - `Atlas.Model.R(k).run({ x: classIndex })`
   - `Atlas.Model.add96('track').run({ a, b })`
   - Direct registry: `StdlibModels.R(k).run({ x })`

---

## Overlap Analysis

### Where They Overlap

Both systems handle **transforms** (R, D, T, M):

| Feature | Evaluator | Model System |
|---------|-----------|--------------|
| **Input** | Sigil expression strings | Numeric class indices |
| **Transform application** | Via `applyTransformsViaModels()` | Direct backend execution |
| **Output** | Canonical bytes | Transformed class index |
| **Performance** | Parse + walk AST + dispatch | Compiled plan execution |

**Key Insight**: The evaluator **already routes** transform application through the model registry (`StdlibModels.R/D/T/M`), so it's v0.4.0 compliant.

### Where They Don't Overlap

The evaluator provides **unique functionality**:

1. **Sigil Expression Parsing**:
   - User-friendly DSL: `'R+2 T+3 ~@ mark@c07'`
   - AST construction from text
   - Model system operates on numeric inputs only

2. **Generator Operations**:
   - mark, copy, swap, merge, split, quote, evaluate
   - These are **not implemented as models** in the current system

3. **Operational Backend (Words)**:
   - Lowers to semantic instruction stream
   - Emits control markers: `⊗_begin`, `→ρ[k]`, etc.
   - No equivalent in model system

4. **Belt Addressing**:
   - Computes belt addresses from page references
   - Returns alongside bytes
   - Model system doesn't handle this

---

## Usage Patterns

### Active Users of Evaluator

1. **Public API** (`Atlas.evaluateBytes/evaluateWords`):
   - Used in README, QUICKSTART, examples
   - Used in tests (152+ references)
   - Used in benchmarks
   - Used in validation tools

2. **Test Suite** (`packages/core/test/index.ts`):
   - 20+ tests use `Atlas.evaluateBytes()`
   - Tests generator operations
   - Tests transform composition
   - Tests belt addressing

3. **Documentation Examples**:
   - All major docs reference `evaluateBytes()`
   - Quickstart guide uses it extensively
   - User-facing examples depend on it

### Active Users of Model System

1. **Internal Operations**:
   - Evaluator routes transforms through models
   - API exposes `Atlas.Model.*`
   - Tests validate compiled model correctness

2. **Direct Numeric Operations**:
   - When working with class indices directly
   - When needing dual-backend dispatch
   - When building higher-level abstractions

---

## Is It Legacy Code?

### ❌ NO - The Evaluator is NOT Legacy Code

**Reasons:**

1. **Unique Value**:
   - Only entry point for sigil expression DSL
   - Only implementation of generator operations (mark, copy, etc.)
   - Only producer of operational backend (words)
   - Only handler of belt addressing

2. **Public API Surface**:
   - Extensively documented in user-facing guides
   - Used in examples throughout codebase
   - Part of `Atlas` public API contract
   - Removing would be breaking change

3. **V0.4.0 Compliant**:
   - Already routes transforms through model registry
   - Satisfies "all operations through registry" requirement
   - No direct backend bypass

4. **Different Abstraction Level**:
   - Evaluator: High-level expression DSL → bytes/words
   - Model system: Low-level operations → optimized plans
   - These are complementary, not redundant

5. **Active Usage**:
   - Tests depend on it (20+ direct calls)
   - Benchmarks measure it
   - Tools validate with it
   - Docs teach with it

---

## Relationship to Model System

### Correct Architecture

```
User Expression (DSL)
    ↓
Evaluator (parse → AST → walk)
    ↓
For Transforms: Model Registry
    ↓
Compiled Model Plans
    ↓
Backend Execution (class/SGA)
    ↓
Result (bytes/words)
```

The evaluator is a **consumer** of the model system, not a competing implementation.

---

## Potential Improvements (Not Cleanup)

### 1. Expand Model Coverage

Currently **not modeled** as declarative operations:
- mark, copy, swap, merge, split, quote, evaluate

Could be modeled, but would require:
- Defining semantics in IR
- Backend implementations
- Significant work for unclear benefit (already working)

### 2. Performance Optimization

The evaluator has higher overhead than direct model calls because:
- Parses expression string every time
- Walks AST to collect leaves
- Dispatches to models for each transform

Could optimize:
- Cache parsed ASTs
- Pre-compile hot expressions
- Direct lower to backend plans

But current performance is acceptable (benchmarks show 0.46M ops/sec for simple cases).

### 3. Documentation Clarity

Could improve docs to clarify:
- When to use evaluator vs. direct model calls
- Evaluator is for DSL expressions
- Models are for programmatic operations

---

## Recommendation

### ✅ KEEP the Evaluator - NO CLEANUP NEEDED

**Rationale:**

1. **Not dead code**: Actively used by public API, tests, benchmarks, docs
2. **Not legacy**: V0.4.0 compliant (routes transforms through models)
3. **Not redundant**: Provides unique DSL parsing and generator ops
4. **Not incorrect**: Follows proper architecture (consumer of model system)

### Actions (Optional Enhancements):

1. ✅ **Already Done**: Evaluator routes transforms through model registry
2. 📝 **Document**: Clarify in docs when to use evaluator vs. models
3. 🚀 **Future**: Consider expression caching for performance (not urgent)
4. 🎯 **Future**: Model generator operations if semantic clarity needed (not urgent)

### No Cleanup Required

The evaluator is a **first-class citizen** of the v0.4.0 architecture, not technical debt.

---

## Conclusion

The evaluator provides essential functionality that the model system doesn't replace:
- Sigil expression DSL parsing
- Generator operations (mark, copy, swap, etc.)
- Operational backend (word emission)
- Belt address computation

It correctly integrates with the model system by routing transforms through the registry. This is the intended architecture, not a legacy path to clean up.

**Status**: ✅ Keep as-is; no cleanup needed.
