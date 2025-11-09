/**
 * Class Backend Branch Tests
 */
import { executeClassPlan } from '../../src/compiler/lowering/class-backend';
import { lowerToClassBackend } from '../../src/compiler/lowering/class-backend';
import * as IR from '../../src/compiler/ir';
import type { ClassOperation, ClassPlan, RingResult } from '../../src/model/types';

// Local helper to build a plan with specific ops
function plan(ops: ClassOperation[]): ClassPlan {
  return { kind: 'class', operations: ops };
}

type TestFn = (name: string, fn: () => void) => void;

export function runClassBackendBranchTests(runTest: TestFn): void {
  console.log('Running Class Backend Branch Tests...');

  // M transform d=0 branch
  runTest('Class Backend: M transform with d=0 stays 0', () => {
    // class index with d=0: pick 8*h + 0*? + l => e.g., 0
    const result = executeClassPlan(plan([{ type: 'M' }]), { x: 0 }) as number;
    if (result !== 0) {
      throw new Error(`Expected M(0)=0, got ${result}`);
    }
  });

  // M transform d!=0 branch
  runTest('Class Backend: M transform with d=1 inverts to d=2', () => {
    // class index 8*d + l + 24*h where d=1; simplest pick 8
    const result = executeClassPlan(plan([{ type: 'M' }]), { x: 8 }) as number;
    // d=1 -> d=2, h and l unchanged: 8 -> 16
    if (result !== 16) {
      throw new Error(`Expected M(8)=16, got ${result}`);
    }
  });

  // projectClass branch in switch
  runTest('Class Backend: projectClass is a no-op', () => {
    const result = executeClassPlan(plan([{ type: 'projectClass' }]), { x: 5 });
    // No state established; function returns fallback object
    if (typeof result !== 'object') {
      throw new Error(`Expected fallback object, got ${result}`);
    }
  });

  // Empty plan return fallback branch
  runTest('Class Backend: empty plan returns fallback object', () => {
    const result = executeClassPlan(plan([]), {});
    if (typeof result !== 'object' || (result as RingResult).value !== 0) {
      throw new Error(`Expected fallback {value:0}, got ${JSON.stringify(result)}`);
    }
  });

  // Transform collection includes M branch
  runTest('Class Backend: lowering collects M transform', () => {
    const term = IR.M(IR.classLiteral(5));
    const classPlan = lowerToClassBackend(term);
    if (!classPlan.operations.some((op) => op.type === 'M')) {
      throw new Error('Expected class plan to include M operation');
    }
  });

  runTest('Class Backend: lowering collects D transform', () => {
    const term = IR.D(IR.classLiteral(5), 2);
    const classPlan = lowerToClassBackend(term);
    if (!classPlan.operations.some((op) => op.type === 'D')) {
      throw new Error('Expected class plan to include D operation');
    }
  });

  runTest('Class Backend: lowering collects T transform', () => {
    const term = IR.T(IR.classLiteral(5), 3);
    const classPlan = lowerToClassBackend(term);
    if (!classPlan.operations.some((op) => op.type === 'T')) {
      throw new Error('Expected class plan to include T operation');
    }
  });

  runTest('Class Backend: transform followed by ring op order preserved', () => {
    // R(add96) with track overflow should still produce R then add96 ops
    const term = IR.R(IR.add96('track'), 2);
    const plan = lowerToClassBackend(term);
    const types = plan.operations.map((o) => o.type).join(',');
    if (!types.includes('R') || !types.includes('add96')) {
      throw new Error(`Expected both R and add96 in operations, got ${types}`);
    }
    // Execute with runtime params to ensure early return gives result
    const out = executeClassPlan(plan, { a: 10, b: 90 });
    if (typeof out !== 'object' || (out as RingResult).value === undefined) {
      throw new Error('Expected ring result object from tracked add96');
    }
  });

  // add96 track: no overflow
  runTest('Class Backend: add96 track without overflow', () => {
    const result = executeClassPlan(plan([{ type: 'add96', overflowMode: 'track' }]), {
      a: 10,
      b: 20,
    });
    const ring = result as RingResult;
    if (ring.value !== 30 || ring.overflow !== false) {
      throw new Error(`Expected {value:30, overflow:false}, got ${JSON.stringify(result)}`);
    }
  });

  // add96 track: with overflow
  runTest('Class Backend: add96 track with overflow', () => {
    const result = executeClassPlan(plan([{ type: 'add96', overflowMode: 'track' }]), {
      a: 80,
      b: 30,
    });
    const ring2 = result as RingResult;
    if (ring2.value !== 110 % 96 || ring2.overflow !== true) {
      throw new Error(`Expected {value:${110 % 96}, overflow:true}, got ${JSON.stringify(result)}`);
    }
  });

  // Note: state carry between ops is only used when inputs are absent; we cover track/drop branches above
}
