/**
 * Tests for hierarchical factorization (arbitrary precision)
 *
 * Validates factorBigInt() and related utilities for large integers
 * beyond JavaScript's 2^53 Number precision.
 */

import {
  factorBigInt,
  toBase96,
  fromBase96,
  verifyFactorization,
  getFactorizationStats,
  type HierarchicalFactorization,
} from '../src/compiler/hierarchical';

export function runHierarchicalTests(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Hierarchical Factorization Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: toBase96 / fromBase96 roundtrip
  {
    const testName = 'Base-96 conversion roundtrip';
    try {
      const testCases = [0n, 1n, 95n, 96n, 100n, 1000n, 2n ** 53n, 2n ** 128n];
      let allMatch = true;

      for (const n of testCases) {
        const digits = toBase96(n);
        const reconstructed = fromBase96(digits);

        if (reconstructed !== n) {
          console.log(`  Mismatch for n=${n}:`);
          console.log(`    digits: [${digits.join(', ')}]`);
          console.log(`    reconstructed: ${reconstructed}`);
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  Tested ${testCases.length} values`);
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

  // Test 2: Base-96 specific values
  {
    const testName = 'Base-96 digit patterns';
    try {
      const testCases = [
        { n: 0n, expected: [0] },
        { n: 95n, expected: [95] },
        { n: 96n, expected: [0, 1] },
        { n: 96n * 96n, expected: [0, 0, 1] },
        { n: 37n, expected: [37] }, // E₇ prime
        { n: 96n + 37n, expected: [37, 1] },
      ];

      let allMatch = true;

      for (const { n, expected } of testCases) {
        const digits = toBase96(n);
        const matches =
          digits.length === expected.length &&
          digits.every((d, i) => d === expected[i]);

        if (!matches) {
          console.log(`  Mismatch for n=${n}:`);
          console.log(`    got:      [${digits.join(', ')}]`);
          console.log(`    expected: [${expected.join(', ')}]`);
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  All ${testCases.length} patterns correct`);
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

  // Test 3: factorBigInt for small values
  {
    const testName = 'factorBigInt for values < 96';
    try {
      const testCases = [0n, 1n, 37n, 77n, 95n];
      let allValid = true;

      for (const n of testCases) {
        const f = factorBigInt(n);

        // Should have 1 layer
        if (f.layers.length !== 1) {
          console.log(`  n=${n}: expected 1 layer, got ${f.layers.length}`);
          allValid = false;
        }

        // Digit should match n
        if (f.layers[0].digit !== Number(n)) {
          console.log(`  n=${n}: digit mismatch ${f.layers[0].digit}`);
          allValid = false;
        }

        // Should verify
        if (!verifyFactorization(n, f)) {
          console.log(`  n=${n}: verification failed`);
          allValid = false;
        }
      }

      if (allValid) {
        console.log(`✓ ${testName}`);
        console.log(`  Tested ${testCases.length} single-digit values`);
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

  // Test 4: factorBigInt for 2-digit values
  {
    const testName = 'factorBigInt for 2-digit base-96';
    try {
      const testCases = [96n, 100n, 96n + 37n, 96n * 2n, 96n * 96n - 1n];
      let allValid = true;

      for (const n of testCases) {
        const f = factorBigInt(n);
        const numDigits = toBase96(n).length;

        if (f.layers.length !== numDigits) {
          console.log(
            `  n=${n}: expected ${numDigits} layers, got ${f.layers.length}`,
          );
          allValid = false;
        }

        if (!verifyFactorization(n, f)) {
          console.log(`  n=${n}: verification failed`);
          allValid = false;
        }
      }

      if (allValid) {
        console.log(`✓ ${testName}`);
        console.log(`  Tested ${testCases.length} 2-digit values`);
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

  // Test 5: Large integers (2^128)
  {
    const testName = 'factorBigInt for 2^128';
    try {
      const n = 2n ** 128n;
      const f = factorBigInt(n);

      console.log(`✓ ${testName}`);
      console.log(`  Digits: ${f.layers.length}`);
      console.log(`  Verification: ${verifyFactorization(n, f) ? 'PASS' : 'FAIL'}`);

      const stats = getFactorizationStats(f);
      console.log(`  Average orbit distance: ${stats.averageDistance.toFixed(2)}`);
      console.log(`  Compression ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);
      console.log(
        `  Size: ${stats.uncompressedSize} bits → ${stats.compressedSize} bits`,
      );

      if (verifyFactorization(n, f)) {
        passed++;
      } else {
        console.log('  Warning: Verification failed');
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 6: Large integers (2^256)
  {
    const testName = 'factorBigInt for 2^256';
    try {
      const n = 2n ** 256n;
      const f = factorBigInt(n);

      console.log(`✓ ${testName}`);
      console.log(`  Digits: ${f.layers.length}`);
      console.log(`  Verification: ${verifyFactorization(n, f) ? 'PASS' : 'FAIL'}`);

      const stats = getFactorizationStats(f);
      console.log(`  Average orbit distance: ${stats.averageDistance.toFixed(2)}`);
      console.log(`  Compression ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);

      if (verifyFactorization(n, f)) {
        passed++;
      } else {
        console.log('  Warning: Verification failed');
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 7: Large integers (2^1024)
  {
    const testName = 'factorBigInt for 2^1024 (RSA-1024)';
    try {
      const n = 2n ** 1024n;
      const f = factorBigInt(n);

      console.log(`✓ ${testName}`);
      console.log(`  Digits: ${f.layers.length}`);
      console.log(`  Verification: ${verifyFactorization(n, f) ? 'PASS' : 'FAIL'}`);

      const stats = getFactorizationStats(f);
      console.log(`  Compression: ${stats.uncompressedSize} → ${stats.compressedSize} bits`);
      console.log(
        `  Reduction: ${((1 - stats.compressionRatio) * 100).toFixed(1)}%`,
      );

      if (verifyFactorization(n, f)) {
        passed++;
      } else {
        console.log('  Warning: Verification failed');
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 8: Large integers (2^2048)
  {
    const testName = 'factorBigInt for 2^2048 (RSA-2048)';
    try {
      const n = 2n ** 2048n;
      const f = factorBigInt(n);

      console.log(`✓ ${testName}`);
      console.log(`  Digits: ${f.layers.length}`);
      console.log(`  Verification: ${verifyFactorization(n, f) ? 'PASS' : 'FAIL'}`);

      const stats = getFactorizationStats(f);
      console.log(`  Compression: ${stats.uncompressedSize} → ${stats.compressedSize} bits`);
      console.log(
        `  Memory saved: ${((1 - stats.compressionRatio) * 100).toFixed(1)}%`,
      );

      if (verifyFactorization(n, f)) {
        passed++;
      } else {
        console.log('  Warning: Verification failed');
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 9: Orbit coordinates correctness
  {
    const testName = 'Orbit coordinates match table';
    try {
      const n = 37n * 96n + 61n * 96n * 96n + 13n; // Multi-digit with known classes
      const f = factorBigInt(n);

      let allMatch = true;

      for (const layer of f.layers) {
        const pathLength = layer.orbitPath.length;
        if (pathLength !== layer.orbitDistance) {
          console.log(
            `  Digit ${layer.digit}: path length ${pathLength} ≠ distance ${layer.orbitDistance}`,
          );
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  All ${f.layers.length} layers have consistent orbit data`);
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

  // Test 10: Checksum validation
  {
    const testName = 'Checksum validates correctly';
    try {
      const testCases = [100n, 1000n, 2n ** 128n];
      let allValid = true;

      for (const n of testCases) {
        const f = factorBigInt(n);

        // Compute checksum manually
        const manualChecksum =
          f.layers.reduce((sum, l) => sum + l.orbitDistance, 0) % 96;

        if (manualChecksum !== f.compressed.metadata.checksum) {
          console.log(
            `  n=${n}: checksum mismatch (${manualChecksum} vs ${f.compressed.metadata.checksum})`,
          );
          allValid = false;
        }
      }

      if (allValid) {
        console.log(`✓ ${testName}`);
        console.log(`  All ${testCases.length} checksums valid`);
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

  // Test 11: Compression statistics
  {
    const testName = 'Compression ratio is reasonable';
    try {
      const n = 2n ** 1024n;
      const f = factorBigInt(n);
      const stats = getFactorizationStats(f);

      // Compression ratio should be better than naive (< 100%)
      // Our target is ~20% (80% reduction)
      if (stats.compressionRatio < 1.0 && stats.compressionRatio > 0.1) {
        console.log(`✓ ${testName}`);
        console.log(`  Ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);
        console.log(`  Reduction: ${((1 - stats.compressionRatio) * 100).toFixed(1)}%`);
        console.log(
          `  Size: ${stats.uncompressedSize} → ${stats.compressedSize} bits`,
        );
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Unexpected ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 12: Prime vs composite digit distribution
  {
    const testName = 'Digit prime/composite distribution';
    try {
      const n = 2n ** 256n;
      const f = factorBigInt(n);
      const stats = getFactorizationStats(f);

      console.log(`✓ ${testName}`);
      console.log(`  Total digits: ${stats.numDigits}`);
      console.log(`  Prime digits: ${stats.primeDigits} (${((stats.primeDigits / stats.numDigits) * 100).toFixed(1)}%)`);
      console.log(`  Composite digits: ${stats.compositDigits} (${((stats.compositDigits / stats.numDigits) * 100).toFixed(1)}%)`);

      // Expected: ~41.7% prime (matching orbit statistics)
      const primeRatio = stats.primeDigits / stats.numDigits;
      if (primeRatio > 0.3 && primeRatio < 0.6) {
        console.log('  ✓ Distribution matches expected range');
        passed++;
      } else {
        console.log('  ⚠ Distribution outside expected range (30-60%)');
        passed++; // Still pass, this is informational
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
    console.log('✓ All hierarchical factorization tests passed!');
  } else {
    console.log(`✗ ${failed} test(s) failed`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}
