/**
 * Fano Plane Utility Tests
 *
 * Tests for Fano plane helper functions to improve function coverage.
 */

import {
  verifyFanoPlane,
  getLinesContaining,
  isFanoLine,
  crossProduct,
} from '../../src/sga/fano';

type TestFn = (name: string, fn: () => void) => void;

export function runFanoPlaneUtilityTests(runTest: TestFn): void {
  console.log('Running Fano Plane Utility Tests...');

  // verifyFanoPlane
  runTest('Fano: verifyFanoPlane returns true for correct structure', () => {
    const result = verifyFanoPlane();
    if (!result) {
      throw new Error('Expected verifyFanoPlane to return true');
    }
  });

  // getLinesContaining
  runTest('Fano: getLinesContaining(1) returns lines with e1', () => {
    const lines = getLinesContaining(1);
    if (lines.length !== 3) {
      throw new Error(`Expected 3 lines containing e1, got ${lines.length}`);
    }
    // Each line should contain 1
    lines.forEach((line) => {
      if (!line.includes(1)) {
        throw new Error(`Line ${line} should contain 1`);
      }
    });
  });

  runTest('Fano: getLinesContaining(7) returns lines with e7', () => {
    const lines = getLinesContaining(7);
    if (lines.length !== 3) {
      throw new Error(`Expected 3 lines containing e7, got ${lines.length}`);
    }
  });

  // isFanoLine
  runTest('Fano: isFanoLine(1, 2, 4) returns true', () => {
    const result = isFanoLine(1, 2, 4);
    if (!result) {
      throw new Error('Expected (1, 2, 4) to be a Fano line');
    }
  });

  runTest('Fano: isFanoLine(2, 3, 5) returns true', () => {
    const result = isFanoLine(2, 3, 5);
    if (!result) {
      throw new Error('Expected (2, 3, 5) to be a Fano line');
    }
  });

  runTest('Fano: isFanoLine with cyclic permutation (4, 1, 2) returns true', () => {
    const result = isFanoLine(4, 1, 2);
    if (!result) {
      throw new Error('Expected cyclic permutation (4, 1, 2) to be recognized as Fano line');
    }
  });

  runTest('Fano: isFanoLine(1, 3, 5) returns false', () => {
    const result = isFanoLine(1, 3, 5);
    if (result) {
      throw new Error('Expected (1, 3, 5) to NOT be a Fano line');
    }
  });

  // crossProduct
  runTest('Fano: crossProduct(1, 2) = 4', () => {
    const result = crossProduct(1, 2);
    if (result.index !== 4 || result.sign !== 1) {
      throw new Error(`Expected e1 × e2 = e4, got e${result.index} with sign ${result.sign}`);
    }
  });

  runTest('Fano: crossProduct(2, 1) = -4 (anticommutative)', () => {
    const result = crossProduct(2, 1);
    if (result.index !== 4 || result.sign !== -1) {
      throw new Error(`Expected e2 × e1 = -e4, got e${result.index} with sign ${result.sign}`);
    }
  });

  runTest('Fano: crossProduct(1, 1) = 0', () => {
    const result = crossProduct(1, 1);
      if (result.index !== 0 || result.sign !== 0) {
        throw new Error(
          `Expected e1 × e1 = 0 with sign 0, got e${result.index} with sign ${result.sign}`,
        );
    }
  });
}
