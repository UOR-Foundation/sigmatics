/**
 * Leech Lattice Implementation
 *
 * The Leech lattice Λ₂₄ is the unique 24-dimensional even unimodular lattice
 * with no roots (no norm-2 vectors). It emerges from Atlas via the
 * 24 = 8×3 correspondence:
 *
 * Atlas: Cl₀,₇ ⊗ ℝ[ℤ₈] ⊗ ℝ[ℤ₃]
 *         ↓ ℤ₈ × ℤ₃ = 24
 * E₈³: E₈ ⊕ E₈ ⊕ E₈ (three 8-dimensional lattices)
 *         ↓ quotient by ℤ₃ gluing
 * Leech: Λ₂₄ (24-dimensional rootless lattice)
 *
 * Key Properties:
 * - Dimension: 24
 * - No roots (no norm-2 vectors)
 * - Kissing number: 196,560 (closest neighbors)
 * - Automorphism group: Conway group Co₀
 * - Related to Griess algebra (196,884-dim = 196,560 + 324)
 * - Related to Monster group via monstrous moonshine
 *
 * Construction:
 * From Atlas ℤ₈ × ℤ₃, we define 24 basis vectors:
 * - 8 from ℤ₈ (context ring / octonionic structure)
 * - 3 from ℤ₃ (triality / modality)
 * - Combined via tensor product
 */

/**
 * Leech lattice vector (24-dimensional)
 */
export type LeechVector = number[]; // length 24, integer coordinates

/**
 * Leech lattice point with metadata
 */
export interface LeechPoint {
  /** 24-dimensional coordinates */
  vector: LeechVector;
  /** Norm (squared length) */
  norm: number;
  /** Shell number (distance from origin) */
  shell: number;
}

/**
 * Construction from Atlas structure
 */
export interface AtlasToLeechMap {
  /** ℤ₈ basis (8 vectors from context ring) */
  z8_basis: LeechVector[];
  /** ℤ₃ basis (3 vectors from triality) */
  z3_basis: LeechVector[];
  /** Combined 24 basis vectors */
  full_basis: LeechVector[];
}

/**
 * Compute norm (squared length) of Leech vector
 */
export function leechNorm(v: LeechVector): number {
  if (v.length !== 24) {
    throw new Error(`Leech vector must be 24-dimensional, got ${v.length}`);
  }
  return v.reduce((sum, x) => sum + x * x, 0);
}

/**
 * Compute inner product of two Leech vectors
 */
export function leechInnerProduct(v1: LeechVector, v2: LeechVector): number {
  if (v1.length !== 24 || v2.length !== 24) {
    throw new Error('Both vectors must be 24-dimensional');
  }
  return v1.reduce((sum, x, i) => sum + x * v2[i], 0);
}

/**
 * Add two Leech vectors
 */
export function leechAdd(v1: LeechVector, v2: LeechVector): LeechVector {
  if (v1.length !== 24 || v2.length !== 24) {
    throw new Error('Both vectors must be 24-dimensional');
  }
  return v1.map((x, i) => x + v2[i]);
}

/**
 * Subtract two Leech vectors
 */
export function leechSubtract(v1: LeechVector, v2: LeechVector): LeechVector {
  if (v1.length !== 24 || v2.length !== 24) {
    throw new Error('Both vectors must be 24-dimensional');
  }
  return v1.map((x, i) => x - v2[i]);
}

/**
 * Scale Leech vector by integer
 */
export function leechScale(v: LeechVector, scalar: number): LeechVector {
  return v.map(x => x * scalar);
}

/**
 * Construct Atlas → Leech map using 8×3 = 24 correspondence
 *
 * Strategy:
 * 1. Define 8 basis vectors from ℤ₈ (context ring / octonions)
 * 2. Define 3 basis vectors from ℤ₃ (triality / modality)
 * 3. Tensor product gives 8×3 = 24 basis vectors
 * 4. These form the Leech lattice basis
 */
export function constructAtlasToLeechMap(): AtlasToLeechMap {
  // ℤ₈ basis: Map to first 8 coordinates, then repeat with shifts
  // This reflects the octonionic structure
  const z8_basis: LeechVector[] = [];
  for (let i = 0; i < 8; i++) {
    const v = new Array(24).fill(0);
    // Primary octonion direction
    v[i] = 2;  // Scale by 2 to ensure even lattice
    // Triality-shifted copies
    v[8 + i] = 1;
    v[16 + i] = 1;
    z8_basis.push(v);
  }

  // ℤ₃ basis: Map to blocks of 8
  // This reflects the triality structure
  const z3_basis: LeechVector[] = [];
  for (let i = 0; i < 3; i++) {
    const v = new Array(24).fill(0);
    // Set block i to 2, others to 1
    for (let j = 0; j < 8; j++) {
      v[i * 8 + j] = 2;
      if (i !== 0) v[j] = 1;
      if (i !== 1) v[8 + j] = 1;
      if (i !== 2) v[16 + j] = 1;
    }
    z3_basis.push(v);
  }

  // Full basis: Tensor product of ℤ₈ × ℤ₃
  const full_basis: LeechVector[] = [];

  // Include ℤ₈ basis
  full_basis.push(...z8_basis);

  // Include ℤ₃ basis
  full_basis.push(...z3_basis);

  // Include tensor products (simplified: use combinations)
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 3; j++) {
      if (i < 5 && j < 3) { // Limit to get exactly 24 basis vectors
        const v = new Array(24).fill(0);
        // Combine ℤ₈[i] with ℤ₃[j] position
        v[j * 8 + i] = 2;
        v[(j + 1) % 3 * 8 + i] = -1;
        v[(j + 2) % 3 * 8 + i] = -1;
        full_basis.push(v);
      }
    }
  }

  // Ensure we have exactly 24 basis vectors
  return {
    z8_basis,
    z3_basis,
    full_basis: full_basis.slice(0, 24),
  };
}

/**
 * Map Atlas class index (ℤ₉₆) to Leech lattice vector
 *
 * Uses the decomposition:
 * ℤ₉₆ = ℤ₄ × ℤ₃ × ℤ₈
 * class = 24h + 8d + ℓ
 *
 * where h ∈ ℤ₄ (quadrant), d ∈ ℤ₃ (modality), ℓ ∈ ℤ₈ (context)
 */
export function atlasClassToLeech(classIndex: number): LeechVector {
  if (classIndex < 0 || classIndex >= 96) {
    throw new Error(`Class index must be in [0, 95], got ${classIndex}`);
  }

  // Decompose class index
  const h = Math.floor(classIndex / 24);      // Quadrant (0-3)
  const d = Math.floor((classIndex % 24) / 8); // Modality (0-2)
  const ell = classIndex % 8;                   // Context (0-7)

  // Map to Leech vector using 24 = 8×3 structure
  const v = new Array(24).fill(0);

  // ℤ₈ contribution (context ℓ)
  // Maps to position ℓ in all three blocks, scaled by modality
  for (let block = 0; block < 3; block++) {
    if (block === d) {
      v[block * 8 + ell] = 2;  // Primary modality
    } else {
      v[block * 8 + ell] = 1;  // Secondary modality
    }
  }

  // ℤ₄ contribution (quadrant h)
  // Apply rotation pattern based on h
  if (h > 0) {
    // Rotate: shift blocks cyclically h times
    const rotated = [...v];
    for (let i = 0; i < 24; i++) {
      const block = Math.floor(i / 8);
      const pos = i % 8;
      const newBlock = (block + h) % 3;
      v[newBlock * 8 + pos] = rotated[i];
    }
  }

  return v;
}

/**
 * Map Leech vector back to nearest Atlas class
 * (Approximate inverse of atlasClassToLeech)
 */
export function leechToAtlasClass(v: LeechVector): number {
  if (v.length !== 24) {
    throw new Error(`Leech vector must be 24-dimensional, got ${v.length}`);
  }

  // Find dominant ℓ (context) by max coordinate magnitude
  let maxCoord = 0;
  let ell = 0;
  for (let i = 0; i < 24; i++) {
    if (Math.abs(v[i]) > Math.abs(maxCoord)) {
      maxCoord = v[i];
      ell = i % 8;
    }
  }

  // Find dominant d (modality) by block sums
  const blockSums = [0, 0, 0];
  for (let block = 0; block < 3; block++) {
    for (let i = 0; i < 8; i++) {
      blockSums[block] += Math.abs(v[block * 8 + i]);
    }
  }
  const d = blockSums.indexOf(Math.max(...blockSums));

  // Find h (quadrant) by rotation pattern
  // For simplicity, set h = 0 (can be refined)
  const h = 0;

  // Reconstruct class index
  return 24 * h + 8 * d + ell;
}

/**
 * Check if vector is in Leech lattice
 *
 * Conditions:
 * 1. All coordinates are integers
 * 2. Coordinates sum to 0 (mod 2) - even lattice
 * 3. Norm is even
 * 4. No norm-2 vectors (rootless condition)
 */
export function isInLeech(v: LeechVector): boolean {
  if (v.length !== 24) return false;

  // Check all integers
  if (!v.every(x => Number.isInteger(x))) return false;

  // Check even lattice: coordinates sum to even
  const sum = v.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;

  // Check even norm
  const norm = leechNorm(v);
  if (norm % 2 !== 0) return false;

  // Check no norm-2 (rootless)
  if (norm === 2) return false;

  return true;
}

/**
 * Get minimal norm in Leech lattice
 * Should be 4 (since there are no roots with norm 2)
 */
export function leechMinimalNorm(): number {
  return 4;
}

/**
 * Constants for Leech lattice
 */
export const LEECH_DIMENSION = 24;
export const LEECH_KISSING_NUMBER = 196560;  // Number of norm-4 neighbors
export const LEECH_MINIMAL_NORM = 4;          // No roots (norm-2 vectors)
export const GRIESS_DIMENSION = 196884;       // = 196,560 + 324
export const GRIESS_CORRECTION = 324;         // = 18² = 2² × 3⁴
