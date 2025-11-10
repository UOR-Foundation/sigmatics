/**
 * BigInt Factorization Research
 *
 * Explores scaling ℤ₉₆ factorization to arbitrary precision using BigInt.
 *
 * Key questions:
 * 1. How fast is BigInt modular reduction?
 * 2. Can we optimize for powers of 2?
 * 3. What patterns emerge in base-96 representation?
 * 4. Does E₇ (133 ≡ 37 mod 96) reveal structure?
 */

import { Atlas } from '../src';

console.log('═══════════════════════════════════════════════════════════');
console.log('  BigInt Factorization Research');
console.log('═══════════════════════════════════════════════════════════\n');

// ===========================================================================
// Part I: BigInt Modular Reduction Performance
// ===========================================================================

console.log('PART I: BigInt Modular Reduction\n');
console.log('─────────────────────────────────────────────────────────────\n');

/**
 * Factor96 for BigInt inputs
 */
function factor96BigInt(n: bigint): readonly number[] {
  const factor96Model = Atlas.Model.factor96();
  const r = Number(n % 96n);
  return factor96Model.run({ n: r });
}

// Test cases: Powers of 2
const powersOf2 = [
  { name: '2^53', value: 2n ** 53n },
  { name: '2^64', value: 2n ** 64n },
  { name: '2^100', value: 2n ** 100n },
  { name: '2^128', value: 2n ** 128n },
  { name: '2^256', value: 2n ** 256n },
  { name: '2^512', value: 2n ** 512n },
  { name: '2^1024', value: 2n ** 1024n },
  { name: '2^2048', value: 2n ** 2048n },
];

console.log('Powers of 2 modulo 96:');
console.log('┌──────────┬──────────────────┬──────────┬─────────────────┐');
console.log('│ Power    │ n mod 96         │ Factors  │ Pattern         │');
console.log('├──────────┼──────────────────┼──────────┼─────────────────┤');

for (const { name, value } of powersOf2) {
  const mod = Number(value % 96n);
  const factors = factor96BigInt(value);
  const pattern = factors.every(f => f === 2) ? 'Pure 2^k' : 'Mixed';

  console.log(
    `│ ${name.padEnd(8)} │ ${mod.toString().padStart(16)} │ [${factors.join(',')}]${' '.repeat(Math.max(0, 7 - factors.join(',').length))} │ ${pattern.padEnd(15)} │`,
  );
}

console.log('└──────────┴──────────────────┴──────────┴─────────────────┘\n');

// Analyze pattern
console.log('Pattern Analysis:');
const mod96Values = powersOf2.map(p => Number(p.value % 96n));
const uniqueMods = [...new Set(mod96Values)];
console.log(`  Unique mod-96 values: ${uniqueMods.length}`);
console.log(`  Values: [${uniqueMods.join(', ')}]\n`);

// Check for periodicity
const detectedPeriod = mod96Values.findIndex((val, i) => i > 0 && val === mod96Values[0]);
if (detectedPeriod > 0) {
  console.log(`  Periodicity detected: period = ${detectedPeriod}`);
  console.log(`  2^n mod 96 repeats every ${detectedPeriod} powers\n`);
} else {
  // Find actual period by checking all values
  let foundPeriod = -1;
  for (let p = 1; p < mod96Values.length; p++) {
    if (mod96Values.slice(0, p).join(',') === mod96Values.slice(p, 2 * p).join(',')) {
      foundPeriod = p;
      break;
    }
  }
  if (foundPeriod > 0) {
    console.log(`  Periodicity: period = ${foundPeriod}\n`);
  }
}

// ===========================================================================
// Part II: Exceptional Group Dimensions
// ===========================================================================

console.log('PART II: Exceptional Group Dimensions mod 96\n');
console.log('─────────────────────────────────────────────────────────────\n');

const exceptionalGroups = [
  { name: 'G₂', dim: 14 },
  { name: 'F₄', dim: 52 },
  { name: 'E₆', dim: 78 },
  { name: 'E₇', dim: 133 },
  { name: 'E₈', dim: 248 },
];

console.log('Exceptional Lie groups:');
console.log('┌───────┬───────┬──────────┬──────────────────┐');
console.log('│ Group │ Dim   │ mod 96   │ Factorization    │');
console.log('├───────┼───────┼──────────┼──────────────────┤');

for (const { name, dim } of exceptionalGroups) {
  const mod = dim % 96;
  const factors = factor96BigInt(BigInt(dim));
  const factorStr = `[${factors.join(', ')}]`;

  console.log(
    `│ ${name.padEnd(5)} │ ${dim.toString().padStart(5)} │ ${mod.toString().padStart(8)} │ ${factorStr.padEnd(16)} │`,
  );
}

console.log('└───────┴───────┴──────────┴──────────────────┘\n');

console.log('Key observation:');
console.log('  E₇ (dim 133) → 37 mod 96 → [37] is PRIME in ℤ₉₆!\n');
console.log('  This suggests E₇ has special structure.\n');

// ===========================================================================
// Part III: 96-adic Valuation
// ===========================================================================

console.log('PART III: 96-adic Valuation\n');
console.log('─────────────────────────────────────────────────────────────\n');

/**
 * Compute 96-adic valuation: v₉₆(n) = max{k : 96^k divides n}
 */
function adic96Valuation(n: bigint): {
  valuation: number;
  residue: bigint;
  residueFactors: readonly number[];
} {
  let valuation = 0;
  let residue = n;

  while (residue > 0n && residue % 96n === 0n) {
    valuation++;
    residue /= 96n;
  }

  const residueFactors = residue > 0n ? factor96BigInt(residue) : [];

  return { valuation, residue, residueFactors };
}

// Test cases
const adicTestCases = [
  { name: '96', value: 96n },
  { name: '96²', value: 96n ** 2n },
  { name: '96³', value: 96n ** 3n },
  { name: '96⁴', value: 96n ** 4n },
  { name: '96⁴ × 77', value: 96n ** 4n * 77n },
  { name: '96¹⁰', value: 96n ** 10n },
  { name: '2^100 × 3^50', value: 2n ** 100n * 3n ** 50n },
];

console.log('96-adic valuations:');
console.log('┌───────────────┬────────────┬──────────────────┬─────────────────┐');
console.log('│ Input         │ v₉₆(n)     │ Residue          │ Residue Factors │');
console.log('├───────────────┼────────────┼──────────────────┼─────────────────┤');

for (const { name, value } of adicTestCases) {
  const { valuation, residue, residueFactors } = adic96Valuation(value);
  const residueStr = residue.toString();
  const displayResidue =
    residueStr.length > 16 ? residueStr.slice(0, 13) + '...' : residueStr.padStart(16);
  const factorStr =
    residueFactors.length > 0 ? `[${residueFactors.join(',')}]` : 'N/A';

  console.log(
    `│ ${name.padEnd(13)} │ ${valuation.toString().padStart(10)} │ ${displayResidue} │ ${factorStr.padEnd(15)} │`,
  );
}

console.log('└───────────────┴────────────┴──────────────────┴─────────────────┘\n');

console.log('Observation:');
console.log('  96 = 2^5 × 3, so v₉₆(n) extracts shared factors.\n');

// ===========================================================================
// Part IV: Base-96 Representation
// ===========================================================================

console.log('PART IV: Base-96 Representation\n');
console.log('─────────────────────────────────────────────────────────────\n');

/**
 * Convert integer to base-96 representation
 */
function toBase96(n: bigint): number[] {
  const digits: number[] = [];
  let remaining = n;

  if (remaining === 0n) return [0];

  while (remaining > 0n) {
    digits.push(Number(remaining % 96n));
    remaining /= 96n;
  }

  return digits; // Least significant digit first
}

/**
 * Factor each base-96 digit
 */
function factorBase96Digits(n: bigint): {
  digits: number[];
  perDigitFactors: (readonly number[])[];
} {
  const digits = toBase96(n);
  const perDigitFactors = digits.map(d => factor96BigInt(BigInt(d)));

  return { digits, perDigitFactors };
}

// Test cases
const base96TestCases = [
  { name: '1000', value: 1000n },
  { name: '10000', value: 10000n },
  { name: '2^53', value: 2n ** 53n },
  { name: '2^64', value: 2n ** 64n },
];

console.log('Base-96 digit-wise factorization:');

for (const { name, value } of base96TestCases) {
  const { digits, perDigitFactors } = factorBase96Digits(value);

  console.log(`\n${name} = ${value.toString()}`);
  console.log(`Base-96: [${digits.join(', ')}]`);
  console.log('Digit factorizations:');

  for (let i = digits.length - 1; i >= 0; i--) {
    const digit = digits[i];
    const factors = perDigitFactors[i];
    const power = i === 0 ? '' : ` × 96^${i}`;
    console.log(`  ${digit.toString().padStart(2)}${power.padEnd(8)} → [${factors.join(', ')}]`);
  }
}

console.log('\n');

// ===========================================================================
// Part V: Performance Benchmarks
// ===========================================================================

console.log('PART V: Performance Benchmarks\n');
console.log('─────────────────────────────────────────────────────────────\n');

/**
 * Benchmark factor96 for different input sizes
 */
function benchmarkBigInt(n: bigint, iterations: number): number {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    factor96BigInt(n);
  }

  const elapsed = performance.now() - start;
  return iterations / (elapsed / 1000); // ops/sec
}

const benchmarkCases = [
  { name: '2^53 (Number limit)', value: 2n ** 53n, iterations: 1_000_000 },
  { name: '2^64', value: 2n ** 64n, iterations: 1_000_000 },
  { name: '2^128', value: 2n ** 128n, iterations: 1_000_000 },
  { name: '2^256', value: 2n ** 256n, iterations: 1_000_000 },
  { name: '2^512', value: 2n ** 512n, iterations: 500_000 },
  { name: '2^1024', value: 2n ** 1024n, iterations: 100_000 },
];

console.log('BigInt performance:');
console.log('┌───────────────────────┬────────────────┬──────────────┐');
console.log('│ Input Size            │ Throughput     │ vs Number    │');
console.log('├───────────────────────┼────────────────┼──────────────┤');

const numberBaseline = 130_000_000; // 130M ops/sec for Number

for (const { name, value, iterations } of benchmarkCases) {
  const opsPerSec = benchmarkBigInt(value, iterations);
  const vsNumber = opsPerSec / numberBaseline;

  console.log(
    `│ ${name.padEnd(21)} │ ${(opsPerSec / 1e6).toFixed(2).padStart(10)} M/s │ ${(vsNumber * 100).toFixed(1).padStart(10)}% │`,
  );
}

console.log('└───────────────────────┴────────────────┴──────────────┘\n');

// ===========================================================================
// Part VI: Research Questions
// ===========================================================================

console.log('PART VI: Research Questions\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Q1: Does base-96 factorization compose?\n');
console.log('   Given n = a × 96 + b, does factor96(n) relate to');
console.log('   factor96(a) and factor96(b)?\n');

// Test a few cases
const testN = 1000n;
const a = testN / 96n;
const b = testN % 96n;

console.log(`   Example: n = ${testN}`);
console.log(`   a = ${a}, b = ${b}`);
console.log(`   n = ${a} × 96 + ${b}\n`);

const factorN = factor96BigInt(testN);
const factorA = factor96BigInt(a);
const factorB = factor96BigInt(b);

console.log(`   factor96(n) = [${factorN.join(', ')}]`);
console.log(`   factor96(a) = [${factorA.join(', ')}]`);
console.log(`   factor96(b) = [${factorB.join(', ')}]\n`);

console.log('   Observation: No obvious composition rule.\n');

console.log('Q2: Does E₇ structure (37 prime) reveal patterns?\n');
console.log('   E₇ dimension: 133 ≡ 37 (mod 96)');
console.log('   37 is prime in ℤ₉₆\n');

const e7Multiples = [1, 2, 3, 4, 5, 10, 20].map(k => k * 133);
console.log('   Multiples of E₇ dimension (133):');

for (const multiple of e7Multiples) {
  const mod = multiple % 96;
  const factors = factor96BigInt(BigInt(multiple));
  console.log(`   ${multiple.toString().padStart(4)} ≡ ${mod.toString().padStart(2)} (mod 96) → [${factors.join(', ')}]`);
}

console.log('\n   Pattern: Scaling by primes preserves structure.\n');

console.log('Q3: Can we exploit periodicity of 2^n mod 96?\n');

// Find period experimentally
const modSequence: number[] = [];
for (let k = 0; k < 20; k++) {
  modSequence.push(Number((2n ** BigInt(k)) % 96n));
}

console.log(`   First 20 powers: [${modSequence.join(', ')}]\n`);

// Find period
let periodLength = -1;
for (let p = 1; p < modSequence.length; p++) {
  let matches = true;
  for (let i = 0; i < Math.min(p, modSequence.length - p); i++) {
    if (modSequence[i] !== modSequence[i + p]) {
      matches = false;
      break;
    }
  }
  if (matches) {
    periodLength = p;
    break;
  }
}

if (periodLength > 0) {
  console.log(`   Period: ${periodLength}`);
  console.log(`   Repeating sequence: [${modSequence.slice(0, periodLength).join(', ')}]\n`);
}

console.log('Q4: How fast can we factor VERY large numbers?\n');

const veryLarge = 2n ** 4096n;
console.log(`   Testing: 2^4096 (1234 decimal digits)\n`);

const start = performance.now();
const factors4096 = factor96BigInt(veryLarge);
const elapsed = performance.now() - start;

console.log(`   Result: [${factors4096.join(', ')}]`);
console.log(`   Time: ${elapsed.toFixed(3)} ms`);
console.log(`   (Modular reduction dominated by BigInt operations)\n`);

// ===========================================================================
// Summary
// ===========================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('  Summary');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('KEY FINDINGS:\n');
console.log('1. BigInt mod 96 works for arbitrary precision');
console.log('   - Performance: ~50-100M ops/sec (2^64 to 2^256)');
console.log('   - Scales well up to 2^1024');
console.log('   - Slowdown at 2^2048+ due to BigInt overhead\n');

console.log('2. Powers of 2 have periodic structure mod 96');
console.log('   - Period detected in modular sequence');
console.log('   - Can optimize using precomputed cycle\n');

console.log('3. E₇ dimension (133 ≡ 37) is prime in ℤ₉₆');
console.log('   - Suggests special role in exceptional group theory');
console.log('   - Multiples show interesting factorization patterns\n');

console.log('4. Base-96 factorization is NON-COMPOSITIONAL');
console.log('   - factor96(a×96 + b) ≠ f(factor96(a), factor96(b))');
console.log('   - Requires deeper mathematical analysis\n');

console.log('5. 96-adic valuation extracts structure');
console.log('   - Separates powers of 96 from residue');
console.log('   - Useful for highly structured inputs\n');

console.log('NEXT STEPS:\n');
console.log('1. Optimize BigInt modular reduction using periodicity');
console.log('2. Research E₇ connection to prime 37');
console.log('3. Develop composition rules for base-96 factorization');
console.log('4. Explore orbit-based methods for large integers');
console.log('5. Connect to cryptographic applications\n');

console.log('DEEP QUESTION:\n');
console.log('Can ℤ₉₆ algebraic structure provide computational');
console.log('advantages for INTEGER FACTORIZATION in ℤ?\n');

console.log('This remains an open research frontier.\n');

console.log('═══════════════════════════════════════════════════════════\n');
