import * as IR from '../../src/compiler/ir';
import { lowerToSgaBackend, executeSgaPlan } from '../../src/compiler/lowering/sga-backend';
import { lift } from '../../src/bridge/lift';
import { transformRPower } from '../../src/sga/transforms';
import { sgaEqual } from '../../src/sga/sga-element';

export function runSgaBackendExtendedTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running SGA Backend Extended Tests...');

  runTest('SGA Backend: lift then projectClass returns class index', () => {
    const ir = IR.projectClass(IR.lift(10));
    const plan = lowerToSgaBackend(ir);
    const result = executeSgaPlan(plan, { x: lift(10) });
    if (result !== 10) throw new Error(`Expected class index 10, got ${result}`);
  });

  runTest('SGA Backend: add96 with overflow tracking', () => {
    const ir = IR.add96('track');
    const plan = lowerToSgaBackend(ir);
    const result = executeSgaPlan(plan, { a: 95, b: 10 });
    if (typeof result !== 'object' || (result as any).value !== 9 || !(result as any).overflow) {
      throw new Error('Expected tracked overflow with value 9');
    }
  });

  runTest('SGA Backend: R transform applied to lifted element', () => {
    // Use a param leaf so the transform is applied to provided input and not overwritten by a later lift
    const ir = IR.R(IR.param('x'), 1);
    const plan = lowerToSgaBackend(ir);
    const x = lift(5);
    const result = executeSgaPlan(plan, { x });
    if (!result || typeof result !== 'object' || !('clifford' in (result as any))) {
      throw new Error('Expected SGA element result');
    }
    const rotated = transformRPower(x, 1);
    if (!sgaEqual(rotated as any, result as any)) {
      throw new Error('R transform did not apply correctly');
    }
  });

  runTest('SGA Backend: project grade reduces Clifford component', () => {
    const ir = IR.projectGrade(0); // scalar grade
    const plan = lowerToSgaBackend(ir);
    const elem = lift(7); // rank-1 element
    const result = executeSgaPlan(plan, { x: elem });
    if (!result || typeof result !== 'object')
      throw new Error('Expected SGA element after projection');
    // Clifford component after grade projection to 0 should retain same shape or shrink
    const originalScalar = (elem as any).clifford.scalar;
    const projectedScalar = (result as any).clifford.scalar;
    if (projectedScalar !== originalScalar) {
      throw new Error('Scalar grade projection failed');
    }
  });
}
