/**
 * Utility Functions Tests
 *
 * Tests for helper/utility functions across various modules
 * to improve function coverage.
 */

import { liftAll, liftMultiple } from '../../src/bridge/lift';
import { projectMultiple, projectStrict, isRank1 } from '../../src/bridge/project';
import { preloadSchemas } from '../../src/model/schema-registry';
import { clearCache, getCacheStats } from '../../src/server/registry';
import { shouldUseClassBackend, requiresSgaBackend } from '../../src/compiler/fuser';
import * as IR from '../../src/compiler/ir';

type TestFn = (name: string, fn: () => void) => void;

export function runUtilityFunctionsTests(runTest: TestFn): void {
  console.log('Running Utility Functions Tests...');

  // Bridge: liftAll
  runTest('Utility: liftAll returns 96 SGA elements', () => {
    const all = liftAll();
    if (all.length !== 96) {
      throw new Error(`Expected 96 elements, got ${all.length}`);
    }
    // Verify first element is scalar (class 0 = h2:0, d:0, l:0)
    if (!all[0]) {
      throw new Error('First element (class 0) should exist');
    }
  });

  // Bridge: liftMultiple
  runTest('Utility: liftMultiple lifts array of indices', () => {
    const indices = [0, 1, 23, 47, 95];
    const elements = liftMultiple(indices);
    if (elements.length !== 5) {
      throw new Error(`Expected 5 elements, got ${elements.length}`);
    }
    // Each element should be defined
    elements.forEach((el, i) => {
      if (!el) {
        throw new Error(`Element at index ${i} should be defined`);
      }
    });
  });

  // Bridge: projectMultiple
  runTest('Utility: projectMultiple projects array of elements', () => {
    const lifted = liftMultiple([0, 1, 2]);
    const projected = projectMultiple(lifted);
    if (projected.length !== 3) {
      throw new Error(`Expected 3 results, got ${projected.length}`);
    }
    if (projected[0] !== 0 || projected[1] !== 1 || projected[2] !== 2) {
      throw new Error(
        `Expected [0, 1, 2], got [${projected[0]}, ${projected[1]}, ${projected[2]}]`,
      );
    }
  });

  // Bridge: projectStrict on rank-1
  runTest('Utility: projectStrict returns class index for rank-1', () => {
    const element = liftMultiple([42])[0];
    const result = projectStrict(element);
    if (result !== 42) {
      throw new Error(`Expected 42, got ${result}`);
    }
  });

  // Bridge: projectStrict throws on non-rank-1
  runTest('Utility: projectStrict throws on non-rank-1', () => {
    // Create a non-rank-1 element by multiplying two rank-1 elements
    const e1 = liftMultiple([1])[0]; // e1 basis vector
    const _e2 = liftMultiple([2])[0]; // e2 basis vector
    const product = {
      z4: e1.z4,
      z3: e1.z3,
      clifford: {
        grades: new Map([
          ['e1^e2', 1], // Not a rank-1 element
        ]),
      },
    };

    let threw = false;
    try {
      projectStrict(product as any);
    } catch (e: unknown) {
      threw = true;
      if (!(e as Error).message.includes('non-rank-1')) {
        throw new Error(`Expected error about non-rank-1, got: ${(e as Error).message}`);
      }
    }

    if (!threw) {
      throw new Error('Expected projectStrict to throw on non-rank-1 element');
    }
  });

  // Bridge: isRank1
  runTest('Utility: isRank1 returns true for lifted element', () => {
    const element = liftMultiple([10])[0];
    const result = isRank1(element);
    if (!result) {
      throw new Error('Expected isRank1 to return true for lifted element');
    }
  });

  runTest('Utility: isRank1 returns false for non-rank-1', () => {
    // Create a non-rank-1 element with proper Z4/Z3 structure
    const nonRank1 = {
      z4: { coefficients: [1, 0, 0, 0] }, // identity in Z4
      z3: { coefficients: [1, 0, 0] }, // identity in Z3
      clifford: {
        grades: new Map([['e1^e2', 1]]), // Grade-2 element, not rank-1
      },
    };
    const result = isRank1(nonRank1 as any);
    if (result) {
      throw new Error('Expected isRank1 to return false for non-rank-1 element');
    }
  });

  // Model: preloadSchemas
  runTest('Utility: preloadSchemas loads known schemas', () => {
    // This should not throw
    preloadSchemas();
  });

  // Server: clearCache and getCacheStats
  runTest('Utility: clearCache clears registry cache', () => {
    clearCache();
    const stats = getCacheStats();
    if (stats.size !== 0) {
      throw new Error(`Expected cache size 0 after clear, got ${stats.size}`);
    }
  });

  runTest('Utility: getCacheStats returns cache info', () => {
    const stats = getCacheStats();
    if (typeof stats.size !== 'number') {
      throw new Error('Expected stats.size to be a number');
    }
    if (!Array.isArray(stats.keys)) {
      throw new Error('Expected stats.keys to be an array');
    }
  });

  // Compiler: shouldUseClassBackend
  runTest('Utility: shouldUseClassBackend returns true for class-pure', () => {
    const node = IR.classLiteral(42);
    const result = shouldUseClassBackend(node);
    if (!result) {
      throw new Error('Expected shouldUseClassBackend to return true for class literal');
    }
  });

  runTest('Utility: shouldUseClassBackend returns false for grade projection', () => {
    const node = IR.projectGrade(1);
    const result = shouldUseClassBackend(node);
    if (result) {
      throw new Error('Expected shouldUseClassBackend to return false for grade projection');
    }
  });

  // Compiler: requiresSgaBackend
  runTest('Utility: requiresSgaBackend returns false for class-pure', () => {
    const node = IR.classLiteral(42);
    const result = requiresSgaBackend(node);
    if (result) {
      throw new Error('Expected requiresSgaBackend to return false for class literal');
    }
  });

  runTest('Utility: requiresSgaBackend returns true for grade projection', () => {
    const node = IR.projectGrade(1);
    const result = requiresSgaBackend(node);
    if (!result) {
      throw new Error('Expected requiresSgaBackend to return true for grade projection');
    }
  });
}
