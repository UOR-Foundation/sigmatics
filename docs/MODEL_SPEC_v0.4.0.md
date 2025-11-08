# Sigmatics Model Specification v0.4.0

## Executive Summary

This document specifies the **declarative model system** introduced in Sigmatics v0.4.0. All Sigil operations are compiled through a central registry from declarative model descriptors, replacing the previous imperative implementation.

**Key Design Principles:**
- **Declarative**: Models defined as data, not code
- **Compiled**: Descriptors → IR → Backend plans
- **Cached**: Compiled artifacts cached with schema invalidation
- **Dual-backend**: Class backend (fast) + SGA backend (correct)
- **Validated**: JSON-Schema runtime validation

## Model Architecture

### Compilation Pipeline

```
Model Descriptor (JSON)
  ↓
Validation (JSON-Schema)
  ↓
IR Generation (buildIR)
  ↓
Normalization (rewrites)
  ↓
Complexity Analysis
  ↓
Backend Selection
  ↓
Lowering (Class or SGA)
  ↓
Compiled Model (cached)
```

### Model Descriptor

A model descriptor is a JSON-compatible object specifying:

```typescript
interface ModelDescriptor {
  // Identity
  name: string;           // Model name (e.g., "R", "add96")
  version: string;        // Semver (e.g., "1.0.0")
  namespace: string;      // Namespace (e.g., "stdlib.transforms")

  // Parameters
  compiled: Record<string, unknown>;  // Compile-time params
  runtime: Record<string, unknown>;   // Runtime params (schema only)

  // Optimization hints
  complexityHint?: ComplexityClass;  // C0-C3
  loweringHints?: {
    prefer?: 'auto' | 'class' | 'sga';
  };
}
```

**Example - R Transform:**
```json
{
  "name": "R",
  "version": "1.0.0",
  "namespace": "stdlib.transforms",
  "compiled": { "k": 1 },
  "runtime": { "x": 0 },
  "complexityHint": "C1",
  "loweringHints": { "prefer": "auto" }
}
```

### Intermediate Representation (IR)

The IR is a tiny functional language for Sigil operations:

```typescript
type IRNode =
  | { kind: 'atom'; op: AtomOp }
  | { kind: 'seq'; left: IRNode; right: IRNode }      // f ∘ g
  | { kind: 'par'; left: IRNode; right: IRNode }      // f ⊗ g
  | { kind: 'transform'; transform: TransformOp; child: IRNode };

type AtomOp =
  | { type: 'classLiteral'; value: number }          // c<i>
  | { type: 'param'; name: string }                  // x (runtime)
  | { type: 'lift'; classIndex: number }             // lift(i)
  | { type: 'project'; grade: number }               // πₖ
  | { type: 'projectClass'; child: IRNode }          // class(x)
  | { type: 'add96'; overflowMode }                  // +₉₆
  | { type: 'sub96'; overflowMode }                  // -₉₆
  | { type: 'mul96'; overflowMode };                 // ×₉₆

type TransformOp =
  | { type: 'R'; k: number }                         // R^k
  | { type: 'D'; k: number }                         // D^k
  | { type: 'T'; k: number }                         // T^k
  | { type: 'M' };                                   // M
```

**IR Laws:**
- Seq associativity: `(f ∘ g) ∘ h = f ∘ (g ∘ h)`
- Par associativity: `(f ⊗ g) ⊗ h = f ⊗ (g ⊗ h)`
- Transform powers: `R^k ∘ R^j = R^(k+j mod 4)`

### Complexity Classes

Models are assigned complexity classes determining backend selection:

| Class | Operations | Examples | Backend |
|-------|-----------|----------|---------|
| **C0** | Pure constant | `lift(42)` | Class |
| **C1** | Class-local | Ring ops, transforms on classes | Class |
| **C2** | Bridge required | Grade projection, lift/project | SGA |
| **C3** | Full algebraic | General SGA operations | SGA |

**Complexity Analysis:**
```typescript
function analyzeComplexity(ir: IRNode): ComplexityClass {
  // Heuristic analysis:
  // - Atoms: C0 (literals/lift) or C1 (params/ring ops)
  // - Transforms: max(child, C1)
  // - Grade projection: C2
  // - Seq/Par: max(left, right)
  return computeComplexity(ir);
}
```

### Backend Selection

```typescript
function selectBackend(
  complexity: ComplexityClass,
  preference?: 'auto' | 'class' | 'sga'
): 'class' | 'sga' {
  if (preference === 'class') return 'class';
  if (preference === 'sga') return 'sga';

  // Auto: use class for C0-C1, SGA for C2-C3
  return complexity === 'C0' || complexity === 'C1' ? 'class' : 'sga';
}
```

## Standard Library Models

### Ring Operations

**add96, sub96, mul96**
- **Namespace**: `stdlib.ring`
- **Compiled params**: `{ overflowMode: 'drop' | 'track' }`
- **Runtime params**: `{ a: number, b: number }`
- **Complexity**: C1
- **Backend**: Class
- **Semantics**: Modular arithmetic in ℤ₉₆

```typescript
add96('drop').run({ a: 50, b: 60 }) // → { value: 14 }
add96('track').run({ a: 50, b: 60 }) // → { value: 14, overflow: true }
```

### Transforms

**R, D, T, M**
- **Namespace**: `stdlib.transforms`
- **Compiled params**: `{ k: number }` (R, D, T only)
- **Runtime params**: `{ x: number | SgaElement }`
- **Complexity**: C1
- **Backend**: Auto (class for numbers, SGA for SgaElements)
- **Semantics**: Automorphisms of SGA

**Transform Laws:**
```
R⁴ = D³ = T⁸ = M² = identity
RD = DR, RT = TR, DT = TD
MDM = D⁻¹, MRM = R⁻¹, MTM = T⁻¹
```

```typescript
R(1).run({ x: 5 }) // → rotate class 5 by quarter-turn
R(2).run({ x: 5 }) // → rotate by half-turn (R²)
M().run({ x: 7 })  // → mirror class 7
```

### Bridge Operations

**lift**
- **Namespace**: `stdlib.bridge`
- **Compiled params**: `{ classIndex: number }`
- **Runtime params**: `{}`
- **Complexity**: C0
- **Backend**: Auto
- **Semantics**: Lift class index to rank-1 SGA element

```typescript
lift(42).run({}) // → SgaElement corresponding to class 42
```

**projectClass**
- **Namespace**: `stdlib.bridge`
- **Compiled params**: `{}`
- **Runtime params**: `{ x: SgaElement }`
- **Complexity**: C1
- **Backend**: SGA
- **Semantics**: Project SGA element to class index (or null)

```typescript
projectClass().run({ x: sgaElement }) // → 42 or null
```

### Grade Operations

**projectGrade**
- **Namespace**: `stdlib.grade`
- **Compiled params**: `{ grade: number }` (0-7)
- **Runtime params**: `{ x: SgaElement }`
- **Complexity**: C2
- **Backend**: SGA
- **Semantics**: Clifford algebra grade projection πₖ

```typescript
projectGrade(1).run({ x: sgaElement }) // → grade-1 component
```

## Model Registry & Caching

### Cache Architecture

```typescript
// Cache key format:
{namespace}/{name}@{version}#{schemaHash}:{compiledParams}

// Example:
stdlib.transforms/R@1.0.0#a3f8c2:{"k":1}
```

**Cache Invalidation:**
- Descriptor changes (name, version, namespace)
- Compiled params change
- Schema content changes (hash mismatch)

**Cache Operations:**
```typescript
cache.get(descriptor)      // Retrieve compiled model
cache.set(descriptor, model) // Store compiled model
cache.clear()              // Clear all cached models
cache.getStats()           // Get cache statistics
```

### Compilation Flow

```typescript
function compileModel<T, R>(descriptor: ModelDescriptor): CompiledModel<T, R> {
  // 1. Validate descriptor (JSON-Schema)
  const validation = validateDescriptor(descriptor);
  if (!validation.valid) throw new Error(...);

  // 2. Check cache
  const cached = cache.get<T, R>(descriptor);
  if (cached) return cached;

  // 3. Build IR from descriptor
  const ir = buildIR(descriptor);

  // 4. Normalize IR (rewrites)
  const normalized = normalize(ir);

  // 5. Analyze complexity
  const complexity = analyzeComplexity(normalized, descriptor.compiled);

  // 6. Select backend
  const backendType = selectBackend(complexity, descriptor.loweringHints?.prefer);

  // 7. Lower to backend plan
  const plan = backendType === 'class'
    ? lowerToClassBackend(normalized)
    : lowerToSgaBackend(normalized);

  // 8. Create compiled model with run() method
  const compiled = { descriptor, complexity, plan, run(params) { ... } };

  // 9. Cache and return
  cache.set(descriptor, compiled);
  return compiled;
}
```

## JSON-Schema Validation

Every model has a corresponding JSON schema in `src/model/schemas/{name}.json`.

**Example - R.json:**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "R",
  "type": "object",
  "properties": {
    "name": { "type": "string", "const": "R" },
    "version": { "type": "string", "pattern": "^1\\.0\\.0$" },
    "namespace": { "type": "string", "const": "stdlib.transforms" },
    "compiled": {
      "type": "object",
      "properties": {
        "k": { "type": "integer" }
      },
      "required": ["k"]
    }
  },
  "required": ["name", "version", "namespace", "compiled", "runtime"]
}
```

**Validation Process:**
1. Load schema from filesystem
2. Remove `$schema` meta-schema reference (AJV compatibility)
3. Compile schema with AJV
4. Validate descriptor
5. Report errors with paths

## Backend Semantics

### Class Backend

Fast path for operations on ℤ₉₆ class indices.

**Supported:**
- Ring operations (add/sub/mul mod 96)
- Transforms via permutation tables
- Class literals and parameters

**Not Supported:**
- SGA-level operations
- Grade projections
- Non-rank-1 elements

**Performance:** 11-23M ops/sec

### SGA Backend

Algebraic fallback for full SGA semantics.

**Supported:**
- All ring operations
- All transforms (via automorphisms)
- Grade projections
- Bridge operations
- Tensor product operations

**Performance:** Varies (0.5-15M ops/sec depending on operation)

**State Machine:**
- Maintains `state: SgaElement` accumulator
- Operations consume inputs or state
- Final state returned as result

## Extensibility

### Adding a New Model

1. **Define descriptor schema**: Create `src/model/schemas/myModel.json`
2. **Add IR builder**: Update `buildIR()` in `src/server/registry.ts`
3. **Add stdlib export**: Update `StdlibModels` object
4. **Add lowering**: Update backends to handle new IR operations
5. **Add tests**: Test model compilation and execution

**Example:**
```typescript
// 1. Schema: src/model/schemas/myModel.json
// 2. IR builder:
if (name === 'myModel') {
  const param = compiled.param as number;
  return IR.myOperation(IR.param('x'), param);
}

// 3. Stdlib export:
myModel: (param: number) => compileModel({
  name: 'myModel',
  version: '1.0.0',
  namespace: 'custom',
  compiled: { param },
  runtime: { x: 0 },
  complexityHint: 'C1',
}),
```

## Invariants & Guarantees

### Type Safety
- **Compile-time**: TypeScript enforces descriptor structure
- **Runtime**: JSON-Schema validates descriptors before compilation
- **Execution**: Backend plans execute with type-checked operations

### Correctness
- **Algebraic laws**: Transform powers and commutations enforced
- **Dual semantics**: Class and SGA backends produce equivalent results for rank-1 elements
- **Bridge correctness**: `project ∘ lift = identity` on valid inputs

### Performance
- **Caching**: Compiled models cached, avoiding re-compilation
- **Backend selection**: Optimal backend chosen based on complexity
- **Fast path**: 99%+ operations route through class backend

## Migration from v0.3.x

### Before (v0.3.x - Imperative)
```typescript
import { transformR, add96 } from '@uor-foundation/sigmatics';

const result = transformR(classIndex, 1);
const sum = add96(a, b, 'drop');
```

### After (v0.4.0 - Declarative)
```typescript
import { Atlas } from '@uor-foundation/sigmatics';

const R = Atlas.Model.R(1);
const add = Atlas.Model.add96('drop');

const result = R.run({ x: classIndex });
const sum = add.run({ a, b });
```

### Breaking Changes
1. All operations now go through `compileModel()`
2. Runtime invocation uses `.run(params)` instead of direct calls
3. Models are first-class values that can be cached, introspected
4. Schema validation enforced at runtime

## Appendix: Complete IR Grammar

```
IRNode ::=
  | Atom(AtomOp)
  | Seq(IRNode, IRNode)
  | Par(IRNode, IRNode)
  | Transform(TransformOp, IRNode)

AtomOp ::=
  | ClassLiteral(value: 0..95)
  | Param(name: string)
  | Lift(classIndex: 0..95)
  | Project(grade: 0..7)
  | ProjectClass(child: IRNode)
  | Add96(overflowMode: 'drop' | 'track')
  | Sub96(overflowMode: 'drop' | 'track')
  | Mul96(overflowMode: 'drop' | 'track')

TransformOp ::=
  | R(k: 0..3)
  | D(k: 0..2)
  | T(k: 0..7)
  | M
```

## Appendix: Cache Statistics Example

```typescript
import { getCacheStats, clearCache } from '@uor-foundation/sigmatics';

const stats = getCacheStats();
console.log(stats);
// {
//   size: 12,
//   keys: [
//     'stdlib.ring/add96@1.0.0#a3f8:{"overflowMode":"drop"}',
//     'stdlib.transforms/R@1.0.0#b4c9:{"k":1}',
//     ...
//   ]
// }

clearCache(); // Clear all compiled models
```

---

**Version**: 0.4.0
**Date**: 2025-11-08
**Status**: Stable
