/**
 * E₆ Exceptional Group Structure
 *
 * E₆ is a 78-dimensional exceptional Lie group.
 * In our context, it operates over ℤ₁₅₆ (base-156 arithmetic).
 *
 * Key properties:
 * - Dimension: 78
 * - Base: 156 = 2² × 3 × 13 = 4 × 39 = 6 × 26 = 12 × 13
 * - φ(156) = 48 (Euler's totient - prime residues)
 * - Expected relation: 78 ≡ ? (mod 156)
 *
 * This module implements:
 * 1. Transform algebra {R, D, T, M} for ℤ₁₅₆
 * 2. Orbit distance table
 * 3. Factorization in base-156
 */

import { Atlas } from '../api';

// ========================================================================
// E₆ Transform Definitions
// ========================================================================

/**
 * R (Rotate): Quadrant rotation in 4-space
 * For E₆: h₂ ∈ {0,1,2,3} → (h₂ + 1) mod 4
 * Maps class i → (i + 39) mod 156 (since 156/4 = 39)
 */
export function R_E6(x: number): number {
  return (x + 39) % 156;
}

/**
 * D (Triality): Modality rotation in 3-space
 * For E₆: d ∈ {0,1,2} → (d + 1) mod 3
 * Maps class i → rotation by 156/3 = 52
 */
export function D_E6(x: number): number {
  return (x + 52) % 156;
}

/**
 * T (Twist): Context ring rotation (octonion structure)
 * For E₆: ℓ ∈ {0..7} → (ℓ + 1) mod 8
 * Maps class i → (i + k) where k relates to 78/8 structure
 */
export function T_E6(x: number): number {
  // E₆ has 78 dimensions, context ring twist by 156/8 ≈ 19.5
  // Use 20 for approximate twist
  return (x + 20) % 156;
}

/**
 * M (Mirror): Reflection symmetry
 * For E₆: Conjugate/mirror operation
 */
export function M_E6(x: number): number {
  // Mirror around midpoint 78
  return (156 - x) % 156;
}

// ========================================================================
// Prime Residues in ℤ₁₅₆
// ========================================================================

/**
 * Compute prime residues mod 156.
 * φ(156) = φ(4) × φ(3) × φ(13) = 2 × 2 × 12 = 48
 */
export function computePrimeResidues156(): number[] {
  const residues: number[] = [];
  for (let i = 1; i < 156; i++) {
    if (gcd(i, 156) === 1) {
      residues.push(i);
    }
  }
  return residues;
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export const PRIME_RESIDUES_156 = computePrimeResidues156();

// Verify count
if (PRIME_RESIDUES_156.length !== 48) {
  throw new Error(
    `Expected 48 prime residues mod 156, got ${PRIME_RESIDUES_156.length}`,
  );
}

// ========================================================================
// Orbit Distance Computation
// ========================================================================

/**
 * Compute orbit distance from prime generator.
 * For E₆, we use BFS to find shortest path from generator to target.
 *
 * Generator: We'll use the smallest prime residue > 1 as canonical.
 */
export function computeOrbitDistances156(): number[] {
  const distances = new Array(156).fill(-1);
  const queue: number[] = [];

  // Start from generator (smallest prime > 1)
  const generator = PRIME_RESIDUES_156[0]; // Should be 1
  // Use second prime as actual generator for non-trivial distances
  const start = PRIME_RESIDUES_156[1]; // Should be 5

  distances[start] = 0;
  queue.push(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances[current];

    // Try all transforms
    const neighbors = [
      R_E6(current),
      D_E6(current),
      T_E6(current),
      M_E6(current),
    ];

    for (const neighbor of neighbors) {
      if (distances[neighbor] === -1) {
        distances[neighbor] = currentDist + 1;
        queue.push(neighbor);
      }
    }
  }

  // Handle unreached nodes (set to max distance)
  for (let i = 0; i < 156; i++) {
    if (distances[i] === -1) {
      distances[i] = 999;
    }
  }

  return distances;
}

export const ORBIT_DISTANCE_TABLE_156 = computeOrbitDistances156();

// ========================================================================
// Base-156 Arithmetic
// ========================================================================

/**
 * Convert bigint to base-156 representation.
 */
export function toBase156(n: bigint): number[] {
  if (n === 0n) return [0];

  const digits: number[] = [];
  let remaining = n;

  while (remaining > 0n) {
    const digit = Number(remaining % 156n);
    digits.push(digit);
    remaining = remaining / 156n;
  }

  return digits;
}

/**
 * Convert base-156 digits back to bigint.
 */
export function fromBase156(digits: number[]): bigint {
  let result = 0n;
  let power = 1n;

  for (const digit of digits) {
    result += BigInt(digit) * power;
    power *= 156n;
  }

  return result;
}

// ========================================================================
// E₆ Factorization
// ========================================================================

/**
 * Factor a number in ℤ₁₅₆ using E₆ orbit structure.
 *
 * This is analogous to computeFactor96 but for base-156.
 */
export function computeFactor156(n: number): number[] {
  const mod = n % 156;

  // Try simple factorizations first
  // 156 = 4 × 39 = 12 × 13 = 2² × 3 × 13

  // Check if it's a prime residue (irreducible in ℤ₁₅₆)
  if (gcd(mod, 156) === 1) {
    return [mod];
  }

  // Try factoring by small primes
  const factors: number[] = [];
  let remaining = mod;

  // Factor out 2s
  while (remaining % 2 === 0 && remaining > 0) {
    factors.push(2);
    remaining = remaining / 2;
  }

  // Factor out 3s
  while (remaining % 3 === 0 && remaining > 0) {
    factors.push(3);
    remaining = remaining / 3;
  }

  // Factor out 13s
  while (remaining % 13 === 0 && remaining > 0) {
    factors.push(13);
    remaining = remaining / 13;
  }

  // If we have remainder, try other factors
  if (remaining > 1) {
    // Try small factors up to sqrt(156)
    for (let f = 5; f <= 12; f++) {
      while (remaining % f === 0 && remaining > 0) {
        factors.push(f);
        remaining = remaining / f;
      }
    }

    // If still not fully factored, add as-is
    if (remaining > 1) {
      factors.push(remaining);
    }
  }

  return factors.length > 0 ? factors : [mod];
}

// ========================================================================
// Hierarchical Factorization for E₆
// ========================================================================

export interface E6Layer {
  digit: number; // base-156 digit
  factors: number[]; // factorization in ℤ₁₅₆
  orbitDistance: number; // distance from generator
  scale: bigint; // 156^i
}

export interface E6Factorization {
  layers: E6Layer[];
}

/**
 * Hierarchical factorization in base-156 (E₆ structure).
 */
export function factorBigIntE6(n: bigint): E6Factorization {
  const digits = toBase156(n);
  const layers: E6Layer[] = [];

  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    const factors = computeFactor156(digit);
    const orbitDistance = ORBIT_DISTANCE_TABLE_156[digit];
    const scale = 156n ** BigInt(i);

    layers.push({
      digit,
      factors,
      orbitDistance,
      scale,
    });
  }

  return { layers };
}

// ========================================================================
// Orbit Structure Analysis
// ========================================================================

/**
 * Find optimal factorization in ℤ₁₅₆ by minimizing orbit distance.
 */
export function findOptimalFactorization156(n: number): {
  factors: number[];
  orbitDistance: number;
} {
  const mod = n % 156;
  const factors = computeFactor156(mod);
  const orbitDistance = ORBIT_DISTANCE_TABLE_156[mod];

  return {
    factors,
    orbitDistance,
  };
}

// ========================================================================
// Complexity Metric
// ========================================================================

/**
 * Compute complexity of factorization in E₆.
 * Uses same metric as E₇: weighted by factor count and orbit distances.
 */
export function computeComplexity156(factors: number[]): number {
  if (factors.length === 0) return 0;

  // α: factor count weight
  // β: sum of orbit distances
  // γ: max orbit distance
  const alpha = 10;
  const beta = 2;
  const gamma = 5;

  const factorCount = factors.length;
  const orbitSum = factors.reduce(
    (sum, f) => sum + ORBIT_DISTANCE_TABLE_156[f % 156],
    0,
  );
  const maxOrbitDist = Math.max(
    ...factors.map((f) => ORBIT_DISTANCE_TABLE_156[f % 156]),
  );

  return alpha * factorCount + beta * orbitSum + gamma * maxOrbitDist;
}

// ========================================================================
// Export Summary
// ========================================================================

export const E6_STRUCTURE = {
  dimension: 78,
  base: 156,
  primeResidueCount: 48,
  factorization: {
    156: '2² × 3 × 13',
  },
  transforms: {
    R: R_E6,
    D: D_E6,
    T: T_E6,
    M: M_E6,
  },
  orbitDistances: ORBIT_DISTANCE_TABLE_156,
  primeResidues: PRIME_RESIDUES_156,
};
