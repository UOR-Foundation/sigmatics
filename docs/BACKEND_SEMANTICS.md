# Backend Execution Semantics

## Overview

Sigmatics v0.4.0 implements a **dual-backend architecture** for executing compiled models:

1. **Class Backend**: Fast path for operations on ℤ₉₆ class indices
2. **SGA Backend**: Algebraic path for full tensor product semantics

This document specifies the precise execution semantics for both backends.

## Backend Selection

```typescript
function selectBackend(
  complexity: ComplexityClass,
  preference?: 'auto' | 'class' | 'sga',
): 'class' | 'sga' {
  if (preference === 'class') return 'class';
  if (preference === 'sga') return 'sga';

  // Auto selection based on complexity
  return complexity === 'C0' || complexity === 'C1' ? 'class' : 'sga';
}
```

**Auto Selection Rules:**

- **C0** (constants): Class backend
- **C1** (class-local): Class backend
- **C2** (bridge required): SGA backend
- **C3** (full algebraic): SGA backend

## Class Backend

### Overview

The class backend operates directly on ℤ₉₆ class indices using:

- Direct integer arithmetic (mod 96)
- Pre-computed permutation tables for transforms
- No algebraic operations

### Execution Model

```typescript
interface ClassPlan {
  kind: 'class';
  operations: ClassOperation[];
}

type ClassOperation =
  | { type: 'add96'; overflowMode: 'drop' | 'track' }
  | { type: 'sub96'; overflowMode: 'drop' | 'track' }
  | { type: 'mul96'; overflowMode: 'drop' | 'track' }
  | { type: 'R'; k: number }
  | { type: 'D'; k: number }
  | { type: 'T'; k: number }
  | { type: 'M' };
```

**State Management:**

- No persistent state between operations
- Each operation consumes inputs directly
- Operations are stateless transformations

### Operation Semantics

#### Ring Operations

**add96:**

```typescript
function add96(a: number, b: number, mode: 'drop' | 'track'): RingResult {
  const sum = a + b;
  const value = sum % 96;
  const overflow = sum >= 96;

  return mode === 'track' ? { value, overflow } : { value };
}
```

**sub96:**

```typescript
function sub96(a: number, b: number, mode: 'drop' | 'track'): RingResult {
  const diff = a - b;
  const value = ((diff % 96) + 96) % 96;
  const overflow = diff < 0;

  return mode === 'track' ? { value, overflow } : { value };
}
```

**mul96:**

```typescript
function mul96(a: number, b: number, mode: 'drop' | 'track'): RingResult {
  const prod = a * b;
  const value = prod % 96;
  const overflow = prod >= 96;

  return mode === 'track' ? { value, overflow } : { value };
}
```

#### Transform Operations

Transforms use pre-computed permutation tables:

```typescript
const R_TABLE: readonly number[] = [...];  // R permutation
const D_TABLE: readonly number[] = [...];  // D permutation
const T_TABLE: readonly number[] = [...];  // T permutation
const M_TABLE: readonly number[] = [...];  // M permutation

function applyTransform(
  classIndex: number,
  transform: 'R' | 'D' | 'T' | 'M',
  k: number = 1
): number {
  let result = classIndex;

  for (let i = 0; i < k; i++) {
    switch (transform) {
      case 'R': result = R_TABLE[result]; break;
      case 'D': result = D_TABLE[result]; break;
      case 'T': result = T_TABLE[result]; break;
      case 'M': result = M_TABLE[result]; break;
    }
  }

  return result;
}
```

**Power Optimization:**

- R^k: Apply k mod 4 times (R⁴ = identity)
- D^k: Apply k mod 3 times (D³ = identity)
- T^k: Apply k mod 8 times (T⁸ = identity)
- M^k: Apply k mod 2 times (M² = identity)

### Type Conversion

The class backend automatically bridges when inputs don't match expected types:

```typescript
// Class backend with SGA input: project → execute → lift
if (plan.backend === 'class' && isSgaInput) {
  const classInput = project(sgaInput);
  if (classInput === null) {
    throw new Error('Cannot project non-rank-1 element to class backend');
  }
  const classResult = executeClassPlan(plan, { ...params, x: classInput });
  return lift(classResult);
}
```

### Performance Characteristics

| Operation              | Throughput     | Latency  |
| ---------------------- | -------------- | -------- |
| Ring ops (add/sub/mul) | 21-23M ops/sec | ~0.045µs |
| Transforms (R/D/T/M)   | 11-15M ops/sec | ~0.070µs |

**Optimization Strategies:**

- Table lookups for transforms (O(1))
- Direct arithmetic for ring ops
- No allocation/deallocation overhead

## SGA Backend

### Overview

The SGA backend operates on full `SgaElement` structures:

```typescript
interface SgaElement {
  clifford: CliffordElement; // Cl₀,₇
  z4: Z4Element; // ℤ₄
  z3: Z3Element; // ℤ₃
}
```

Implements full tensor product algebra:

```
SGA = Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]
```

### Execution Model

```typescript
interface SgaPlan {
  kind: 'sga';
  operations: SgaOperation[];
}

type SgaOperation =
  | { type: 'multiply' }
  | { type: 'add' }
  | { type: 'scale'; scalar: number }
  | { type: 'add96' | 'sub96' | 'mul96'; overflowMode }
  | { type: 'R' | 'D' | 'T' | 'M'; k?: number }
  | { type: 'projectGrade'; grade: number }
  | { type: 'lift'; classIndex: number }
  | { type: 'projectClass' };
```

**State Management:**

- Maintains `state: SgaElement | undefined`
- Operations consume `inputs` or `state`
- Final `state` returned as result

```typescript
function executeSgaPlan(plan: SgaPlan, inputs: Record<string, unknown>): unknown {
  let state: SgaElement | undefined = undefined;

  for (const op of plan.operations) {
    state = executeOperation(op, inputs, state);
  }

  return state;
}
```

### Operation Semantics

#### Tensor Product Operations

**multiply:**

```typescript
const a = inputs.a ?? state;
const b = inputs.b ?? state;
state = sgaMultiply(a, b);
// sgaMultiply: Cl₀,₇ × Cl₀,₇, ℤ₄ × ℤ₄, ℤ₃ × ℤ₃
```

**add:**

```typescript
const a = inputs.a ?? state;
const b = inputs.b ?? state;
state = sgaAdd(a, b);
// Component-wise addition
```

**scale:**

```typescript
const element = inputs.x ?? state;
state = sgaScale(element, scalar);
// Scalar multiplication across all components
```

#### Ring Operations (via Bridge)

Ring operations work at the class level via automatic bridging:

```typescript
function ringOp(a: unknown, b: unknown): SgaElement {
  // Project inputs to class indices
  const aClass = typeof a === 'number' ? a : project(a);
  const bClass = typeof b === 'number' ? b : project(b);

  if (aClass === null || bClass === null) {
    throw new Error('Ring op requires rank-1 elements');
  }

  // Perform class-level arithmetic
  const resultClass = (aClass ⊕ bClass) % 96;

  // Lift back to SGA
  return lift(resultClass);
}
```

#### Transform Operations (via Automorphisms)

Transforms are implemented as SGA automorphisms:

```typescript
// R: Quarter-turn rotation
state = transformRPower(element, k);
// Applies octonion-preserving rotation k times

// D: Diagonal flip
state = transformDPower(element, k);
// Applies diagonal reflection k times

// T: Time reversal
state = transformTPower(element, k);
// Applies time-reversal automorphism k times

// M: Mirror
state = transformM(element);
// Applies mirror reflection
```

**Algebraic Properties:**

```
R⁴ = D³ = T⁸ = M² = identity
RD = DR, RT = TR, DT = TD  (commutations)
MDM = D⁻¹, MRM = R⁻¹, MTM = T⁻¹  (conjugations)
```

#### Grade Projection

Projects Clifford algebra component to specific grade:

```typescript
const inputElement = inputs.x ?? state;
const projected = gradeProject(inputElement.clifford, grade);
state = {
  clifford: projected,
  z4: inputElement.z4,
  z3: inputElement.z3,
};
```

**Grades:**

- 0: Scalar
- 1: Vector (e₀, ..., e₆)
- 2: Bivector
- ...
- 7: Pseudoscalar

#### Bridge Operations

**lift:**

```typescript
state = lift(classIndex);
// Maps ℤ₉₆ class index to rank-1 SGA element
// Inverse of project when element is rank-1
```

**projectClass:**

```typescript
const element = inputs.x ?? state;
return project(element);
// Returns class index (0-95) or null if not rank-1
```

### Type Conversion

The SGA backend automatically bridges when inputs don't match expected types:

```typescript
// SGA backend with class input: lift → execute → project
if (plan.backend === 'sga' && !isSgaInput) {
  const sgaInput = lift(classInput);
  const sgaResult = executeSgaPlan(plan, { ...params, x: sgaInput });
  const projected = project(sgaResult);
  return projected !== null ? projected : sgaResult;
}
```

### Performance Characteristics

| Operation        | Throughput     | Latency    |
| ---------------- | -------------- | ---------- |
| Tensor multiply  | ~1M ops/sec    | ~1µs       |
| Transforms       | ~5-10M ops/sec | ~0.1-0.2µs |
| Bridge (lift)    | 0.7M ops/sec   | ~1.4µs     |
| Bridge (project) | 0.5M ops/sec   | ~2.0µs     |
| Grade projection | ~1-5M ops/sec  | ~0.2-1µs   |

**Performance Notes:**

- Slower than class backend due to algebraic operations
- Necessary for correctness beyond rank-1 elements
- Optimized for common patterns

## Backend Interoperability

### Automatic Bridging

Both backends support automatic type conversion:

```typescript
// Example: Class backend called with SGA input
const R = Atlas.Model.R(1); // Compiles to class backend (C1)
const sgaElement = lift(42);

// Automatic bridge: project → class operation → lift
const result = R.run({ x: sgaElement });
// 1. project(sgaElement) → 42
// 2. R_TABLE[42] → 17
// 3. lift(17) → SgaElement
```

```typescript
// Example: SGA backend called with class input
const projectGrade = Atlas.Model.projectGrade(1); // SGA backend (C2)
const classIndex = 42;

// Automatic bridge: lift → SGA operation → project?
const result = projectGrade.run({ x: classIndex });
// 1. lift(42) → SgaElement
// 2. gradeProject(..., 1) → SgaElement
// 3. Return SgaElement (no project needed)
```

### Bridge Correctness

**Invariant:** For rank-1 elements, both backends produce equivalent results.

```typescript
// Class backend
const resultClass = R(1).run({ x: 42 });

// SGA backend
const resultSga = R(1).run({ x: lift(42) });
const projected = project(resultSga);

assert(resultClass === projected); // ✓ Holds for rank-1
```

**Non-rank-1 elements:**

- Class backend cannot represent (throws error on projection)
- SGA backend required for correctness

## Error Handling

### Class Backend Errors

```typescript
// Non-rank-1 input
project(nonRank1Element); // → null
// → Error: Cannot project non-rank-1 element to class backend

// Invalid class index
applyTransform(96, 'R', 1); // → Error: Invalid class index
```

### SGA Backend Errors

```typescript
// Missing required input
executeSgaPlan(multiplyOp, {});
// → Error: Multiply requires two SGA elements

// Type mismatch
ringOp(nonRank1_a, nonRank1_b);
// → Error: Ring op requires rank-1 elements
```

## State Persistence

### Class Backend: Stateless

```typescript
executeClassPlan(plan, { x: 5 }); // Independent
executeClassPlan(plan, { x: 7 }); // Independent
// No state carried between invocations
```

### SGA Backend: Stateful Accumulator

```typescript
let state = undefined;

// Op 1: lift(42)
state = lift(42);

// Op 2: R(state, 1)
state = transformR(state, 1);

// Op 3: project(state)
return project(state); // Final result
```

**State Scope:**

- State lives within single `executeSgaPlan()` call
- Cleared at start of each invocation
- Not persisted across model executions

## Optimization Opportunities

### Class Backend

1. **Table memoization**: Pre-compute all transform powers
2. **SIMD**: Vectorize batch operations
3. **JIT compilation**: Specialize hot paths

### SGA Backend

1. **Lazy evaluation**: Defer Clifford operations until needed
2. **Sparse representation**: Skip zero components in tensor product
3. **Algebraic simplification**: Apply identities at IR level
4. **Grade specialization**: Optimize for common grades (0, 1)

## Appendix: Operation Reference

### Class Backend Operations

| Operation | Input Types      | Output Type  | Complexity         |
| --------- | ---------------- | ------------ | ------------------ |
| `add96`   | `number, number` | `RingResult` | O(1)               |
| `sub96`   | `number, number` | `RingResult` | O(1)               |
| `mul96`   | `number, number` | `RingResult` | O(1)               |
| `R(k)`    | `number`         | `number`     | O(k) table lookups |
| `D(k)`    | `number`         | `number`     | O(k) table lookups |
| `T(k)`    | `number`         | `number`     | O(k) table lookups |
| `M`       | `number`         | `number`     | O(1) table lookup  |

### SGA Backend Operations

| Operation         | Input Types              | Output Type      | Complexity          |
| ----------------- | ------------------------ | ---------------- | ------------------- |
| `multiply`        | `SgaElement, SgaElement` | `SgaElement`     | O(1) tensor ops     |
| `add`             | `SgaElement, SgaElement` | `SgaElement`     | O(1) component-wise |
| `scale`           | `SgaElement, number`     | `SgaElement`     | O(1) scalar mult    |
| `R(k)`            | `SgaElement`             | `SgaElement`     | O(k) automorphisms  |
| `D(k)`            | `SgaElement`             | `SgaElement`     | O(k) automorphisms  |
| `T(k)`            | `SgaElement`             | `SgaElement`     | O(k) automorphisms  |
| `M`               | `SgaElement`             | `SgaElement`     | O(1) reflection     |
| `projectGrade(k)` | `SgaElement`             | `SgaElement`     | O(1) Clifford proj  |
| `lift(i)`         | `number`                 | `SgaElement`     | O(1) bridge         |
| `projectClass`    | `SgaElement`             | `number \| null` | O(1) bridge         |

---

**Version**: 0.4.0
**Date**: 2025-11-08
**Status**: Stable
