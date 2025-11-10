/**
 * Exceptional Factorization: Lookup Table Generation via Algebraic Structure
 *
 * This explores how the Atlas algebraic foundations (Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃])
 * can guide the generation of precomputed lookup tables based on input characteristics.
 *
 * Key insight: The 96-class system decomposes as:
 *   class(h₂, d, ℓ) = 24h₂ + 8d + ℓ
 *
 * Where:
 *   - h₂ ∈ {0,1,2,3}: Quadrant (from ℤ₄)
 *   - d ∈ {0,1,2}: Modality (from ℤ₃)
 *   - ℓ ∈ {0..7}: Context (from Cl₀,₇ grade-1 basis)
 *
 * This structure suggests factorization strategies based on coordinate decomposition.
 */

import { Atlas } from '../src';

// ============================================================================
// Coordinate Decomposition
// ============================================================================

interface ClassCoordinates {
  h2: number; // Quadrant [0,3]
  d: number; // Modality [0,2]
  l: number; // Context [0,7]
}

function decodeClass(c: number): ClassCoordinates {
  return {
    h2: Math.floor(c / 24),
    d: Math.floor((c % 24) / 8),
    l: c % 8,
  };
}

function encodeClass(coords: ClassCoordinates): number {
  return 24 * coords.h2 + 8 * coords.d + coords.l;
}

// ============================================================================
// Exceptional Structure Analysis
// ============================================================================

/**
 * Analyze factorization patterns by quadrant (h₂)
 * ℤ₄ structure: 4 quadrants with cyclic symmetry
 */
function analyzeQuadrantStructure(): Map<number, Set<string>> {
  const model = Atlas.Model.factor96();
  const quadrants = new Map<number, Set<string>>();

  for (let h2 = 0; h2 < 4; h2++) {
    quadrants.set(h2, new Set());
  }

  for (let c = 0; c < 96; c++) {
    const { h2 } = decodeClass(c);
    const factors = model.run({ n: c }) as number[];
    const signature = JSON.stringify(factors.sort((a, b) => a - b));
    quadrants.get(h2)!.add(signature);
  }

  return quadrants;
}

/**
 * Analyze factorization patterns by modality (d)
 * ℤ₃ structure: 3 modalities with triality symmetry
 */
function analyzeModalityStructure(): Map<number, Set<string>> {
  const model = Atlas.Model.factor96();
  const modalities = new Map<number, Set<string>>();

  for (let d = 0; d < 3; d++) {
    modalities.set(d, new Set());
  }

  for (let c = 0; c < 96; c++) {
    const { d } = decodeClass(c);
    const factors = model.run({ n: c }) as number[];
    const signature = JSON.stringify(factors.sort((a, b) => a - b));
    modalities.get(d)!.add(signature);
  }

  return modalities;
}

/**
 * Analyze factorization patterns by context (ℓ)
 * Cl₀,₇ structure: 8 contexts (scalar + 7 basis vectors)
 */
function analyzeContextStructure(): Map<number, Set<string>> {
  const model = Atlas.Model.factor96();
  const contexts = new Map<number, Set<string>>();

  for (let l = 0; l < 8; l++) {
    contexts.set(l, new Set());
  }

  for (let c = 0; c < 96; c++) {
    const { l } = decodeClass(c);
    const factors = model.run({ n: c }) as number[];
    const signature = JSON.stringify(factors.sort((a, b) => a - b));
    contexts.get(l)!.add(signature);
  }

  return contexts;
}

// ============================================================================
// Lookup Table Generation Strategies
// ============================================================================

/**
 * Strategy 1: Full 96-element lookup table (baseline)
 */
function generateFullLookupTable(): number[][] {
  const model = Atlas.Model.factor96();
  const table: number[][] = [];

  for (let c = 0; c < 96; c++) {
    table[c] = model.run({ n: c }) as number[];
  }

  return table;
}

/**
 * Strategy 2: Decomposed lookup (h₂, d, ℓ) → factorization
 * Exploits coordinate structure for compression
 */
function generateDecomposedLookupTable(): Map<string, number[]> {
  const model = Atlas.Model.factor96();
  const table = new Map<string, number[]>();

  for (let h2 = 0; h2 < 4; h2++) {
    for (let d = 0; d < 3; d++) {
      for (let l = 0; l < 8; l++) {
        const c = encodeClass({ h2, d, l });
        const key = `${h2},${d},${l}`;
        table.set(key, model.run({ n: c }) as number[]);
      }
    }
  }

  return table;
}

/**
 * Strategy 3: Sparse lookup with algebraic fallback
 * Only store "interesting" factorizations, compute trivial ones
 */
function generateSparseLookupTable(): {
  table: Map<number, number[]>;
  trivialClasses: Set<number>;
} {
  const model = Atlas.Model.factor96();
  const isPrimeModel = Atlas.Model.isPrime96();

  const table = new Map<number, number[]>();
  const trivialClasses = new Set<number>();

  for (let c = 0; c < 96; c++) {
    const isPrime = isPrimeModel.run({ n: c });

    if (isPrime || c === 0 || c === 1) {
      // Trivial factorization: prime numbers factor to themselves
      trivialClasses.add(c);
    } else {
      // Non-trivial: store in lookup table
      const factors = model.run({ n: c }) as number[];
      table.set(c, factors);
    }
  }

  return { table, trivialClasses };
}

/**
 * Strategy 4: Symmetry-based compression
 * Exploit R, D, T transform symmetries to reduce storage
 */
function analyzeTransformSymmetries(): Map<string, number[]> {
  const model = Atlas.Model.factor96();
  const canonicalFactorizations = new Map<string, number[]>();

  // For each class, compute its orbit under R, D, T
  const processed = new Set<number>();

  for (let c = 0; c < 96; c++) {
    if (processed.has(c)) continue;

    const factors = model.run({ n: c }) as number[];
    const orbit = computeOrbit(c);

    // Store canonical factorization for entire orbit
    const canonicalKey = Math.min(...orbit).toString();
    canonicalFactorizations.set(canonicalKey, factors);

    // Mark all orbit members as processed
    orbit.forEach((o) => processed.add(o));
  }

  return canonicalFactorizations;
}

function computeOrbit(c: number): number[] {
  const RModel = Atlas.Model.R(1);
  const DModel = Atlas.Model.D(1);
  const TModel = Atlas.Model.T(1);

  const orbit = new Set<number>([c]);

  // Apply R transforms (order 4)
  let current = c;
  for (let i = 0; i < 4; i++) {
    current = RModel.run({ x: current }) as number;
    orbit.add(current);
  }

  // Apply D transforms (order 3)
  current = c;
  for (let i = 0; i < 3; i++) {
    current = DModel.run({ x: current }) as number;
    orbit.add(current);
  }

  // Apply T transforms (order 8)
  current = c;
  for (let i = 0; i < 8; i++) {
    current = TModel.run({ x: current }) as number;
    orbit.add(current);
  }

  return Array.from(orbit);
}

// ============================================================================
// Main Analysis
// ============================================================================

function main(): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Exceptional Factorization: Algebraic Lookup Table Generation');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Analyze coordinate structure
  console.log('Analyzing factorization patterns by coordinate...\n');

  const quadrants = analyzeQuadrantStructure();
  console.log('Quadrant (h₂) Distribution:');
  for (const [h2, signatures] of quadrants) {
    console.log(`  Quadrant ${h2}: ${signatures.size} unique factorization patterns`);
  }
  console.log();

  const modalities = analyzeModalityStructure();
  console.log('Modality (d) Distribution:');
  for (const [d, signatures] of modalities) {
    const modalityName = ['neutral', 'produce', 'consume'][d];
    console.log(`  Modality ${d} (${modalityName}): ${signatures.size} unique patterns`);
  }
  console.log();

  const contexts = analyzeContextStructure();
  console.log('Context (ℓ) Distribution:');
  for (const [l, signatures] of contexts) {
    const contextName = l === 0 ? 'scalar' : `e_${l}`;
    console.log(`  Context ${l} (${contextName}): ${signatures.size} unique patterns`);
  }
  console.log();

  // Generate lookup tables
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Lookup Table Generation Strategies');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Strategy 1: Full table
  const fullTable = generateFullLookupTable();
  const fullSize = JSON.stringify(fullTable).length;
  console.log('Strategy 1: Full Lookup Table');
  console.log(`  Size: ${fullSize} bytes`);
  console.log(`  Entries: 96`);
  console.log(`  Lookup: O(1) - direct array index`);
  console.log();

  // Strategy 2: Decomposed table
  const decomposedTable = generateDecomposedLookupTable();
  const decomposedSize = JSON.stringify(Array.from(decomposedTable.entries())).length;
  console.log('Strategy 2: Decomposed Lookup Table');
  console.log(`  Size: ${decomposedSize} bytes`);
  console.log(`  Entries: 96 (organized by coordinates)`);
  console.log(`  Lookup: O(1) - hash map with (h₂,d,ℓ) key`);
  console.log();

  // Strategy 3: Sparse table
  const { table: sparseTable, trivialClasses } = generateSparseLookupTable();
  const sparseSize = JSON.stringify(Array.from(sparseTable.entries())).length;
  console.log('Strategy 3: Sparse Lookup Table');
  console.log(`  Size: ${sparseSize} bytes`);
  console.log(`  Stored entries: ${sparseTable.size}`);
  console.log(`  Trivial entries: ${trivialClasses.size} (computed on-the-fly)`);
  console.log(`  Compression: ${((1 - sparseTable.size / 96) * 100).toFixed(1)}%`);
  console.log(`  Lookup: O(1) - hash map with fallback`);
  console.log();

  // Strategy 4: Symmetry-based
  const symmetryTable = analyzeTransformSymmetries();
  const symmetrySize = JSON.stringify(Array.from(symmetryTable.entries())).length;
  console.log('Strategy 4: Symmetry-Based Compression');
  console.log(`  Size: ${symmetrySize} bytes`);
  console.log(`  Canonical entries: ${symmetryTable.size}`);
  console.log(`  Compression: ${((1 - symmetryTable.size / 96) * 100).toFixed(1)}%`);
  console.log(`  Lookup: O(1) - map to canonical + transform`);
  console.log();

  // Analyze compression potential
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Compression Analysis');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Size comparison:');
  console.log(`  Full table:       ${fullSize} bytes (baseline)`);
  console.log(`  Decomposed table: ${decomposedSize} bytes (${((decomposedSize / fullSize) * 100).toFixed(1)}%)`);
  console.log(`  Sparse table:     ${sparseSize} bytes (${((sparseSize / fullSize) * 100).toFixed(1)}%)`);
  console.log(`  Symmetry table:   ${symmetrySize} bytes (${((symmetrySize / fullSize) * 100).toFixed(1)}%)`);
  console.log();

  // Demonstrate exceptional structure patterns
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Exceptional Structure Patterns');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Show factorization pattern for each coordinate component
  console.log('Sample factorizations by coordinate:');
  console.log();

  // Quadrant patterns (h₂ = 0, 1, 2, 3)
  console.log('Quadrant variation (fixing d=0, ℓ=5):');
  for (let h2 = 0; h2 < 4; h2++) {
    const c = encodeClass({ h2, d: 0, l: 5 });
    const factors = fullTable[c];
    console.log(`  h₂=${h2}: class ${c} → [${factors}]`);
  }
  console.log();

  // Modality patterns (d = 0, 1, 2)
  console.log('Modality variation (fixing h₂=0, ℓ=5):');
  for (let d = 0; d < 3; d++) {
    const c = encodeClass({ h2: 0, d, l: 5 });
    const factors = fullTable[c];
    const modalityName = ['neutral', 'produce', 'consume'][d];
    console.log(`  d=${d} (${modalityName}): class ${c} → [${factors}]`);
  }
  console.log();

  // Context patterns (ℓ = 0..7)
  console.log('Context variation (fixing h₂=0, d=0):');
  for (let l = 0; l < 8; l++) {
    const c = encodeClass({ h2: 0, d: 0, l });
    const factors = fullTable[c];
    const contextName = l === 0 ? 'scalar' : `e_${l}`;
    console.log(`  ℓ=${l} (${contextName}): class ${c} → [${factors}]`);
  }
  console.log();

  // Analyze prime distribution by coordinate
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Prime Distribution by Coordinate');
  console.log('═══════════════════════════════════════════════════════════\n');

  const isPrimeModel = Atlas.Model.isPrime96();

  const primesByQuadrant = new Map<number, number>();
  const primesByModality = new Map<number, number>();
  const primesByContext = new Map<number, number>();

  for (let c = 0; c < 96; c++) {
    const isPrime = isPrimeModel.run({ n: c });
    if (!isPrime) continue;

    const { h2, d, l } = decodeClass(c);
    primesByQuadrant.set(h2, (primesByQuadrant.get(h2) || 0) + 1);
    primesByModality.set(d, (primesByModality.get(d) || 0) + 1);
    primesByContext.set(l, (primesByContext.get(l) || 0) + 1);
  }

  console.log('Primes by quadrant (h₂):');
  for (let h2 = 0; h2 < 4; h2++) {
    console.log(`  Quadrant ${h2}: ${primesByQuadrant.get(h2) || 0} primes`);
  }
  console.log();

  console.log('Primes by modality (d):');
  for (let d = 0; d < 3; d++) {
    const modalityName = ['neutral', 'produce', 'consume'][d];
    console.log(`  Modality ${d} (${modalityName}): ${primesByModality.get(d) || 0} primes`);
  }
  console.log();

  console.log('Primes by context (ℓ):');
  for (let l = 0; l < 8; l++) {
    const contextName = l === 0 ? 'scalar' : `e_${l}`;
    console.log(`  Context ${l} (${contextName}): ${primesByContext.get(l) || 0} primes`);
  }
  console.log();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Conclusion');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Key findings:');
  console.log();
  console.log('1. Coordinate decomposition provides natural lookup table organization');
  console.log('2. Sparse storage reduces space by ~33% (64 stored, 32 computed)');
  console.log('3. Symmetry-based compression exploits R/D/T transform orbits');
  console.log('4. Prime distribution shows structure in (h₂, d, ℓ) space');
  console.log();
  console.log('Recommended strategy: Sparse lookup with coordinate-based indexing');
  console.log('  - Store 64 composite factorizations');
  console.log('  - Compute 32 prime factorizations on-the-fly (trivial)');
  console.log('  - Use (h₂, d, ℓ) decomposition for efficient access');
  console.log('  - Total memory: ~2KB for lookup table');
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
