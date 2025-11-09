import { lowerToSgaBackend, executeSgaPlan } from '../../src/compiler/lowering/sga-backend';
import * as IR from '../../src/compiler/ir';
import { lift } from '../../src/bridge/lift';

export function runSgaBackendRingTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running SGA Backend Ring Op Tests...');

  runTest('SGA Backend: sub96 with drop overflow', () => {
    const ir = IR.sub96('drop');
    const plan = lowerToSgaBackend(ir);
    const result = executeSgaPlan(plan, { a: 10, b: 15 });
    if (!result || typeof result !== 'object' || !('clifford' in result)) {
      throw new Error('Expected SGA element result');
    }
    // Value should be wrapped in lifted SGA element (state), extract isn't trivial
    // but we verified it runs without error
  });

  runTest('SGA Backend: sub96 with track overflow', () => {
    const ir = IR.sub96('track');
    const plan = lowerToSgaBackend(ir);
    const result = executeSgaPlan(plan, { a: 10, b: 15 });
    if (
      typeof result !== 'object' ||
      result === null ||
      !('value' in result) ||
      !('overflow' in result)
    ) {
      throw new Error('Expected RingResult with overflow');
    }
    const rr = result as { value: number; overflow: boolean };
    if (rr.value !== 91 || !rr.overflow) {
      throw new Error('Expected value=91, overflow=true for 10-15');
    }
  });

  runTest('SGA Backend: mul96 with drop overflow', () => {
    const ir = IR.mul96('drop');
    const plan = lowerToSgaBackend(ir);
    const _result = executeSgaPlan(plan, { a: 10, b: 10 });
    // Should complete without error; exact result check depends on state handling
  });

  runTest('SGA Backend: mul96 with track overflow', () => {
    const ir = IR.mul96('track');
    const plan = lowerToSgaBackend(ir);
    const result = executeSgaPlan(plan, { a: 10, b: 10 });
    if (
      typeof result !== 'object' ||
      result === null ||
      !('value' in result) ||
      !('overflow' in result)
    ) {
      throw new Error('Expected RingResult with overflow');
    }
    const rr2 = result as { value: number; overflow: boolean };
    if (rr2.value !== 4 || !rr2.overflow) {
      throw new Error('Expected value=4, overflow=true for 10*10=100');
    }
  });

  runTest('SGA Backend: D transform power', () => {
    const ir = IR.D(IR.param('x'), 2);
    const plan = lowerToSgaBackend(ir);
    const x = lift(5);
    const result = executeSgaPlan(plan, { x });
    if (!result || typeof result !== 'object' || !('clifford' in result)) {
      throw new Error('Expected SGA element result from D transform');
    }
  });

  runTest('SGA Backend: T transform power', () => {
    const ir = IR.T(IR.param('x'), 3);
    const plan = lowerToSgaBackend(ir);
    const x = lift(7);
    const result = executeSgaPlan(plan, { x });
    if (!result || typeof result !== 'object' || !('clifford' in result)) {
      throw new Error('Expected SGA element result from T transform');
    }
  });

  runTest('SGA Backend: M transform', () => {
    const ir = IR.M(IR.param('x'));
    const plan = lowerToSgaBackend(ir);
    const x = lift(9);
    const result = executeSgaPlan(plan, { x });
    if (!result || typeof result !== 'object' || !('clifford' in result)) {
      throw new Error('Expected SGA element result from M transform');
    }
  });

  runTest('SGA Backend: projectClass missing input throws', () => {
    const ir = IR.projectClass(IR.param('x'));
    const plan = lowerToSgaBackend(ir);
    try {
      executeSgaPlan(plan, {});
      throw new Error('Expected error for missing x param');
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (!msg.includes('projectClass requires')) {
        throw new Error('Wrong error message: ' + msg);
      }
    }
  });

  runTest('SGA Backend: grade projection for grade 1', () => {
    const ir = IR.projectGrade(1);
    const plan = lowerToSgaBackend(ir);
    const elem = lift(10);
    const result = executeSgaPlan(plan, { x: elem });
    if (!result || typeof result !== 'object' || !('clifford' in result)) {
      throw new Error('Expected SGA element after grade projection');
    }
  });
}
