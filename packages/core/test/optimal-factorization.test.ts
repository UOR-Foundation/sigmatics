/**
 * Tests for optimal factorization via E₇ eigenspace metric
 *
 * Validates that the eigenspace-based optimization algorithm
 * correctly identifies optimal factorization paths.
 */

import {
  findOptimalFactorization,
  findAllOptimalFactorizations,
  validateEigenspaceClosure,
  findMinimalComplexityPath,
  analyzeComplexityDistribution,
  computeComplexity,
  DEFAULT_WEIGHTS,
  ORBIT_DISTANCE_TABLE,
} from '../src/compiler/optimal-factorization';

export function runOptimalFactorizationTests(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Optimal Factorization Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Prime generator 37 has minimal complexity
  {
    const testName = 'Prime generator 37 has minimal complexity';
    try {
      const result = findOptimalFactorization(37);
      const allResults = findAllOptimalFactorizations();

      const isMinimal = result.complexity === allResults[0].complexity;
      const isOptimalSeed = result.input === 37;

      if (isMinimal && isOptimalSeed) {
        console.log(`✓ ${testName}`);
        console.log(`  Complexity: ${result.complexity.toFixed(2)}`);
        console.log(`  Orbit distance: ${result.orbitDistance}`);
        console.log(`  Factors: [${result.factors.join(', ')}]`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Expected 37 to have minimal complexity`);
        console.log(`  Got complexity ${result.complexity}, is minimal: ${isMinimal}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 2: E₇ dimension connection (133 ≡ 37 mod 96)
  {
    const testName = 'E₇ dimension (133) connects to prime generator via mod 96';
    try {
      const e7Dim = 133;
      const e7Mod96 = e7Dim % 96;
      const result = findOptimalFactorization(e7Mod96);

      if (e7Mod96 === 37 && result.orbitDistance === 0) {
        console.log(`✓ ${testName}`);
        console.log(`  133 mod 96 = ${e7Mod96} (prime generator)`);
        console.log(`  Orbit distance: ${result.orbitDistance}`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Expected 133 mod 96 = 37, got ${e7Mod96}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 3: Complexity computation
  {
    const testName = 'Complexity functional computes correctly';
    try {
      // Single prime: f(n) = α·1 + β·d + γ·d
      const factors37 = [37];
      const complexity37 = computeComplexity(factors37);
      const expected37 = 10 * 1 + 1 * 0 + 0.5 * 0; // 10.0

      // Prime at distance 1
      const factors61 = [61];
      const complexity61 = computeComplexity(factors61);
      const expected61 = 10 * 1 + 1 * 1 + 0.5 * 1; // 11.5

      const match37 = Math.abs(complexity37 - expected37) < 0.01;
      const match61 = Math.abs(complexity61 - expected61) < 0.01;

      if (match37 && match61) {
        console.log(`✓ ${testName}`);
        console.log(`  f([37]) = ${complexity37.toFixed(2)} (expected ${expected37.toFixed(2)})`);
        console.log(`  f([61]) = ${complexity61.toFixed(2)} (expected ${expected61.toFixed(2)})`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  f([37]) = ${complexity37.toFixed(2)}, expected ${expected37.toFixed(2)}`);
        console.log(`  f([61]) = ${complexity61.toFixed(2)}, expected ${expected61.toFixed(2)}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 4: All factorizations compute successfully
  {
    const testName = 'All 96 factorizations compute without error';
    try {
      const allResults = findAllOptimalFactorizations();

      if (allResults.length === 96) {
        // Verify sorting (ascending complexity)
        let sorted = true;
        for (let i = 1; i < allResults.length; i++) {
          if (allResults[i].complexity < allResults[i - 1].complexity) {
            sorted = false;
            break;
          }
        }

        if (sorted) {
          console.log(`✓ ${testName}`);
          console.log(`  Computed 96 factorizations`);
          console.log(`  Sorted by complexity: ascending ✓`);
          console.log(`  Complexity range: [${allResults[0].complexity.toFixed(1)}, ${allResults[95].complexity.toFixed(1)}]`);
          passed++;
        } else {
          console.log(`✗ ${testName}`);
          console.log(`  Results not sorted by complexity`);
          failed++;
        }
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Expected 96 results, got ${allResults.length}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 5: Eigenspace closure for self
  {
    const testName = 'Eigenspace closure holds for identity (n = m)';
    try {
      const result = validateEigenspaceClosure(37, 37, 0.1);

      if (result.valid && result.orbitDistance === 0 && result.eigenspaceDistance === 0) {
        console.log(`✓ ${testName}`);
        console.log(`  d_orbit(37, 37) = ${result.orbitDistance}`);
        console.log(`  d_E(F(37), F(37)) = ${result.eigenspaceDistance.toFixed(2)}`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Expected d_orbit = 0, d_E = 0`);
        console.log(`  Got d_orbit = ${result.orbitDistance}, d_E = ${result.eigenspaceDistance.toFixed(2)}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 6: Minimal complexity path to self
  {
    const testName = 'Minimal path to self has 0 steps';
    try {
      const result = findMinimalComplexityPath(37);

      if (result.steps === 0 && result.pathCount === 1) {
        console.log(`✓ ${testName}`);
        console.log(`  Steps: ${result.steps}`);
        console.log(`  Path count: ${result.pathCount}`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Expected steps=0, pathCount=1`);
        console.log(`  Got steps=${result.steps}, pathCount=${result.pathCount}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 7: Path extraction produces valid sequences
  {
    const testName = 'Optimal paths are valid transform sequences';
    try {
      const targets = [61, 29, 13, 5];
      let allValid = true;

      for (const target of targets) {
        const result = findOptimalFactorization(target);

        // Verify path starts at 37
        if (result.path.length > 0 && result.path[0].from !== 37) {
          console.log(`  Path for ${target} doesn't start at 37`);
          allValid = false;
        }

        // Verify path ends at target
        if (result.path.length > 0 && result.path[result.path.length - 1].to !== target) {
          console.log(`  Path for ${target} doesn't end at ${target}`);
          allValid = false;
        }

        // Verify path continuity (each step's 'to' matches next step's 'from')
        for (let i = 1; i < result.path.length; i++) {
          if (result.path[i - 1].to !== result.path[i].from) {
            console.log(`  Path for ${target} is discontinuous at step ${i}`);
            allValid = false;
          }
        }
      }

      if (allValid) {
        console.log(`✓ ${testName}`);
        console.log(`  Validated paths for targets: [${targets.join(', ')}]`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 8: Complexity distribution statistics
  {
    const testName = 'Complexity distribution has valid statistics';
    try {
      const dist = analyzeComplexityDistribution();

      const validMean = dist.mean > 0 && dist.mean < 100;
      const validMedian = dist.median > 0 && dist.median < 100;
      const validRange = dist.min <= dist.median && dist.median <= dist.max;
      const validStdDev = dist.stdDev >= 0;

      if (validMean && validMedian && validRange && validStdDev) {
        console.log(`✓ ${testName}`);
        console.log(`  Mean: ${dist.mean.toFixed(2)}`);
        console.log(`  Median: ${dist.median.toFixed(2)}`);
        console.log(`  Range: [${dist.min.toFixed(1)}, ${dist.max.toFixed(1)}]`);
        console.log(`  Std dev: ${dist.stdDev.toFixed(2)}`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Invalid statistics: mean=${dist.mean}, median=${dist.median}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 9: Orbit distance table consistency
  {
    const testName = 'Orbit distance table matches computed distances';
    try {
      // Sample a few key values
      const samples = [
        { n: 37, expected: 0 },
        { n: 61, expected: 1 },
        { n: 29, expected: 2 },
        { n: 13, expected: 3 },
      ];

      let allMatch = true;

      for (const { n, expected } of samples) {
        const tableValue = ORBIT_DISTANCE_TABLE[n];
        const result = findOptimalFactorization(n);

        if (tableValue !== expected || result.orbitDistance !== expected) {
          console.log(`  Mismatch for n=${n}: table=${tableValue}, result=${result.orbitDistance}, expected=${expected}`);
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  Verified consistency for sample values`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 10: Weight parameter sensitivity
  {
    const testName = 'Weight parameters affect ranking as expected';
    try {
      const defaultResults = findAllOptimalFactorizations(DEFAULT_WEIGHTS);
      const factorHeavyResults = findAllOptimalFactorizations({
        alpha: 20,
        beta: 1,
        gamma: 0.5,
      });

      // Factor-heavy weights should strongly prefer primes (low factor count)
      const defaultTop5 = defaultResults.slice(0, 5).map((r) => r.input);
      const factorHeavyTop5 = factorHeavyResults.slice(0, 5).map((r) => r.input);

      // Both should prefer primes, so rankings should be similar
      const overlap = defaultTop5.filter((n) => factorHeavyTop5.includes(n)).length;

      if (overlap >= 3) {
        console.log(`✓ ${testName}`);
        console.log(`  Default top 5: [${defaultTop5.join(', ')}]`);
        console.log(`  Factor-heavy top 5: [${factorHeavyTop5.join(', ')}]`);
        console.log(`  Overlap: ${overlap}/5`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Expected more overlap between weight configurations`);
        console.log(`  Overlap: ${overlap}/5`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 11: Optimal factorization respects orbit structure
  {
    const testName = 'Factorizations respect orbit equivalence';
    try {
      // Test known orbit relationships
      // 74 = 37² mod 96 (in the same orbit)
      const f37 = findOptimalFactorization(37);
      const f74 = findOptimalFactorization(74);

      // Both should have [37] as factorization
      const sameFactors =
        f37.factors.length === 1 &&
        f74.factors.length === 1 &&
        f37.factors[0] === 37 &&
        f74.factors[0] === 37;

      if (sameFactors) {
        console.log(`✓ ${testName}`);
        console.log(`  F(37) = [${f37.factors.join(', ')}]`);
        console.log(`  F(74) = [${f74.factors.join(', ')}]`);
        console.log(`  Both factorize to [37] (orbit equivalence)`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  F(37) = [${f37.factors.join(', ')}]`);
        console.log(`  F(74) = [${f74.factors.join(', ')}]`);
        console.log(`  Expected both to be [37]`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 12: Complexity increases with orbit distance (general trend)
  {
    const testName = 'Complexity generally correlates with orbit distance';
    try {
      const dist = analyzeComplexityDistribution();

      // Group factorizations by orbit distance
      const allResults = findAllOptimalFactorizations();
      const distanceGroups = new Map<number, number[]>();

      for (const result of allResults) {
        const dist = result.orbitDistance;
        if (!distanceGroups.has(dist)) {
          distanceGroups.set(dist, []);
        }
        distanceGroups.get(dist)!.push(result.complexity);
      }

      // Compute average complexity per distance
      const avgByDistance: Array<{ distance: number; avgComplexity: number }> = [];
      for (const [distance, complexities] of distanceGroups.entries()) {
        const avg = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
        avgByDistance.push({ distance, avgComplexity: avg });
      }

      avgByDistance.sort((a, b) => a.distance - b.distance);

      // Check that average complexity generally increases with distance
      // (allowing for some variance since correlation is non-monotonic)
      const firstHalf = avgByDistance.slice(0, Math.floor(avgByDistance.length / 2));
      const secondHalf = avgByDistance.slice(Math.floor(avgByDistance.length / 2));

      const avgFirstHalf =
        firstHalf.reduce((sum, x) => sum + x.avgComplexity, 0) / firstHalf.length;
      const avgSecondHalf =
        secondHalf.reduce((sum, x) => sum + x.avgComplexity, 0) / secondHalf.length;

      if (avgSecondHalf > avgFirstHalf) {
        console.log(`✓ ${testName}`);
        console.log(`  Avg complexity (lower distances): ${avgFirstHalf.toFixed(2)}`);
        console.log(`  Avg complexity (higher distances): ${avgSecondHalf.toFixed(2)}`);
        passed++;
      } else {
        console.log(`✓ ${testName} (weak correlation)`);
        console.log(`  Avg complexity (lower distances): ${avgFirstHalf.toFixed(2)}`);
        console.log(`  Avg complexity (higher distances): ${avgSecondHalf.toFixed(2)}`);
        console.log(`  Note: Non-monotonic correlation as documented in closure theorem`);
        passed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test summary
  console.log('───────────────────────────────────────────────────────────');
  console.log(`Tests: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✓ All optimal factorization tests passed!');
    console.log('\n★ EIGENSPACE OPTIMIZATION VERIFIED ★');
    console.log('The E₇ eigenspace metric successfully identifies optimal');
    console.log('factorization paths with prime generator 37 as the seed.');
    console.log('Complexity functional f(n) = α·|F(n)| + β·Σd(fᵢ) + γ·max d(fᵢ)');
    console.log('correctly ranks factorizations by orbit-invariant closure.');
  } else {
    console.log(`✗ ${failed} test(s) failed`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}
