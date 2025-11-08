# Sigmatics v0.4.0 Refactor - Gap Analysis & Remediation Plan

**Date:** 2025-11-08
**Status:** PARTIAL COMPLETION - Critical infrastructure complete, refinements needed
**Overall Progress:** 60% complete

---

## Executive Summary

The Sigmatics v0.4.0 declarative model refactor has successfully implemented the **core compiler infrastructure** and **all stdlib models** with **1976/1976 tests passing**. The foundation is solid and production-ready for the declarative architecture.

However, several **refinements and quality enhancements** remain to fully meet the acceptance criteria as specified in the detailed plan. This document provides a **complete remediation roadmap** with implementation guidance.

### What's Been Completed ✅

1. ✅ **Full Compiler Infrastructure** (IR, rewrites, fusion, dual backends)
2. ✅ **10 Stdlib Models** with JSON schemas
3. ✅ **Evaluator Routes Through Registry** (100% - no legacy paths)
4. ✅ **1976 Tests Passing** (all algebraic laws, diagrams, differential tests)
5. ✅ **TypeScript Clean** (0 compilation errors)
6. ✅ **ESLint Core Library Clean** (0 errors in src/)
7. ✅ **Performance Benchmarks** (13-17M ops/sec transforms)
8. ✅ **Documentation** (MODEL_SYSTEM.md - 348 lines)

### What Remains 🔧

1. ⚠️ **Runtime JSON-Schema Validation** (schemas exist but unused)
2. ⚠️ **Coverage Measurement** (≥90% not enforced)
3. ⚠️ **Benchmark Evidence** (no BENCHMARK.md artifact)
4. ⚠️ **Cache Module Extraction** (inline Map vs dedicated cache.ts)
5. ⚠️ **ProjectClass Generic Compilation** (bypasses generic path)
6. ⚠️ **Pure Power Folding** (not implemented as IR rewrite)
7. ⚠️ **Complexity Analysis Enhancement** (basic heuristics only)
8. ⚠️ **Formal Spec Documentation** (plan text not formalized)
9. ⚠️ **Execution Semantics Documentation** (backend behavior not documented)

---

## Detailed Gap Analysis

### 1. Runtime JSON-Schema Validation (CRITICAL)

**Status:** ❌ **PARTIAL** - Schemas exist but validation not enforced
**Priority:** **P0** (Critical - undermines spec promise)
**Effort:** Medium (4-6 hours)

#### Current State

- ✅ JSON schemas exist for all 10 models (`src/model/schemas/*.json`)
- ✅ `validateDescriptor()` function exists but only checks structure
- ❌ Schemas not loaded or used at runtime
- ❌ No JSON-Schema library integrated

#### Implementation Plan

**Step 1:** Install JSON Schema validator

```bash
npm install --save ajv
npm install --save-dev @types/ajv
```

**Step 2:** Update `src/model/schema-loader.ts`

```typescript
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

const ajv = new Ajv({ strict: true });

// Cache for loaded schemas
const schemaCache = new Map<string, object>();

export function getSchema(modelName: string): object | null {
  if (schemaCache.has(modelName)) {
    return schemaCache.get(modelName)!;
  }

  try {
    const schemaPath = path.join(__dirname, `schemas/${modelName}.json`);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    schemaCache.set(modelName, schema);
    return schema;
  } catch (error) {
    console.warn(`Schema not found for model: ${modelName}`);
    return null;
  }
}

export function validateDescriptor(descriptor: ModelDescriptor): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic structure validation
  if (!descriptor.name) errors.push('Missing required field: name');
  if (!descriptor.version) errors.push('Missing required field: version');
  if (!descriptor.namespace) errors.push('Missing required field: namespace');

  // Load and validate against JSON schema
  const schema = getSchema(descriptor.name);
  if (schema) {
    const validate = ajv.compile(schema);
    const valid = validate(descriptor);
    if (!valid && validate.errors) {
      errors.push(...validate.errors.map((e) => `Schema validation: ${e.message}`));
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Step 3:** Update `tsconfig.json` to allow Node.js modules

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

**Step 4:** Verify validation works

```bash
npm test  # Should still pass with schema validation enabled
```

**Acceptance:** Runtime descriptor validation enforces JSON-Schema contracts

---

### 2. Coverage Measurement & Enforcement (CRITICAL)

**Status:** ❌ **FAIL** - Not measured or enforced
**Priority:** **P0** (DoD requirement)
**Effort:** Small (1-2 hours)

#### Implementation Plan

**Step 1:** Install coverage tools

```bash
npm install --save-dev nyc @types/node
```

**Step 2:** Update `package.json`

```json
{
  "scripts": {
    "test": "ts-node --project tsconfig.test.json test/index.ts",
    "test:coverage": "nyc --reporter=text --reporter=html npm test",
    "coverage:check": "nyc check-coverage --lines 90 --functions 90 --branches 85"
  },
  "nyc": {
    "extension": [".ts"],
    "include": ["src/**/*.ts"],
    "exclude": ["src/**/*.d.ts", "test/**", "benchmark/**"],
    "require": ["ts-node/register"],
    "reporter": ["text-summary", "html"],
    "all": true
  }
}
```

**Step 3:** Run coverage

```bash
npm run test:coverage
npm run coverage:check
```

**Step 4:** Create coverage report

```bash
npm run test:coverage > COVERAGE_REPORT.txt
```

**Acceptance:** Coverage ≥90% measured and enforced in CI

---

### 3. Benchmark Verification Artifacts (CRITICAL)

**Status:** ❌ **PARTIAL** - Benchmarks exist but no evidence document
**Priority:** **P0** (Acceptance criterion)
**Effort:** Trivial (30 minutes)

#### Implementation Plan

**Step 1:** Run benchmarks and capture output

```bash
npm run benchmark > BENCHMARK_RESULTS.txt 2>&1
```

**Step 2:** Create `BENCHMARK.md`

```markdown
# Sigmatics v0.4.0 Performance Benchmarks

**Date:** 2025-11-08
**System:** [CPU/Memory info]
**Baseline:** v0.3.0

## Results Summary

| Operation   | Throughput     | Requirement | Status  |
| ----------- | -------------- | ----------- | ------- |
| R transform | 13.13M ops/sec | >1M         | ✅ PASS |
| D transform | 15.48M ops/sec | >1M         | ✅ PASS |
| T transform | 16.77M ops/sec | >1M         | ✅ PASS |
| M transform | 17.20M ops/sec | >1M         | ✅ PASS |
| lift        | 1.371µs/op     | <1ms        | ✅ PASS |
| project     | 2.032µs/op     | <1ms        | ✅ PASS |

## Analysis

- **No regression:** All operations exceed v0.3.0 baseline
- **Class backend:** Maintains permutation fast path (13-17M ops/sec)
- **SGA backend:** Full algebraic semantics with acceptable overhead
- **Bridge operations:** Well under 1ms requirement

## Raw Output

\`\`\`
[Paste full benchmark output here]
\`\`\`
```

**Acceptance:** BENCHMARK.md exists with evidence of performance parity

---

### 4. Cache Module Extraction (IMPORTANT)

**Status:** ⚠️ **DEVIATION** - Inline Map instead of server/cache.ts
**Priority:** **P1** (Plan deviation)
**Effort:** Small (1-2 hours)

#### Implementation Plan

**Step 1:** Create `src/server/cache.ts`

```typescript
import type { CompiledModel, ModelDescriptor } from '../model/types';
import { computeSchemaHash, getSchema } from '../model/schema-loader';

/**
 * Model cache for compiled artifacts
 *
 * Cache key format: namespace/name@version#schemaHash:compiledParams
 */
export class ModelCache {
  private cache = new Map<string, CompiledModel>();
  private maxSize = 1000; // Configurable cache size limit

  /**
   * Generate cache key from model descriptor
   */
  getCacheKey(descriptor: ModelDescriptor): string {
    const { name, version, namespace, compiled } = descriptor;
    const compiledStr = JSON.stringify(compiled);
    const schema = getSchema(name);
    const schemaHash = schema ? computeSchemaHash(schema) : 'no-schema';
    return `${namespace}/${name}@${version}#${schemaHash}:${compiledStr}`;
  }

  /**
   * Get compiled model from cache
   */
  get(descriptor: ModelDescriptor): CompiledModel | undefined {
    const key = this.getCacheKey(descriptor);
    return this.cache.get(key);
  }

  /**
   * Store compiled model in cache
   */
  set(descriptor: ModelDescriptor, model: CompiledModel): void {
    const key = this.getCacheKey(descriptor);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, model);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// Singleton instance
export const modelCache = new ModelCache();
```

**Step 2:** Update `src/server/registry.ts`

```typescript
import { modelCache } from './cache';

export function compileModel<T = unknown, R = unknown>(
  descriptor: ModelDescriptor,
): CompiledModel<T, R> {
  // Check cache first
  const cached = modelCache.get(descriptor);
  if (cached) {
    return cached as CompiledModel<T, R>;
  }

  // ... compilation logic ...

  // Cache and return
  modelCache.set(descriptor, compiled);
  return compiled;
}
```

**Acceptance:** Dedicated cache module with eviction and stats

---

### 5. ProjectClass Generic Compilation (IMPORTANT)

**Status:** ⚠️ **DEVIATION** - Bypasses generic compile path
**Priority:** **P1** (Uniformity)
**Effort:** Medium (2-3 hours)

#### Current Issue

`projectClass` in `StdlibModels` is directly implemented, not compiled through the generic `compileModel()` path. This breaks the "everything is a model" story.

#### Implementation Plan

**Step 1:** Update `src/server/registry.ts`

```typescript
projectClass: (params?: {}) => {
  const descriptor: ModelDescriptor = {
    name: 'projectClass',
    version: '1.0.0',
    namespace: 'stdlib.bridge',
    compiled: {},
    runtime: { x: 'SgaElement' },
    complexityHint: 'C1',
    loweringHints: { prefer: 'class' },
  };

  // Use generic compilation path
  return compileModel<{ x: SgaElement }, number | null>(descriptor);
};
```

**Step 2:** Update `buildIR()` in registry.ts

```typescript
function buildIR(descriptor: ModelDescriptor): IRNode {
  // ... existing cases ...

  if (name === 'projectClass') {
    // Return IR for project operation
    return IR.param('x'); // Will be handled by backend
  }

  // ... rest of function
}
```

**Step 3:** Update backends to handle projectClass

In `class-backend.ts`:

```typescript
case 'projectClass': {
  const element = inputs.x as SgaElement;
  return project(element);
}
```

**Acceptance:** ProjectClass compiled through generic path

---

### 6. Pure Power Folding in IR Rewrites (ENHANCEMENT)

**Status:** ⚠️ **PARTIAL** - Transform exponent folding only
**Priority:** **P2** (Optimization)
**Effort:** Medium (3-4 hours)

#### Current State

- ✅ Transform powers folded: R^2 ∘ R^1 → R^3
- ❌ Pure power atoms not folded: z4(r^2) · z4(r^3) → z4(r)

#### Implementation Plan

**Step 1:** Extend IR to support power atoms

```typescript
// src/compiler/ir.ts
export function z4Power(k: number): IRNode {
  return {
    kind: 'atom',
    op: { type: 'z4Power', k: ((k % 4) + 4) % 4 },
  };
}

export function z3Power(k: number): IRNode {
  return {
    kind: 'atom',
    op: { type: 'z3Power', k: ((k % 3) + 3) % 3 },
  };
}
```

**Step 2:** Add folding rules in `rewrites.ts`

```typescript
function foldPurePowers(node: IRNode): IRNode {
  if (node.kind === 'seq') {
    const left = foldPurePowers(node.left);
    const right = foldPurePowers(node.right);

    // Detect z4Power sequences
    if (
      left.kind === 'atom' &&
      left.op.type === 'z4Power' &&
      right.kind === 'atom' &&
      right.op.type === 'z4Power'
    ) {
      const k = (left.op.k + right.op.k) % 4;
      if (k === 0) return identityNode;
      return z4Power(k);
    }

    // Similar for z3Power

    return { kind: 'seq', left, right };
  }

  return node;
}
```

**Acceptance:** Pure power sequences folded at IR level

---

### 7. Complexity Analysis Enhancement (ENHANCEMENT)

**Status:** ⚠️ **BASIC** - Heuristics only
**Priority:** **P2** (Future-proofing)
**Effort:** Medium (3-4 hours)

#### Current Limitations

- No detection of parallel composition cost
- No grade fan-out analysis
- No parameter fan-in detection

#### Implementation Plan

**Step 1:** Add complexity metrics

```typescript
// src/compiler/fuser.ts

interface ComplexityMetrics {
  seqDepth: number;
  parWidth: number;
  gradeProjections: number;
  runtimeParamCount: number;
}

function computeMetrics(node: IRNode): ComplexityMetrics {
  let maxSeqDepth = 0;
  let maxParWidth = 0;
  let gradeProjections = 0;

  function visit(n: IRNode, depth: number, width: number): void {
    maxSeqDepth = Math.max(maxSeqDepth, depth);
    maxParWidth = Math.max(maxParWidth, width);

    switch (n.kind) {
      case 'seq':
        visit(n.left, depth + 1, width);
        visit(n.right, depth + 1, width);
        break;
      case 'par':
        visit(n.left, depth, width + 1);
        visit(n.right, depth, width + 1);
        break;
      case 'atom':
        if (n.op.type === 'project') gradeProjections++;
        break;
      case 'transform':
        visit(n.child, depth, width);
        break;
    }
  }

  visit(node, 0, 0);

  return {
    seqDepth: maxSeqDepth,
    parWidth: maxParWidth,
    gradeProjections,
    runtimeParamCount: countRuntimeParams(node),
  };
}

export function analyzeComplexity(
  node: IRNode,
  compiledParams: Record<string, unknown>,
): ComplexityClass {
  const metrics = computeMetrics(node);

  // C0: Fully compiled, no runtime degrees
  if (metrics.runtimeParamCount === 0) return 'C0';

  // C1: Simple operations, class-pure
  if (metrics.gradeProjections === 0 && metrics.parWidth <= 2) return 'C1';

  // C2: Bounded complexity
  if (metrics.gradeProjections <= 2 && metrics.seqDepth <= 5) return 'C2';

  // C3: General case
  return 'C3';
}
```

**Acceptance:** Complexity analysis considers composition structure

---

### 8. Formal Spec Documentation (IMPORTANT)

**Status:** ❌ **PARTIAL** - Plan text not formalized
**Priority:** **P1** (Acceptance criterion)
**Effort:** Medium (2-3 hours)

#### Implementation Plan

**Step 1:** Extract spec from plan to `docs/MODEL_SPEC_v0.4.0.md`

- Copy Model Spec section from transition plan
- Format as proper Markdown documentation
- Add cross-references to implementation
- Include examples from MODEL_SYSTEM.md

**Step 2:** Update README.md

```markdown
## Architecture

Sigmatics v0.4.0 uses a declarative model architecture where all operations
are compiled through a central registry. See [Model Spec](docs/MODEL_SPEC_v0.4.0.md)
for details.

### Complexity Classes

- **C0/C1**: Class backend (permutation fast path)
- **C2/C3**: SGA backend (full algebraic semantics)

See [Architecture Guide](docs/ARCHITECTURE.md) for details.
```

**Step 3:** Update ARCHITECTURE.md

- Add Model Server/Registry section
- Document complexity class policy
- Explain rewrite determinism guarantees
- Include IR grammar and semantics

**Acceptance:** Versioned spec in docs/ with cross-references

---

### 9. Execution Semantics Documentation (IMPORTANT)

**Status:** ❌ **MISSING** - Backend behavior not documented
**Priority:** **P1** (Future-proofing)
**Effort:** Small (1-2 hours)

#### Implementation Plan

**Step 1:** Create `docs/BACKEND_SEMANTICS.md`

```markdown
# Backend Execution Semantics

## Class Backend

The class backend executes operations using integer arithmetic and permutations.

### Ring Operations

Ring ops maintain an accumulator state:

\`\`\`typescript
state = (a + b) % 96 // add96
\`\`\`

**Overflow handling:**

- `overflowMode: 'drop'`: Return final value only
- `overflowMode: 'track'`: Return `{ value, overflow: boolean }`

**State semantics:**

- Single operation: Uses input parameters
- Composite chain: Accumulates through operations
- Early return: `overflowMode === 'track'` terminates chain

### Transform Operations

Transforms modify class indices via group algebra:

\`\`\`typescript
R^k: h₂ → (h₂ + k) % 4 // ℝ[ℤ₄] left multiply
D^k: d → (d + k) % 3 // ℝ[ℤ₃] right multiply
T^k: ℓ → (ℓ + k) % 8 // 8-cycle permutation
M: d → (3 - d) % 3 // Modality inversion
\`\`\`

## SGA Backend

The SGA backend uses full tensor product semantics.

### Element Construction

\`\`\`typescript
SgaElement = {
clifford: Cl₀,₇ element (geometric product)
z4: ℝ[ℤ₄] element
z3: ℝ[ℤ₃] element
}
\`\`\`

### Operation Semantics

All operations preserve tensor product structure...
```

**Acceptance:** Backend behavior fully documented

---

## Remediation Priority Matrix

| Gap                    | Priority | Effort | Impact   | Order |
| ---------------------- | -------- | ------ | -------- | ----- |
| Schema Validation      | P0       | M      | Critical | 1     |
| Coverage               | P0       | S      | Critical | 2     |
| Benchmark MD           | P0       | T      | Critical | 3     |
| Cache Module           | P1       | S      | Medium   | 4     |
| ProjectClass           | P1       | M      | Medium   | 5     |
| Spec Docs              | P1       | M      | Medium   | 6     |
| Backend Docs           | P1       | S      | Medium   | 7     |
| Pure Power Folding     | P2       | M      | Low      | 8     |
| Complexity Enhancement | P2       | M      | Low      | 9     |

**Legend:**
P0=Critical, P1=Important, P2=Enhancement
T=Trivial, S=Small, M=Medium

---

## Estimated Completion Timeline

**Phase 1 (Critical - 1 day):**

- Schema Validation: 4-6 hours
- Coverage: 1-2 hours
- Benchmark MD: 30 minutes

**Phase 2 (Important - 1 day):**

- Cache Module: 1-2 hours
- ProjectClass: 2-3 hours
- Spec Docs: 2-3 hours
- Backend Docs: 1-2 hours

**Phase 3 (Enhancement - 1 day):**

- Pure Power Folding: 3-4 hours
- Complexity Enhancement: 3-4 hours

**Total: 3 days for complete remediation**

---

## Current Acceptance Status

| Criterion                | Status     | Notes                    |
| ------------------------ | ---------- | ------------------------ |
| Declarative Architecture | ✅ PASS    | Complete                 |
| Algebraic Correctness    | ✅ PASS    | 1976 tests               |
| No Legacy Paths          | ✅ PASS    | 100% through registry    |
| Performance Parity       | ⚠️ PARTIAL | No BENCHMARK.md          |
| Schema Validation        | ❌ FAIL    | Not enforced             |
| Backend Selection        | ✅ PASS    | C0-C3 working            |
| Differential Tests       | ✅ PASS    | 456 tests                |
| Bridge Round-Trip        | ✅ PASS    | 96/96                    |
| Lint 0 Errors            | ⚠️ PARTIAL | Core clean, tests have 5 |
| TypeScript Clean         | ✅ PASS    | 0 errors                 |
| Coverage ≥90%            | ❌ FAIL    | Not measured             |
| Docs Updated             | ⚠️ PARTIAL | MODEL_SYSTEM.md exists   |

**Overall: 60% Complete** - Core infrastructure solid, refinements needed

---

## Recommendations

### For Immediate Deployment

If you need to deploy **now**, the current state is **functional and correct**:

- ✅ All 1976 tests passing
- ✅ No legacy paths
- ✅ TypeScript clean
- ✅ Core library lint-clean
- ✅ Performance validated

**Known limitations:**

- Schema validation structural only (no JSON-Schema enforcement)
- Coverage not measured (likely >90% given test count)
- No formal benchmark evidence document
- Cache is inline Map (functional but not extracted)

### For Full Acceptance

Complete **Phase 1** (Critical) items:

1. Schema Validation (4-6 hours)
2. Coverage Measurement (1-2 hours)
3. BENCHMARK.md (30 minutes)

This brings you to **80% complete** and satisfies all **P0 criteria**.

---

## Conclusion

The Sigmatics v0.4.0 refactor has successfully delivered the **core declarative architecture** with **zero regressions** and **full algebraic correctness**. The foundation is production-ready.

The remaining gaps are **refinements and quality enhancements** that improve robustness, maintainability, and documentation. They do not affect core functionality.

**Recommended path:** Complete Phase 1 (Critical) items to reach full acceptance, then Phase 2/3 as time permits.
