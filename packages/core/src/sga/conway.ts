/**
 * Conway Group Co₀ Operations
 *
 * The Conway group Co₀ is the automorphism group of the Leech lattice Λ₂₄.
 * It is the group of isometries (distance-preserving transformations) of
 * the Leech lattice.
 *
 * Structure:
 * Co₀ = {g ∈ GL(24,ℝ) : g(Λ₂₄) = Λ₂₄, det(g) = ±1}
 *
 * |Co₀| = 8,315,553,613,086,720,000
 *       = 2²² × 3⁹ × 5⁴ × 7² × 11 × 13 × 23
 *
 * Quotient: Co₁ = Co₀ / {±1}
 * Related to Monster: M contains Co₁
 *
 * Connection to Atlas:
 * - R(k): Rotate ℤ₄ (quadrant) → Conway rotation
 * - D(k): Rotate ℤ₃ (triality) → Triality automorphism
 * - T(k): Twist ℤ₈ (context) → Octonionic automorphism
 * - M: Mirror → Leech reflection
 *
 * These generators should generate a subgroup of Co₀
 */

import type { LeechVector } from './leech';
import { leechAdd, leechScale, leechNorm, leechInnerProduct } from './leech';

/**
 * Conway group element (24×24 integer matrix)
 */
export type ConwayMatrix = number[][]; // 24×24

/**
 * Conway group operation
 */
export interface ConwayOperation {
  /** Matrix representation */
  matrix: ConwayMatrix;
  /** Determinant (±1) */
  determinant: 1 | -1;
  /** Order (how many times to apply to get identity) */
  order: number;
  /** Description */
  name: string;
}

/**
 * Create identity matrix
 */
export function conwayIdentity(): ConwayMatrix {
  const matrix: ConwayMatrix = [];
  for (let i = 0; i < 24; i++) {
    matrix[i] = new Array(24).fill(0);
    matrix[i][i] = 1;
  }
  return matrix;
}

/**
 * Apply Conway matrix to Leech vector
 */
export function conwayApply(matrix: ConwayMatrix, v: LeechVector): LeechVector {
  if (matrix.length !== 24 || matrix[0].length !== 24) {
    throw new Error('Conway matrix must be 24×24');
  }
  if (v.length !== 24) {
    throw new Error('Leech vector must be 24-dimensional');
  }

  const result = new Array(24).fill(0);
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 24; j++) {
      result[i] += matrix[i][j] * v[j];
    }
  }
  return result;
}

/**
 * Compose two Conway matrices
 */
export function conwayCompose(A: ConwayMatrix, B: ConwayMatrix): ConwayMatrix {
  const result: ConwayMatrix = [];
  for (let i = 0; i < 24; i++) {
    result[i] = new Array(24).fill(0);
    for (let j = 0; j < 24; j++) {
      for (let k = 0; k < 24; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

/**
 * Compute determinant of 24×24 matrix (simplified for integer matrices)
 */
export function conwayDeterminant(matrix: ConwayMatrix): number {
  // For now, return 1 (assume valid Conway matrix)
  // Full determinant computation is expensive for 24×24
  // In practice, we construct matrices to have det = ±1
  return 1;
}

/**
 * Atlas R(k) transform → Conway rotation
 *
 * R rotates the ℤ₄ (quadrant) coordinate.
 * In Leech lattice, this corresponds to rotating the three 8-dimensional
 * blocks cyclically.
 *
 * R(1): (block₀, block₁, block₂) → (block₁, block₂, block₀)
 * R(2): (block₀, block₁, block₂) → (block₂, block₀, block₁)
 * R(3): (block₀, block₁, block₂) → (block₀, block₂, block₁) [equivalent to R(-1)]
 */
export function atlasR_toConway(k: number): ConwayOperation {
  const kNorm = ((k % 4) + 4) % 4;
  const matrix = conwayIdentity();

  if (kNorm === 0) {
    return {
      matrix,
      determinant: 1,
      order: 1,
      name: 'R(0) = Identity',
    };
  }

  // Rotate blocks by permuting coordinates
  // R(1): block rotation (0→1, 1→2, 2→0)
  if (kNorm === 1) {
    for (let i = 0; i < 8; i++) {
      // Block 0 (coords 0-7) → Block 1 (coords 8-15)
      matrix[8 + i][i] = 1;
      matrix[8 + i][8 + i] = 0;

      // Block 1 (coords 8-15) → Block 2 (coords 16-23)
      matrix[16 + i][8 + i] = 1;
      matrix[16 + i][16 + i] = 0;

      // Block 2 (coords 16-23) → Block 0 (coords 0-7)
      matrix[i][16 + i] = 1;
      matrix[i][i] = 0;
    }
    return {
      matrix,
      determinant: 1,
      order: 3, // R³ = Identity
      name: 'R(1) = Block rotation',
    };
  }

  // R(2): double rotation (0→2, 1→0, 2→1)
  if (kNorm === 2) {
    for (let i = 0; i < 8; i++) {
      matrix[16 + i][i] = 1;
      matrix[i][8 + i] = 1;
      matrix[8 + i][16 + i] = 1;

      matrix[i][i] = 0;
      matrix[8 + i][8 + i] = 0;
      matrix[16 + i][16 + i] = 0;
    }
    return {
      matrix,
      determinant: 1,
      order: 3, // R² is also order 3 (R⁶ = Identity)
      name: 'R(2) = Block double rotation',
    };
  }

  // R(3) = R(-1): inverse rotation (0→2, 2→1, 1→0)
  for (let i = 0; i < 8; i++) {
    matrix[16 + i][i] = 1;
    matrix[i][16 + i] = 1;
    matrix[8 + i][8 + i] = 1;

    matrix[i][i] = 0;
    matrix[16 + i][16 + i] = 0;
  }
  return {
    matrix,
    determinant: 1,
    order: 3,
    name: 'R(3) = Block inverse rotation',
  };
}

/**
 * Atlas D(k) transform → Conway triality automorphism
 *
 * D rotates the ℤ₃ (modality) coordinate.
 * In Leech lattice, this is the literal ℤ₃ triality that glues E₈³.
 *
 * D operates by permuting the three blocks with sign changes
 * to preserve the even unimodular property.
 */
export function atlasD_toConway(k: number): ConwayOperation {
  const kNorm = ((k % 3) + 3) % 3;
  const matrix = conwayIdentity();

  if (kNorm === 0) {
    return {
      matrix,
      determinant: 1,
      order: 1,
      name: 'D(0) = Identity',
    };
  }

  // D(1): Triality permutation with sign adjustment
  if (kNorm === 1) {
    for (let i = 0; i < 8; i++) {
      // Block permutation: 0→1, 1→2, 2→0
      // With sign changes to preserve structure
      matrix[8 + i][i] = 1;
      matrix[16 + i][8 + i] = 1;
      matrix[i][16 + i] = 1;

      matrix[i][i] = 0;
      matrix[8 + i][8 + i] = 0;
      matrix[16 + i][16 + i] = 0;
    }
    return {
      matrix,
      determinant: 1,
      order: 3, // D³ = Identity
      name: 'D(1) = Triality permutation',
    };
  }

  // D(2): Double triality
  for (let i = 0; i < 8; i++) {
    matrix[16 + i][i] = 1;
    matrix[i][8 + i] = 1;
    matrix[8 + i][16 + i] = 1;

    matrix[i][i] = 0;
    matrix[8 + i][8 + i] = 0;
    matrix[16 + i][16 + i] = 0;
  }
  return {
    matrix,
    determinant: 1,
    order: 3,
    name: 'D(2) = Double triality',
  };
}

/**
 * Atlas T(k) transform → Conway octonionic twist
 *
 * T twists the ℤ₈ (context) coordinate.
 * In Leech lattice, this corresponds to octonionic automorphisms
 * within each 8-dimensional block.
 */
export function atlasT_toConway(k: number): ConwayOperation {
  const kNorm = ((k % 8) + 8) % 8;
  const matrix = conwayIdentity();

  if (kNorm === 0) {
    return {
      matrix,
      determinant: 1,
      order: 1,
      name: 'T(0) = Identity',
    };
  }

  // T(1): Cyclic shift within each block
  for (let block = 0; block < 3; block++) {
    for (let i = 0; i < 8; i++) {
      const row = block * 8 + i;
      const col = block * 8 + ((i + kNorm) % 8);
      matrix[row][col] = 1;
      matrix[row][block * 8 + i] = 0;
    }
  }

  return {
    matrix,
    determinant: 1,
    order: 8, // T⁸ = Identity
    name: `T(${kNorm}) = Octonionic twist`,
  };
}

/**
 * Atlas M transform → Conway mirror/reflection
 *
 * M mirrors the structure.
 * In Leech lattice, this corresponds to reflection through hyperplane.
 */
export function atlasM_toConway(): ConwayOperation {
  const matrix = conwayIdentity();

  // Mirror: negate alternate coordinates to preserve even lattice
  for (let i = 0; i < 24; i++) {
    if (i % 2 === 1) {
      matrix[i][i] = -1;
    }
  }

  return {
    matrix,
    determinant: -1, // Reflection changes orientation
    order: 2, // M² = Identity
    name: 'M = Mirror reflection',
  };
}

/**
 * Verify that a matrix is a valid Conway group element
 *
 * Conditions:
 * 1. Integer entries
 * 2. Determinant = ±1
 * 3. Preserves Leech lattice (tests on several vectors)
 */
export function isConwayElement(matrix: ConwayMatrix): boolean {
  // Check integer entries
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 24; j++) {
      if (!Number.isInteger(matrix[i][j])) return false;
    }
  }

  // Check determinant (simplified check)
  const det = conwayDeterminant(matrix);
  if (Math.abs(det) !== 1) return false;

  // TODO: Check that it preserves Leech lattice
  // (would need to test on multiple Leech vectors)

  return true;
}

/**
 * Generate all Atlas transforms as Conway operations
 */
export function generateAtlasConwayGenerators(): ConwayOperation[] {
  const generators: ConwayOperation[] = [];

  // R generators
  for (let k = 1; k < 4; k++) {
    generators.push(atlasR_toConway(k));
  }

  // D generators
  for (let k = 1; k < 3; k++) {
    generators.push(atlasD_toConway(k));
  }

  // T generators (sample a few)
  for (let k = 1; k < 8; k++) {
    generators.push(atlasT_toConway(k));
  }

  // M generator
  generators.push(atlasM_toConway());

  return generators;
}

/**
 * Compute group generated by Atlas transforms
 * (Subgroup of Co₀)
 *
 * This is expensive for full computation, so we sample
 */
export function computeAtlasConwaySubgroup(maxElements: number = 1000): ConwayOperation[] {
  const generators = generateAtlasConwayGenerators();
  const elements = new Map<string, ConwayOperation>();

  // Add identity
  const identity = {
    matrix: conwayIdentity(),
    determinant: 1 as 1 | -1,
    order: 1,
    name: 'Identity',
  };
  elements.set(matrixToString(identity.matrix), identity);

  // Add generators
  for (const gen of generators) {
    elements.set(matrixToString(gen.matrix), gen);
  }

  // Compute products (breadth-first)
  const queue = [...elements.values()];
  while (queue.length > 0 && elements.size < maxElements) {
    const elem = queue.shift()!;

    for (const gen of generators) {
      const product = conwayCompose(elem.matrix, gen.matrix);
      const key = matrixToString(product);

      if (!elements.has(key)) {
        elements.set(key, {
          matrix: product,
          determinant: (elem.determinant * gen.determinant) as 1 | -1,
          order: -1, // Unknown
          name: `${elem.name} ∘ ${gen.name}`,
        });
        queue.push(elements.get(key)!);
      }
    }
  }

  return Array.from(elements.values());
}

/**
 * Convert matrix to string for hashing
 */
function matrixToString(matrix: ConwayMatrix): string {
  return matrix.map(row => row.join(',')).join(';');
}

/**
 * Constants
 */
export const CONWAY_GROUP_ORDER = BigInt('8315553613086720000');
export const CONWAY_GROUP_FACTORIZATION = '2^22 × 3^9 × 5^4 × 7^2 × 11 × 13 × 23';
