import * as IR from '../../src/compiler/ir';
import { lowerToClassBackend } from '../../src/compiler/lowering/class-backend';
import { lowerToSgaBackend } from '../../src/compiler/lowering/sga-backend';

export function runLoweringEdgeTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running Lowering Edge Case Tests...');

  runTest('Lowering: class backend rejects grade projection', () => {
    const proj = IR.projectGrade(2);
    try {
      lowerToClassBackend(proj);
      throw new Error('Expected error for grade projection in class backend');
    } catch (e: unknown) {
      if (!(e as Error).message.includes('Grade projection requires SGA backend')) {
        throw new Error('Incorrect error message for grade projection');
      }
    }
  });

  runTest('Lowering: sga backend collects projectGrade op', () => {
    const proj = IR.projectGrade(3);
    const plan = lowerToSgaBackend(proj);
    if (plan.operations.length !== 1 || plan.operations[0].type !== 'projectGrade') {
      throw new Error('SGA backend did not collect projectGrade operation');
    }
  });

  runTest('Lowering: transform chain preserved in SGA plan', () => {
    const term = IR.R(IR.D(IR.T(IR.classLiteral(5), 3), 2), 1);
    const plan = lowerToSgaBackend(term);
    const kinds = plan.operations.map((o) => o.type).slice(0, 3); // first three should be transforms
    if (kinds.join(',') !== 'R,D,T') {
      throw new Error(`Expected transform sequence R,D,T but got ${kinds.join(',')}`);
    }
  });

  runTest('Lowering: transform chain preserved in Class plan', () => {
    const term = IR.R(IR.D(IR.T(IR.classLiteral(5), 3), 2), 1);
    const plan = lowerToClassBackend(term);
    const kinds = plan.operations.map((o) => o.type).slice(0, 3);
    if (kinds.join(',') !== 'R,D,T') {
      throw new Error(`Expected transform sequence R,D,T but got ${kinds.join(',')}`);
    }
  });
}
