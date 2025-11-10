#!/usr/bin/env node
/**
 * Phase 1: Carry Propagation Constraint Solver for RSA-260
 *
 * Uses the bijective property of base-96 hierarchical factorization to derive
 * recursive constraints on the unknown prime factors p and q of RSA-260.
 *
 * Key insight: If RSA-260 = p × q, then:
 *   toBase96(RSA-260) = [d₀, d₁, ..., d₁₃₆]
 *   toBase96(p) = [p₀, p₁, ..., p₆₈]
 *   toBase96(q) = [q₀, q₁, ..., q₆₈]
 *
 * Multiplication in base-96 gives us recursive constraints:
 *   dᵢ = Σ(pⱼ × qₖ) + carryᵢ₋₁ (mod 96)
 *        j+k=i
 *
 * This script builds the constraint graph through all 137 digits.
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

// Base-96 digits of RSA-260 (loaded from analysis)
const RSA_260_DIGITS = [
  17, 58, 27, 31, 35, 81, 83, 20, 22, 90, 73, 24, 59, 70, 73, 80, 11, 17, 56,
  72, 2, 68, 1, 43, 93, 89, 52, 17, 83, 76, 18, 63, 37, 62, 92, 37, 78, 90, 68,
  28, 65, 89, 81, 59, 95, 86, 41, 40, 91, 1, 90, 83, 9, 50, 68, 63, 40, 26, 62,
  16, 7, 5, 81, 27, 51, 35, 87, 55, 46, 52, 7, 26, 53, 41, 20, 39, 59, 79, 48,
  26, 86, 92, 67, 79, 10, 95, 10, 54, 83, 84, 87, 88, 40, 16, 9, 25, 95, 89, 1,
  55, 61, 7, 76, 92, 66, 67, 65, 39, 49, 64, 78, 75, 72, 48, 30, 91, 5, 79, 5,
  72, 15, 60, 17, 10, 66, 63, 39, 27, 41, 61, 87, 46, 20, 82, 52, 37, 2,
];

// Valid prime residue pairs where p₀ × q₀ ≡ 17 (mod 96)
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

// ========================================================================
// Helper Functions
// ========================================================================

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function isPrimeResidue(n: number): boolean {
  return gcd(n, 96) === 1;
}

/**
 * Compute constraints on the next digit (pᵢ, qᵢ) given previous digits.
 *
 * Key insight: For digit i, we have:
 *   dᵢ = (p₀×qᵢ + p₁×qᵢ₋₁ + ... + pᵢ×q₀) + carryᵢ₋₁ (mod 96)
 *
 * We can solve for valid (pᵢ, qᵢ) pairs by:
 *   1. Computing the partial sum from known digits (j < i)
 *   2. Finding (pᵢ, qᵢ) such that: pᵢ×q₀ + p₀×qᵢ + ... = target - partial_sum
 *
 * This reduces the search space significantly by using the known digits
 * as constraints rather than trying all combinations.
 */
interface DigitCandidate {
  p_digits: number[]; // [p₀, p₁, ..., pᵢ]
  q_digits: number[]; // [q₀, q₁, ..., qᵢ]
  carry: number; // carry into next digit
}

function computeNextDigitCandidates(
  current_candidates: DigitCandidate[],
  target_digit: number,
  digit_index: number,
): DigitCandidate[] {
  const next_candidates: DigitCandidate[] = [];

  for (const candidate of current_candidates) {
    // Compute partial sum from known cross products (j + k = i, where j,k < i)
    let partial_sum = candidate.carry;

    // Add cross products from previously determined digits
    for (let j = 1; j < digit_index; j++) {
      const k = digit_index - j;
      if (k >= candidate.q_digits.length || j >= candidate.p_digits.length) continue;

      partial_sum += candidate.p_digits[j] * candidate.q_digits[k];
    }

    // Now we need to find (pᵢ, qᵢ) such that:
    // pᵢ×q₀ + p₀×qᵢ + partial_sum ≡ target_digit (mod 96)
    //
    // Rearranging: pᵢ×q₀ + p₀×qᵢ ≡ target_digit - partial_sum (mod 96)
    //
    // This is a linear Diophantine equation in pᵢ and qᵢ

    const p0 = candidate.p_digits[0];
    const q0 = candidate.q_digits[0];
    const target_sum = (target_digit - partial_sum + 96 * 100) % 96; // ensure positive

    // Try all prime residue values for pᵢ
    for (let pi = 0; pi < 96; pi++) {
      if (!isPrimeResidue(pi)) continue;

      // Given pᵢ, solve for qᵢ:
      // p₀×qᵢ ≡ target_sum - pᵢ×q₀ (mod 96)
      //
      // This requires computing the modular inverse of p₀ (if it exists)
      // However, since we're trying all values, we can just check directly

      for (let qi = 0; qi < 96; qi++) {
        if (!isPrimeResidue(qi)) continue;

        const cross_sum = (pi * q0 + p0 * qi) % 96;

        // Now compute the full sum including carry
        const full_sum = partial_sum + cross_sum;
        const digit_result = full_sum % 96;
        const carry_out = Math.floor(full_sum / 96);

        if (digit_result === target_digit) {
          next_candidates.push({
            p_digits: [...candidate.p_digits, pi],
            q_digits: [...candidate.q_digits, qi],
            carry: carry_out,
          });
        }
      }
    }
  }

  return next_candidates;
}

/**
 * Build constraint graph level by level.
 *
 * Starting from the 32 valid (p₀, q₀) pairs, propagate constraints forward
 * through d₁, d₂, ..., d₁₃₆.
 */
function buildConstraintGraph(max_digits: number = 10): Map<number, DigitCandidate[]> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Phase 1: Carry Propagation Constraint Graph');
  console.log('  RSA-260 Factor Resolution via Bijectivity');
  console.log('═══════════════════════════════════════════════════════════\n');

  const constraint_graph = new Map<number, DigitCandidate[]>();

  // Level 0: Initial pairs from d₀ = 17
  const level_0: DigitCandidate[] = INITIAL_PAIRS.map(([p0, q0]) => {
    const product = p0 * q0;
    const carry = Math.floor(product / 96);
    return {
      p_digits: [p0],
      q_digits: [q0],
      carry: carry,
    };
  });

  constraint_graph.set(0, level_0);

  console.log(`Level 0 (d₀ = ${RSA_260_DIGITS[0]}):`);
  console.log(`  Initial pairs: ${level_0.length}`);
  console.log(
    `  Carry distribution: ${JSON.stringify(Array.from(new Set(level_0.map((c) => c.carry))).sort((a, b) => a - b))}`,
  );
  console.log();

  // Propagate constraints level by level
  for (let i = 1; i < max_digits && i < RSA_260_DIGITS.length; i++) {
    const target_digit = RSA_260_DIGITS[i];
    const prev_candidates = constraint_graph.get(i - 1)!;

    console.log(`Level ${i} (d₍${i}₎ = ${target_digit}):`);
    console.log(`  Starting candidates: ${prev_candidates.length}`);

    const start_time = performance.now();

    // This is the expensive computation - trying all (pᵢ, qᵢ) combinations
    const next_candidates = computeNextDigitCandidates(
      prev_candidates,
      target_digit,
      i,
    );

    const end_time = performance.now();

    constraint_graph.set(i, next_candidates);

    console.log(`  Resulting candidates: ${next_candidates.length}`);
    console.log(`  Pruning: ${((1 - next_candidates.length / prev_candidates.length) * 100).toFixed(1)}%`);
    console.log(`  Computation time: ${(end_time - start_time).toFixed(2)} ms`);

    if (next_candidates.length > 0) {
      const carry_dist = Array.from(new Set(next_candidates.map((c) => c.carry))).sort(
        (a, b) => a - b,
      );
      console.log(`  Carry distribution: ${JSON.stringify(carry_dist.slice(0, 10))}${carry_dist.length > 10 ? '...' : ''}`);
    }

    console.log();

    // Stop if we've pruned to zero (indicates error or need for backtracking)
    if (next_candidates.length === 0) {
      console.log(`⚠️  Pruned to zero candidates at level ${i}. Stopping.`);
      console.log();
      break;
    }

    // Also stop if computation becomes too expensive
    if (next_candidates.length > 100000) {
      console.log(
        `⚠️  Candidate explosion (${next_candidates.length} > 100K). Stopping at level ${i}.`,
      );
      console.log();
      break;
    }
  }

  return constraint_graph;
}

/**
 * Analyze pruning efficiency across the constraint graph.
 */
function analyzePruningEfficiency(
  constraint_graph: Map<number, DigitCandidate[]>,
): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Pruning Efficiency Analysis');
  console.log('═══════════════════════════════════════════════════════════\n');

  const levels = Array.from(constraint_graph.keys()).sort((a, b) => a - b);

  console.log('Level | Candidates | Reduction | Cumulative Reduction');
  console.log('─────────────────────────────────────────────────────────────');

  let prev_count = 0;
  for (const level of levels) {
    const candidates = constraint_graph.get(level)!;
    const count = candidates.length;

    if (level === 0) {
      console.log(`  ${level.toString().padStart(2)}  | ${count.toString().padStart(10)} |     -     |         -`);
      prev_count = count;
      continue;
    }

    const reduction = ((1 - count / prev_count) * 100).toFixed(1);
    const cumulative_reduction = (
      (1 - count / constraint_graph.get(0)!.length) *
      100
    ).toFixed(1);

    console.log(
      `  ${level.toString().padStart(2)}  | ${count.toString().padStart(10)} | ${reduction.padStart(6)}% | ${cumulative_reduction.padStart(15)}%`,
    );

    prev_count = count;
  }

  console.log();

  // Statistical summary
  const final_level = levels[levels.length - 1];
  const final_candidates = constraint_graph.get(final_level)!;
  const initial_candidates = constraint_graph.get(0)!;

  const total_reduction =
    (1 - final_candidates.length / initial_candidates.length) * 100;

  console.log('Summary:');
  console.log(`  Initial candidates (level 0): ${initial_candidates.length}`);
  console.log(`  Final candidates (level ${final_level}): ${final_candidates.length}`);
  console.log(`  Total reduction: ${total_reduction.toFixed(2)}%`);
  console.log(
    `  Average reduction per level: ${(total_reduction / final_level).toFixed(2)}%`,
  );
  console.log();
}

/**
 * Export verifiable constraint graph data.
 */
function exportConstraintGraph(
  constraint_graph: Map<number, DigitCandidate[]>,
  output_path: string,
): void {
  const levels = Array.from(constraint_graph.keys()).sort((a, b) => a - b);

  const export_data = {
    metadata: {
      name: 'RSA-260-Carry-Propagation-Constraint-Graph',
      timestamp: new Date().toISOString(),
      rsa_value: RSA_260.toString(),
      total_digits: RSA_260_DIGITS.length,
      computed_levels: levels.length,
    },
    target_digits: RSA_260_DIGITS.slice(0, levels.length),
    constraint_graph: levels.map((level) => {
      const candidates = constraint_graph.get(level)!;
      return {
        level: level,
        target_digit: RSA_260_DIGITS[level],
        candidate_count: candidates.length,
        // Only export first 100 candidates to keep file size manageable
        sample_candidates: candidates.slice(0, 100).map((c) => ({
          p_digits: c.p_digits,
          q_digits: c.q_digits,
          carry: c.carry,
        })),
      };
    }),
    pruning_efficiency: levels.slice(1).map((level, idx) => {
      const prev_level = levels[idx];
      const prev_count = constraint_graph.get(prev_level)!.length;
      const curr_count = constraint_graph.get(level)!.length;
      return {
        level: level,
        reduction_percent: ((1 - curr_count / prev_count) * 100).toFixed(2),
        cumulative_reduction_percent: (
          (1 - curr_count / constraint_graph.get(0)!.length) *
          100
        ).toFixed(2),
      };
    }),
  };

  fs.writeFileSync(output_path, JSON.stringify(export_data, null, 2));
  console.log(`Exported constraint graph to: ${output_path}`);
}

// ========================================================================
// Main Execution
// ========================================================================

function main(): void {
  // Build constraint graph for first 10 digits (adjust as needed)
  const max_digits = 10;
  const constraint_graph = buildConstraintGraph(max_digits);

  // Analyze pruning efficiency
  analyzePruningEfficiency(constraint_graph);

  // Export verifiable data
  const output_path = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'packages',
    'core',
    'benchmark',
    'rsa-260-carry-propagation.json',
  );
  exportConstraintGraph(constraint_graph, output_path);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Phase 1: Carry Propagation Analysis Complete');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Key Findings:');
  const final_level = Math.max(...Array.from(constraint_graph.keys()));
  const final_count = constraint_graph.get(final_level)!.length;
  const initial_count = constraint_graph.get(0)!.length;

  console.log(`  • Constraint propagation through ${final_level + 1} digits`);
  console.log(`  • Initial candidates: ${initial_count}`);
  console.log(`  • Final candidates: ${final_count}`);
  console.log(
    `  • Reduction: ${((1 - final_count / initial_count) * 100).toFixed(2)}%`,
  );
  console.log();

  console.log('Next Steps:');
  console.log('  • Extend to more digits (currently limited by computation)');
  console.log('  • Apply Phase 2: Orbit closure constraints');
  console.log('  • Combine with Phase 3: Eigenspace complexity analysis');
  console.log();
}

main();
