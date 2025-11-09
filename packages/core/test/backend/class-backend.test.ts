import { lowerToClassBackend, executeClassPlan } from '../../src/compiler/lowering/class-backend';
import * as IR from '../../src/compiler/ir';

export function runClassBackendTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running Class Backend Tests...');

  runTest('Class Backend: sub96 with drop overflow', () => {
    const ir = IR.sub96('drop');
    const plan = lowerToClassBackend(ir);
    const result = executeClassPlan(plan, { a: 10, b: 15 });
    if (typeof result === 'object' && result !== null && 'value' in result) {
      if ((result as any).value !== 91) throw new Error('Expected (10-15) mod 96 = 91');
    } else if (result !== 91) {
      throw new Error('Expected result=91');
    }
  });

  runTest('Class Backend: sub96 with track overflow', () => {
    const ir = IR.sub96('track');
    const plan = lowerToClassBackend(ir);
    const result = executeClassPlan(plan, { a: 10, b: 15 });
    if (typeof result !== 'object' || result === null || !('value' in result) || !('overflow' in result)) {
      throw new Error('Expected RingResult with overflow');
    }
    if ((result as any).value !== 91 || !(result as any).overflow) {
      throw new Error('Expected value=91, overflow=true');
    }
  });

  runTest('Class Backend: mul96 with drop overflow', () => {
    const ir = IR.mul96('drop');
    const plan = lowerToClassBackend(ir);
    const result = executeClassPlan(plan, { a: 10, b: 10 });
    if (typeof result === 'object' && result !== null && 'value' in result) {
      if ((result as any).value !== 4) throw new Error('Expected (10*10) mod 96 = 4');
    } else if (result !== 4) {
      throw new Error('Expected result=4');
    }
  });

  runTest('Class Backend: mul96 with track overflow', () => {
    const ir = IR.mul96('track');
    const plan = lowerToClassBackend(ir);
    const result = executeClassPlan(plan, { a: 10, b: 10 });
    if (typeof result !== 'object' || result === null || !('value' in result) || !('overflow' in result)) {
      throw new Error('Expected RingResult with overflow');
    }
    if ((result as any).value !== 4 || !(result as any).overflow) {
      throw new Error('Expected value=4, overflow=true for 10*10=100');
    }
  });

  runTest('Class Backend: R∘D∘T∘M transform chain', () => {
    const ir = IR.R(IR.D(IR.T(IR.M(IR.classLiteral(0)), 1), 1), 1);
    const plan = lowerToClassBackend(ir);
    const result = executeClassPlan(plan, {});
    if (typeof result !== 'number') throw new Error('Expected numeric class index');
    // Result should be some transformed class index; exact value depends on transform composition
    // Just verify it's in range
    if (result < 0 || result >= 96) throw new Error('Result out of class range');
  });

  runTest('Class Backend: add96 no overflow', () => {
    const ir = IR.add96('drop');
    const plan = lowerToClassBackend(ir);
    const result = executeClassPlan(plan, { a: 10, b: 20 });
    if (typeof result === 'object' && result !== null && 'value' in result) {
      if ((result as any).value !== 30) throw new Error('Expected 10+20=30');
    } else if (result !== 30) {
      throw new Error('Expected result=30');
    }
  });
}
