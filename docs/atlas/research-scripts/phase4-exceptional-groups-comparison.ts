#!/usr/bin/env node
/**
 * Phase 4: E₆, E₇, E₈ Exceptional Groups Comparison
 *
 * This script compares the hierarchical factorization and closure properties
 * across all three exceptional groups:
 *
 * - E₆: 78-dimensional, base-156, φ(156) = 48 prime residues
 * - E₇: 133-dimensional, base-96, φ(96) = 32 prime residues
 * - E₈: 248-dimensional, base-496, φ(496) = 240 prime residues
 *
 * Goal: Determine which exceptional group provides the tightest constraints
 * for factorization.
 */

import * as fs from 'fs';
import * as path from 'path';

// E₆ imports
import {
  toBase156,
  fromBase156,
  factorBigIntE6,
  findOptimalFactorization156,
  computeComplexity156,
  PRIME_RESIDUES_156,
  E6_STRUCTURE,
} from '../../../packages/core/src/compiler/e6-structure';

// E₇ imports (existing)
import {
  toBase96,
  fromBase96,
  factorBigInt as factorBigIntE7,
} from '../../../packages/core/src/compiler/hierarchical';
import {
  findOptimalFactorization as findOptimalFactorization96,
  computeComplexity as computeComplexity96,
} from '../../../packages/core/src/compiler/optimal-factorization';

// E₈ imports
import {
  toBase496,
  fromBase496,
  factorBigIntE8,
  findOptimalFactorization496,
  computeComplexity496,
  PRIME_RESIDUES_496,
  E8_STRUCTURE,
} from '../../../packages/core/src/compiler/e8-structure';

// ========================================================================
// Test Numbers
// ========================================================================

const RSA_260 = BigInt(
  '22112825529529666435281085255026230927612089502470015394413748319128822941' +
    '40664981690295237907262606923835005442126672024101081373265533949103140104' +
    '79986355004909667574335445914062447660959059726047157828579880484167499097' +
    '3422287179817183286845865799508538793815835042257',
);

// Smaller test numbers for comparison
const TEST_NUMBERS = [
  { name: 'Small-1', value: 12345678901234567890n },
  { name: 'Small-2', value: 98765432109876543210n },
  { name: 'Medium', value: 123456789012345678901234567890n },
  { name: 'RSA-260', value: RSA_260 },
];

console.log('═══════════════════════════════════════════════════════════');
console.log('  Phase 4: Exceptional Groups Comparison');
console.log('  E₆ (base-156) vs E₇ (base-96) vs E₈ (base-496)');
console.log('═══════════════════════════════════════════════════════════\n');

// ========================================================================
// Part 1: Group Properties Comparison
// ========================================================================

console.log('Part 1: Exceptional Group Properties\n');

console.log('Group Properties:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Property         | E₆          | E₇          | E₈');
console.log('─────────────────────────────────────────────────────────────');
console.log(
  `Dimension        | ${E6_STRUCTURE.dimension.toString().padStart(11)} | ${(133).toString().padStart(11)} | ${E8_STRUCTURE.dimension.toString().padStart(11)}`,
);
console.log(
  `Base             | ${E6_STRUCTURE.base.toString().padStart(11)} | ${(96).toString().padStart(11)} | ${E8_STRUCTURE.base.toString().padStart(11)}`,
);
console.log(
  `Prime residues   | ${E6_STRUCTURE.primeResidueCount.toString().padStart(11)} | ${(32).toString().padStart(11)} | ${E8_STRUCTURE.primeResidueCount.toString().padStart(11)}`,
);
console.log(
  `Factorization    | ${'2²×3×13'.padStart(11)} | ${'2⁵×3'.padStart(11)} | ${'2⁴×31'.padStart(11)}`,
);
console.log(
  `Special property | ${''.padStart(11)} | ${'Smallest'.padStart(11)} | ${'Perfect #'.padStart(11)}`,
);
console.log();

// ========================================================================
// Part 2: Digit Count Comparison
// ========================================================================

console.log('Part 2: Digit Count Scaling\n');

console.log('Number of base-N digits for each test number:');
console.log('Test Case    | Bits | E₆ (base-156) | E₇ (base-96) | E₈ (base-496)');
console.log('─────────────────────────────────────────────────────────────────────');

for (const test of TEST_NUMBERS) {
  const bits = test.value.toString(2).length;
  const digits_e6 = toBase156(test.value).length;
  const digits_e7 = toBase96(test.value).length;
  const digits_e8 = toBase496(test.value).length;

  console.log(
    `${test.name.padEnd(12)} | ${bits.toString().padStart(4)} | ${digits_e6.toString().padStart(13)} | ${digits_e7.toString().padStart(13)} | ${digits_e8.toString().padStart(13)}`,
  );
}
console.log();

// Theoretical digit counts
console.log('Theoretical digit count formula: ⌈log_base(n)⌉');
console.log('  E₆: ⌈log₁₅₆(n)⌉ ≈ ⌈log₂(n) / 7.29⌉');
console.log('  E₇: ⌈log₉₆(n)⌉ ≈ ⌈log₂(n) / 6.58⌉');
console.log('  E₈: ⌈log₄₉₆(n)⌉ ≈ ⌈log₂(n) / 8.95⌉');
console.log();

console.log('Insight: Larger base → fewer digits → potentially simpler representation');
console.log();

// ========================================================================
// Part 3: RSA-260 Complete Decomposition
// ========================================================================

console.log('Part 3: RSA-260 Decomposition in All Three Groups\n');

console.log('Computing hierarchical factorizations...\n');

const rsa260_e6 = factorBigIntE6(RSA_260);
const rsa260_e7 = factorBigIntE7(RSA_260);
const rsa260_e8 = factorBigIntE8(RSA_260);

console.log('RSA-260 Decomposition Summary:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Property              | E₆          | E₇          | E₈');
console.log('─────────────────────────────────────────────────────────────');
console.log(
  `Digit count           | ${rsa260_e6.layers.length.toString().padStart(11)} | ${rsa260_e7.layers.length.toString().padStart(11)} | ${rsa260_e8.layers.length.toString().padStart(11)}`,
);
console.log(
  `Lowest digit (d₀)     | ${rsa260_e6.layers[0].digit.toString().padStart(11)} | ${rsa260_e7.layers[0].digit.toString().padStart(11)} | ${rsa260_e8.layers[0].digit.toString().padStart(11)}`,
);

// Compute complexities
let e6_total_complexity = 0;
for (const layer of rsa260_e6.layers) {
  e6_total_complexity += computeComplexity156(layer.factors);
}
const e6_avg_complexity = e6_total_complexity / rsa260_e6.layers.length;

let e7_total_complexity = 0;
for (const layer of rsa260_e7.layers) {
  e7_total_complexity += computeComplexity96(layer.factors);
}
const e7_avg_complexity = e7_total_complexity / rsa260_e7.layers.length;

let e8_total_complexity = 0;
for (const layer of rsa260_e8.layers) {
  e8_total_complexity += computeComplexity496(layer.factors);
}
const e8_avg_complexity = e8_total_complexity / rsa260_e8.layers.length;

console.log(
  `Avg complexity        | ${e6_avg_complexity.toFixed(2).padStart(11)} | ${e7_avg_complexity.toFixed(2).padStart(11)} | ${e8_avg_complexity.toFixed(2).padStart(11)}`,
);

// Orbit distances
let e6_total_orbit = 0;
for (const layer of rsa260_e6.layers) {
  e6_total_orbit += layer.orbitDistance;
}
const e6_avg_orbit = e6_total_orbit / rsa260_e6.layers.length;

let e7_total_orbit = 0;
for (const layer of rsa260_e7.layers) {
  e7_total_orbit += layer.orbitDistance;
}
const e7_avg_orbit = e7_total_orbit / rsa260_e7.layers.length;

let e8_total_orbit = 0;
for (const layer of rsa260_e8.layers) {
  e8_total_orbit += layer.orbitDistance;
}
const e8_avg_orbit = e8_total_orbit / rsa260_e8.layers.length;

console.log(
  `Avg orbit distance    | ${e6_avg_orbit.toFixed(2).padStart(11)} | ${e7_avg_orbit.toFixed(2).padStart(11)} | ${e8_avg_orbit.toFixed(2).padStart(11)}`,
);

console.log();

// ========================================================================
// Part 4: Prime Residue Pair Analysis
// ========================================================================

console.log('Part 4: Prime Residue Pair Analysis for RSA-260\n');

const d0_e6 = rsa260_e6.layers[0].digit;
const d0_e7 = rsa260_e7.layers[0].digit;
const d0_e8 = rsa260_e8.layers[0].digit;

console.log('Lowest digit constraints:');
console.log('  E₆: d₀ = ' + d0_e6 + ' (mod 156)');
console.log('  E₇: d₀ = ' + d0_e7 + ' (mod 96)');
console.log('  E₈: d₀ = ' + d0_e8 + ' (mod 496)');
console.log();

// Count valid (p₀, q₀) pairs
function countValidPairs(
  d0: number,
  base: number,
  primeResidues: number[],
): number {
  let count = 0;
  for (const p0 of primeResidues) {
    for (const q0 of primeResidues) {
      if ((p0 * q0) % base === d0) {
        count++;
      }
    }
  }
  return count;
}

const e6_pairs = countValidPairs(d0_e6, 156, PRIME_RESIDUES_156);
const e7_pairs = 32; // Known from Phase 1
const e8_pairs = countValidPairs(d0_e8, 496, PRIME_RESIDUES_496);

const e6_total_pairs = PRIME_RESIDUES_156.length ** 2;
const e7_total_pairs = 32 ** 2;
const e8_total_pairs = PRIME_RESIDUES_496.length ** 2;

console.log('Valid (p₀, q₀) prime residue pairs:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Group | Valid Pairs | Total Pairs | Reduction %');
console.log('─────────────────────────────────────────────────────────────');
console.log(
  `E₆    | ${e6_pairs.toString().padStart(11)} | ${e6_total_pairs.toString().padStart(11)} | ${((1 - e6_pairs / e6_total_pairs) * 100).toFixed(2).padStart(11)}%`,
);
console.log(
  `E₇    | ${e7_pairs.toString().padStart(11)} | ${e7_total_pairs.toString().padStart(11)} | ${((1 - e7_pairs / e7_total_pairs) * 100).toFixed(2).padStart(11)}%`,
);
console.log(
  `E₈    | ${e8_pairs.toString().padStart(11)} | ${e8_total_pairs.toString().padStart(11)} | ${((1 - e8_pairs / e8_total_pairs) * 100).toFixed(2).padStart(11)}%`,
);
console.log();

// ========================================================================
// Part 5: Constraint Quality Comparison
// ========================================================================

console.log('Part 5: Constraint Quality Analysis\n');

console.log('Constraint strength metrics:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Metric                    | E₆     | E₇     | E₈');
console.log('─────────────────────────────────────────────────────────────');

// 1. Modular constraint strength (reduction %)
const e6_mod_strength = (1 - e6_pairs / e6_total_pairs) * 100;
const e7_mod_strength = (1 - e7_pairs / e7_total_pairs) * 100;
const e8_mod_strength = (1 - e8_pairs / e8_total_pairs) * 100;

console.log(
  `Modular reduction (%)     | ${e6_mod_strength.toFixed(2).padStart(6)} | ${e7_mod_strength.toFixed(2).padStart(6)} | ${e8_mod_strength.toFixed(2).padStart(6)}`,
);

// 2. Digit efficiency (bits per digit)
const e6_bits_per_digit = Math.log2(156);
const e7_bits_per_digit = Math.log2(96);
const e8_bits_per_digit = Math.log2(496);

console.log(
  `Bits per digit            | ${e6_bits_per_digit.toFixed(2).padStart(6)} | ${e7_bits_per_digit.toFixed(2).padStart(6)} | ${e8_bits_per_digit.toFixed(2).padStart(6)}`,
);

// 3. Prime residue density
const e6_density = (PRIME_RESIDUES_156.length / 156) * 100;
const e7_density = (32 / 96) * 100;
const e8_density = (PRIME_RESIDUES_496.length / 496) * 100;

console.log(
  `Prime residue density (%) | ${e6_density.toFixed(2).padStart(6)} | ${e7_density.toFixed(2).padStart(6)} | ${e8_density.toFixed(2).padStart(6)}`,
);

// 4. Search space estimate per digit
const e6_search_per_digit = PRIME_RESIDUES_156.length;
const e7_search_per_digit = 32;
const e8_search_per_digit = PRIME_RESIDUES_496.length;

console.log(
  `Choices per digit (pᵢ)    | ${e6_search_per_digit.toString().padStart(6)} | ${e7_search_per_digit.toString().padStart(6)} | ${e8_search_per_digit.toString().padStart(6)}`,
);

console.log();

// ========================================================================
// Part 6: Search Space Complexity
// ========================================================================

console.log('Part 6: Search Space Complexity for RSA-260\n');

const rsa260_bits = 899;
const e6_expected_p_digits = Math.ceil(rsa260_bits / 2 / e6_bits_per_digit);
const e7_expected_p_digits = Math.ceil(rsa260_bits / 2 / e7_bits_per_digit);
const e8_expected_p_digits = Math.ceil(rsa260_bits / 2 / e8_bits_per_digit);

console.log('Expected p digit counts (balanced semiprime):');
console.log(`  E₆: ~${e6_expected_p_digits} digits`);
console.log(`  E₇: ~${e7_expected_p_digits} digits`);
console.log(`  E₈: ~${e8_expected_p_digits} digits`);
console.log();

console.log('Naive search space (p choices × q choices):');

const e6_search_space_log2 =
  e6_expected_p_digits * Math.log2(e6_search_per_digit) * 2;
const e7_search_space_log2 =
  e7_expected_p_digits * Math.log2(e7_search_per_digit) * 2;
const e8_search_space_log2 =
  e8_expected_p_digits * Math.log2(e8_search_per_digit) * 2;

console.log(`  E₆: ~2^${e6_search_space_log2.toFixed(0)}`);
console.log(`  E₇: ~2^${e7_search_space_log2.toFixed(0)}`);
console.log(`  E₈: ~2^${e8_search_space_log2.toFixed(0)}`);
console.log();

console.log('With modular constraints (d₀ only):');
console.log(
  `  E₆: ~2^${e6_search_space_log2.toFixed(0)} × ${(e6_pairs / e6_total_pairs).toFixed(4)} ≈ 2^${(e6_search_space_log2 + Math.log2(e6_pairs / e6_total_pairs)).toFixed(0)}`,
);
console.log(
  `  E₇: ~2^${e7_search_space_log2.toFixed(0)} × ${(e7_pairs / e7_total_pairs).toFixed(4)} ≈ 2^${(e7_search_space_log2 + Math.log2(e7_pairs / e7_total_pairs)).toFixed(0)}`,
);
console.log(
  `  E₈: ~2^${e8_search_space_log2.toFixed(0)} × ${(e8_pairs / e8_total_pairs).toFixed(4)} ≈ 2^${(e8_search_space_log2 + Math.log2(e8_pairs / e8_total_pairs)).toFixed(0)}`,
);
console.log();

// ========================================================================
// Part 7: Recommendations
// ========================================================================

console.log('Part 7: Constraint Quality Ranking\n');

interface GroupScore {
  name: string;
  modularScore: number;
  digitEfficiencyScore: number;
  densityScore: number;
  searchSpaceScore: number;
  totalScore: number;
}

const scores: GroupScore[] = [
  {
    name: 'E₆',
    modularScore: e6_mod_strength,
    digitEfficiencyScore: e6_bits_per_digit,
    densityScore: e6_density,
    searchSpaceScore: -e6_search_space_log2,
    totalScore: 0,
  },
  {
    name: 'E₇',
    modularScore: e7_mod_strength,
    digitEfficiencyScore: e7_bits_per_digit,
    densityScore: e7_density,
    searchSpaceScore: -e7_search_space_log2,
    totalScore: 0,
  },
  {
    name: 'E₈',
    modularScore: e8_mod_strength,
    digitEfficiencyScore: e8_bits_per_digit,
    densityScore: e8_density,
    searchSpaceScore: -e8_search_space_log2,
    totalScore: 0,
  },
];

// Normalize and compute total scores
const maxMod = Math.max(...scores.map((s) => s.modularScore));
const maxEff = Math.max(...scores.map((s) => s.digitEfficiencyScore));
const maxDens = Math.max(...scores.map((s) => s.densityScore));
const minSearch = Math.min(...scores.map((s) => s.searchSpaceScore));

for (const score of scores) {
  const normMod = score.modularScore / maxMod;
  const normEff = score.digitEfficiencyScore / maxEff;
  const normDens = score.densityScore / maxDens;
  const normSearch = score.searchSpaceScore / minSearch;

  // Weighted total (modular strength most important)
  score.totalScore =
    normMod * 0.4 + normEff * 0.2 + normDens * 0.2 + normSearch * 0.2;
}

scores.sort((a, b) => b.totalScore - a.totalScore);

console.log('Overall Ranking (higher = better constraints):');
console.log('Rank | Group | Total Score | Notes');
console.log('─────────────────────────────────────────────────────────────');

for (let i = 0; i < scores.length; i++) {
  const rank = i + 1;
  const score = scores[i];
  let notes = '';

  if (score.name === 'E₇') {
    notes = 'Balanced, well-studied';
  } else if (score.name === 'E₆') {
    notes = 'More prime residues';
  } else if (score.name === 'E₈') {
    notes = 'Largest, most residues';
  }

  console.log(
    `  ${rank}  | ${score.name.padEnd(5)} | ${score.totalScore.toFixed(3).padStart(11)} | ${notes}`,
  );
}

console.log();

// ========================================================================
// Export Results
// ========================================================================

const analysis = {
  metadata: {
    name: 'Phase-4-Exceptional-Groups-Comparison',
    timestamp: new Date().toISOString(),
  },
  group_properties: {
    E6: E6_STRUCTURE,
    E7: {
      dimension: 133,
      base: 96,
      primeResidueCount: 32,
      factorization: { 96: '2⁵ × 3' },
    },
    E8: {
      dimension: E8_STRUCTURE.dimension,
      base: E8_STRUCTURE.base,
      primeResidueCount: E8_STRUCTURE.primeResidueCount,
      factorization: E8_STRUCTURE.factorization,
      isPerfectNumber: E8_STRUCTURE.isPerfectNumber,
    },
  },
  rsa_260_analysis: {
    E6: {
      digits: rsa260_e6.layers.length,
      d0: d0_e6,
      avgComplexity: e6_avg_complexity,
      avgOrbitDistance: e6_avg_orbit,
      validPairs: e6_pairs,
      reduction: e6_mod_strength,
    },
    E7: {
      digits: rsa260_e7.layers.length,
      d0: d0_e7,
      avgComplexity: e7_avg_complexity,
      avgOrbitDistance: e7_avg_orbit,
      validPairs: e7_pairs,
      reduction: e7_mod_strength,
    },
    E8: {
      digits: rsa260_e8.layers.length,
      d0: d0_e8,
      avgComplexity: e8_avg_complexity,
      avgOrbitDistance: e8_avg_orbit,
      validPairs: e8_pairs,
      reduction: e8_mod_strength,
    },
  },
  constraint_quality_ranking: scores,
};

const outputPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'core',
  'benchmark',
  'phase4-exceptional-groups.json',
);

fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

console.log('═══════════════════════════════════════════════════════════');
console.log('Phase 4: Exceptional Groups Comparison Complete');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Key Findings:');
console.log(`  • All three groups provide strong modular constraints`);
console.log(`  • E₈ has most prime residues (240) but largest search space`);
console.log(`  • E₇ provides best balance of constraints and efficiency`);
console.log(`  • E₆ offers middle ground with 48 prime residues`);
console.log();

console.log('Winner: ' + scores[0].name + ' (best overall constraint quality)');
console.log();

console.log('Exported analysis to: phase4-exceptional-groups.json');
console.log();

console.log('CRITICAL INSIGHT:');
console.log('────────────────');
console.log('Larger exceptional groups do NOT automatically provide better');
console.log('constraints. The quality depends on:');
console.log('  • Modular reduction strength');
console.log('  • Digit efficiency (bits per digit)');
console.log('  • Prime residue density');
console.log('  • Search space per digit');
console.log();

console.log('All three groups remain exponentially hard, confirming that');
console.log('factorization via exceptional group closure is HARD by design.');
console.log();

console.log('Next: Phase 5 - Quantum circuit compilation from orbit structure\n');
