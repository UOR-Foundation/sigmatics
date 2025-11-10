/**
 * Tests for constant propagation fusion
 *
 * Validates that compile-time constants are properly fused
 * and produce identical results to runtime evaluation.
 */

import { Atlas } from '../src';

export function runFusionConstantTests(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Constant Propagation Fusion Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Compile-time constant matches runtime
  {
    const testName = 'Compile-time constant matches runtime';
    try {
      const runtimeModel = Atlas.Model.factor96();
      const fusedModel = Atlas.Model.factor96(77);

      const runtimeResult = runtimeModel.run({ n: 77 });
      const fusedResult = fusedModel.run({ n: 0 }); // n is ignored for fused model

      if (
        runtimeResult.length === fusedResult.length &&
        runtimeResult.every((v, i) => v === fusedResult[i])
      ) {
        console.log(`✓ ${testName}`);
        console.log(`  Runtime: [${runtimeResult}]`);
        console.log(`  Fused:   [${fusedResult}]`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Runtime: [${runtimeResult}]`);
        console.log(`  Fused:   [${fusedResult}]`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 2: Verify multiple constants
  {
    const testName = 'Multiple compile-time constants';
    try {
      const runtimeModel = Atlas.Model.factor96();
      const testCases = [5, 7, 11, 13, 77, 91, 95];
      let allMatch = true;

      for (const n of testCases) {
        const fusedModel = Atlas.Model.factor96(n);
        const runtimeResult = runtimeModel.run({ n });
        const fusedResult = fusedModel.run({ n: 0 }); // n is ignored for fused model

        if (
          !(
            runtimeResult.length === fusedResult.length &&
            runtimeResult.every((v, i) => v === fusedResult[i])
          )
        ) {
          console.log(`  Mismatch for n=${n}:`);
          console.log(`    Runtime: [${runtimeResult}]`);
          console.log(`    Fused:   [${fusedResult}]`);
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  Tested: [${testCases.join(', ')}]`);
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

  // Test 3: Verify all 96 values
  {
    const testName = 'All 96 class values';
    try {
      const runtimeModel = Atlas.Model.factor96();
      let allMatch = true;
      const mismatches: number[] = [];

      for (let n = 0; n < 96; n++) {
        const fusedModel = Atlas.Model.factor96(n);
        const runtimeResult = runtimeModel.run({ n });
        const fusedResult = fusedModel.run({ n: 0 }); // n is ignored for fused model

        if (
          !(
            runtimeResult.length === fusedResult.length &&
            runtimeResult.every((v, i) => v === fusedResult[i])
          )
        ) {
          allMatch = false;
          mismatches.push(n);
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  Verified all 96 class indices`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Mismatches at: [${mismatches.join(', ')}]`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 4: Modulo wrapping
  {
    const testName = 'Modulo wrapping (n >= 96)';
    try {
      const runtimeModel = Atlas.Model.factor96();
      const testCases = [96, 97, 173, 200, 1000];
      let allMatch = true;

      for (const n of testCases) {
        const fusedModel = Atlas.Model.factor96(n);
        const runtimeResult = runtimeModel.run({ n });
        const fusedResult = fusedModel.run({ n: 0 }); // n is ignored for fused model
        const expected = runtimeModel.run({ n: n % 96 });

        if (
          !(
            runtimeResult.length === fusedResult.length &&
            runtimeResult.every((v, i) => v === fusedResult[i]) &&
            fusedResult.length === expected.length &&
            fusedResult.every((v, i) => v === expected[i])
          )
        ) {
          console.log(`  Mismatch for n=${n} (${n % 96} mod 96):`);
          console.log(`    Runtime: [${runtimeResult}]`);
          console.log(`    Fused:   [${fusedResult}]`);
          console.log(`    Expected: [${expected}]`);
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  Tested: [${testCases.join(', ')}]`);
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

  // Test 5: Primes vs composites
  {
    const testName = 'Prime and composite values';
    try {
      const runtimeModel = Atlas.Model.factor96();
      const primes = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
      const composites = [6, 12, 18, 24, 30, 36, 42, 48, 54, 60];
      let allMatch = true;

      for (const n of [...primes, ...composites]) {
        const fusedModel = Atlas.Model.factor96(n);
        const runtimeResult = runtimeModel.run({ n });
        const fusedResult = fusedModel.run({ n: 0 }); // n is ignored for fused model

        // Primes should have single-element factorization
        if (primes.includes(n) && runtimeResult.length !== 1) {
          console.log(`  Warning: n=${n} expected to be prime but has factors [${runtimeResult}]`);
        }

        if (
          !(
            runtimeResult.length === fusedResult.length &&
            runtimeResult.every((v, i) => v === fusedResult[i])
          )
        ) {
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  Tested ${primes.length} primes and ${composites.length} composites`);
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

  // Summary
  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`Tests: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✓ All constant propagation fusion tests passed!');
  } else {
    console.log(`✗ ${failed} test(s) failed`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}
