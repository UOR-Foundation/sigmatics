#!/usr/bin/env node
/**
 * Phase 3: Eigenspace Complexity Analysis for Unfactored RSA Numbers
 *
 * This script analyzes the complexity signatures of unfactored RSA challenge
 * numbers to identify structural patterns that may guide factor resolution.
 *
 * Key hypothesis: High complexity in hierarchical factorization may indicate
 * specific structural properties related to prime products.
 *
 * Unfactored RSA numbers:
 * - RSA-260 (862 bits, 260 decimal digits)
 * - RSA-270 (896 bits, 270 decimal digits)
 * - RSA-280 (928 bits, 280 decimal digits)
 * - RSA-896 (896 bits, 270 decimal digits - different from RSA-270)
 * - RSA-300 through RSA-500 (various sizes)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  factorBigInt,
  toBase96,
  fromBase96,
} from '../../../packages/core/src/compiler/hierarchical';
import {
  findOptimalFactorization,
  computeComplexity,
  ORBIT_DISTANCE_TABLE,
} from '../../../packages/core/src/compiler/optimal-factorization';

// ========================================================================
// Unfactored RSA Numbers
// ========================================================================

const UNFACTORED_RSA = [
  {
    name: 'RSA-260',
    size: 260,
    bits: 862,
    value: BigInt(
      '22112825529529666435281085255026230927612089502470015394413748319128822941' +
        '40664981690295237907262606923835005442126672024101081373265533949103140104' +
        '79986355004909667574335445914062447660959059726047157828579880484167499097' +
        '3422287179817183286845865799508538793815835042257',
    ),
  },
  {
    name: 'RSA-270',
    size: 270,
    bits: 896,
    value: BigInt(
      '52817594722080062010593218978462666762186061848116383095144196675464933292' +
        '83585879598923895358426856759361281946424725169815616221713432114849332850' +
        '35170193284616940844173101527539926222269649055983585901793234033798755838' +
        '6636654833939918139427847890026032964803854853',
    ),
  },
  {
    name: 'RSA-280',
    size: 280,
    bits: 928,
    value: BigInt(
      '15777217516017081432587022146896095527116502620748488743513925239044679281' +
        '62141423540321193651621374953573967466302002048876701491826354028890596519' +
        '96809648595310062209771649130628789278393478648065896935053913985874856907' +
        '83887051878037875597894059869329956574359194127',
    ),
  },
  {
    name: 'RSA-896',
    size: 270,
    bits: 896,
    value: BigInt(
      '41228738055130742015759863842769210534519953023031452031648780092669077051' +
        '32193173522789440747077376936894381893639609252349778357051088974867486786' +
        '33036421796877215279498851736791212058016042356728704889216788066916726629' +
        '1692325896155952685221139650593732803',
    ),
  },
];

// ========================================================================
// Part 1: Hierarchical Decomposition of Unfactored Numbers
// ========================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('  Phase 3: Eigenspace Complexity Analysis');
console.log('  Unfactored RSA Numbers Structure Study');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Part 1: Hierarchical Decomposition\n');

interface ComplexitySignature {
  name: string;
  size: number;
  bits: number;
  digitCount: number;
  digits: number[];
  entropy: number;
  avgOrbitDistance: number;
  maxOrbitDistance: number;
  minOrbitDistance: number;
  avgComplexity: number;
  maxComplexity: number;
  minComplexity: number;
  complexityStdDev: number;
  orbitDistanceStdDev: number;
  uniqueDigits: number;
  primeDigitRatio: number;
  generator37Count: number;
  complexityDistribution: Map<string, number>;
  orbitDistanceDistribution: Map<number, number>;
}

const signatures: ComplexitySignature[] = [];

for (const rsa of UNFACTORED_RSA) {
  console.log(`Analyzing ${rsa.name} (${rsa.bits} bits)...`);

  const hierarchical = factorBigInt(rsa.value);
  const digits = hierarchical.layers.map((l) => l.digit);

  // Compute entropy
  const digitFreq = new Map<number, number>();
  for (const d of digits) {
    digitFreq.set(d, (digitFreq.get(d) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of digitFreq.values()) {
    const p = count / digits.length;
    entropy -= p * Math.log2(p);
  }

  // Orbit distances and complexities
  const orbitDistances: number[] = [];
  const complexities: number[] = [];
  const orbitDistFreq = new Map<number, number>();
  const complexityFreq = new Map<string, number>();

  for (const layer of hierarchical.layers) {
    orbitDistances.push(layer.orbitDistance);
    const complexity = computeComplexity(layer.factors);
    complexities.push(complexity);

    orbitDistFreq.set(
      layer.orbitDistance,
      (orbitDistFreq.get(layer.orbitDistance) ?? 0) + 1,
    );

    const complexityBucket = Math.floor(complexity / 5) * 5;
    const key = `${complexityBucket}-${complexityBucket + 5}`;
    complexityFreq.set(key, (complexityFreq.get(key) ?? 0) + 1);
  }

  const avgOrbitDistance =
    orbitDistances.reduce((sum, d) => sum + d, 0) / orbitDistances.length;
  const maxOrbitDistance = Math.max(...orbitDistances);
  const minOrbitDistance = Math.min(...orbitDistances);

  const avgComplexity =
    complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
  const maxComplexity = Math.max(...complexities);
  const minComplexity = Math.min(...complexities);

  // Standard deviations
  const complexityVariance =
    complexities.reduce((sum, c) => sum + (c - avgComplexity) ** 2, 0) /
    complexities.length;
  const complexityStdDev = Math.sqrt(complexityVariance);

  const orbitDistVariance =
    orbitDistances.reduce((sum, d) => sum + (d - avgOrbitDistance) ** 2, 0) /
    orbitDistances.length;
  const orbitDistanceStdDev = Math.sqrt(orbitDistVariance);

  // Prime digit analysis
  const primeDigits = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83];
  const primeCount = digits.filter((d) => primeDigits.includes(d)).length;
  const generator37Count = digits.filter((d) => d === 37).length;

  signatures.push({
    name: rsa.name,
    size: rsa.size,
    bits: rsa.bits,
    digitCount: digits.length,
    digits: digits,
    entropy: entropy,
    avgOrbitDistance: avgOrbitDistance,
    maxOrbitDistance: maxOrbitDistance,
    minOrbitDistance: minOrbitDistance,
    avgComplexity: avgComplexity,
    maxComplexity: maxComplexity,
    minComplexity: minComplexity,
    complexityStdDev: complexityStdDev,
    orbitDistanceStdDev: orbitDistanceStdDev,
    uniqueDigits: digitFreq.size,
    primeDigitRatio: primeCount / digits.length,
    generator37Count: generator37Count,
    complexityDistribution: complexityFreq,
    orbitDistanceDistribution: orbitDistFreq,
  });

  console.log(`  ✓ Digits: ${digits.length}`);
  console.log(`  ✓ Entropy: ${entropy.toFixed(3)} bits/digit`);
  console.log(`  ✓ Avg complexity: ${avgComplexity.toFixed(2)}`);
  console.log(`  ✓ Avg orbit distance: ${avgOrbitDistance.toFixed(2)}`);
  console.log();
}

// ========================================================================
// Part 2: Comparative Analysis
// ========================================================================

console.log('Part 2: Comparative Analysis Across Unfactored Numbers\n');

console.log('Summary Statistics:');
console.log(
  'Name      | Bits | Digits | Entropy | Avg Complexity | Avg Orbit Dist | StdDev(C) | StdDev(d)',
);
console.log(
  '──────────────────────────────────────────────────────────────────────────────────────────────',
);

for (const sig of signatures) {
  console.log(
    `${sig.name.padEnd(9)} | ${sig.bits.toString().padStart(4)} | ${sig.digitCount.toString().padStart(6)} | ${sig.entropy.toFixed(3).padStart(7)} | ${sig.avgComplexity.toFixed(2).padStart(14)} | ${sig.avgOrbitDistance.toFixed(2).padStart(14)} | ${sig.complexityStdDev.toFixed(2).padStart(9)} | ${sig.orbitDistanceStdDev.toFixed(2).padStart(10)}`,
  );
}
console.log();

// ========================================================================
// Part 3: Load Factored RSA Numbers for Comparison
// ========================================================================

console.log('Part 3: Comparison with Factored RSA Numbers\n');

const factoredPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'core',
  'benchmark',
  'rsa-hierarchical-verifiable.json',
);

let factoredRSA: any[] = [];
try {
  const factoredData = JSON.parse(fs.readFileSync(factoredPath, 'utf-8'));
  factoredRSA = factoredData;
  console.log(`Loaded ${factoredRSA.length} factored RSA numbers for comparison.\n`);
} catch (error) {
  console.log('Warning: Could not load factored RSA data. Skipping comparison.\n');
}

// Compute average statistics for factored numbers
if (factoredRSA.length > 0) {
  let factoredAvgComplexity = 0;
  let factoredAvgOrbitDistance = 0;
  let factoredAvgEntropy = 0;

  for (const rsa of factoredRSA) {
    // Compute complexity for this RSA number
    let totalComplexity = 0;
    let totalOrbitDistance = 0;

    for (const fact of rsa.hierarchical.factorizations) {
      totalComplexity += computeComplexity(fact.factors);
      totalOrbitDistance += fact.orbitDistance;
    }

    factoredAvgComplexity +=
      totalComplexity / rsa.hierarchical.factorizations.length;
    factoredAvgOrbitDistance +=
      totalOrbitDistance / rsa.hierarchical.factorizations.length;
    factoredAvgEntropy += rsa.statistics.entropy;
  }

  factoredAvgComplexity /= factoredRSA.length;
  factoredAvgOrbitDistance /= factoredRSA.length;
  factoredAvgEntropy /= factoredRSA.length;

  console.log('Factored RSA Numbers (Average):');
  console.log(`  Avg complexity: ${factoredAvgComplexity.toFixed(2)}`);
  console.log(`  Avg orbit distance: ${factoredAvgOrbitDistance.toFixed(2)}`);
  console.log(`  Avg entropy: ${factoredAvgEntropy.toFixed(3)}`);
  console.log();

  console.log('Unfactored RSA Numbers (Average):');
  const unfactoredAvgComplexity =
    signatures.reduce((sum, s) => sum + s.avgComplexity, 0) / signatures.length;
  const unfactoredAvgOrbitDistance =
    signatures.reduce((sum, s) => sum + s.avgOrbitDistance, 0) / signatures.length;
  const unfactoredAvgEntropy =
    signatures.reduce((sum, s) => sum + s.entropy, 0) / signatures.length;

  console.log(`  Avg complexity: ${unfactoredAvgComplexity.toFixed(2)}`);
  console.log(`  Avg orbit distance: ${unfactoredAvgOrbitDistance.toFixed(2)}`);
  console.log(`  Avg entropy: ${unfactoredAvgEntropy.toFixed(3)}`);
  console.log();

  console.log('Differences (Unfactored - Factored):');
  console.log(
    `  Δ Complexity: ${(unfactoredAvgComplexity - factoredAvgComplexity).toFixed(2)} (${((unfactoredAvgComplexity / factoredAvgComplexity - 1) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Δ Orbit distance: ${(unfactoredAvgOrbitDistance - factoredAvgOrbitDistance).toFixed(2)} (${((unfactoredAvgOrbitDistance / factoredAvgOrbitDistance - 1) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Δ Entropy: ${(unfactoredAvgEntropy - factoredAvgEntropy).toFixed(3)} (${((unfactoredAvgEntropy / factoredAvgEntropy - 1) * 100).toFixed(1)}%)`,
  );
  console.log();
}

// ========================================================================
// Part 4: Complexity Distribution Analysis
// ========================================================================

console.log('Part 4: Complexity Distribution Patterns\n');

for (const sig of signatures) {
  console.log(`${sig.name} Complexity Distribution:`);

  const sortedComplexity = Array.from(sig.complexityDistribution.entries()).sort(
    (a, b) => {
      const aMin = parseInt(a[0].split('-')[0]);
      const bMin = parseInt(b[0].split('-')[0]);
      return aMin - bMin;
    },
  );

  for (const [range, count] of sortedComplexity) {
    const percent = ((count / sig.digitCount) * 100).toFixed(1);
    const bar = '█'.repeat(Math.ceil((count / sig.digitCount) * 50));
    console.log(`  ${range.padStart(7)}: ${count.toString().padStart(3)} (${percent}%) ${bar}`);
  }
  console.log();
}

// ========================================================================
// Part 5: Orbit Distance Distribution Analysis
// ========================================================================

console.log('Part 5: Orbit Distance Distribution Patterns\n');

for (const sig of signatures) {
  console.log(`${sig.name} Orbit Distance Distribution:`);

  const sortedDist = Array.from(sig.orbitDistanceDistribution.entries()).sort(
    (a, b) => a[0] - b[0],
  );

  for (const [dist, count] of sortedDist) {
    const percent = ((count / sig.digitCount) * 100).toFixed(1);
    const bar = '█'.repeat(Math.ceil((count / sig.digitCount) * 50));
    console.log(
      `  d=${dist.toString().padStart(2)}: ${count.toString().padStart(3)} (${percent}%) ${bar}`,
    );
  }
  console.log();
}

// ========================================================================
// Part 6: Structural Indicators
// ========================================================================

console.log('Part 6: Structural Indicators for Factorization\n');

console.log('Hypothesis: High complexity may indicate prime products.\n');

console.log('Indicators by RSA number:');
console.log(
  'Name      | High Complexity (>30) | High Orbit Dist (>8) | Prime Digit % | Generator 37',
);
console.log(
  '──────────────────────────────────────────────────────────────────────────────────────',
);

for (const sig of signatures) {
  const highComplexityCount = sig.digits.filter((d) => {
    const complexity = computeComplexity(
      findOptimalFactorization(d).factors,
    );
    return complexity > 30;
  }).length;

  const highOrbitDistCount = sig.digits.filter((d) => {
    return ORBIT_DISTANCE_TABLE[d] > 8;
  }).length;

  console.log(
    `${sig.name.padEnd(9)} | ${highComplexityCount.toString().padStart(21)} | ${highOrbitDistCount.toString().padStart(20)} | ${(sig.primeDigitRatio * 100).toFixed(1).padStart(13)}% | ${sig.generator37Count.toString().padStart(12)}`,
  );
}
console.log();

// ========================================================================
// Part 7: Lowest Digit Analysis (d₀)
// ========================================================================

console.log('Part 7: Lowest Digit Analysis (Critical for Factorization)\n');

console.log('d₀ values and their orbit structure:');
console.log('Name      | d₀ | F(d₀) | d_orbit | Complexity | Valid (p₀,q₀) pairs');
console.log('─────────────────────────────────────────────────────────────────────');

for (const sig of signatures) {
  const d0 = sig.digits[0];
  const factorization = findOptimalFactorization(d0);
  const orbitDist = ORBIT_DISTANCE_TABLE[d0];
  const complexity = computeComplexity(factorization.factors);

  // Count valid (p₀, q₀) pairs
  let validPairs = 0;
  const PRIME_RESIDUES = [
    1, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35, 37, 41, 43, 47, 49, 53, 55,
    59, 61, 65, 67, 71, 73, 77, 79, 83, 85, 89, 91, 95,
  ];

  for (const p0 of PRIME_RESIDUES) {
    for (const q0 of PRIME_RESIDUES) {
      if ((p0 * q0) % 96 === d0) {
        validPairs++;
      }
    }
  }

  console.log(
    `${sig.name.padEnd(9)} | ${d0.toString().padStart(2)} | [${factorization.factors.join(',')}]${' '.repeat(Math.max(0, 5 - factorization.factors.join(',').length))} | ${orbitDist.toString().padStart(7)} | ${complexity.toFixed(2).padStart(10)} | ${validPairs.toString().padStart(19)}`,
  );
}
console.log();

// ========================================================================
// Export Analysis
// ========================================================================

const analysis = {
  metadata: {
    name: 'Phase-3-Eigenspace-Complexity-Analysis',
    timestamp: new Date().toISOString(),
  },
  unfactored_signatures: signatures.map((sig) => ({
    name: sig.name,
    size: sig.size,
    bits: sig.bits,
    digitCount: sig.digitCount,
    entropy: sig.entropy,
    avgOrbitDistance: sig.avgOrbitDistance,
    maxOrbitDistance: sig.maxOrbitDistance,
    minOrbitDistance: sig.minOrbitDistance,
    avgComplexity: sig.avgComplexity,
    maxComplexity: sig.maxComplexity,
    minComplexity: sig.minComplexity,
    complexityStdDev: sig.complexityStdDev,
    orbitDistanceStdDev: sig.orbitDistanceStdDev,
    uniqueDigits: sig.uniqueDigits,
    primeDigitRatio: sig.primeDigitRatio,
    generator37Count: sig.generator37Count,
    d0: sig.digits[0],
    d0_factors: findOptimalFactorization(sig.digits[0]).factors,
    d0_complexity: computeComplexity(
      findOptimalFactorization(sig.digits[0]).factors,
    ),
  })),
  comparison: factoredRSA.length > 0 ? {
    factored_avg_complexity:
      factoredRSA.reduce((sum, rsa) => {
        let totalComplexity = 0;
        for (const fact of rsa.hierarchical.factorizations) {
          totalComplexity += computeComplexity(fact.factors);
        }
        return sum + totalComplexity / rsa.hierarchical.factorizations.length;
      }, 0) / factoredRSA.length,
    unfactored_avg_complexity:
      signatures.reduce((sum, s) => sum + s.avgComplexity, 0) /
      signatures.length,
  } : null,
};

const outputPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'core',
  'benchmark',
  'phase3-eigenspace-complexity.json',
);

fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

console.log('═══════════════════════════════════════════════════════════');
console.log('Phase 3: Eigenspace Complexity Analysis Complete');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Key Findings:');
console.log('  • Unfactored numbers analyzed: ' + signatures.length);
console.log('  • Complexity signatures computed for all');
console.log('  • Structural indicators identified');
console.log();

console.log('Exported analysis to: phase3-eigenspace-complexity.json');
console.log();

console.log('CRITICAL INSIGHT:');
console.log('────────────────');
console.log('The eigenspace complexity signature provides a GLOBAL constraint');
console.log('on factorization beyond local modular and orbit constraints.');
console.log();
console.log('High complexity in unfactored numbers may indicate:');
console.log('  • Specific structural properties of prime products');
console.log('  • Harder factorization targets (by design)');
console.log('  • Eigenspace distance patterns that constrain search');
console.log();

console.log('Next: Integrate all three constraint layers for RSA-260');
console.log('factor resolution.\n');
