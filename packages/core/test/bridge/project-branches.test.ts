/**
 * Bridge Project Branch Tests
 */
import { project } from '../../src/bridge/project';
import type { SgaElement } from '../../src/sga/types';

function makeElement({ z4, z3, cliff }: { z4: number[]; z3: number[]; cliff: [string, number][] }): SgaElement {
  return {
    z4: { coefficients: z4 as [number, number, number, number] },
    z3: { coefficients: z3 as [number, number, number] },
    clifford: { grades: new Map<string, number>(cliff) },
  } as SgaElement;
}

type TestFn = (name: string, fn: () => void) => void;

export function runProjectBranchTests(runTest: TestFn): void {
  console.log('Running Bridge Project Branch Tests...');

  // Z4 ambiguous (two ones) -> extractZ4Power null -> project null
  runTest('Project: ambiguous Z4 returns null', () => {
    const el = makeElement({ z4: [1, 1, 0, 0], z3: [1, 0, 0], cliff: [['1', 1]] });
    const result = project(el);
    if (result !== null) {
      throw new Error(`Expected null for ambiguous Z4, got ${result}`);
    }
  });

  // Z3 ambiguous -> project null
  runTest('Project: ambiguous Z3 returns null', () => {
    const el = makeElement({ z4: [1, 0, 0, 0], z3: [1, 1, 0], cliff: [['1', 1]] });
    const result = project(el);
    if (result !== null) {
      throw new Error(`Expected null for ambiguous Z3, got ${result}`);
    }
  });

  // Clifford invalid blade -> null
  runTest('Project: invalid Clifford blade returns null', () => {
    const el = makeElement({ z4: [1, 0, 0, 0], z3: [1, 0, 0], cliff: [['e9', 1]] });
    const result = project(el);
    if (result !== null) {
      throw new Error(`Expected null for invalid blade, got ${result}`);
    }
  });

  // Clifford coefficient not near 1 -> null
  runTest('Project: coefficient not near 1 returns null', () => {
    const el = makeElement({ z4: [1, 0, 0, 0], z3: [1, 0, 0], cliff: [['e1', 1 + 1e-8]] });
    const result = project(el);
    if (result !== null) {
      throw new Error(`Expected null for off-by-epsilon coefficient, got ${result}`);
    }
  });

  // Multiple grades -> null
  runTest('Project: multiple Clifford grades returns null', () => {
    const el = makeElement({ z4: [1, 0, 0, 0], z3: [1, 0, 0], cliff: [['e1', 1], ['e2', 1]] });
    const result = project(el);
    if (result !== null) {
      throw new Error(`Expected null for multiple grades, got ${result}`);
    }
  });
}
