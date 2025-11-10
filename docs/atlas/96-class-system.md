# The 96-Class System: Emergence from Structure

The 96 classes are not an arbitrary choice. They **emerge** from the rank-1 basis of the tensor product structure **Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]**.

This document explains how 256 bytes map to 96 equivalence classes, why this structure is inevitable, and how it forms the computational substrate for Atlas.

## The Emergence of 96

### From Tensor Product to Classes

**Rank-1 basis elements**:

```
E_{h,d,ℓ} = r^h ⊗ e_ℓ ⊗ τ^d
```

**Parameters**:

- **h ∈ {0,1,2,3}**: Quadrant index (4 choices from ℤ₄)
- **d ∈ {0,1,2}**: Modality index (3 choices from ℤ₃)
- **ℓ ∈ {0,1,2,3,4,5,6,7}**: Context index (8 choices from Cl₀,₇)
  - ℓ=0: Scalar (grade 0)
  - ℓ=1..7: Basis vectors e₁, e₂, ..., e₇ (grade 1)

**Total count**:

```
4 × 3 × 8 = 96
```

This is **not a design parameter** - it is the **natural dimension** of the rank-1 basis.

### Class Index Formula

**Encoding**:

```
class(h, d, ℓ) = 24h + 8d + ℓ
```

**Range**: {0, 1, 2, ..., 95}

**Decoding**:

```
h = ⌊class / 24⌋        ∈ {0,1,2,3}
d = ⌊(class mod 24) / 8⌋  ∈ {0,1,2}
ℓ = class mod 8          ∈ {0..7}
```

**Implementation**: [class-system/class.ts:135-149](../../packages/core/src/class-system/class.ts)

**Examples**:

```
class(0, 0, 0) = 0    (h₂=0, d=neutral, ℓ=scalar)
class(0, 0, 5) = 5    (h₂=0, d=neutral, ℓ=e₅)
class(0, 2, 5) = 21   (h₂=0, d=consume, ℓ=e₅)
class(1, 0, 0) = 24   (h₂=1, d=neutral, ℓ=scalar)
class(3, 2, 7) = 95   (h₂=3, d=consume, ℓ=e₇)
```

### Coordinate Interpretation

The triple (h, d, ℓ) gives **semantic meaning** to each class:

**h (Scope)**: "Where" the computation happens

- 0: First quadrant
- 1: Second quadrant
- 2: Third quadrant
- 3: Fourth quadrant

Relates to **compilation phase**, **namespace**, or **execution context**.

**d (Modality)**: "How" the computation behaves

- 0: Neutral (no bias)
- 1: Produce (output-oriented)
- 2: Consume (input-oriented)

Relates to **producer/consumer** patterns, **data flow direction**, or **evaluation strategy**.

**ℓ (Context)**: "What" structure is being manipulated

- 0: Empty/scalar (trivial structure)
- 1..7: Seven distinct structural slots

Relates to **data type**, **arity**, or **shape**.

**This semantic interpretation is not imposed - it emerges from the algebraic structure.**

## Byte Encoding: 256 → 96

### The Equivalence Relation (≡₉₆)

**Problem**: How do 256 bytes (B⁸) map to 96 classes?

**Answer**: Through an **equivalence relation** defined by the coordinate decomposition.

**Byte structure** (8 bits: b₇ b₆ b₅ b₄ b₃ b₂ b₁ b₀):

```
h₂ = (b₇ << 1) | b₆           (bits 7-6: quadrant)
d  = decode(b₅, b₄)           (bits 5-4: modality)
ℓ  = (b₃ << 2) | (b₂ << 1) | b₁  (bits 3-1: context)
b₀ = LSB (ignored for equivalence)
```

**Modality decoding**:

```
(b₅, b₄) → d
(0, 0) → 0  (neutral)
(0, 1) → 1  (produce)
(1, 0) → 2  (consume)
(1, 1) → 2  (consume, ambiguous encoding)
```

**Key insight**: The encoding (b₅, b₄) = (1, 1) is **redundant** with (1, 0) - both decode to d=2. This creates equivalence.

**Equivalence classes**:

- Most classes have **2 representatives**: one with b₀=0, one with b₀=1
- Some classes have **4 representatives**: when (b₅, b₄) ambiguity is combined with b₀ freedom

**Example**:

```
Class 21: (h=0, d=2, ℓ=5)
Byte representatives:
  0x2A = 0010 1010 → (h=0, d=2, ℓ=5, b₀=0) [canonical]
  0x2B = 0010 1011 → (h=0, d=2, ℓ=5, b₀=1)
  0x3A = 0011 1010 → (h=0, d=2, ℓ=5, b₀=0) via (b₅,b₄)=(1,1)
  0x3B = 0011 1011 → (h=0, d=2, ℓ=5, b₀=1) via (b₅,b₄)=(1,1)
```

**Implementation**: [class-system/class.ts:55-95](../../packages/core/src/class-system/class.ts)

### Canonical Form

**Definition**: The **canonical byte** for a class is the unique representative with:

1. **b₀ = 0** (LSB cleared)
2. **Minimal modality encoding**: (b₅, b₄) ∈ {(0,0), (0,1), (1,0)} (never (1,1))

**Encoding function**:

```typescript
function encodeComponentsToByte(h: number, d: number, ℓ: number): number {
  const b6_b7 = h & 0b11;
  const b4_b5 = d === 0 ? 0b00 : d === 1 ? 0b01 : 0b10;
  const b1_b3 = ℓ & 0b111;
  return (b6_b7 << 6) | (b4_b5 << 4) | (b1_b3 << 1);
  // b₀ is implicitly 0
}
```

**Property**: Every class has a **unique canonical byte**.

**Implementation**: [class-system/class.ts:179-202](../../packages/core/src/class-system/class.ts)

**Invariant**: All evaluation backends (literal, operational, SGA) **must output canonical bytes**.

This ensures:

- **Deterministic output**: Same expression always produces same bytes
- **Equality testing**: Can compare bytes directly
- **Consistency**: Different evaluation paths produce identical results

## Structural Properties

### Distribution Across Quadrants

**Classes per quadrant**:

```
Each h ∈ {0,1,2,3} contributes 3 modalities × 8 contexts = 24 classes
Total: 4 × 24 = 96
```

**Class ranges**:

- Quadrant 0 (h=0): classes 0..23
- Quadrant 1 (h=1): classes 24..47
- Quadrant 2 (h=2): classes 48..71
- Quadrant 3 (h=3): classes 72..95

### Distribution Across Modalities

**Classes per modality**:

```
Each d ∈ {0,1,2} contributes 4 quadrants × 8 contexts = 32 classes
Total: 3 × 32 = 96
```

**Class sets**:

- Neutral (d=0): {0..7, 24..31, 48..55, 72..79}
- Produce (d=1): {8..15, 32..39, 56..63, 80..87}
- Consume (d=2): {16..23, 40..47, 64..71, 88..95}

### Distribution Across Contexts

**Classes per context slot**:

```
Each ℓ ∈ {0..7} contributes 4 quadrants × 3 modalities = 12 classes
Total: 8 × 12 = 96
```

**Context ℓ=0** (scalar):

- Classes {0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88}

**Context ℓ=5** (basis vector e₅):

- Classes {5, 13, 21, 29, 37, 45, 53, 61, 69, 77, 85, 93}

### Symmetry

The class structure exhibits **complete symmetry** under the factorization 4 × 3 × 8:

- **R (rotation)**: Permutes across quadrants (h → h+1)
- **D (triality)**: Permutes across modalities (d → d+1)
- **T (twist)**: Permutes across contexts (ℓ → ℓ+1)

Each transform preserves the product structure.

**Theorem**: The group generated by {R, D, T} acts **transitively** on the 96 classes.

**Proof**: For any two classes c₁, c₂, decompose to (h₁,d₁,ℓ₁) and (h₂,d₂,ℓ₂). Then:

```
R^(h₂-h₁) ∘ D^(d₂-d₁) ∘ T^(ℓ₂-ℓ₁) : c₁ ↦ c₂
```

All arithmetic is mod the appropriate modulus. ∎

**Corollary**: There are no "special" classes - all 96 are equivalent under symmetry.

## Triality Orbits

**Definition**: A **triality orbit** is the set of three classes related by the D (modality rotation) transform.

**Orbit structure**:

```
For each (h, ℓ) ∈ {0..3} × {0..7}:
  Orbit_{h,ℓ} = {class(h, 0, ℓ), class(h, 1, ℓ), class(h, 2, ℓ)}
```

**Count**:

```
4 quadrants × 8 contexts = 32 orbits
32 orbits × 3 elements per orbit = 96 classes
```

**Example orbits**:

**Orbit (h=0, ℓ=5)**:

- class(0, 0, 5) = 5 (neutral)
- class(0, 1, 5) = 13 (produce)
- class(0, 2, 5) = 21 (consume)

Under D transform:

```
D(5) = 13
D(13) = 21
D(21) = 5
```

**Orbit (h=2, ℓ=0)**:

- class(2, 0, 0) = 48 (neutral)
- class(2, 1, 0) = 56 (produce)
- class(2, 2, 0) = 64 (consume)

**Property**: D has order 3, so each orbit has exactly 3 elements.

**Implementation**: [sga/transforms.ts:136-149](../../packages/core/src/sga/transforms.ts) (applyTriality, getTrialityOrbit)

## Context Cycles

**Definition**: A **context cycle** is the set of 8 classes related by the T (context twist) transform.

**Cycle structure**:

```
For each (h, d) ∈ {0..3} × {0..2}:
  Cycle_{h,d} = {class(h, d, 0), class(h, d, 1), ..., class(h, d, 7)}
```

**Count**:

```
4 quadrants × 3 modalities = 12 cycles
12 cycles × 8 elements per cycle = 96 classes
```

**Example cycle**:

**Cycle (h=0, d=0)**:

- {0, 1, 2, 3, 4, 5, 6, 7}

Under T transform:

```
T(0) = 1, T(1) = 2, ..., T(6) = 7, T(7) = 0
```

Forms an 8-cycle: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 0

**Special property**: The cycle includes ℓ=0 (scalar), which is a **distinguished element**.

**Semantic interpretation**: T rotates through all 8 structural contexts, including the trivial (scalar) context.

**Implementation**: [sga/transforms.ts:90-115](../../packages/core/src/sga/transforms.ts) (applyTwist)

## Quadrant Permutations

**Definition**: A **quadrant permutation** is the set of 4 classes related by the R (rotation) transform.

**Permutation structure**:

```
For each (d, ℓ) ∈ {0..2} × {0..7}:
  Perm_{d,ℓ} = {class(0, d, ℓ), class(1, d, ℓ), class(2, d, ℓ), class(3, d, ℓ)}
```

**Count**:

```
3 modalities × 8 contexts = 24 permutations
24 permutations × 4 elements each = 96 classes
```

**Example permutation**:

**Perm (d=2, ℓ=5)**:

- class(0, 2, 5) = 21
- class(1, 2, 5) = 45
- class(2, 2, 5) = 69
- class(3, 2, 5) = 93

Under R transform:

```
R(21) = 45, R(45) = 69, R(69) = 93, R(93) = 21
```

Forms a 4-cycle: 21 → 45 → 69 → 93 → 21

**Implementation**: [sga/transforms.ts:17-33](../../packages/core/src/sga/transforms.ts) (applyRotation)

## Invariants

**The 96-class system preserves critical invariants:**

### Invariant 1: Bijective Encoding

**Property**: The mapping (h, d, ℓ) ↔ class_index is **bijective**.

**Verification**:

```typescript
∀c ∈ {0..95}: decompose(compose(c)) = c
∀(h,d,ℓ): compose(decompose(h,d,ℓ)) = (h,d,ℓ)
```

**Implementation**: Tests in [test/class-system.test.ts](../../packages/core/test/class-system.test.ts)

### Invariant 2: Transform Closure

**Property**: All transforms map classes to classes (closure).

```typescript
∀c ∈ {0..95}: R(c) ∈ {0..95}
∀c ∈ {0..95}: D(c) ∈ {0..95}
∀c ∈ {0..95}: T(c) ∈ {0..95}
∀c ∈ {0..95}: M(c) ∈ {0..95}
```

**Verification**: Exhaustive testing across all 96 classes.

**Implementation**: [bridge/validation.ts](../../packages/core/src/bridge/validation.ts)

### Invariant 3: Canonical Output

**Property**: All evaluation backends produce canonical bytes.

```typescript
∀expr: LSB(evaluateLiteral(expr)) = 0
∀expr: encode(evaluateLiteral(expr)) uses minimal modality encoding
```

**Enforcement**: [class-system/class.ts](../../packages/core/src/class-system/class.ts) (encodeComponentsToByte)

### Invariant 4: SGA Commutation

**Property**: Class permutations commute with SGA automorphisms via the bridge.

```typescript
∀c ∈ {0..95}, ∀g ∈ {R,D,T,M}:
  project(g_SGA(lift(c))) = g_class(c)
```

**Verification**: 1,248 commutative diagram tests (all pass).

**Implementation**: [bridge/validation.ts](../../packages/core/src/bridge/validation.ts)

This is the **foundational correctness property** of Atlas.

## The Number 96: Why It's Special

### Prime Factorization

```
96 = 2⁵ × 3 = 32 × 3
```

**Components**:

- **2⁵ = 32**: Maximum power-of-2 structure
  - 4 quadrants (2²) × 8 contexts (2³) = 32
- **3**: Minimal triadic structure (beyond binary)

### Connections to Other Structures

**Octonions**: 8 dimensions (scalar + 7 imaginaries)

- Context ℓ ∈ {0..7} directly corresponds to octonionic components

**Quaternions**: 4 dimensions (scalar + 3 imaginaries)

- Quadrants h ∈ {0..3} reflects quaternionic phase structure

**Triality**: Minimal ternary logic

- Modality d ∈ {0,1,2} is the fundamental triadic distinction

**Synthesis**:

```
96 = (quaternionic) × (triadic) × (octonionic)
   = 4 × 3 × 8
```

Atlas integrates these three fundamental structures into a unified whole.

## Computational Implications

### State Space

**96 classes form the computational state space**:

- Each class is a distinct computational "configuration"
- Transforms move between states
- Generators produce sequences of states
- Composition builds state trajectories

**Finite**: 96 is small enough for exhaustive verification.
**Rich**: 96 is large enough to express complex computations.

### Transform Permutations

**Each transform is a permutation of {0..95}**:

- R: 4-cycle structure (24 independent 4-cycles)
- D: 3-cycle structure (32 independent 3-cycles)
- T: 8-cycle structure (12 independent 8-cycles)
- M: 2-cycle structure with fixed points

**Combined**: The group generated by {R, D, T, M} has order 192 (acts on 96 classes).

### Lookup Tables

**Fast implementation**: Class permutations are precomputed lookup tables.

**Example** (rotation):

```typescript
const ROTATION_TABLE: number[] = [
  1, 2, 3, ..., // R(0) = 24, R(1) = 25, ...
];
```

**Performance**: O(1) lookup vs O(n) algebraic computation.

**Implementation**: [class-system/class.ts](../../packages/core/src/class-system/class.ts)

---

## Summary

**The 96-class system is not arbitrary:**

1. **Emerges** from rank-1 basis of Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]
2. **Factorizes** as 4 (quadrants) × 3 (modalities) × 8 (contexts)
3. **Encodes** 256 bytes via equivalence relation (≡₉₆)
4. **Preserves** symmetry under 4 transforms (R, D, T, M)
5. **Commutes** with SGA automorphisms (verified by bridge)
6. **Provides** computational substrate (finite state space)

**96 is inevitable** - the unique count satisfying these properties.

The class system is a **discovered structure**, revealed through the algebraic foundations of Atlas.
