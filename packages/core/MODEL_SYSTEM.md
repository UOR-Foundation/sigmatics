# Sigmatics v0.4.0: Declarative Model System

## Overview

Sigmatics v0.4.0 introduces a declarative model architecture where every stdlib operation is defined as a **compiled model** with dual backend execution:

- **Class Backend**: Fast permutation path for rank-1/class-pure operations
- **SGA Backend**: Full algebraic semantics for general SGA elements

Models accept both `number` (class index) and `SgaElement` inputs, automatically dispatching to the appropriate backend at runtime.

## Architecture

```
┌─────────────────┐
│ Model Descriptor│  JSON Schema definition
│  (JSON Schema)  │  ↓
└─────────────────┘  compileModel()
         ↓
┌─────────────────┐
│  Compiled Model │  IR → Rewrites → Fusion → Lowering
│   (In-Memory)   │
└─────────────────┘
         ↓
    .run(params)
         ↓
┌─────────────────────────────┐
│   Dynamic Dispatch          │
│  (runtime type checking)    │
├─────────────────────────────┤
│  number input → class backend│
│  SgaElement   → SGA backend │
└─────────────────────────────┘
         ↓
┌──────────────┬──────────────┐
│ Class Backend│  SGA Backend │
│  (Fast Path) │ (Correctness)│
└──────────────┴──────────────┘
```

### Key Components

1. **Model Descriptor**: JSON Schema definition with compile-time and runtime parameters
2. **IR (Intermediate Representation)**: Tiny algebraic IR with atoms, combinators, and transforms
3. **Compiler Pipeline**: normalize → analyze complexity → select backend → lower to plan
4. **Dual Backends**:
   - **Class**: Integer arithmetic mod 96, permutations via group algebra powers
   - **SGA**: Full Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃] semantics
5. **Runtime Dispatch**: Automatic type-based backend selection with bridge conversions

## Usage

### Basic API

```typescript
import { Atlas } from '@uor-foundation/sigmatics';

// Transform models
const rModel = Atlas.Model.R(2); // Compile R² transform
const result = rModel.run({ x: 21 }); // Execute: 21 → 69

// Ring operations
const addModel = Atlas.Model.add96('track');
const sum = addModel.run({ a: 50, b: 60 });
// { value: 14, overflow: true }

// Bridge operations
const liftModel = Atlas.Model.lift(42);
const element = liftModel.run({}); // Class 42 → SGA element
```

### Dual Backend Dispatch

Models automatically select the appropriate backend based on input type:

```typescript
const dModel = Atlas.Model.D(1); // Compile D¹ (triality) transform

// Class backend (fast path)
const classResult = dModel.run({ x: 21 }); // number input → class backend
console.log(classResult); // 5

// SGA backend (full semantics)
const sgaInput = Atlas.SGA.lift(21);
const sgaResult = dModel.run({ x: sgaInput }); // SgaElement → SGA backend
const projected = Atlas.SGA.project(sgaResult);
console.log(projected); // 5 (same result, different execution path)
```

### Direct Registry Access

Advanced users can access the registry directly:

```typescript
import { Server } from '@uor-foundation/sigmatics';

// Compile custom models
const customModel = Server.compileModel({
  name: 'custom',
  version: '1.0.0',
  namespace: 'user.ops',
  compiled: { k: 3 },
  runtime: { x: 0 },
  complexityHint: 'C1',
  loweringHints: { prefer: 'auto' },
});

// Execute
const result = customModel.run({ x: 42 });
```

## Stdlib Models

### Ring Operations

```typescript
// Addition modulo 96
Atlas.Model.add96(overflowMode: 'drop' | 'track')
// Input: { a: number, b: number }
// Output: number | { value: number, overflow: boolean }

// Subtraction modulo 96
Atlas.Model.sub96(overflowMode: 'drop' | 'track')
// Input: { a: number, b: number }
// Output: number | { value: number, overflow: boolean }

// Multiplication modulo 96
Atlas.Model.mul96(overflowMode: 'drop' | 'track')
// Input: { a: number, b: number }
// Output: number | { value: number, overflow: boolean }
```

### Transforms

```typescript
// R: Rotation (period 4)
Atlas.Model.R(k: number)
// Input: { x: number | SgaElement }
// Output: number | SgaElement

// D: Triality (period 3)
Atlas.Model.D(k: number)
// Input: { x: number | SgaElement }
// Output: number | SgaElement

// T: Twist (period 8)
Atlas.Model.T(k: number)
// Input: { x: number | SgaElement }
// Output: number | SgaElement

// M: Mirror (period 2)
Atlas.Model.M()
// Input: { x: number | SgaElement }
// Output: number | SgaElement
```

### Grade Operations

```typescript
// Project to specific grade
Atlas.Model.projectGrade(grade: number)
// Input: { x: SgaElement }
// Output: SgaElement
```

### Bridge Operations

```typescript
// Lift class index to SGA element
Atlas.Model.lift(classIndex: number)
// Input: {} (classIndex is compile-time)
// Output: SgaElement
```

## Compiler Pipeline

### 1. IR Construction

Models are compiled to a tiny algebraic IR:

```typescript
// Atoms
{ kind: 'atom', op: { type: 'classLiteral', value: 42 } }
{ kind: 'atom', op: { type: 'param', name: 'x' } }  // Runtime param
{ kind: 'atom', op: { type: 'lift', classIndex: 5 } }
{ kind: 'atom', op: { type: 'add96', overflowMode: 'drop' } }

// Combinators
{ kind: 'seq', left: IR1, right: IR2 }  // Sequential composition (∘)
{ kind: 'par', left: IR1, right: IR2 }  // Parallel composition (⊗)

// Transforms
{ kind: 'transform', transform: { type: 'R', k: 2 }, child: IR }
```

### 2. Rewrites (Normalization)

- Push transforms to leaves
- Fold consecutive transforms: R^a ∘ R^b → R^(a+b)
- Apply mirror conjugation rules: MRM = R⁻¹, MDM = D⁻¹, MTM = T⁻¹
- Normalize transform powers: R^k mod 4, D^k mod 3, T^k mod 8
- Canonicalize non-adjacent same-type transform chains post-normalization (v0.4.0 extension)

Limitations:
- Cross-type transform folding beyond mirror conjugation is intentionally avoided to preserve evaluation order semantics.
- Power aggregation skips chains separated by parallel composition boundaries.
- Mirror conjugation does not invert nested chains with intervening lift/project operations; those remain explicit for correctness.
- Future pass may introduce dead transform elimination (e.g., R^0) after backend selection; currently retained for traceability.

### 3. Complexity Analysis

Models are classified into complexity classes:

- **C0**: Fully compiled (no runtime degrees of freedom)
- **C1**: Few runtime degrees, class-pure → prefer class backend
- **C2**: Bounded mixed-grade operations → prefer SGA backend
- **C3**: General case → SGA backend

Heuristic details used by the compiler:

- Depth thresholds: shallow graphs (seqDepth ≤ 3, parDepth ≤ 2) stay in C1 when class-pure.
- Grade selectors: the presence of project(k) or projectClass moves models to at least C2; more than two selectors or deep graphs escalate to C3.
- Rationale: shallow, class-pure graphs maximize permutation fusion (class backend). Grade selectors or deep compositions require SGA’s grade semantics to preserve correctness without over-fusing.

### 4. Backend Selection

```typescript
// Automatic selection
if (preference === 'auto') {
  if (complexity === 'C0' || complexity === 'C1') {
    return 'class'; // Fast path
  } else {
    return 'sga'; // Correctness
  }
}

// Explicit hints
loweringHints: {
  prefer: 'class' | 'sga' | 'auto';
}
```

### 5. Lowering

#### Class Backend Plan

```typescript
{
  kind: 'class',
  operations: [
    { type: 'R', k: 2 },
    { type: 'add96', overflowMode: 'drop' },
    { type: 'lift', classIndex: 5 }
  ]
}
```

#### SGA Backend Plan

```typescript
{
  kind: 'sga',
  operations: [
    { type: 'transformR', k: 2 },
    { type: 'add96', overflowMode: 'track' },
    { type: 'project', grade: 1 }
  ]
}
```

## Testing

The model system includes comprehensive test coverage:

### Differential Tests (456 tests)

Verify class and SGA backends produce identical results for rank-1 operations:

```typescript
// Ring operations: add96, sub96, mul96
// Sample: all combinations of {0, 10, 20, ..., 90}
// Total: 300 tests

// Transforms: R, D, T, M
// Sample: {0, 8, 16, ..., 88} × all powers
// Total: 156 tests
```

### Compiled Model Correctness (176 tests)

Validate compiled models satisfy algebraic laws:

```typescript
// Transform orders (40 tests)
R⁴ = D³ = T⁸ = M² = identity

// Commutations (30 tests)
RD = DR, RT = TR, DT = TD

// Conjugations (10 tests)
MDM = D⁻¹

// Bridge round-trip (96 tests)
project(lift(i)) = i  for all i ∈ [0..95]
```

### Running Tests

```bash
npm test
# 1344 existing tests + 632 new model tests = 1976 total tests
```

## Performance Characteristics

### Class Backend

- **Complexity**: O(1) for transforms, O(1) for ring ops
- **Memory**: ~100 bytes per model
- **Throughput**: ~10M ops/sec (transforms), ~50M ops/sec (ring)

### SGA Backend

- **Complexity**: O(k) for grade-k elements
- **Memory**: ~1KB per rank-1 element
- **Throughput**: ~100K ops/sec (transforms), ~1M ops/sec (ring)

### Dynamic Dispatch Overhead

- **Type check**: ~5ns per call
- **Bridge conversion**: ~50ns (lift), ~100ns (project)
- **Amortized**: <1% overhead for typical workloads

## Schema Catalog

All stdlib models have JSON Schema definitions in `src/model/schemas/`:

- `add96.json` - Addition modulo 96
- `sub96.json` - Subtraction modulo 96
- `mul96.json` - Multiplication modulo 96
- `R.json` - Rotation transform
- `D.json` - Triality transform
- `T.json` - Twist transform
- `M.json` - Mirror transform
- `project.json` - Grade projection
- `lift.json` - Class-to-SGA bridge

## Future Extensions

The model system is designed to support:

1. **User-defined models**: Custom operations via JSON Schema
2. **Model composition**: Combine models via IR composition
3. **Optimization passes**: Fusion, constant folding, dead code elimination
4. **JIT compilation**: Lower to WASM/native code for hot paths
5. **Distributed execution**: Execute plans across workers/GPUs

## See Also

- [SGA Documentation](./SGA.md) - Sigmatics Geometric Algebra
- [IR Reference](./docs/IR.md) - Intermediate Representation
- [Backend Guide](./docs/BACKENDS.md) - Class and SGA backend internals
- [API Reference](./docs/API.md) - Full API documentation
