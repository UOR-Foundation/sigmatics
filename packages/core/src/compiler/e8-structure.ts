/**
 * E₈ Exceptional Group Structure
 *
 * E₈ is a 248-dimensional exceptional Lie group.
 * In our context, it operates over ℤ₄₉₆ (base-496 arithmetic).
 *
 * Key properties:
 * - Dimension: 248
 * - Base: 496 = 2⁴ × 31 = 16 × 31
 * - φ(496) = φ(16) × φ(31) = 8 × 30 = 240 (prime residues)
 * - 496 is a perfect number: 1 + 2 + 4 + 8 + 16 + 31 + 62 + 124 + 248 = 496
 *
 * This module implements:
 * 1. Transform algebra {R, D, T, M} for ℤ₄₉₆
 * 2. Orbit distance table
 * 3. Factorization in base-496
 */

// ========================================================================
// E₈ Transform Definitions
// ========================================================================

/**
 * R (Rotate): Quadrant rotation in 4-space
 * For E₈: Maps class i → (i + 124) mod 496 (since 496/4 = 124)
 */
export function R_E8(x: number): number {
  return (x + 124) % 496;
}

/**
 * D (Triality): Modality rotation in 3-space
 * For E₈: Maps class i → (i + 165) mod 496 (since 496/3 ≈ 165.33)
 */
export function D_E8(x: number): number {
  return (x + 165) % 496;
}

/**
 * T (Twist): Context ring rotation (octonion structure)
 * For E₈: ℓ ∈ {0..7} → (ℓ + 1) mod 8
 * Maps class i → (i + 62) mod 496 (since 496/8 = 62)
 */
export function T_E8(x: number): number {
  return (x + 62) % 496;
}

/**
 * M (Mirror): Reflection symmetry
 * For E₈: Mirror around midpoint 248 (dimension of E₈)
 */
export function M_E8(x: number): number {
  return (496 - x) % 496;
}

// ========================================================================
// Prime Residues in ℤ₄₉₆
// ========================================================================

/**
 * Compute prime residues mod 496.
 * φ(496) = φ(16) × φ(31) = 8 × 30 = 240
 */
export function computePrimeResidues496(): number[] {
  const residues: number[] = [];
  for (let i = 1; i < 496; i++) {
    if (gcd(i, 496) === 1) {
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

export const PRIME_RESIDUES_496 = computePrimeResidues496();

// Verify count
if (PRIME_RESIDUES_496.length !== 240) {
  throw new Error(
    `Expected 240 prime residues mod 496, got ${PRIME_RESIDUES_496.length}`,
  );
}

// ========================================================================
// Orbit Distance Computation
// ========================================================================

/**
 * Compute orbit distance from prime generator.
 * For E₈, we use BFS to find shortest path from generator to target.
 *
 * Note: This is expensive for 496 elements, but computes once at module load.
 */
export function computeOrbitDistances496(): number[] {
  const distances = new Array(496).fill(-1);
  const queue: number[] = [];

  // Start from generator (use second prime residue for non-trivial distances)
  const start = PRIME_RESIDUES_496[1];

  distances[start] = 0;
  queue.push(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances[current];

    // Try all transforms
    const neighbors = [
      R_E8(current),
      D_E8(current),
      T_E8(current),
      M_E8(current),
    ];

    for (const neighbor of neighbors) {
      if (distances[neighbor] === -1) {
        distances[neighbor] = currentDist + 1;
        queue.push(neighbor);
      }
    }
  }

  // Handle unreached nodes
  for (let i = 0; i < 496; i++) {
    if (distances[i] === -1) {
      distances[i] = 999;
    }
  }

  return distances;
}

// Lazy initialization to avoid slow module load
let _ORBIT_DISTANCE_TABLE_496: number[] | null = null;

export function getOrbitDistanceTable496(): number[] {
  if (_ORBIT_DISTANCE_TABLE_496 === null) {
    _ORBIT_DISTANCE_TABLE_496 = computeOrbitDistances496();
  }
  return _ORBIT_DISTANCE_TABLE_496;
}

// ========================================================================
// Base-496 Arithmetic
// ========================================================================

/**
 * Convert bigint to base-496 representation.
 */
export function toBase496(n: bigint): number[] {
  if (n === 0n) return [0];

  const digits: number[] = [];
  let remaining = n;

  while (remaining > 0n) {
    const digit = Number(remaining % 496n);
    digits.push(digit);
    remaining = remaining / 496n;
  }

  return digits;
}

/**
 * Convert base-496 digits back to bigint.
 */
export function fromBase496(digits: number[]): bigint {
  let result = 0n;
  let power = 1n;

  for (const digit of digits) {
    result += BigInt(digit) * power;
    power *= 496n;
  }

  return result;
}

// ========================================================================
// E₈ Factorization
// ========================================================================

/**
 * Factor a number in ℤ₄₉₆ using E₈ orbit structure.
 *
 * 496 = 16 × 31 = 2⁴ × 31
 */
export function computeFactor496(n: number): number[] {
  const mod = n % 496;

  // Check if it's a prime residue (irreducible)
  if (gcd(mod, 496) === 1) {
    return [mod];
  }

  const factors: number[] = [];
  let remaining = mod;

  // Factor out 2s (up to 2⁴)
  while (remaining % 2 === 0 && remaining > 0) {
    factors.push(2);
    remaining = remaining / 2;
  }

  // Factor out 31
  while (remaining % 31 === 0 && remaining > 0) {
    factors.push(31);
    remaining = remaining / 31;
  }

  // Try other small factors
  if (remaining > 1) {
    for (let f = 3; f <= 22; f++) {
      while (remaining % f === 0 && remaining > 0) {
        factors.push(f);
        remaining = remaining / f;
      }
    }

    if (remaining > 1) {
      factors.push(remaining);
    }
  }

  return factors.length > 0 ? factors : [mod];
}

// ========================================================================
// Hierarchical Factorization for E₈
// ========================================================================

export interface E8Layer {
  digit: number;
  factors: number[];
  orbitDistance: number;
  scale: bigint;
}

export interface E8Factorization {
  layers: E8Layer[];
}

/**
 * Hierarchical factorization in base-496 (E₈ structure).
 */
export function factorBigIntE8(n: bigint): E8Factorization {
  const digits = toBase496(n);
  const layers: E8Layer[] = [];
  const orbitDistances = getOrbitDistanceTable496();

  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    const factors = computeFactor496(digit);
    const orbitDistance = orbitDistances[digit];
    const scale = 496n ** BigInt(i);

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
 * Find optimal factorization in ℤ₄₉₆ by minimizing orbit distance.
 */
export function findOptimalFactorization496(n: number): {
  factors: number[];
  orbitDistance: number;
} {
  const mod = n % 496;
  const factors = computeFactor496(mod);
  const orbitDistances = getOrbitDistanceTable496();
  const orbitDistance = orbitDistances[mod];

  return {
    factors,
    orbitDistance,
  };
}

// ========================================================================
// Complexity Metric
// ========================================================================

/**
 * Compute complexity of factorization in E₈.
 */
export function computeComplexity496(factors: number[]): number {
  if (factors.length === 0) return 0;

  const alpha = 10;
  const beta = 2;
  const gamma = 5;

  const orbitDistances = getOrbitDistanceTable496();

  const factorCount = factors.length;
  const orbitSum = factors.reduce(
    (sum, f) => sum + orbitDistances[f % 496],
    0,
  );
  const maxOrbitDist = Math.max(
    ...factors.map((f) => orbitDistances[f % 496]),
  );

  return alpha * factorCount + beta * orbitSum + gamma * maxOrbitDist;
}

// ========================================================================
// Export Summary
// ========================================================================

export const E8_STRUCTURE = {
  dimension: 248,
  base: 496,
  primeResidueCount: 240,
  factorization: {
    496: '2⁴ × 31',
  },
  isPerfectNumber: true,
  transforms: {
    R: R_E8,
    D: D_E8,
    T: T_E8,
    M: M_E8,
  },
  getOrbitDistances: getOrbitDistanceTable496,
  primeResidues: PRIME_RESIDUES_496,
};
