/**
 * Fano CrossProduct Error Branch Tests
 */
import { crossProduct } from '../../src/sga/fano';

type TestFn = (name: string, fn: () => void) => void;

export function runFanoBranchTests(runTest: TestFn): void {
  console.log('Running Fano Branch Tests...');

  runTest('Fano: crossProduct out-of-range i throws', () => {
    let threw = false;
    try {
      crossProduct(0, 1);
    } catch (e: unknown) {
      threw = true;
      if (!(e as Error).message.includes('1..7')) {
        throw new Error(`Unexpected error message: ${(e as Error).message}`);
      }
    }
    if (!threw) {
      throw new Error('Expected crossProduct(0,1) to throw');
    }
  });

  runTest('Fano: crossProduct out-of-range j throws', () => {
    let threw = false;
    try {
      crossProduct(1, 8);
    } catch (e: unknown) {
      threw = true;
      if (!(e as Error).message.includes('1..7')) {
        throw new Error(`Unexpected error message: ${(e as Error).message}`);
      }
    }
    if (!threw) {
      throw new Error('Expected crossProduct(1,8) to throw');
    }
  });
}
