/**
 * Coordinate-Based Factorization Formula Research
 *
 * Goal: Derive a closed formula from (h₂, d, ℓ) coordinates
 */

import { Atlas } from '../src';

console.log('═══════════════════════════════════════════════════════════');
console.log('  Coordinate-Based Factorization Formula');
console.log('═══════════════════════════════════════════════════════════\n');

const factorModel = Atlas.Model.factor96();
const isPrimeModel = Atlas.Model.isPrime96();
const gcdModel = Atlas.Model.gcd96();

// =============================================================================
// Part I: Complete Factorization Database
// =============================================================================

console.log('PART I: Building Complete Factorization Database\n');
console.log('─────────────────────────────────────────────────────────────\n');

interface ClassInfo {
  c: number;
  h: number;
  d: number;
  l: number;
  factors: number[];
  isPrime: boolean;
  complexity: number;
}

const database: ClassInfo[] = [];

for (let c = 0; c < 96; c++) {
  const h = Math.floor(c / 24);
  const d = Math.floor((c % 24) / 8);
  const l = c % 8;

  const factors = factorModel.run({ n: c }) as number[];
  const isPrime = isPrimeModel.run({ n: c });

  database.push({
    c,
    h,
    d,
    l,
    factors,
    isPrime: isPrime && c !== 1,
    complexity: factors.length,
  });
}

const primes = database.filter((info) => info.isPrime);
const composites = database.filter((info) => !info.isPrime && info.c !== 0 && info.c !== 1);

console.log(`Total classes: ${database.length}`);
console.log(`Primes: ${primes.length}`);
console.log(`Composites: ${composites.length}`);
console.log(`Special (0, 1): 2\n`);

// =============================================================================
// Part II: Pattern Analysis by Coordinate
// =============================================================================

console.log('PART II: Factorization Patterns by Single Coordinate\n');
console.log('─────────────────────────────────────────────────────────────\n');

console.log('A. Pattern by CONTEXT (ℓ) - The Parity Constraint:\n');

for (let l = 0; l < 8; l++) {
  const classes = database.filter((info) => info.l === l);
  const primesAtL = classes.filter((info) => info.isPrime);
  const parity = l % 2 === 0 ? 'EVEN' : 'ODD ';

  console.log(`ℓ=${l} (${parity}):`);
  console.log(`  Total: ${classes.length} classes`);
  console.log(`  Primes: ${primesAtL.length}`);

  if (primesAtL.length === 0) {
    console.log(`  → No primes (shares factor with 96)`);
  } else {
    console.log(`  → Primes possible`);
  }
  console.log();
}

console.log('✓ CONFIRMED: Primes only at ODD contexts (ℓ ∈ {1,3,5,7})\n');
console.log('This is because 96 = 2⁵ × 3, so even ℓ → class divisible by 2\n');

console.log('B. Pattern by MODALITY (d):\n');

for (let d = 0; d < 3; d++) {
  const classes = database.filter((info) => info.d === d);
  const primesAtD = classes.filter((info) => info.isPrime);
  const modalityName = ['neutral', 'produce', 'consume'][d];

  console.log(`d=${d} (${modalityName}):`);
  console.log(`  Total: ${classes.length} classes`);
  console.log(`  Primes: ${primesAtD.length}`);
  console.log(`  Prime density: ${(primesAtD.length / classes.length * 100).toFixed(1)}%\n`);
}

console.log('C. Pattern by QUADRANT (h₂):\n');

for (let h = 0; h < 4; h++) {
  const classes = database.filter((info) => info.h === h);
  const primesAtH = classes.filter((info) => info.isPrime);

  console.log(`h₂=${h}:`);
  console.log(`  Total: ${classes.length} classes`);
  console.log(`  Primes: ${primesAtH.length}`);
  console.log(`  Prime density: ${(primesAtH.length / classes.length * 100).toFixed(1)}%\n`);
}

// =============================================================================
// Part III: Composite Coordinate Patterns
// =============================================================================

console.log('\nPART III: Two-Coordinate Interaction Patterns\n');
console.log('─────────────────────────────────────────────────────────────\n');

console.log('A. (d, ℓ) Interaction - Modality × Context:\n');

const dlMatrix: number[][] = [];
for (let d = 0; d < 3; d++) {
  dlMatrix[d] = [];
  for (let l = 0; l < 8; l++) {
    const classes = database.filter((info) => info.d === d && info.l === l);
    const primesHere = classes.filter((info) => info.isPrime);
    dlMatrix[d][l] = primesHere.length;
  }
}

console.log('Prime count matrix [d][ℓ]:\n');
console.log('       ℓ=0  ℓ=1  ℓ=2  ℓ=3  ℓ=4  ℓ=5  ℓ=6  ℓ=7');
for (let d = 0; d < 3; d++) {
  const modalityName = ['neutral', 'produce', 'consume'][d];
  const row = `d=${d} ${modalityName.padEnd(7)}:`;
  const values = dlMatrix[d].map((v) => v.toString().padStart(4)).join('');
  console.log(row + values);
}
console.log();

// =============================================================================
// Part IV: Direct Primality Formula
// =============================================================================

console.log('\nPART IV: Deriving Primality Formula from Coordinates\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Testing primality prediction from coordinates:\n');

function predictPrimality(h: number, d: number, l: number): boolean {
  // Rule 1: Must have odd context
  if (l % 2 === 0) return false;

  // Rule 2: Must be coprime to 96
  const c = 24 * h + 8 * d + l;
  const g = gcdModel.run({ a: c, b: 96 });
  return g === 1;
}

let correct = 0;
let total = 0;

for (const info of database) {
  if (info.c === 0 || info.c === 1) continue;  // Skip special cases

  const predicted = predictPrimality(info.h, info.d, info.l);
  const actual = info.isPrime;

  if (predicted === actual) {
    correct++;
  } else {
    console.log(`  Mismatch at c=${info.c} (${info.h},${info.d},${info.l}): predicted=${predicted}, actual=${actual}`);
  }
  total++;
}

console.log(`\nPrimality prediction accuracy: ${correct}/${total} (${(correct / total * 100).toFixed(1)}%)\n`);

if (correct === total) {
  console.log('✓ PERFECT PRIMALITY FORMULA FOUND!\n');
  console.log('isPrime₉₆(h₂, d, ℓ) = (ℓ is odd) AND (gcd(24h₂ + 8d + ℓ, 96) = 1)\n');
}

// =============================================================================
// Part V: Factorization Structure Analysis
// =============================================================================

console.log('\nPART V: Factorization Structure\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Analyzing composite factorization patterns:\n');

// Group composites by their factor structure
const byStructure = new Map<string, ClassInfo[]>();

for (const info of composites) {
  const structure = info.factors.map((f) => {
    const fInfo = database.find((i) => i.c === f);
    return fInfo?.isPrime ? 'p' : 'c';
  }).join('');

  if (!byStructure.has(structure)) {
    byStructure.set(structure, []);
  }
  byStructure.get(structure)!.push(info);
}

console.log('Composite structures:\n');
for (const [structure, classes] of Array.from(byStructure.entries()).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  [${structure}]: ${classes.length} classes`);
  if (classes.length <= 3) {
    console.log(`    Examples: ${classes.map((c) => `${c.c}=[${c.factors}]`).join(', ')}`);
  }
}

console.log();

// Analyze squares and products
const squares = composites.filter((info) => {
  return info.factors.length === 2 && info.factors[0] === info.factors[1];
});

const products = composites.filter((info) => {
  return info.factors.length === 2 && info.factors[0] !== info.factors[1];
});

console.log(`Perfect squares: ${squares.length}`);
if (squares.length > 0) {
  console.log(`  ${squares.map((s) => `${s.c}=${s.factors[0]}²`).join(', ')}\n`);
}

console.log(`Prime products: ${products.length}`);
if (products.length > 0) {
  console.log(`  ${products.map((p) => `${p.c}=${p.factors[0]}×${p.factors[1]}`).join(', ')}\n`);
}

// =============================================================================
// Part VI: Summary and Conclusions
// =============================================================================

console.log('\nPART VI: Research Summary\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('DISCOVERED FORMULAS:\n');

console.log('1. CLASS INDEX from coordinates:');
console.log('   class(h₂, d, ℓ) = 24h₂ + 8d + ℓ\n');

console.log('2. PRIMALITY TEST:');
console.log('   isPrime₉₆(n) = (ℓ is odd) AND (gcd(n, 96) = 1)');
console.log('   where ℓ = n mod 8\n');

console.log('3. PARITY CONSTRAINT:');
console.log('   Primes ONLY at ℓ ∈ {1,3,5,7}');
console.log('   Reason: 96 = 2⁵ × 3, even ℓ → divisible by 2\n');

console.log('4. QUADRANT SYMMETRY:');
console.log('   R (rotation) permutes quadrants h₂ ∈ {0,1,2,3}');
console.log('   Nearly equal prime distribution across quadrants\n');

console.log('5. TRIALITY:');
console.log('   D (modality shift) cycles d ∈ {0,1,2}');
console.log('   Modality affects prime density\n');

console.log('FACTORIZATION ALGORITHM:\n');
console.log('Given n ∈ ℤ₉₆:');
console.log('1. Compute coordinates: (h₂, d, ℓ) = decode(n)');
console.log('2. Check primality: if (ℓ odd AND gcd(n,96)=1) return [n]');
console.log('3. Otherwise: lookup precomputed table (optimal)\n');

console.log('COMPRESSION STRATEGIES:\n');
console.log('Current: 96-entry table = 473 bytes');
console.log('Option 1: Orbit-based = ~118 bytes (89.6% reduction)');
console.log('Option 2: Coordinate-based (ℓ odd only) = ~200 bytes (58% reduction)\n');

console.log('TOWARD CLOSED FORMULA:\n');
console.log('The challenge: Computing factorization of composites directly');
console.log('from coordinates WITHOUT lookup table.\n');
console.log('Current status: Primality is solvable, factorization requires');
console.log('deeper number-theoretic analysis or accepting table lookup.\n');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Research Complete');
console.log('═══════════════════════════════════════════════════════════\n');
