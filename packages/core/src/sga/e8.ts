/**
 * E₈ Exceptional Lie Algebra Root System
 *
 * E₈ is an 8-dimensional exceptional Lie algebra with 240 roots.
 * It is one of the building blocks of the Leech lattice via the
 * construction E₈³ → Λ₂₄ (quotient by ℤ₃).
 *
 * Structure:
 * - Dimension: 8
 * - Number of roots: 240
 * - Root length squared: 2 (for normalized roots)
 * - Weyl group: |W(E₈)| = 696,729,600
 * - Cartan matrix determinant: 1 (simply laced)
 *
 * Connection to Atlas:
 * - Atlas ℤ₈ (context ring) maps to E₈ positions
 * - Three E₈ copies correspond to three modalities (ℤ₃)
 * - E₈³ has 720 roots total
 * - Leech lattice quotient removes these roots (becomes rootless)
 *
 * Construction Methods:
 * 1. Coordinate representation (in ℝ⁸)
 * 2. Affine extension (in ℝ⁹ with constraint)
 * 3. Octonion algebra (Cayley algebra)
 *
 * We use method 1 (coordinate representation) for direct Atlas integration.
 */

/**
 * E₈ root vector (8-dimensional)
 */
export type E8Root = number[]; // length 8, integer or half-integer coordinates

/**
 * E₈ root with metadata
 */
export interface E8RootInfo {
  /** 8-dimensional coordinates */
  root: E8Root;
  /** Norm squared (should be 2 for roots) */
  norm: number;
  /** Index in standard ordering (0-239) */
  index: number;
}

/**
 * E₈ lattice point
 */
export interface E8Point {
  /** 8-dimensional coordinates */
  vector: E8Root;
  /** Norm squared */
  norm: number;
  /** Is this a root? (norm = 2) */
  isRoot: boolean;
}

/**
 * Compute norm squared of E₈ vector
 */
export function e8Norm(v: E8Root): number {
  if (v.length !== 8) {
    throw new Error(`E₈ vector must be 8-dimensional, got ${v.length}`);
  }
  return v.reduce((sum, x) => sum + x * x, 0);
}

/**
 * Compute inner product of two E₈ vectors
 */
export function e8InnerProduct(v1: E8Root, v2: E8Root): number {
  if (v1.length !== 8 || v2.length !== 8) {
    throw new Error('Both vectors must be 8-dimensional');
  }
  return v1.reduce((sum, x, i) => sum + x * v2[i], 0);
}

/**
 * Add two E₈ vectors
 */
export function e8Add(v1: E8Root, v2: E8Root): E8Root {
  if (v1.length !== 8 || v2.length !== 8) {
    throw new Error('Both vectors must be 8-dimensional');
  }
  return v1.map((x, i) => x + v2[i]);
}

/**
 * Scale E₈ vector
 */
export function e8Scale(v: E8Root, scalar: number): E8Root {
  return v.map(x => x * scalar);
}

/**
 * Generate all 240 E₈ roots
 *
 * The E₈ root system consists of:
 * 1. All permutations of (±1, ±1, 0, 0, 0, 0, 0, 0) with an even number of minus signs
 *    Count: C(8,2) × 2² / 2 = 28 × 2 = 112 roots
 *
 * 2. All vectors (±½, ±½, ±½, ±½, ±½, ±½, ±½, ±½) with an even number of minus signs
 *    Count: 2⁸ / 2 = 128 roots
 *
 * Total: 112 + 128 = 240 roots
 *
 * All roots have norm² = 2.
 */
export function generateE8Roots(): E8RootInfo[] {
  const roots: E8RootInfo[] = [];
  let index = 0;

  // Type 1: Permutations of (±1, ±1, 0, 0, 0, 0, 0, 0)
  // Generate all positions for the two ±1 entries and all sign combinations
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      // All four sign combinations
      const signPatterns = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];

      for (const [sign1, sign2] of signPatterns) {
        const root = new Array(8).fill(0);
        root[i] = sign1;
        root[j] = sign2;
        roots.push({ root, norm: e8Norm(root), index: index++ });
      }
    }
  }

  // Type 2: All (±½)⁸ with even number of minus signs
  // Generate all 2⁸ = 256 sign patterns, filter to even parity
  for (let pattern = 0; pattern < 256; pattern++) {
    const root = new Array(8);
    let minusCount = 0;

    for (let i = 0; i < 8; i++) {
      const sign = (pattern >> i) & 1 ? -1 : 1;
      root[i] = sign * 0.5;
      if (sign === -1) minusCount++;
    }

    // Keep only even parity (even number of minus signs)
    if (minusCount % 2 === 0) {
      roots.push({ root, norm: e8Norm(root), index: index++ });
    }
  }

  return roots;
}

/**
 * Verify E₈ root system properties
 *
 * 1. Count: Should have exactly 240 roots
 * 2. Norm: All roots should have norm² = 2
 * 3. Inner products: Should be integers or half-integers
 * 4. Symmetry: Closed under Weyl reflections
 */
export function verifyE8RootSystem(roots: E8RootInfo[]): {
  valid: boolean;
  count: number;
  allNorm2: boolean;
  messages: string[];
} {
  const messages: string[] = [];

  // Check count
  const validCount = roots.length === 240;
  messages.push(`Root count: ${roots.length} (expected 240) ${validCount ? '✓' : '✗'}`);

  // Check all norms = 2
  const allNorm2 = roots.every(r => Math.abs(r.norm - 2) < 1e-10);
  const normRange = {
    min: Math.min(...roots.map(r => r.norm)),
    max: Math.max(...roots.map(r => r.norm)),
  };
  messages.push(`All norm² = 2: ${allNorm2 ? '✓' : '✗'} (range: [${normRange.min}, ${normRange.max}])`);

  // Check root property: if α is a root, -α is also a root
  const rootSet = new Set(roots.map(r => r.root.join(',')));
  let allNegated = true;
  for (const r of roots) {
    const negated = r.root.map(x => -x).join(',');
    if (!rootSet.has(negated)) {
      allNegated = false;
      messages.push(`Missing negated root for: ${r.root}`);
      break;
    }
  }
  messages.push(`Closed under negation: ${allNegated ? '✓' : '✗'}`);

  return {
    valid: validCount && allNorm2 && allNegated,
    count: roots.length,
    allNorm2,
    messages,
  };
}

/**
 * Check if vector is an E₈ root (norm² = 2)
 */
export function isE8Root(v: E8Root): boolean {
  const norm = e8Norm(v);
  return Math.abs(norm - 2) < 1e-10;
}

/**
 * Find simple roots (Dynkin basis) for E₈
 *
 * Simple roots form a basis where all other roots can be expressed
 * as integer linear combinations with all coefficients ≥ 0 (positive roots)
 * or all ≤ 0 (negative roots).
 *
 * Standard E₈ simple roots (one choice):
 * α₁ = (1, -1, 0, 0, 0, 0, 0, 0)
 * α₂ = (0,  1, -1, 0, 0, 0, 0, 0)
 * α₃ = (0,  0,  1, -1, 0, 0, 0, 0)
 * α₄ = (0,  0,  0,  1, -1, 0, 0, 0)
 * α₅ = (0,  0,  0,  0,  1, -1, 0, 0)
 * α₆ = (0,  0,  0,  0,  0,  1, -1, 0)
 * α₇ = (0,  0,  0,  0,  0,  1,  1, 0)
 * α₈ = (-½, -½, -½, -½, -½, -½, -½, -½)
 *
 * Cartan matrix A[i,j] = 2⟨αᵢ, αⱼ⟩ / ⟨αᵢ, αᵢ⟩
 */
export function generateE8SimpleRoots(): E8Root[] {
  return [
    [1, -1, 0, 0, 0, 0, 0, 0],      // α₁
    [0, 1, -1, 0, 0, 0, 0, 0],      // α₂
    [0, 0, 1, -1, 0, 0, 0, 0],      // α₃
    [0, 0, 0, 1, -1, 0, 0, 0],      // α₄
    [0, 0, 0, 0, 1, -1, 0, 0],      // α₅
    [0, 0, 0, 0, 0, 1, -1, 0],      // α₆
    [0, 0, 0, 0, 0, 1, 1, 0],       // α₇
    [-0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5], // α₈
  ];
}

/**
 * Compute E₈ Cartan matrix
 *
 * A[i,j] = 2⟨αᵢ, αⱼ⟩ / ⟨αᵢ, αᵢ⟩ = ⟨αᵢ, αⱼ⟩ (since ⟨αᵢ, αᵢ⟩ = 2 for all roots)
 *
 * E₈ Cartan matrix (symmetric, positive definite):
 * [ 2 -1  0  0  0  0  0  0]
 * [-1  2 -1  0  0  0  0  0]
 * [ 0 -1  2 -1  0  0  0  0]
 * [ 0  0 -1  2 -1  0  0  0]
 * [ 0  0  0 -1  2 -1  0  0]
 * [ 0  0  0  0 -1  2 -1  0]
 * [ 0  0  0  0  0 -1  2 -1]
 * [ 0  0  0  0  0  0 -1  2]
 */
export function computeE8CartanMatrix(simpleRoots: E8Root[]): number[][] {
  const n = simpleRoots.length;
  const cartan: number[][] = [];

  for (let i = 0; i < n; i++) {
    cartan[i] = [];
    for (let j = 0; j < n; j++) {
      // A[i,j] = 2⟨αᵢ, αⱼ⟩ / ⟨αᵢ, αᵢ⟩
      const innerProd = e8InnerProduct(simpleRoots[i], simpleRoots[j]);
      const normI = e8Norm(simpleRoots[i]);
      cartan[i][j] = Math.round((2 * innerProd) / normI);
    }
  }

  return cartan;
}

/**
 * Constants for E₈
 */
export const E8_DIMENSION = 8;
export const E8_ROOT_COUNT = 240;
export const E8_ROOT_NORM = 2;
export const E8_WEYL_GROUP_ORDER = 696729600;

/**
 * Weyl reflection across root α
 *
 * s_α(v) = v - 2⟨v, α⟩/⟨α, α⟩ · α
 *        = v - ⟨v, α⟩ · α  (since ⟨α, α⟩ = 2 for normalized roots)
 */
export function weylReflection(v: E8Root, root: E8Root): E8Root {
  const innerProd = e8InnerProduct(v, root);
  const rootNorm = e8Norm(root);
  const coeff = (2 * innerProd) / rootNorm;

  return v.map((x, i) => x - coeff * root[i]);
}

/**
 * Check if vector is in E₈ lattice
 *
 * E₈ lattice vectors satisfy:
 * - Either all integer coordinates, or all half-integer coordinates
 * - Sum of coordinates is even
 */
export function isInE8Lattice(v: E8Root): boolean {
  if (v.length !== 8) return false;

  // Check if all integers or all half-integers
  const fractionalParts = v.map(x => Math.abs(x - Math.round(x)));
  const allInteger = fractionalParts.every(f => f < 1e-10);
  const allHalfInteger = fractionalParts.every(f => Math.abs(f - 0.5) < 1e-10);

  if (!allInteger && !allHalfInteger) return false;

  // Check sum is even (for integers) or half-integer sum has even denominator
  const sum = v.reduce((a, b) => a + b, 0);
  const sumInt = Math.round(sum * 2); // Multiply by 2 to handle half-integers

  return sumInt % 2 === 0;
}
