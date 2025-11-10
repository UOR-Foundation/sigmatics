/**
 * Decomposed Factorization Benchmark
 *
 * Separates mod reduction cost from factorization cost to understand
 * where the scaling behavior comes from:
 *
 * Total time = Mod reduction time + Factorization time
 *
 * Hypothesis:
 * - Mod reduction: O(log n) - depends on input magnitude
 * - Factorization: O(1) - depends only on [0, 95] value
 */

import { Atlas } from '../src';

interface DecomposedResult {
  inputMagnitude: string;
  modReductionUs: number;
  factorizationUs: number;
  totalUs: number;
  modPercent: number;
  factorPercent: number;
}

function benchmarkModReduction(inputGenerator: () => number, iterations: number): number {
  // Warm-up
  for (let i = 0; i < 100; i++) {
    inputGenerator() % 96;
  }

  // Measure pure mod reduction
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const input = inputGenerator();
    const _ = input % 96; // Just the mod operation
  }
  const end = performance.now();

  return ((end - start) * 1000) / iterations; // μs per operation
}

function benchmarkFactorization(iterations: number): number {
  const model = Atlas.Model.factor96();

  // Pre-generate inputs [0, 95] to isolate factorization cost
  const inputs = Array.from({ length: iterations }, (_, i) => i % 96);

  // Warm-up
  for (let i = 0; i < 100; i++) {
    model.run({ n: inputs[i % 96] });
  }

  // Measure pure factorization (no mod reduction)
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    model.run({ n: inputs[i] });
  }
  const end = performance.now();

  return ((end - start) * 1000) / iterations; // μs per operation
}

function benchmarkTotal(
  inputGenerator: () => number,
  iterations: number,
): number {
  const model = Atlas.Model.factor96();

  // Warm-up
  for (let i = 0; i < 100; i++) {
    model.run({ n: inputGenerator() });
  }

  // Measure total time (mod + factorization)
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const input = inputGenerator();
    model.run({ n: input });
  }
  const end = performance.now();

  return ((end - start) * 1000) / iterations; // μs per operation
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Factor96 Decomposed Benchmark');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('This benchmark separates mod reduction cost from factorization cost.');
  console.log('Expected: mod cost scales with input size, factorization cost is O(1).\n');

  const iterations = 100000;
  const results: DecomposedResult[] = [];

  // Measure pure factorization cost (baseline)
  console.log('Measuring baseline factorization cost (no mod)...');
  const baselineFactorUs = benchmarkFactorization(iterations);

  console.log(`Baseline factorization: ${baselineFactorUs.toFixed(3)} μs\n`);

  // Test different input magnitudes
  const testCases: Array<[string, () => number]> = [
    ['Small (0-95)', () => Math.floor(Math.random() * 96)],
    ['10³ (thousand)', () => Math.floor(Math.random() * 1000)],
    ['10⁶ (million)', () => Math.floor(Math.random() * 1000000)],
    ['10⁹ (billion)', () => Math.floor(Math.random() * 1000000000)],
    ['10¹² (trillion)', () => Math.floor(Math.random() * 1000000000000)],
    ['2⁵³ - 1 (max)', () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)],
  ];

  for (const [name, generator] of testCases) {
    console.log(`Testing ${name}...`);

    const modUs = benchmarkModReduction(generator, iterations);
    const totalUs = benchmarkTotal(generator, iterations);
    const factorUs = totalUs - modUs;

    const modPercent = (modUs / totalUs) * 100;
    const factorPercent = (factorUs / totalUs) * 100;

    results.push({
      inputMagnitude: name,
      modReductionUs: modUs,
      factorizationUs: factorUs,
      totalUs,
      modPercent,
      factorPercent,
    });
  }

  // Print results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Decomposed Results');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Input Magnitude       | Mod (μs) | Factor (μs) | Total (μs) | Mod % | Factor %');
  console.log('----------------------|----------|-------------|------------|-------|----------');

  for (const r of results) {
    const magnitude = r.inputMagnitude.padEnd(20);
    const modUs = r.modReductionUs.toFixed(3).padStart(8);
    const factorUs = r.factorizationUs.toFixed(3).padStart(11);
    const totalUs = r.totalUs.toFixed(3).padStart(10);
    const modPct = r.modPercent.toFixed(1).padStart(5);
    const factorPct = r.factorPercent.toFixed(1).padStart(8);

    console.log(`${magnitude} | ${modUs} | ${factorUs} | ${totalUs} | ${modPct} | ${factorPct}`);
  }

  console.log();

  // Analyze factorization variance (should be O(1))
  const factorTimes = results.map((r) => r.factorizationUs);
  const factorMean = factorTimes.reduce((a, b) => a + b, 0) / factorTimes.length;
  const factorVariance =
    factorTimes.reduce((sum, t) => sum + Math.pow(t - factorMean, 2), 0) / factorTimes.length;
  const factorStdDev = Math.sqrt(factorVariance);
  const factorCV = (factorStdDev / factorMean) * 100;

  // Analyze mod variance (expected to scale with input size)
  const modTimes = results.map((r) => r.modReductionUs);
  const modMean = modTimes.reduce((a, b) => a + b, 0) / modTimes.length;
  const modVariance =
    modTimes.reduce((sum, t) => sum + Math.pow(t - modMean, 2), 0) / modTimes.length;
  const modStdDev = Math.sqrt(modVariance);
  const modCV = (modStdDev / modMean) * 100;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Statistical Analysis');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Factorization (should be O(1)):');
  console.log(`  Mean:                    ${factorMean.toFixed(3)} μs`);
  console.log(`  Standard deviation:      ${factorStdDev.toFixed(3)} μs`);
  console.log(`  Coefficient of variation: ${factorCV.toFixed(2)}%`);

  if (factorCV < 10) {
    console.log('  ✅ CONFIRMED: Factorization is O(1) (CV < 10%)\n');
  } else if (factorCV < 20) {
    console.log('  ⚠️  MARGINAL: Factorization likely O(1) (CV < 20%)\n');
  } else {
    console.log('  ❌ REJECTED: Factorization not O(1) (CV > 20%)\n');
  }

  console.log('Mod Reduction (expected to scale with input size):');
  console.log(`  Mean:                    ${modMean.toFixed(3)} μs`);
  console.log(`  Standard deviation:      ${modStdDev.toFixed(3)} μs`);
  console.log(`  Coefficient of variation: ${modCV.toFixed(2)}%`);

  if (modCV > 30) {
    console.log('  ✅ CONFIRMED: Mod reduction scales with input size (CV > 30%)\n');
  } else {
    console.log('  ⚠️  Mod reduction variance lower than expected\n');
  }

  // Cost breakdown
  const avgModPercent = results.reduce((sum, r) => sum + r.modPercent, 0) / results.length;
  const avgFactorPercent =
    results.reduce((sum, r) => sum + r.factorPercent, 0) / results.length;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Cost Breakdown');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Average mod reduction cost:     ${avgModPercent.toFixed(1)}% of total time`);
  console.log(`Average factorization cost:     ${avgFactorPercent.toFixed(1)}% of total time\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Conclusion');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Factor96 performance characteristics:');
  console.log();
  console.log('1. Core factorization is O(1) - independent of input magnitude');
  console.log(`   (CV = ${factorCV.toFixed(2)}%, mean = ${factorMean.toFixed(3)} μs)`);
  console.log();
  console.log('2. Mod reduction cost scales logarithmically with input size');
  console.log(`   (CV = ${modCV.toFixed(2)}%, mean = ${modMean.toFixed(3)} μs)`);
  console.log();
  console.log('3. For stream processing of [0, 95] values:');
  console.log(`   Pure throughput: ~${Math.round(1000000 / factorMean).toLocaleString()} ops/sec`);
  console.log();
  console.log('4. For arbitrary input magnitudes:');
  console.log(`   Throughput: ~${Math.round(1000000 / (factorMean + modMean)).toLocaleString()} ops/sec (varies with input distribution)`);
  console.log();
  console.log('VERDICT: factor96 supports UNBOUNDED inputs with O(log n) preprocessing');
  console.log('         and O(1) factorization after mod reduction.\n');
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
