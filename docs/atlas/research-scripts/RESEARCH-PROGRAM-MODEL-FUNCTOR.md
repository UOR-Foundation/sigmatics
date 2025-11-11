# Research Program: The Model Functor

**Goal**: Prove that SGA models form a functor from the category of domains to the category of constraint algebras, preserving compositional structure.

**Date Started**: 2025-11-10
**Status**: In Progress

---

## Research Questions

### Primary Questions

1. **Does SGA define a functor F: Dom → Alg?**
   - Objects: Computational domains (factorization, graph coloring, SAT, etc.)
   - Morphisms: Domain transformations (reductions, embeddings)
   - Target: Constraint algebras with orbit closure

2. **What are the natural transformations between model functors?**
   - Can we transform factorization models into graph coloring models compositionally?
   - Is there a universal model that all others factor through?

3. **Does the functor preserve limits and colimits?**
   - Product of models = model of product?
   - Coproduct of models = model of coproduct?

### Secondary Questions

4. What is the kernel of the model functor (information lost in translation)?
5. What is the image (which constraint algebras are reachable)?
6. Are there adjoint functors (forgetful/free functors)?
7. What monoidal structure do models inherit from ⊗, ∘, ⊕?

---

## Experimental Plan

### Phase 1: Functoriality Proof (Experiments 1-3)
- **Experiment 1**: Identity preservation (F(id) = id)
- **Experiment 2**: Composition preservation (F(g ∘ f) = F(g) ∘ F(f))
- **Experiment 3**: Domain morphism examples

### Phase 2: Natural Transformations (Experiments 4-6)
- **Experiment 4**: Factorization → Graph Coloring transformation
- **Experiment 5**: Graph Coloring → SAT transformation
- **Experiment 6**: Naturality square verification

### Phase 3: Limits and Colimits (Experiments 7-9)
- **Experiment 7**: Product preservation (F(A × B) ≅ F(A) × F(B))
- **Experiment 8**: Coproduct preservation (F(A + B) ≅ F(A) + F(B))
- **Experiment 9**: Pullback/pushout analysis

### Phase 4: Monoidal Structure (Experiments 10-12)
- **Experiment 10**: Tensor product ⊗ as monoidal structure
- **Experiment 11**: Sequential composition ∘ coherence
- **Experiment 12**: Merge operation ⊕ universal property

### Phase 5: Adjunctions (Experiments 13-15)
- **Experiment 13**: Free model functor (from raw domains)
- **Experiment 14**: Forgetful functor (to underlying sets)
- **Experiment 15**: Adjunction F ⊣ U verification

### Phase 6: Universal Properties (Experiments 16-18)
- **Experiment 16**: Initial/terminal objects
- **Experiment 17**: Universal model characterization
- **Experiment 18**: Yoneda lemma for models

---

## Implementation Strategy

Each experiment will:
1. State the categorical property formally
2. Implement test cases in TypeScript
3. Measure constraint preservation (ε, pruning, φ(96))
4. Document findings in markdown
5. Connect to existing SGA theory

---

## Success Criteria

**Minimal Success**: Prove functoriality (experiments 1-3)
**Moderate Success**: Establish natural transformations (experiments 4-6)
**Significant Success**: Prove monoidal functor structure (experiments 10-12)
**Complete Success**: Full categorical characterization (all 18 experiments)

---

## Expected Outcomes

If successful, we will have:
1. Formal proof that SGA models form a functor
2. Compositional model construction toolkit
3. Automatic constraint transfer via functoriality
4. Universal model as initial object
5. Category-theoretic foundation for Atlas

This would elevate SGA from "universal algebra" to "universal categorical framework."

---

**Status**: Phase 1 Starting
**Next**: Experiment 1 - Identity Preservation
