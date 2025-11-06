/**
 * Group Algebras ℝ[ℤ₄] and ℝ[ℤ₃]
 *
 * This module implements the real group algebras for:
 * - ℤ₄: cyclic group of order 4 (generator r)
 * - ℤ₃: cyclic group of order 3 (generator τ)
 *
 * These algebras capture the quadrant rotation (R) and triality (D) structure.
 */

import type { Z4Element, Z3Element } from './types';
import { EPSILON } from './types';

// ============================================================================
// ℝ[ℤ₄] - Real Group Algebra of Cyclic Order-4 Group
// ============================================================================

/**
 * Create the identity element in ℝ[ℤ₄]
 *
 * r⁰ = [1, 0, 0, 0]
 */
export function z4Identity(): Z4Element {
  return { coefficients: [1, 0, 0, 0] };
}

/**
 * Create the zero element in ℝ[ℤ₄]
 */
export function z4Zero(): Z4Element {
  return { coefficients: [0, 0, 0, 0] };
}

/**
 * Create the generator r in ℝ[ℤ₄]
 *
 * r¹ = [0, 1, 0, 0]
 */
export function z4Generator(): Z4Element {
  return { coefficients: [0, 1, 0, 0] };
}

/**
 * Create r^k for k ∈ {0, 1, 2, 3}
 *
 * @param k - Power of r (will be reduced mod 4)
 */
export function z4Power(k: number): Z4Element {
  const index = ((k % 4) + 4) % 4; // Ensure positive
  const coefficients: [number, number, number, number] = [0, 0, 0, 0];
  coefficients[index] = 1;
  return { coefficients };
}

/**
 * Multiply two elements of ℝ[ℤ₄]
 *
 * Uses convolution: (Σ aᵢrⁱ)(Σ bⱼrʲ) = Σ (Σ aᵢbⱼ) r^(i+j)
 *
 * @param a - First element
 * @param b - Second element
 */
export function z4Multiply(a: Z4Element, b: Z4Element): Z4Element {
  const result: [number, number, number, number] = [0, 0, 0, 0];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const k = (i + j) % 4;
      result[k] += a.coefficients[i] * b.coefficients[j];
    }
  }

  return { coefficients: result };
}

/**
 * Add two elements of ℝ[ℤ₄]
 */
export function z4Add(a: Z4Element, b: Z4Element): Z4Element {
  return {
    coefficients: [
      a.coefficients[0] + b.coefficients[0],
      a.coefficients[1] + b.coefficients[1],
      a.coefficients[2] + b.coefficients[2],
      a.coefficients[3] + b.coefficients[3],
    ],
  };
}

/**
 * Subtract two elements of ℝ[ℤ₄]
 */
export function z4Subtract(a: Z4Element, b: Z4Element): Z4Element {
  return {
    coefficients: [
      a.coefficients[0] - b.coefficients[0],
      a.coefficients[1] - b.coefficients[1],
      a.coefficients[2] - b.coefficients[2],
      a.coefficients[3] - b.coefficients[3],
    ],
  };
}

/**
 * Scale an element of ℝ[ℤ₄] by a real scalar
 */
export function z4Scale(a: Z4Element, scalar: number): Z4Element {
  return {
    coefficients: [
      a.coefficients[0] * scalar,
      a.coefficients[1] * scalar,
      a.coefficients[2] * scalar,
      a.coefficients[3] * scalar,
    ],
  };
}

/**
 * Invert an element r^k → r^(-k) = r^(4-k)
 *
 * Note: This only works for pure powers. General inversion would require
 * checking invertibility in the group algebra.
 */
export function z4Invert(a: Z4Element): Z4Element {
  // Check if this is a pure power (only one non-zero coefficient)
  const nonZeroIndices = a.coefficients
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => Math.abs(c) >= EPSILON);

  if (nonZeroIndices.length !== 1) {
    throw new Error('Can only invert pure powers in ℤ₄');
  }

  const { i: k, c: coeff } = nonZeroIndices[0];

  if (Math.abs(coeff - 1) >= EPSILON) {
    throw new Error('Can only invert unit coefficient powers');
  }

  // r^k → r^(-k) = r^(4-k)
  return z4Power((4 - k) % 4);
}

/**
 * Extract the power k if element is r^k, otherwise return null
 */
export function extractZ4Power(a: Z4Element): number | null {
  // Check which coefficient is 1
  for (let i = 0; i < 4; i++) {
    if (Math.abs(a.coefficients[i] - 1) < EPSILON) {
      // Check that all others are 0
      const allOthersZero = a.coefficients.every(
        (c, j) => i === j || Math.abs(c) < EPSILON
      );
      if (allOthersZero) return i;
    }
  }
  return null;
}

/**
 * Test equality of two ℝ[ℤ₄] elements
 */
export function z4Equal(a: Z4Element, b: Z4Element, epsilon = EPSILON): boolean {
  return a.coefficients.every((c, i) => Math.abs(c - b.coefficients[i]) < epsilon);
}

// ============================================================================
// ℝ[ℤ₃] - Real Group Algebra of Cyclic Order-3 Group
// ============================================================================

/**
 * Create the identity element in ℝ[ℤ₃]
 *
 * τ⁰ = [1, 0, 0]
 */
export function z3Identity(): Z3Element {
  return { coefficients: [1, 0, 0] };
}

/**
 * Create the zero element in ℝ[ℤ₃]
 */
export function z3Zero(): Z3Element {
  return { coefficients: [0, 0, 0] };
}

/**
 * Create the generator τ in ℝ[ℤ₃]
 *
 * τ¹ = [0, 1, 0]
 */
export function z3Generator(): Z3Element {
  return { coefficients: [0, 1, 0] };
}

/**
 * Create τ^k for k ∈ {0, 1, 2}
 *
 * @param k - Power of τ (will be reduced mod 3)
 */
export function z3Power(k: number): Z3Element {
  const index = ((k % 3) + 3) % 3; // Ensure positive
  const coefficients: [number, number, number] = [0, 0, 0];
  coefficients[index] = 1;
  return { coefficients };
}

/**
 * Multiply two elements of ℝ[ℤ₃]
 *
 * Uses convolution: (Σ aᵢτⁱ)(Σ bⱼτʲ) = Σ (Σ aᵢbⱼ) τ^(i+j)
 *
 * @param a - First element
 * @param b - Second element
 */
export function z3Multiply(a: Z3Element, b: Z3Element): Z3Element {
  const result: [number, number, number] = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const k = (i + j) % 3;
      result[k] += a.coefficients[i] * b.coefficients[j];
    }
  }

  return { coefficients: result };
}

/**
 * Add two elements of ℝ[ℤ₃]
 */
export function z3Add(a: Z3Element, b: Z3Element): Z3Element {
  return {
    coefficients: [
      a.coefficients[0] + b.coefficients[0],
      a.coefficients[1] + b.coefficients[1],
      a.coefficients[2] + b.coefficients[2],
    ],
  };
}

/**
 * Subtract two elements of ℝ[ℤ₃]
 */
export function z3Subtract(a: Z3Element, b: Z3Element): Z3Element {
  return {
    coefficients: [
      a.coefficients[0] - b.coefficients[0],
      a.coefficients[1] - b.coefficients[1],
      a.coefficients[2] - b.coefficients[2],
    ],
  };
}

/**
 * Scale an element of ℝ[ℤ₃] by a real scalar
 */
export function z3Scale(a: Z3Element, scalar: number): Z3Element {
  return {
    coefficients: [
      a.coefficients[0] * scalar,
      a.coefficients[1] * scalar,
      a.coefficients[2] * scalar,
    ],
  };
}

/**
 * Invert an element τ^k → τ^(-k) = τ^(3-k)
 *
 * Note: This only works for pure powers.
 */
export function z3Invert(a: Z3Element): Z3Element {
  // Check if this is a pure power (only one non-zero coefficient)
  const nonZeroIndices = a.coefficients
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => Math.abs(c) >= EPSILON);

  if (nonZeroIndices.length !== 1) {
    throw new Error('Can only invert pure powers in ℤ₃');
  }

  const { i: k, c: coeff } = nonZeroIndices[0];

  if (Math.abs(coeff - 1) >= EPSILON) {
    throw new Error('Can only invert unit coefficient powers');
  }

  // τ^k → τ^(-k) = τ^(3-k)
  return z3Power((3 - k) % 3);
}

/**
 * Extract the power k if element is τ^k, otherwise return null
 */
export function extractZ3Power(a: Z3Element): number | null {
  // Check which coefficient is 1
  for (let i = 0; i < 3; i++) {
    if (Math.abs(a.coefficients[i] - 1) < EPSILON) {
      // Check that all others are 0
      const allOthersZero = a.coefficients.every(
        (c, j) => i === j || Math.abs(c) < EPSILON
      );
      if (allOthersZero) return i;
    }
  }
  return null;
}

/**
 * Test equality of two ℝ[ℤ₃] elements
 */
export function z3Equal(a: Z3Element, b: Z3Element, epsilon = EPSILON): boolean {
  return a.coefficients.every((c, i) => Math.abs(c - b.coefficients[i]) < epsilon);
}
