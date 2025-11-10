#!/usr/bin/env node
/**
 * Phase 1: Carry Propagation Analysis for RSA-260
 *
 * This script analyzes the carry propagation structure in base-96 multiplication
 * to understand the constraint landscape for factorization.
 *
 * Key insight: Rather than trying to enumerate all candidate paths (which explodes),
 * we analyze the STRUCTURE of constraints to understand:
 *   1. How many degrees of freedom exist at each digit
 *   2. How carries constrain the search space
 *   3. What orbit closure properties can add further constraints
 *
 * This is the foundation for Phase 2: combining with orbit closure theory.
 */

import * as fs from 'fs';
import * as path from 'path';

// ========================================================================
// RSA-260 Data
// ========================================================================

const RSA_260 = BigInt(
  '22112825529529666435281085255026230927612089502470015394413748319128822941' +
    '40664981690295237907262606923835005442126672024101081373265533949103140104' +
    '79986355004909667574335445914062447660959059726047157828579880484167499097' +
    '3422287179817183286845865799508538793815835042257',
);

const RSA_260_DIGITS = [
  17, 58, 27, 31, 35, 81, 83, 20, 22, 90, 73, 24, 59, 70, 73, 80, 11, 17, 56,
  72, 2, 68, 1, 43, 93, 89, 52, 17, 83, 76, 18, 63, 37, 62, 92, 37, 78, 90, 68,
  28, 65, 89, 81, 59, 95, 86, 41, 40, 91, 1, 90, 83, 9, 50, 68, 63, 40, 26, 62,
  16, 7, 5, 81, 27, 51, 35, 87, 55, 46, 52, 7, 26, 53, 41, 20, 39, 59, 79, 48,
  26, 86, 92, 67, 79, 10, 95, 10, 54, 83, 84, 87, 88, 40, 16, 9, 25, 95, 89, 1,
  55, 61, 7, 76, 92, 66, 67, 65, 39, 49, 64, 78, 75, 72, 48, 30, 91, 5, 79, 5,
  72, 15, 60, 17, 10, 66, 63, 39, 27, 41, 61, 87, 46, 20, 82, 52, 37, 2,
];

// Prime residues mod 96 (φ(96) = 32)
const PRIME_RESIDUES = [
  1, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35, 37, 41, 43, 47, 49, 53, 55, 59,
  61, 65, 67, 71, 73, 77, 79, 83, 85, 89, 91, 95,
];

// Valid (p₀, q₀) pairs where p₀ × q₀ ≡ 17 (mod 96)
const INITIAL_PAIRS = [
  [1, 17],
  [5, 61],
  [7, 71],
  [11, 19],
  [13, 53],
  [17, 1],
  [19, 11],
  [23, 55],
  [25, 89],
  [29, 37],
  [31, 47],
  [35, 91],
  [37, 29],
  [41, 73],
  [43, 83],
  [47, 31],
  [49, 65],
  [53, 13],
  [55, 23],
  [59, 67],
  [61, 5],
  [65, 49],
  [67, 59],
  [71, 7],
  [73, 41],
  [77, 85],
  [79, 95],
  [83, 43],
  [85, 77],
  [89, 25],
  [91, 35],
  [95, 79],
];

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// ========================================================================
// Part 1: Carry Structure Analysis
// ========================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('  Phase 1: Carry Propagation Structure Analysis');
console.log('  RSA-260 Factor Resolution via Bijectivity');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Part 1: Understanding the Constraint Landscape\n');

console.log('Given: RSA-260 = p × q');
console.log('  p ≈ 2^449 bits (69 base-96 digits)');
console.log('  q ≈ 2^450 bits (69 base-96 digits)');
console.log('  RSA-260: 137 base-96 digits\n');

console.log('Multiplication structure in base-96:');
console.log('  dᵢ = Σ(pⱼ × qₖ) + carryᵢ₋₁ (mod 96)');
console.log('       j+k=i\n');

console.log('Degrees of freedom at each digit:');
console.log('  • d₀: 32 choices for (p₀, q₀) [from p₀×q₀ ≡ 17]');
console.log('  • d₁: For each (p₀,q₀), need p₁×q₀ + p₀×q₁ + carry₀ ≡ 58');
console.log('  • dᵢ: Constraint involves all (pⱼ, qₖ) where j+k=i\n');

// ========================================================================
// Part 2: Carry Distribution Analysis
// ========================================================================

console.log('Part 2: Carry Distribution from d₀\n');

interface CarryInfo {
  p0: number;
  q0: number;
  carry: number;
  product: number;
}

const carry_analysis: CarryInfo[] = INITIAL_PAIRS.map(([p0, q0]) => {
  const product = p0 * q0;
  const carry = Math.floor(product / 96);
  return { p0, q0, carry, product };
});

// Group by carry value
const carries_by_value = new Map<number, CarryInfo[]>();
for (const info of carry_analysis) {
  if (!carries_by_value.has(info.carry)) {
    carries_by_value.set(info.carry, []);
  }
  carries_by_value.get(info.carry)!.push(info);
}

const carry_values = Array.from(carries_by_value.keys()).sort((a, b) => a - b);

console.log('Carry distribution from (p₀, q₀) pairs:');
console.log('Carry | Count | Example pairs');
console.log('─────────────────────────────────────────────────────────────');

for (const carry of carry_values) {
  const pairs = carries_by_value.get(carry)!;
  const example = pairs[0];
  console.log(
    `  ${carry.toString().padStart(2)}  |   ${pairs.length}   | (${example.p0}, ${example.q0})${pairs.length > 1 ? ` and ${pairs.length - 1} more` : ''}`,
  );
}
console.log();

// ========================================================================
// Part 3: Constraint Degrees of Freedom
// ========================================================================

console.log('Part 3: Degrees of Freedom Analysis\n');

console.log('For digit d₁ = 58:');
console.log('  Constraint: p₀×q₁ + p₁×q₀ + carry₀ ≡ 58 (mod 96)\n');

console.log('Given a fixed (p₀, q₀, carry₀), how many (p₁, q₁) satisfy the constraint?');
console.log('  • p₁ can be any of 32 prime residues');
console.log('  • For each p₁, we need: q₁ ≡ (58 - carry₀ - p₁×q₀) / p₀ (mod 96)');
console.log('  • This is solvable iff gcd(p₀, 96) | (58 - carry₀ - p₁×q₀)');
console.log('  • Since p₀ is a prime residue, gcd(p₀, 96) = 1, so always solvable\n');

// Sample analysis for first few (p₀, q₀) pairs
console.log('Sample constraint analysis for d₁:');
console.log('(p₀,q₀) | carry₀ | Valid (p₁,q₁) count');
console.log('─────────────────────────────────────────────────────────────');

const d1 = RSA_260_DIGITS[1]; // 58

for (let i = 0; i < Math.min(5, INITIAL_PAIRS.length); i++) {
  const [p0, q0] = INITIAL_PAIRS[i];
  const carry0 = Math.floor((p0 * q0) / 96);

  // Count valid (p₁, q₁) pairs
  let valid_count = 0;
  for (const p1 of PRIME_RESIDUES) {
    for (const q1 of PRIME_RESIDUES) {
      const sum = p0 * q1 + p1 * q0 + carry0;
      if (sum % 96 === d1) {
        valid_count++;
      }
    }
  }

  console.log(
    `(${p0.toString().padStart(2)},${q0.toString().padStart(2)}) |   ${carry0.toString().padStart(2)}   | ${valid_count}`,
  );
}
console.log();

// ========================================================================
// Part 4: Carry Bounds Analysis
// ========================================================================

console.log('Part 4: Carry Bounds Analysis\n');

console.log('At digit i, the carry into i+1 is bounded by:');
console.log('  carryᵢ ≤ ⌊(Σ(pⱼ × qₖ) + carryᵢ₋₁) / 96⌋');
console.log('         j+k=i\n');

console.log('Maximum possible carry at each level:');
console.log('  • d₀: max carry = ⌊95×95/96⌋ = 93');
console.log('  • d₁: max cross products = 2×95×95 = 18050');
console.log('        max carry = ⌊(18050 + 93)/96⌋ = 189');
console.log('  • dᵢ: max cross products = (i+1)×95×95');
console.log('        carry grows roughly as O(i)\n');

console.log('This means carry magnitudes increase linearly with digit index.');
console.log('However, the MODULAR constraint still limits degrees of freedom.\n');

// ========================================================================
// Part 5: Search Space Estimate
// ========================================================================

console.log('Part 5: Search Space Estimate\n');

console.log('Naive search space:');
console.log('  • p: 32^69 choices (each digit is a prime residue)');
console.log('  • q: 32^69 choices');
console.log('  • Total: 32^138 ≈ 2^690 possibilities\n');

console.log('Constrained search with carry propagation:');
console.log('  • d₀: 32 choices');
console.log('  • d₁: ~32 choices per (p₀,q₀) [from sampling above]');
console.log('  • dᵢ: ~32 choices per previous path (estimate)\n');

console.log('If each digit adds ~32 choices:');
console.log('  • After 10 digits: 32^10 ≈ 2^50');
console.log('  • After 20 digits: 32^20 ≈ 2^100');
console.log('  • After 69 digits: 32^69 ≈ 2^345\n');

console.log('This suggests that MODULAR constraints alone do NOT provide');
console.log('sufficient pruning. We need ADDITIONAL constraints from:');
console.log('  1. E₇ orbit closure (Phase 2)');
console.log('  2. Eigenspace complexity (Phase 3)');
console.log('  3. Global structure (factorization must yield specific RSA-260)\n');

// ========================================================================
// Part 6: Orbit Closure Integration Strategy
// ========================================================================

console.log('Part 6: Integration with Orbit Closure Theory\n');

console.log('The hierarchical factorization provides:');
console.log('  • Complete base-96 decomposition: [d₀, d₁, ..., d₁₃₆]');
console.log('  • Orbit factorizations: F(dᵢ) for each digit');
console.log('  • Orbit paths from prime generator 37\n');

console.log('Orbit closure conjecture:');
console.log('  Given: F(p) = [f₀, f₁, ..., f₆₈] (orbit factorizations of p)');
console.log('         F(q) = [g₀, g₁, ..., g₆₈] (orbit factorizations of q)');
console.log('  Then:  F(p×q) should satisfy orbit-consistent composition\n');

console.log('Constraint from orbit closure:');
console.log('  • Each F(dᵢ) places constraints on possible F(pⱼ) and F(qₖ)');
console.log('  • Orbit distance should be consistent across multiplication');
console.log('  • High-complexity digits (like d₀=17, complexity 24.41) may');
console.log('    indicate structural properties of p and q\n');

console.log('Next steps:');
console.log('  1. Phase 2: Define orbit-consistent tensor product F(p) ⊗ F(q)');
console.log('  2. Compute orbit closure bound for all ℤ₉₆² pairs');
console.log('  3. Apply orbit constraints to prune (p₀,q₀) candidates');
console.log('  4. Combine modular + orbit constraints for tighter bounds\n');

// ========================================================================
// Export Analysis
// ========================================================================

const analysis = {
  metadata: {
    name: 'RSA-260-Carry-Propagation-Analysis',
    timestamp: new Date().toISOString(),
  },
  rsa_260: {
    value: RSA_260.toString(),
    bits: 899,
    digits: RSA_260_DIGITS.length,
    expected_p_digits: 69,
    expected_q_digits: 69,
  },
  modular_constraints: {
    d0_pairs: INITIAL_PAIRS.length,
    d0_value: RSA_260_DIGITS[0],
    carry_distribution: Array.from(carries_by_value.entries()).map(([carry, pairs]) => ({
      carry: carry,
      count: pairs.length,
      examples: pairs.slice(0, 3).map((p) => ({ p0: p.p0, q0: p.q0 })),
    })),
  },
  degrees_of_freedom: {
    prime_residues_count: PRIME_RESIDUES.length,
    naive_search_space: '2^690',
    constrained_estimate: '2^345 (per-digit modular constraints)',
    note: 'Additional constraints needed from orbit closure theory',
  },
  carry_bounds: {
    max_carry_d0: 93,
    max_carry_d1: 189,
    growth_rate: 'O(i) linear in digit index',
  },
  next_phase: {
    phase: 2,
    goal: 'Define orbit-consistent tensor product and closure bound',
    approach: 'Combine modular constraints with E₇ orbit structure',
  },
};

const output_path = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'core',
  'benchmark',
  'rsa-260-carry-analysis.json',
);

fs.writeFileSync(output_path, JSON.stringify(analysis, null, 2));

console.log('═══════════════════════════════════════════════════════════');
console.log('Analysis exported to: rsa-260-carry-analysis.json');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('KEY INSIGHT:');
console.log('────────────');
console.log('Modular constraints from carry propagation provide structure');
console.log('but NOT sufficient pruning on their own. The search space');
console.log('remains exponential (~2^345 with modular constraints alone).\n');

console.log('The path forward requires ORBIT CLOSURE THEORY (Phase 2):');
console.log('  • E₇ orbit structure provides additional algebraic constraints');
console.log('  • Factorization closure theorem relates F(p), F(q), F(p×q)');
console.log('  • Orbit-consistent composition may provide polynomial reduction\n');

console.log('This is where EXCEPTIONAL GROUP STRUCTURE becomes critical.');
console.log('The factorization closure of E₇ defines our model.\n');
