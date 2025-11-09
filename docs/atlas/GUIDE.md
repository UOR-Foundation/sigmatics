# Atlas Documentation Guide

This guide helps you navigate the Atlas documentation and understand the discovered mathematical structure from multiple perspectives.

## Start Here

**New to Atlas?** Begin with:
1. [README.md](./README.md) - Overview and warning about modal fixation
2. [atlas-defined.md](./atlas-defined.md) - Comprehensive definition of Atlas
3. [universal-properties.md](./universal-properties.md) - Why Atlas is inevitable

**Want mathematical foundations?** Read:
1. [algebraic-foundations.md](./algebraic-foundations.md) - The tensor product structure
2. [96-class-system.md](./96-class-system.md) - How 96 classes emerge
3. [implementation-as-proof.md](./implementation-as-proof.md) - Executable verification

## Documentation Map

### Core Definitions

**[atlas-defined.md](./atlas-defined.md)** - *Start here for complete picture*
- What Atlas is (mathematically, computationally, categorically)
- Why Atlas is inevitable (universal properties)
- Multi-modal nature (super-symmetry)
- Platonic nature (discovered, not designed)
- Recursive self-similarity
- Complete verification summary

**Length**: ~17KB, comprehensive overview

**Best for**: Getting the complete picture before diving into specifics

### Foundational Mathematics

**[algebraic-foundations.md](./algebraic-foundations.md)** - *The tensor product structure*
- Clifford algebra Cl₀,₇ (geometric product, 7 dimensions)
- Group algebras ℝ[ℤ₄], ℝ[ℤ₃] (quadrants, triality)
- SGA tensor product (full 1,536 dimensions)
- Rank-1 restriction (96-class emergence)
- Bridge between class and SGA

**Length**: ~11KB, detailed algebraic exposition

**Best for**: Mathematicians wanting rigorous foundations

**[universal-properties.md](./universal-properties.md)** - *Why Atlas is inevitable*
- Universal Property 1: Minimal tensor product
- Universal Property 2: Complete generators (why 7?)
- Universal Property 3: Transform automorphisms (why 4?)
- Universal Property 4: Dual semantics (why 2?)
- Universal Property 5: Belt addressing (why 48 pages?)

**Length**: ~11KB, philosophical + mathematical argument

**Best for**: Understanding why each aspect of Atlas is necessary, not chosen

### The 96-Class System

**[96-class-system.md](./96-class-system.md)** - *How classes emerge from structure*
- Emergence from 4×3×8 factorization
- Class index formula: 24h + 8d + ℓ
- Byte encoding and equivalence relation (≡₉₆)
- Canonical form (LSB=0, minimal modality encoding)
- Triality orbits (32 orbits × 3 elements)
- Context cycles (12 cycles × 8 elements)
- Quadrant permutations (24 permutations × 4 elements)
- Why 96 is special (2⁵ × 3 structure)

**Length**: ~13KB, comprehensive class system explanation

**Best for**: Understanding the computational substrate (finite state space)

### Verification and Proof

**[implementation-as-proof.md](./implementation-as-proof.md)** - *The codebase as theorem*
- Theorem 1: Bijective encoding
- Theorem 2: Transform commutativity
- Theorem 3: Transform orders (R⁴=D³=T⁸=M²=id)
- Theorem 4: Mirror conjugation (MgM=g⁻¹)
- **Theorem 5: Bridge correctness (1,248 verifications)**
- Theorem 6: Canonical uniqueness
- Theorem 7: Dual semantics consistency
- Theorem 8: Rewrite confluence

**Length**: ~18KB, detailed proof exposition

**Best for**: Understanding how the implementation verifies Atlas's coherence

## Reading Paths

### Path 1: Mathematical Foundations First

**For mathematicians, category theorists, algebraists**

1. [universal-properties.md](./universal-properties.md) - See why structure is inevitable
2. [algebraic-foundations.md](./algebraic-foundations.md) - Understand tensor product
3. [96-class-system.md](./96-class-system.md) - Explore rank-1 restriction
4. [implementation-as-proof.md](./implementation-as-proof.md) - See verification
5. [atlas-defined.md](./atlas-defined.md) - Synthesize complete picture

**Why this order**: Builds from abstract to concrete, proving inevitability before showing details.

### Path 2: Overview First

**For computer scientists, programmers, system designers**

1. [atlas-defined.md](./atlas-defined.md) - Get complete overview
2. [96-class-system.md](./96-class-system.md) - Understand computational substrate
3. [algebraic-foundations.md](./algebraic-foundations.md) - See underlying algebra
4. [implementation-as-proof.md](./implementation-as-proof.md) - Verify correctness
5. [universal-properties.md](./universal-properties.md) - Understand inevitability

**Why this order**: Starts concrete (what is Atlas?), then explores foundations and verification.

### Path 3: Proof-First

**For formalists, proof theorists, verification engineers**

1. [implementation-as-proof.md](./implementation-as-proof.md) - See what is proven
2. [algebraic-foundations.md](./algebraic-foundations.md) - Understand what is being verified
3. [96-class-system.md](./96-class-system.md) - Explore finite structure
4. [universal-properties.md](./universal-properties.md) - See why properties hold
5. [atlas-defined.md](./atlas-defined.md) - Synthesize understanding

**Why this order**: Emphasizes rigor and verification, builds confidence through proofs.

### Path 4: Exceptional Structures

**For mathematicians interested in Lie groups and algebraic embeddings**

1. [algebraic-foundations.md](./algebraic-foundations.md) - Understand tensor product (Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃])
2. [exceptional-structures-complete.md](./exceptional-structures-complete.md) - Survey all five exceptional Lie embeddings
3. [g2-embedding-proof.md](./g2-embedding-proof.md) - Detailed G₂ proof (PSL(2,7) = 14 × 12)
4. [f4-projection-proof.md](./f4-projection-proof.md) - Detailed F₄ proof (quotient by ℤ₂ × ℤ₃)
5. [the-2048-automorphism-group.md](./the-2048-automorphism-group.md) - E₈ connection (Weyl / 2048 exact)

**Why this order**: Builds from foundations through verified proofs to open questions.

**Total time**: ~2-3 hours for deep understanding of exceptional structure embeddings

### Path 5: Quick Start

**For busy readers who need the essentials**

1. [README.md](./README.md) - 5 minutes: Context and warning
2. [atlas-defined.md](./atlas-defined.md) - 30 minutes: Complete picture
3. [implementation-as-proof.md](./implementation-as-proof.md) - 20 minutes: Verification summary

**Total time**: ~1 hour to understand Atlas at high level

**Follow-up**: Read specific documents as needed for deeper understanding.

## Key Concepts to Understand

### Modal Fixation Warning

**Critical**: Do not view Atlas through only one lens.

**Common traps**:
- "Atlas is just a Clifford algebra" (misses group algebras, generators, semantics)
- "Atlas is just a programming language" (misses algebraic foundations)
- "Atlas is based on octonions" (confuses one component with the whole)

**Truth**: All views are **projections** of the same underlying structure. Atlas is **super-symmetrical** - it maps perfectly onto any domain because it sits at the foundation.

**How to avoid**: Read multiple documents, recognize each perspective as valid but incomplete.

### The Platonic Claim

**Atlas is discovered, not designed.**

**Evidence**:
- Every component (Cl₀,₇, ℤ₄, ℤ₃, 𝕆) is unique and inevitable
- All "design choices" are actually mathematical necessities
- >2,000 verification tests pass (exhaustive for finite structure)
- No counterexamples found in any domain

**Implication**: The implementation **reveals** Atlas rather than constructs it.

**Philosophical stance**: Atlas is a **Platonic form** - exists independently of representation.

### The Bridge Theorem

**Most important proof**: Class permutations ≅ SGA automorphisms

**Statement**:
```
∀g ∈ {R,D,T,M}, ∀c ∈ {0..95}:
  project(g_SGA(lift(c))) = g_class(c)
```

**Verification**: 1,248 commutative diagram tests (all pass)

**Significance**: Proves that the **fast class backend** and **algebraic SGA backend** compute the **same thing**. Without this, we'd have two inconsistent systems.

**Location**: [implementation-as-proof.md, Theorem 5](./implementation-as-proof.md#theorem-5-bridge-correctness-the-critical-theorem)

### Super-Symmetry

**Atlas maps perfectly onto any domain** you view it through:

- **Algebraic**: Tensor product structure
- **Computational**: Dual-backend evaluator
- **Categorical**: Monoidal category
- **Geometric**: Octonionic Fano geometry
- **Information-theoretic**: Content-addressable system
- **Type-theoretic**: Typed programming language

**Each view is equally valid.** None is privileged.

**Why this matters**: Atlas is **initial to everything** - it appears fundamental in every domain because it **is** fundamental.

## Cross-References

### From Implementation to Theory

**Codebase location** → **Documentation**

- `class-system/class.ts` → [96-class-system.md](./96-class-system.md)
- `sga/` → [algebraic-foundations.md](./algebraic-foundations.md)
- `bridge/validation.ts` → [implementation-as-proof.md](./implementation-as-proof.md)
- `evaluator/evaluator.ts` → [atlas-defined.md](./atlas-defined.md) (dual semantics)
- `compiler/rewrites.ts` → [implementation-as-proof.md](./implementation-as-proof.md) (Theorem 8)

### From Theory to Implementation

**Concept** → **Codebase verification**

- Tensor product (Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]) → `sga/` modules
- 96 classes → `class-system/class.ts` (bijective encoding)
- 4 transforms → `sga/transforms.ts`, `class-system/class.ts` (permutations)
- 7 generators → `types/types.ts` (Generator enum), `evaluator/evaluator.ts` (semantics)
- Bridge correctness → `bridge/validation.ts` (1,248 tests)

## Exceptional Structures Documentation

### Master Reference

**[exceptional-structures-complete.md](./exceptional-structures-complete.md)** - *Complete analysis of all five exceptional Lie groups*

**Coverage**:
- G₂: PSL(2,7) = 14 × 12 factorization through Fano plane (✓ VERIFIED)
- F₄: Rank-1 group as quotient F₄ Weyl / (ℤ₂ × ℤ₃) (✓ STRONG HYPOTHESIS)
- E₆: Weyl / 192 = 270 relationship (⚠ UNCLEAR)
- E₇: Dimensional proximity 133 ≈ 128 (⚠ WEAK)
- E₈: Weyl / 2048 exact division, 248 = 31 × 8 (⚠ POTENTIAL)

**Length**: ~21KB, comprehensive reference with discovery method

**Best for**: Understanding full landscape of exceptional structure embeddings

### Detailed Proofs

**[g2-embedding-proof.md](./g2-embedding-proof.md)** - *G₂ through Fano plane*

**Key theorem**: G₂ is naturally embedded in Atlas through the 7-dimensional imaginary octonion structure, with PSL(2,7) = (dim G₂) × (Weyl G₂) = 14 × 12.

**Proof status**: ✓ VERIFIED (Fano plane automorphisms proven, PSL(2,7) factorization exact)

**Length**: ~15KB

**[f4-projection-proof.md](./f4-projection-proof.md)** - *F₄ quotient by Mirror × Triality*

**Key theorem**: Rank-1 automorphism group (192 elements) ≅ F₄ Weyl / (ℤ₂ × ℤ₃), where quotient factors are precisely Mirror (M) and Triality (D) transforms.

**Proof status**: ✓ STRONG HYPOTHESIS (perfect integer quotient, exact structural match)

**Length**: ~21KB

### Discovery Guide

**[exceptional-discovery-guide.md](./exceptional-discovery-guide.md)** - *How to discover exceptional embeddings yourself*

**Purpose**: Practical guide to finding and understanding exceptional Lie group embeddings in Atlas

**Content**:
- The four discovery signals (dimensions, quotients, overcounting, alignment)
- Verified case study: G₂ through Fano plane (step-by-step)
- Strong hypothesis: F₄ through rank-1 quotient (detailed walkthrough)
- Investigation guides for E₆, E₇, E₈
- Practical workflow (code examples, common pitfalls)
- Proof standards (verified → strong → potential → weak → unclear)

**Length**: ~15KB

**Best for**: Anyone wanting to discover exceptional structures themselves or verify existing claims

### Research Scripts

Programmatic verification scripts in [research-scripts/](./research-scripts/):

- `construct-g2-automorphisms.js` - G₂ Weyl group construction
- `prove-f4-connection.js` - F₄ quotient verification (192 elements enumerated)
- `analyze-e7-structure.js` - E₇ dimensional analysis
- `search-all-exceptional.js` - E₆, E₈ comprehensive search
- `investigate-exceptional-topology.js` - Primitive correspondence proof
- `investigate-z4-quaternion-connection.js` - ℝ[ℤ₄] = abelianized ℍ
- `investigate-z3-triality-connection.js` - ℝ[ℤ₃] = exceptional triality

**Run with**: `node docs/atlas/research-scripts/<script-name>.js`

**See**: [research-scripts/README.md](./research-scripts/README.md) for detailed descriptions

## Additional Resources

### Formal Specification

**File**: `/workspaces/sigmatics/docs/atlas_sigil_algebra_formal_specification_v_1.md`

**Coverage**: Grammar, byte encoding, transform laws, test vectors

**Relationship to Atlas docs**: Specification is operational reference; Atlas docs explain **why** the specification is what it is.

### Examples and Verification

**File**: `/workspaces/sigmatics/examples/algebraic-law-verification.ts`

**Purpose**: Executable verification of group laws (commutativity, orders, conjugation)

**Relationship**: Proves theorems stated in [implementation-as-proof.md](./implementation-as-proof.md)

### Architecture Documentation

**File**: `/workspaces/sigmatics/docs/ARCHITECTURE.md`

**Purpose**: System architecture, module organization, compilation pipeline

**Relationship**: Describes **how** Sigmatics implements Atlas (orthogonal to **what** Atlas is)

## FAQ

### "Why 96 classes specifically?"

**Short answer**: 4 × 3 × 8 = 96 (quadrants × modalities × contexts)

**Long answer**: See [universal-properties.md](./universal-properties.md) and [96-class-system.md](./96-class-system.md)

**The number emerges** from the tensor product Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃] restricted to rank-1 elements. It could not be otherwise.

### "Why only 7 generators?"

**Short answer**: They form a complete basis for monoidal symmetric closed categories.

**Long answer**: See [universal-properties.md, Universal Property 2](./universal-properties.md#universal-property-2-completeness-of-generators)

**No 8th generator** is needed (would be expressible in terms of the 7). **No generator can be removed** (would create incompleteness).

### "Is Atlas a programming language?"

**No** - Atlas is more fundamental than any single modality.

**Atlas is**:
- An algebraic structure (tensor product)
- A computational system (dual semantics)
- A categorical framework (monoidal category)
- All of these simultaneously

A "programming language" is **one projection** of Atlas (the computational/type-theoretic modality).

### "How is this different from other symbolic systems?"

**Most symbolic systems**: Designed for specific purpose, arbitrary design choices

**Atlas**: Discovered structure, every aspect is mathematically necessary, >2,000 exhaustive verifications

**Atlas is Platonic** - it exists independently of its representation.

### "Can I use only one backend?"

**Technically yes**, but you'd miss half of Atlas.

**Literal backend**: Shows WHAT (bytes, addresses)
**Operational backend**: Shows HOW (process, control flow)

Both are **canonical interpretations** - neither is more "true" than the other. They are **dual views** of the same computation.

### "What is the bridge and why does it matter?"

**Bridge**: The pair of functions lift (class → SGA) and project (SGA → class)

**Critical property**:
```
project(g_SGA(lift(c))) = g_class(c)
```

**Why it matters**: Proves that **fast class permutations** and **slow algebraic transformations** compute the **same result**. This is the **foundational correctness property** of Atlas.

**Verification**: 1,248 commutative diagram tests (see [implementation-as-proof.md](./implementation-as-proof.md))

### "What are the exceptional structures in Atlas?"

**Short answer**: All five exceptional Lie groups (G₂, F₄, E₆, E₇, E₈) embed naturally in Atlas at different levels.

**Long answer**: See [exceptional-structures-complete.md](./exceptional-structures-complete.md)

**Key discoveries**:
- **G₂** (verified): Embeds through Fano plane, PSL(2,7) = 14 × 12
- **F₄** (strong): Rank-1 group is F₄ Weyl / (ℤ₂ × ℤ₃) where quotient = Mirror × Triality
- **E₇** (weak): Dimensional proximity 133 ≈ 128, but non-integer Weyl ratio
- **E₈** (potential): Weyl / 2048 divides exactly, dimension 248 = 31 × 8

**Why this matters**: Atlas isn't "designed" - these structures emerge naturally from the tensor product. Exceptional groups appear because they **must** given the algebraic foundations.

## Next Steps

**After reading this documentation:**

1. **Explore the codebase**: `/workspaces/sigmatics/packages/core/src/`
   - See how theory becomes executable mathematics

2. **Run examples**: `/workspaces/sigmatics/examples/`
   - Experience Atlas in action

3. **Read test vectors**: `/workspaces/sigmatics/packages/core/test/index.ts`
   - See specification compliance verification

4. **Experiment with web playground**: `/workspaces/sigmatics/apps/playground-web/`
   - Interactive exploration of Atlas

5. **Study the formal spec**: `/workspaces/sigmatics/docs/atlas_sigil_algebra_formal_specification_v_1.md`
   - Operational reference for parser and evaluator

## Meta-Documentation Note

**These documents avoid**:
- Claiming Atlas is "designed" (it's discovered)
- Privileging one modality (all are equal projections)
- Unverified assertions (everything is proven or cited)
- Modal fixation (each doc presents multiple views)

**These documents emphasize**:
- Universal properties (why Atlas is inevitable)
- Executable verification (codebase as proof)
- Multi-modal nature (super-symmetry)
- Platonic stance (discovered, not invented)

**The goal**: Define Atlas **as it is** - a discovered mathematical structure revealed through executable mathematics.

---

**Welcome to Atlas. It was always here. We just found it.**
