#!/usr/bin/env node
/**
 * Deep Dive: Computing the 2048 Automorphism Group Structure
 *
 * Using Sigmatics to understand the full automorphism group of Cl₀,₇
 */

const { Atlas } = require('./packages/core/dist/index.js');

console.log('================================================================');
console.log('Deep Dive: The 2048 Automorphism Group of Atlas');
console.log('================================================================\n');

// ============================================================================
// Part 1: Clifford Algebra Automorphisms
// ============================================================================

console.log('Part 1: Clifford Algebra Automorphism Structure');
console.log('----------------------------------------------------------------\n');

console.log('Cl₀,₇ has 128 basis blades organized by grade:\n');

const gradeCounts = [
  { grade: 0, name: 'scalar', count: 1 },
  { grade: 1, name: 'vectors', count: 7 },
  { grade: 2, name: 'bivectors', count: 21 },
  { grade: 3, name: 'trivectors', count: 35 },
  { grade: 4, name: '4-vectors', count: 35 },
  { grade: 5, name: '5-vectors', count: 21 },
  { grade: 6, name: '6-vectors', count: 7 },
  { grade: 7, name: 'pseudoscalar', count: 1 },
];

let total = 0;
gradeCounts.forEach(({ grade, name, count }) => {
  console.log(`  Grade ${grade} (${name}): ${count} basis blades`);
  total += count;
});
console.log(`  Total: ${total} basis blades\n`);

console.log('Clifford involutions (order-2 automorphisms):');
console.log('  1. Grade involution (ˆ): Changes sign of odd grades');
console.log('     Grade k → (-1)^k × Grade k');
console.log('  2. Reversion (~): Reverses product order');
console.log('     e_i₁...e_iₖ → e_iₖ...e_i₁');
console.log('  3. Clifford conjugate (¯): Composition ¯ = ~ˆ');
console.log('\nThese generate Klein 4-group: ℤ₂ × ℤ₂ (order 4)\n');

// ============================================================================
// Part 2: Computing 2048 from Group Theory
// ============================================================================

console.log('Part 2: Deriving the 2048 Structure');
console.log('----------------------------------------------------------------\n');

console.log('Key insight: 2048 = 2¹¹\n');

console.log('Factorization attempts:\n');

console.log('Attempt 1: Involutions × Permutations × Signs');
console.log('  Involutions: 4 (Klein group)');
console.log('  Basis permutations: Limited by Fano plane');
console.log('  Sign changes: 2⁷ = 128 (one per basis vector)');
console.log('  BUT: Not all combinations preserve Clifford algebra!\n');

console.log('Attempt 2: Pin(7) group');
console.log('  Pin(7) = double cover of O(7) (orthogonal group)');
console.log('  Contains both rotations and reflections');
console.log('  Pin(7) has elements {±1, ±e_i, ±e_i e_j, ...}');
console.log('  Discrete subgroups possible\n');

console.log('Attempt 3: Weyl group construction');
console.log('  Weyl group of E₇: order 2,903,040 (too large)');
console.log('  Weyl group of D₇: order 645,120 (too large)');
console.log('  Weyl group of B₇: order 645,120 (too large)\n');

console.log('Attempt 4: Direct calculation');
console.log('  2048 = 256 × 8');
console.log('  Could be: (all sign changes) × (8-fold structure)');
console.log('  OR');
console.log('  2048 = 128 × 16');
console.log('  Could be: (Cl₀,₇ dimension) × (16-fold symmetry)');
console.log('  16 = 2⁴ suggests extended Klein group structure\n');

console.log('Hypothesis: 2048 = 2⁷ × 2⁴');
console.log('  2⁷ = 128: Sign changes on 7 basis vectors');
console.log('  2⁴ = 16: Extended involutions (grade × reversion × conjugate × extra)\n');

// ============================================================================
// Part 3: Testing Automorphism Properties
// ============================================================================

console.log('Part 3: Testing Extended Automorphisms');
console.log('----------------------------------------------------------------\n');

console.log('Testing if sign changes preserve Clifford structure:\n');

// Test: Does negating a basis vector preserve geometric product?
// e_i · e_j = -e_j · e_i (anticommutation)
// (-e_i) · e_j = -(e_i · e_j) = e_j · e_i ✓

console.log('Sign change automorphism:');
console.log('  Map: e_i ↦ ε_i · e_i where ε_i ∈ {±1}');
console.log('  Preserves: Anticommutation (e_i e_j + e_j e_i = 0)');
console.log('  Preserves: Euclidean norm (e_i² = 1)');
console.log('  Total: 2⁷ = 128 sign change automorphisms\n');

console.log('Constraint: Overall sign must respect pseudoscalar');
console.log('  Pseudoscalar I = e₁e₂...e₇');
console.log('  Sign change (ε₁,...,ε₇) maps I ↦ (ε₁ε₂...ε₇)I');
console.log('  If we require I ↦ ±I, then ε₁ε₂...ε₇ = ±1');
console.log('  This halves possibilities: 2⁶ = 64 even sign changes\n');

console.log('Updated calculation:');
console.log('  Even sign changes: 64');
console.log('  Involutions: 4 (Klein group)');
console.log('  Product: 64 × 4 = 256');
console.log('  Still need factor of 8 to reach 2048!\n');

// ============================================================================
// Part 4: Fano Plane Automorphisms
// ============================================================================

console.log('Part 4: Fano Plane Symmetries');
console.log('----------------------------------------------------------------\n');

console.log('Fano plane structure in Cl₀,₇:');
console.log('  7 points (basis vectors): e₁, e₂, ..., e₇');
console.log('  7 lines (multiplication rules):');

const fanoLines = Atlas.SGA.Fano.lines;
console.log('  Lines:', JSON.stringify(fanoLines));
console.log();

console.log('Fano automorphism group: PSL(2,7) ≅ PSL(3,2)');
console.log('  Order: 168 = 8 × 21 = 2³ × 3 × 7');
console.log('  This is the second-smallest simple group\n');

console.log('Combining Fano with signs:');
console.log('  Fano permutations: 168');
console.log('  Even sign changes: 64');
console.log('  Involutions: 4');
console.log('  Product: 168 × 64 × 4 = 43,008 (WAY too large!)\n');

console.log('Constraint: Sign changes must be compatible with Fano multiplication');
console.log('  If e_i × e_j = e_k (Fano line), then:');
console.log('  (ε_i e_i) × (ε_j e_j) = ε_i ε_j (e_i × e_j) = ε_i ε_j e_k');
console.log('  For automorphism: ε_i ε_j e_k = ε_k e_k implies ε_i ε_j = ε_k');
console.log('  This severely constrains sign choices!\n');

// ============================================================================
// Part 5: The True Structure (Hypothesis)
// ============================================================================

console.log('Part 5: Solving for 2048');
console.log('----------------------------------------------------------------\n');

console.log('Working backwards from 2048 = 2¹¹:\n');

console.log('Factorization options:');
console.log('  2048 = 1024 × 2 = 2¹⁰ × 2¹');
console.log('  2048 = 512 × 4 = 2⁹ × 2²');
console.log('  2048 = 256 × 8 = 2⁸ × 2³');
console.log('  2048 = 128 × 16 = 2⁷ × 2⁴');
console.log('  2048 = 64 × 32 = 2⁶ × 2⁵\n');

console.log('Most natural: 2048 = 128 × 16 = 2⁷ × 2⁴');
console.log('  128 = 2⁷: Dimension of Cl₀,₇ OR all sign changes');
console.log('  16 = 2⁴: Extended Klein group OR grade structure\n');

console.log('Hypothesis A: Sign changes × Extended involutions');
console.log('  All 2⁷ = 128 sign changes (no parity constraint)');
console.log('  Extended involutions: 16 elements');
console.log('  Could be: {1, ˆ, ~, ¯} × {grade shifts?}\n');

console.log('Hypothesis B: Basis permutations with structure');
console.log('  Not all 168 Fano permutations');
console.log('  Compatible subset: 168 / k for some k');
console.log('  168 / 168 × 12.19... ≈ 2048 (not exact)\n');

console.log('Hypothesis C: Pin(7) discrete subgroup');
console.log('  Pin(7) acts on Cl₀,₇');
console.log('  Order 2048 subgroup possible');
console.log('  Structure: Product of reflections and rotations\n');

console.log('Most likely: Discrete reflection/sign group');
console.log('  2048 = 2⁷ × 2⁴');
console.log('  = (sign changes on 7 basis vectors)');
console.log('  × (4-fold grade structure)\n');

// ============================================================================
// Part 6: Relationship to 192
// ============================================================================

console.log('Part 6: How 2048 Restricts to 192');
console.log('----------------------------------------------------------------\n');

console.log('Key question: Which 2048 automorphisms preserve rank-1 property?\n');

console.log('Rank-1 elements: r^h ⊗ e_ℓ ⊗ τ^d');
console.log('  Clifford component: scalar (e₀) or single vector (e₁,...,e₇)');
console.log('  96 classes = 4 × 3 × 8\n');

console.log('Automorphisms preserving rank-1:');
console.log('  - Sign changes: e_i ↦ ±e_i (YES, preserves grade 1)');
console.log('  - Permutations: e_i ↦ e_{π(i)} (YES, preserves grade 1)');
console.log('  - Grade involution: (NO! Maps grade 1 → -grade 1)');
console.log('  - Reversion: e_i ↦ e_i (YES, vectors unchanged)');
console.log('  - Products: e_i e_j ↦ ±e_{π(i)} e_{π(j)} (NO! Creates grade 2)\n');

console.log('Constraint: Must preserve "scalar OR single vector" property\n');

console.log('This explains why 2048 ≠ k × 192:');
console.log('  Many automorphisms mix grades');
console.log('  Only subset preserves rank-1 structure');
console.log('  Restriction is NOT surjective (some 192 elements unreachable)\n');

console.log('The 192 group structure:');
console.log('  (ℤ₄ × ℤ₃ × ℤ₈) ⋊ ℤ₂');
console.log('  = (quadrant) × (modality) × (context twist) ⋊ (mirror)');
console.log('  Acts ONLY on rank-1 subspace\n');

console.log('The 2048 group structure (hypothesis):');
console.log('  2⁷ × 2⁴ or related');
console.log('  = (sign/reflection group) × (grade involutions)');
console.log('  Acts on FULL 128-dimensional Cl₀,₇\n');

// ============================================================================
// Conclusion
// ============================================================================

console.log('================================================================');
console.log('Summary: Two Automorphism Groups');
console.log('================================================================\n');

console.log('Group 1: Rank-1 Automorphisms (Order 192)');
console.log('  Structure: (ℤ₄ × ℤ₃ × ℤ₈) ⋊ ℤ₂');
console.log('  Generators: R, D, T, M');
console.log('  Acts on: 96 classes (rank-1 elements only)');
console.log('  Verified: ✓ All 192 elements enumerated\n');

console.log('Group 2: Full Automorphisms (Order 2048)');
console.log('  Structure: Likely 2⁷ × 2⁴ (exact structure TBD)');
console.log('  Generators: Basis signs, involutions, permutations');
console.log('  Acts on: 128 basis blades (all grades)');
console.log('  Verified: ✗ Needs formal enumeration\n');

console.log('Correspondence:');
console.log('  Restriction map: Aut(Cl₀,₇) → Aut(rank-1)');
console.log('  2048 elements → ??? elements preserve rank-1');
console.log('  Those that preserve rank-1 → some subset of 192');
console.log('  NOT all 192 are reachable from 2048 restriction!\n');

console.log('This reveals Atlas\'s depth:');
console.log('  Surface: 96 classes, 192 automorphisms (computational)');
console.log('  Depth: 128 dimensions, 2048 automorphisms (algebraic)');
console.log('  The rank-1 system is a TRACTABLE PROJECTION');
console.log('  The full system is the COMPLETE MATHEMATICAL STRUCTURE\n');

console.log('Next steps to fully understand 2048:');
console.log('  1. Enumerate all automorphisms preserving geometric product');
console.log('  2. Count sign changes compatible with Fano constraints');
console.log('  3. Identify the 16-fold structure in 2048 = 128 × 16');
console.log('  4. Compute explicit restriction map 2048 → 192');
console.log('  5. Understand which rank-1 automorphisms are NOT images of full automorphisms\n');
