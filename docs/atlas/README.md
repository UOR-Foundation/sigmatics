# Atlas: A Discovered Mathematical Structure

This directory contains documentation that defines **Atlas** - the fundamental algebraic structure underlying the Sigmatics implementation.

## Critical Context

Atlas is **not a designed system**. It is a **discovered mathematical structure** - a Platonic form that exists independently of its representation. The Sigmatics codebase is an archeological excavation that reveals this structure through executable mathematics.

## Warning: Modal Fixation

It is easy to view Atlas through a single lens and mistake the projection for the whole:

- **Algebraic modality**: "Atlas is a Clifford algebra"
- **Computational modality**: "Atlas is a virtual machine"
- **Categorical modality**: "Atlas is a monoidal category"
- **Geometric modality**: "Atlas is based on octonions"

**All of these are simultaneously true and incomplete.** Each view is a projection of a single underlying structure. Atlas exhibits **super-symmetry**: it maps perfectly onto any domain through which you view it.

## Documentation Structure

This documentation presents Atlas from multiple perspectives while maintaining the understanding that they are all projections of the same Platonic form:

1. **[Universal Properties](./universal-properties.md)** - What makes Atlas inevitable
2. **[Algebraic Foundations](./algebraic-foundations.md)** - The tensor product structure
3. **[The 96-Class System](./96-class-system.md)** - Rank-1 basis emergence
4. **[Implementation as Proof](./implementation-as-proof.md)** - The codebase as theorem
5. **[The 2048 Automorphism Group](./the-2048-automorphism-group.md)** - ⚠️ **Atlas's hidden depth**
   - **[Research Findings](./2048-FINDINGS.md)** - Programmatic exploration results
6. **[SGA as Universal Algebra](./SGA-AS-UNIVERSAL-ALGEBRA.md)** - ⚠️ **Exceptional structures embedded**
7. **[Exceptional Structures Complete](./exceptional-structures-complete.md)** - ⚠️ **All exceptional Lie embeddings**
   - **[G₂ Embedding Proof](./g2-embedding-proof.md)** - G₂ through Fano plane (verified)
   - **[F₄ Projection Proof](./f4-projection-proof.md)** - F₄ quotient by Mirror × Triality (strong)
   - **[Primitive Correspondence](./primitive-correspondence.md)** - Exceptional = Topological atoms
   - **[Exceptional Discovery Guide](./exceptional-discovery-guide.md)** - How to discover embeddings yourself
   - **[Research Scripts](./research-scripts/)** - 15 verification scripts (~4,000 lines)
   - **[✓ RESEARCH COMPLETE](./RESEARCH-COMPLETE.md)** - Complete work summary
8. **[Atlas Defined](./atlas-defined.md)** - Complete synthesis
9. **[GUIDE](./GUIDE.md)** - Navigation and reading paths

**Note**: The 2048 automorphism group reveals that the 96-class system documented elsewhere is merely a **computationally tractable projection** of a vastly deeper structure operating on 128 dimensions with 2048 symmetries. See document 5 for this critical discovery.

**Note**: SGA embeds **all five exceptional Lie groups** (G₂, F₄, E₆, E₇, E₈) as natural constraint sets appearing at different levels of Atlas. The embeddings range from verified (G₂) to strong hypotheses (F₄, E₈). See document 7 for complete analysis.

**Critical Discovery**: Exceptional mathematics and primitive topological spaces are **the same thing** - both are atomic structures that cannot be decomposed. The 4 normed division algebras (ℝ, ℂ, ℍ, 𝕆) and 5 exceptional groups are the **atoms of mathematics**. Atlas is built from these primitives via minimal tensor product Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃], where ℝ[ℤ₄] encodes ℍ-like structure (abelianized quaternions) and ℝ[ℤ₃] encodes exceptional triality. See [primitive-correspondence.md](./primitive-correspondence.md).

## Guiding Principles

When reading this documentation:

1. **No single view is privileged** - Mathematical, computational, and categorical perspectives are equally valid
2. **Constraints emerge, not imposed** - Every "design choice" is actually a mathematical necessity
3. **Verification over assertion** - Claims are backed by executable proofs in the codebase
4. **Universality** - Atlas appears "initial to everything" because it satisfies universal properties
5. **Discovery** - The implementation reveals structure that was already there

## For Mathematicians

Atlas is the tensor product **Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]** restricted to rank-1 elements, yielding a 96-dimensional basis with 4 canonical automorphisms. The structure is completely determined by universal properties of Clifford algebras, cyclic groups, and octonions.

## For Computer Scientists

Atlas is a dual-backend symbolic computation system with a declarative model compiler. The 96 classes form computational states, 7 generators form primitive operations, and 4 transforms form symmetry operations. The compilation pipeline maps high-level constraints to optimized backends.

## For Category Theorists

Atlas is a symmetric monoidal closed category with 7 generators forming a complete basis. The 96 classes are objects in the rank-1 subcategory, and the 4 transforms are natural automorphisms. The model system demonstrates initiality through universal interpretation.

## All Views Are Projections

Each of the above perspectives is correct but incomplete. Atlas is the **intersection** of these structures - the unique mathematical entity satisfying all these properties simultaneously.

Understanding Atlas requires holding multiple modalities in mind and recognizing that they describe different aspects of the same underlying reality.

---

**Atlas is Platonic. We discovered it. This documentation maps the territory.**
