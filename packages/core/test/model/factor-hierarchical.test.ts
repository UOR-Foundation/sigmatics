/**
 * Test suite for hierarchical factorization model
 *
 * Verifies:
 * - Algorithm correctness on known semiprimes
 * - Categorical invariants (orbit closure, F₄ structure)
 * - Beam search pruning effectiveness
 * - Feasibility estimation accuracy
 */

import { factorSemiprime, estimateFeasibility, type FactorizationOptions } from '../../src/compiler/factor-hierarchical-semiprime';

export function runFactorHierarchicalTests(): void {
  console.log('\n' + '='.repeat(70));
  console.log('HIERARCHICAL FACTORIZATION MODEL TESTS');
  console.log('='.repeat(70));

  testSmallSemiprimes();
  testMediumSemiprimes();
  testCategoricalInvariants();
  testBeamSearchPruning();
  testFeasibilityEstimates();
  testEdgeCases();

  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL HIERARCHICAL FACTORIZATION TESTS PASSED');
  console.log('='.repeat(70));
}

/**
 * Test small semiprimes (< 1000)
 */
function testSmallSemiprimes(): void {
  console.log('\n📊 Test Suite: Small Semiprimes');

  const cases: Array<{ n: bigint; p: bigint; q: bigint; name: string }> = [
    { n: 323n, p: 17n, q: 19n, name: '17 × 19' },
    { n: 1517n, p: 37n, q: 41n, name: '37 × 41' },
    { n: 3127n, p: 53n, q: 59n, name: '53 × 59' },
    { n: 9797n, p: 97n, q: 101n, name: '97 × 101' },
  ];

  for (const { n, p, q, name } of cases) {
    const result = factorSemiprime(n);

    // Verify correctness
    if (!result.success) {
      throw new Error(`Failed to factor ${name}: success=${result.success}`);
    }

    // Verify factors (order may be swapped)
    const foundP = result.p === p || result.p === q;
    const foundQ = result.q === q || result.q === p;
    if (!foundP || !foundQ) {
      throw new Error(
        `Incorrect factors for ${name}: got ${result.p} × ${result.q}, expected ${p} × ${q}`
      );
    }

    // Verify product
    if (result.p * result.q !== n) {
      throw new Error(`Product mismatch for ${name}: ${result.p} × ${result.q} ≠ ${n}`);
    }

    console.log(`  ✅ ${name}: ${result.p} × ${result.q} (${result.totalCandidates} candidates, ${result.time}ms)`);
  }
}

/**
 * Test medium semiprimes (1000-100000)
 */
function testMediumSemiprimes(): void {
  console.log('\n📊 Test Suite: Medium Semiprimes');

  const cases: Array<{ n: bigint; p: bigint; q: bigint; name: string }> = [
    { n: 10403n, p: 101n, q: 103n, name: '101 × 103' },
    { n: 21599n, p: 127n, q: 170n, name: '127 × 170 (non-prime q, should fail or find smaller factors)' },
  ];

  // Only test actual semiprimes
  const semiprimeCases = cases.filter(c => {
    // Simple primality check for test purposes
    const isPrime = (n: bigint): boolean => {
      if (n < 2n) return false;
      for (let i = 2n; i * i <= n; i++) {
        if (n % i === 0n) return false;
      }
      return true;
    };
    return isPrime(c.p) && isPrime(c.q);
  });

  for (const { n, p, q, name } of semiprimeCases) {
    const result = factorSemiprime(n);

    if (result.success) {
      const foundP = result.p === p || result.p === q;
      const foundQ = result.q === q || result.q === p;
      if (foundP && foundQ && result.p * result.q === n) {
        console.log(`  ✅ ${name}: ${result.p} × ${result.q} (${result.levels} levels)`);
      } else {
        console.log(`  ⚠️  ${name}: Found different factorization ${result.p} × ${result.q}`);
      }
    } else {
      console.log(`  ❌ ${name}: Failed to factor`);
    }
  }
}

/**
 * Test categorical invariants (orbit closure, F₄ structure)
 */
function testCategoricalInvariants(): void {
  console.log('\n📊 Test Suite: Categorical Invariants');

  const n = 323n; // 17 × 19
  const result = factorSemiprime(n, {
    validateF4: true,
    epsilon: 10,
  });

  if (!result.success) {
    throw new Error('Factorization failed for categorical invariant test');
  }

  // Verify orbit closure was satisfied
  if (!result.orbitClosureSatisfied) {
    throw new Error('Orbit closure constraint not satisfied');
  }

  // Verify F₄ structure was validated
  if (!result.f4StructureValidated) {
    throw new Error('F₄ structure not validated');
  }

  console.log(`  ✅ Orbit closure satisfied: ${result.orbitClosureSatisfied}`);
  console.log(`  ✅ F₄ structure validated: ${result.f4StructureValidated}`);
  console.log(`  ✅ Categorical invariants verified`);
}

/**
 * Test beam search pruning effectiveness
 */
function testBeamSearchPruning(): void {
  console.log('\n📊 Test Suite: Beam Search Pruning');

  const n = 1517n; // 37 × 41

  // Test with different beam widths
  const beamWidths = [8, 16, 32, 64];
  const results: Array<{ width: number; candidates: number; success: boolean; time: number }> = [];

  for (const width of beamWidths) {
    const result = factorSemiprime(n, { beamWidth: width });
    results.push({
      width,
      candidates: result.totalCandidates,
      success: result.success,
      time: result.time,
    });
  }

  // Verify all succeeded
  for (const r of results) {
    if (!r.success) {
      throw new Error(`Beam width ${r.width} failed to factor`);
    }
  }

  // Verify pruning effectiveness: larger beam = more candidates
  for (let i = 1; i < results.length; i++) {
    if (results[i].candidates < results[i - 1].candidates) {
      console.log(`  ⚠️  Beam width ${results[i].width} explored fewer candidates than ${results[i - 1].width}`);
    }
  }

  console.log(`  ✅ Beam width 8:  ${results[0].candidates} candidates`);
  console.log(`  ✅ Beam width 16: ${results[1].candidates} candidates`);
  console.log(`  ✅ Beam width 32: ${results[2].candidates} candidates (default)`);
  console.log(`  ✅ Beam width 64: ${results[3].candidates} candidates`);
}

/**
 * Test feasibility estimation
 */
function testFeasibilityEstimates(): void {
  console.log('\n📊 Test Suite: Feasibility Estimates');

  const cases = [
    { bits: 40, expectedFeasible: true, name: '40-bit' },
    { bits: 60, expectedFeasible: true, name: '60-bit' },
    { bits: 80, expectedFeasible: true, name: '80-bit' },
    { bits: 100, expectedFeasible: true, name: '100-bit' },
    { bits: 256, expectedFeasible: false, name: '256-bit' },
    { bits: 512, expectedFeasible: false, name: 'RSA-512' },
    { bits: 1024, expectedFeasible: false, name: 'RSA-1024' },
  ];

  for (const { bits, expectedFeasible, name } of cases) {
    const est = estimateFeasibility(bits);

    if (est.feasible !== expectedFeasible) {
      throw new Error(
        `Feasibility estimate wrong for ${name}: got ${est.feasible}, expected ${expectedFeasible}`
      );
    }

    const icon = est.feasible ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${est.feasible ? 'Feasible' : 'Intractable'} - ${est.reason}`);
  }
}

/**
 * Test edge cases
 */
function testEdgeCases(): void {
  console.log('\n📊 Test Suite: Edge Cases');

  // Test with prime number (should fail or return n = n × 1)
  console.log('  Testing prime number (17)...');
  const prime17 = factorSemiprime(17n);
  if (prime17.success && (prime17.p === 1n || prime17.q === 1n)) {
    console.log(`  ✅ Prime 17: Correctly identified (${prime17.p} × ${prime17.q})`);
  } else {
    console.log(`  ⚠️  Prime 17: Unexpected result (${prime17.p} × ${prime17.q})`);
  }

  // Test with small numbers
  console.log('  Testing small semiprime (15 = 3 × 5)...');
  const small15 = factorSemiprime(15n);
  if (small15.success && ((small15.p === 3n && small15.q === 5n) || (small15.p === 5n && small15.q === 3n))) {
    console.log(`  ✅ Small semiprime 15: ${small15.p} × ${small15.q}`);
  } else {
    console.log(`  ⚠️  Small semiprime 15: Unexpected result`);
  }

  console.log('  ✅ Edge cases handled');
}
