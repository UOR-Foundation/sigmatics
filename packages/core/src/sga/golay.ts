/**
 * Binary Golay Code 𝓖₂₄
 *
 * The extended binary Golay code is a [24,12,8] error-correcting code:
 * - 24 bits (codeword length)
 * - 12 information bits (dimension)
 * - Minimum distance 8 (any two codewords differ in ≥8 positions)
 *
 * Properties:
 * - 4,096 = 2¹² codewords
 * - Self-dual (C = C⊥)
 * - Weight distribution: 0 (1 codeword), 8 (759), 12 (2,576), 16 (759), 24 (1)
 *
 * Used to construct the 196,560 minimal vectors of the Leech lattice.
 *
 * Construction: Uses generator matrix in standard form [I₁₂ | A]
 * where I₁₂ is the 12×12 identity and A is a 12×12 circulant matrix.
 */

/**
 * Binary vector (24 bits)
 */
export type GolayCodeword = number[]; // length 24, each element 0 or 1

/**
 * Information vector (12 bits)
 */
export type GolayInfo = number[]; // length 12, each element 0 or 1

/**
 * Generator matrix for extended binary Golay code
 *
 * Standard form: G = [I₁₂ | P]
 * where I₁₂ is 12×12 identity and P is the 12×12 parity check matrix
 *
 * The parity matrix P is based on the complement of the adjacency matrix
 * of the icosahedron. This is the standard construction that ensures
 * the [24,12,8] parameters.
 */
function getGeneratorMatrix(): number[][] {
  // Parity check matrix P (12×12)
  // Each row given in binary (reading left to right)
  const P = [
    [1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1],  // Row 0
    [1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0],  // Row 1
    [1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1],  // Row 2
    [1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0],  // Row 3
    [1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1],  // Row 4
    [0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1],  // Row 5
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1],  // Row 6
    [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0],  // Row 7
    [0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0],  // Row 8
    [0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0],  // Row 9
    [1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1],  // Row 10
    [0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1],  // Row 11
  ];

  // Build 12×24 generator matrix [I₁₂ | P]
  const G: number[][] = [];

  for (let i = 0; i < 12; i++) {
    const row: number[] = new Array(24).fill(0);

    // Identity part (first 12 columns)
    row[i] = 1;

    // Parity part (last 12 columns)
    for (let j = 0; j < 12; j++) {
      row[12 + j] = P[i][j];
    }

    G.push(row);
  }

  return G;
}

/**
 * Cached generator matrix
 */
let GENERATOR_MATRIX: number[][] | null = null;

/**
 * Get generator matrix (cached)
 */
function getGenerator(): number[][] {
  if (!GENERATOR_MATRIX) {
    GENERATOR_MATRIX = getGeneratorMatrix();
  }
  return GENERATOR_MATRIX;
}

/**
 * Encode 12 information bits to 24-bit Golay codeword
 *
 * Encoding: c = m·G (matrix multiplication over GF(2))
 */
export function encodeGolay(info: GolayInfo): GolayCodeword {
  if (info.length !== 12) {
    throw new Error(`Info vector must be length 12, got ${info.length}`);
  }

  const G = getGenerator();
  const codeword = new Array(24).fill(0);

  // Matrix multiplication m·G over GF(2)
  for (let j = 0; j < 24; j++) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum ^= (info[i] * G[i][j]); // XOR for GF(2) addition
    }
    codeword[j] = sum;
  }

  return codeword;
}

/**
 * Generate all 4,096 Golay codewords
 */
export function generateAllGolayCodewords(): GolayCodeword[] {
  const codewords: GolayCodeword[] = [];

  // Generate all 2^12 = 4,096 possible information vectors
  for (let n = 0; n < 4096; n++) {
    const info: GolayInfo = [];

    // Convert n to binary (12 bits)
    for (let i = 0; i < 12; i++) {
      info.push((n >> i) & 1);
    }

    const codeword = encodeGolay(info);
    codewords.push(codeword);
  }

  return codewords;
}

/**
 * Compute Hamming weight (number of 1s) of a codeword
 */
export function hammingWeight(codeword: GolayCodeword): number {
  return codeword.reduce((sum, bit) => sum + bit, 0);
}

/**
 * Check if two codewords are equal
 */
export function codewordsEqual(c1: GolayCodeword, c2: GolayCodeword): boolean {
  if (c1.length !== c2.length) return false;
  return c1.every((bit, i) => bit === c2[i]);
}

/**
 * Compute complement of a codeword (flip all bits)
 */
export function complementCodeword(codeword: GolayCodeword): GolayCodeword {
  return codeword.map(bit => 1 - bit);
}

/**
 * Filter codewords by weight
 */
export function getCodewordsByWeight(
  codewords: GolayCodeword[],
  weight: number
): GolayCodeword[] {
  return codewords.filter(c => hammingWeight(c) === weight);
}

/**
 * Get octads (weight-8 codewords)
 *
 * The Golay code has exactly 759 codewords of weight 8 (octads).
 * These are critical for constructing Leech lattice minimal vectors.
 */
export function getOctads(codewords?: GolayCodeword[]): GolayCodeword[] {
  const allCodewords = codewords || generateAllGolayCodewords();
  return getCodewordsByWeight(allCodewords, 8);
}

/**
 * Get dodecads (weight-12 codewords)
 *
 * The Golay code has exactly 2,576 codewords of weight 12 (dodecads).
 * Used for Type 3 Leech vectors.
 */
export function getDodecads(codewords?: GolayCodeword[]): GolayCodeword[] {
  const allCodewords = codewords || generateAllGolayCodewords();
  return getCodewordsByWeight(allCodewords, 12);
}

/**
 * Analyze weight distribution of Golay code
 *
 * Expected distribution:
 * - Weight 0: 1 (zero codeword)
 * - Weight 8: 759 (octads)
 * - Weight 12: 2,576 (dodecads)
 * - Weight 16: 759 (complements of octads)
 * - Weight 24: 1 (all-ones codeword)
 * Total: 4,096 = 2¹²
 */
export function analyzeWeightDistribution(codewords?: GolayCodeword[]): {
  [weight: number]: number;
} {
  const allCodewords = codewords || generateAllGolayCodewords();
  const distribution: { [weight: number]: number } = {};

  for (const codeword of allCodewords) {
    const weight = hammingWeight(codeword);
    distribution[weight] = (distribution[weight] || 0) + 1;
  }

  return distribution;
}

/**
 * Verify Golay code properties
 *
 * Checks:
 * 1. Total count = 4,096
 * 2. Weight distribution matches expected
 * 3. Minimum distance = 8 (all non-zero codewords have weight ≥ 8)
 */
export function verifyGolayCode(): {
  valid: boolean;
  errors: string[];
  distribution: { [weight: number]: number };
} {
  const errors: string[] = [];

  const codewords = generateAllGolayCodewords();

  // Check 1: Total count
  if (codewords.length !== 4096) {
    errors.push(`Expected 4,096 codewords, got ${codewords.length}`);
  }

  // Check 2: Weight distribution
  const distribution = analyzeWeightDistribution(codewords);

  const expectedDistribution = {
    0: 1,
    8: 759,
    12: 2576,
    16: 759,
    24: 1,
  };

  for (const [weight, count] of Object.entries(expectedDistribution)) {
    const actualCount = distribution[Number(weight)] || 0;
    if (actualCount !== count) {
      errors.push(
        `Expected ${count} codewords of weight ${weight}, got ${actualCount}`
      );
    }
  }

  // Check 3: No weights other than 0, 8, 12, 16, 24
  for (const weight of Object.keys(distribution).map(Number)) {
    if (![0, 8, 12, 16, 24].includes(weight)) {
      errors.push(`Unexpected weight ${weight} found`);
    }
  }

  // Check 4: Minimum distance (all non-zero have weight ≥ 8)
  const minWeight = Math.min(
    ...Object.keys(distribution)
      .map(Number)
      .filter(w => w > 0)
  );
  if (minWeight !== 8) {
    errors.push(`Minimum distance should be 8, got ${minWeight}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    distribution,
  };
}

/**
 * Constants
 */
export const GOLAY_CODE_LENGTH = 24;
export const GOLAY_CODE_DIMENSION = 12;
export const GOLAY_CODE_MIN_DISTANCE = 8;
export const GOLAY_CODE_SIZE = 4096; // 2^12

/**
 * Expected weight distribution counts
 */
export const GOLAY_WEIGHT_DISTRIBUTION = {
  0: 1,
  8: 759,
  12: 2576,
  16: 759,
  24: 1,
} as const;
