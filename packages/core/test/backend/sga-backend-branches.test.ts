/**
 * SGA Backend Branch Tests
 */
import { lowerToSgaBackend, executeSgaPlan } from '../../src/compiler/lowering/sga-backend';
import * as IR from '../../src/compiler/ir';

 type TestFn = (name: string, fn: () => void) => void;

export function runSgaBackendBranchTests(runTest: TestFn): void {
  console.log('Running SGA Backend Branch Tests...');

  runTest('SGA Backend: lowering collects R transform', () => {
    const term = IR.R(IR.classLiteral(5), 1);
    const plan = lowerToSgaBackend(term);
    if (!plan.operations.some((op) => op.type === 'R')) {
      throw new Error('Expected SGA plan to include R operation');
    }
  });

  runTest('SGA Backend: projectClass returns class index', () => {
    const plan = { kind: 'sga' as const, operations: [{ type: 'lift', classIndex: 7 }, { type: 'projectClass' as const }] };
    const out = executeSgaPlan(plan as any, {});
    if (out !== 7) {
      throw new Error(`Expected projectClass to return 7, got ${out}`);
    }
  });
}
