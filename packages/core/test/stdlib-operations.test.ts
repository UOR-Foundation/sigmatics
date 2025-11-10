/**
 * Stdlib Operations Tests
 *
 * Tests for Phase 1 & 2 stdlib operations:
 * - Arithmetic: gcd96, lcm96
 * - Reduction: sum, product, max, min
 * - Factorization: factor96, isPrime96
 */

import { Atlas } from '../src';
import type { RingResult } from '../src/model/types';

export function runStdlibOperationsTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Stdlib Operations Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  function assertEqual<T>(actual: T, expected: T, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
      throw new Error(message ?? `Expected ${expectedStr}, got ${actualStr}`);
    }
  }

  // ==========================================================================
  // Arithmetic Operations Tests
  // ==========================================================================

  runTest('gcd96: GCD(12, 18) = 6', () => {
    const model = Atlas.Model.gcd96();
    const result = model.run({ a: 12, b: 18 });
    assertEqual(result, 6);
  });

  runTest('gcd96: GCD(48, 60) = 12', () => {
    const model = Atlas.Model.gcd96();
    const result = model.run({ a: 48, b: 60 });
    assertEqual(result, 12);
  });

  runTest('gcd96: GCD(0, 5) = 5', () => {
    const model = Atlas.Model.gcd96();
    const result = model.run({ a: 0, b: 5 });
    assertEqual(result, 5);
  });

  runTest('gcd96: GCD(7, 11) = 1 (coprime)', () => {
    const model = Atlas.Model.gcd96();
    const result = model.run({ a: 7, b: 11 });
    assertEqual(result, 1);
  });

  runTest('gcd96: GCD with values > 96 reduces mod 96', () => {
    const model = Atlas.Model.gcd96();
    const result = model.run({ a: 108, b: 114 }); // 108 % 96 = 12, 114 % 96 = 18
    assertEqual(result, 6); // GCD(12, 18) = 6
  });

  runTest('lcm96: LCM(12, 18) = 36', () => {
    const model = Atlas.Model.lcm96();
    const result = model.run({ a: 12, b: 18 });
    assertEqual(result, 36);
  });

  runTest('lcm96: LCM(4, 6) = 12', () => {
    const model = Atlas.Model.lcm96();
    const result = model.run({ a: 4, b: 6 });
    assertEqual(result, 12);
  });

  runTest('lcm96: LCM(0, 5) = 0', () => {
    const model = Atlas.Model.lcm96();
    const result = model.run({ a: 0, b: 5 });
    assertEqual(result, 0);
  });

  runTest('lcm96: LCM(7, 11) = 77', () => {
    const model = Atlas.Model.lcm96();
    const result = model.run({ a: 7, b: 11 });
    assertEqual(result, 77);
  });

  // ==========================================================================
  // Reduction Operations Tests
  // ==========================================================================

  runTest('sum: Sum of [1, 2, 3, 4, 5] = 15', () => {
    const model = Atlas.Model.sum();
    const result = model.run({ values: [1, 2, 3, 4, 5] });
    assertEqual(result, 15);
  });

  runTest('sum: Sum of empty array = 0', () => {
    const model = Atlas.Model.sum();
    const result = model.run({ values: [] });
    assertEqual(result, 0);
  });

  runTest('sum: Sum wraps mod 96', () => {
    const model = Atlas.Model.sum();
    const result = model.run({ values: [50, 60] }); // 110 % 96 = 14
    assertEqual(result, 14);
  });

  runTest('sum: Sum of [10, 20, 30] = 60', () => {
    const model = Atlas.Model.sum();
    const result = model.run({ values: [10, 20, 30] });
    assertEqual(result, 60);
  });

  runTest('product: Product of [2, 3, 4] = 24', () => {
    const model = Atlas.Model.product();
    const result = model.run({ values: [2, 3, 4] });
    assertEqual(result, 24);
  });

  runTest('product: Product of empty array = 1', () => {
    const model = Atlas.Model.product();
    const result = model.run({ values: [] });
    assertEqual(result, 1);
  });

  runTest('product: Product wraps mod 96', () => {
    const model = Atlas.Model.product();
    const result = model.run({ values: [10, 10] }); // 100 % 96 = 4
    assertEqual(result, 4);
  });

  runTest('product: Product of [5, 7] = 35', () => {
    const model = Atlas.Model.product();
    const result = model.run({ values: [5, 7] });
    assertEqual(result, 35);
  });

  runTest('max: Maximum of [3, 7, 2, 9, 1] = 9', () => {
    const model = Atlas.Model.max();
    const result = model.run({ values: [3, 7, 2, 9, 1] });
    assertEqual(result, 9);
  });

  runTest('max: Maximum of empty array = 0', () => {
    const model = Atlas.Model.max();
    const result = model.run({ values: [] });
    assertEqual(result, 0);
  });

  runTest('max: Maximum with values > 96 reduces mod 96', () => {
    const model = Atlas.Model.max();
    const result = model.run({ values: [100, 105, 110] }); // [4, 9, 14]
    assertEqual(result, 14);
  });

  runTest('min: Minimum of [3, 7, 2, 9, 1] = 1', () => {
    const model = Atlas.Model.min();
    const result = model.run({ values: [3, 7, 2, 9, 1] });
    assertEqual(result, 1);
  });

  runTest('min: Minimum of empty array = 0', () => {
    const model = Atlas.Model.min();
    const result = model.run({ values: [] });
    assertEqual(result, 0);
  });

  runTest('min: Minimum with values > 96 reduces mod 96', () => {
    const model = Atlas.Model.min();
    const result = model.run({ values: [100, 105, 110] }); // [4, 9, 14]
    assertEqual(result, 4);
  });

  // ==========================================================================
  // Factorization Operations Tests
  // ==========================================================================

  runTest('isPrime96: 1 is unit in ℤ₉₆', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 1 });
    assertEqual(result, true); // 1 is coprime to 96
  });

  runTest('isPrime96: 5 is prime in ℤ₉₆', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 5 });
    assertEqual(result, true);
  });

  runTest('isPrime96: 7 is prime in ℤ₉₆', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 7 });
    assertEqual(result, true);
  });

  runTest('isPrime96: 2 is NOT prime in ℤ₉₆ (divides 96)', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 2 });
    assertEqual(result, false);
  });

  runTest('isPrime96: 3 is NOT prime in ℤ₉₆ (divides 96)', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 3 });
    assertEqual(result, false);
  });

  runTest('isPrime96: 4 is NOT prime in ℤ₉₆', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 4 });
    assertEqual(result, false);
  });

  runTest('isPrime96: 11 is prime in ℤ₉₆', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 11 });
    assertEqual(result, true);
  });

  runTest('isPrime96: 13 is prime in ℤ₉₆', () => {
    const model = Atlas.Model.isPrime96();
    const result = model.run({ n: 13 });
    assertEqual(result, true);
  });

  runTest('factor96: Factor 0 = [0]', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 0 }) as number[];
    assertEqual(result, [0]);
  });

  runTest('factor96: Factor 1 = [1]', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 1 }) as number[];
    assertEqual(result, [1]);
  });

  runTest('factor96: Factor 5 = [5] (prime)', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 5 }) as number[];
    assertEqual(result, [5]);
  });

  runTest('factor96: Factor 25 = [5, 5]', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 25 }) as number[];
    assertEqual(result, [5, 5]);
  });

  runTest('factor96: Factor 35 = [5, 7]', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 35 }) as number[];
    assertEqual(result, [5, 7]);
  });

  runTest('factor96: Factor 49 = [7, 7]', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 49 }) as number[];
    assertEqual(result, [7, 7]);
  });

  runTest('factor96: Factor 77 = [7, 11]', () => {
    const model = Atlas.Model.factor96();
    const result = model.run({ n: 77 }) as number[];
    assertEqual(result, [7, 11]);
  });

  // ==========================================================================
  // Edge Cases and Consistency Tests
  // ==========================================================================

  runTest('Consistency: GCD(a, b) * LCM(a, b) = a * b (mod 96)', () => {
    const a = 12;
    const b = 18;

    const gcdModel = Atlas.Model.gcd96();
    const lcmModel = Atlas.Model.lcm96();

    const gcd = gcdModel.run({ a, b }) as number;
    const lcm = lcmModel.run({ a, b }) as number;

    // GCD * LCM = a * b for coprime-to-96 numbers
    const product1 = (gcd * lcm) % 96;
    const product2 = (a * b) % 96;

    assertEqual(product1, product2);
  });

  runTest('Consistency: sum([a, b]) = add96(a, b)', () => {
    const a = 50;
    const b = 60;

    const sumModel = Atlas.Model.sum();
    const addModel = Atlas.Model.add96('track');

    const sumResult = sumModel.run({ values: [a, b] }) as number;
    const addResult = addModel.run({ a, b }) as RingResult;

    assertEqual(sumResult, addResult.value);
  });

  runTest('Consistency: product([a, b]) = mul96(a, b)', () => {
    const a = 7;
    const b = 11;

    const productModel = Atlas.Model.product();
    const mulModel = Atlas.Model.mul96('track');

    const productResult = productModel.run({ values: [a, b] }) as number;
    const mulResult = mulModel.run({ a, b }) as RingResult;

    assertEqual(productResult, mulResult.value);
  });

  runTest('Perfect factorization: product(factor96(n)) = n (for factorizable n)', () => {
    const n = 35;

    const factorModel = Atlas.Model.factor96();
    const productModel = Atlas.Model.product();

    const factors = factorModel.run({ n }) as number[];
    const reconstructed = productModel.run({ values: factors }) as number;

    assertEqual(reconstructed, n);
  });

  runTest('Perfect factorization: product(factor96(49)) = 49', () => {
    const n = 49;

    const factorModel = Atlas.Model.factor96();
    const productModel = Atlas.Model.product();

    const factors = factorModel.run({ n }) as number[];
    const reconstructed = productModel.run({ values: factors }) as number;

    assertEqual(reconstructed, n);
  });

  runTest('Perfect factorization: product(factor96(77)) = 77', () => {
    const n = 77;

    const factorModel = Atlas.Model.factor96();
    const productModel = Atlas.Model.product();

    const factors = factorModel.run({ n }) as number[];
    const reconstructed = productModel.run({ values: factors }) as number;

    assertEqual(reconstructed, n);
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✓ All stdlib operations tests passed!');
  console.log('═══════════════════════════════════════════════════════════\n');
}
