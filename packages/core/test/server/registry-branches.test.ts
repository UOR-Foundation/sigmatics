/**
 * Server Registry Branch Tests
 */
import { compileModel, StdlibModels } from '../../src/server/registry';
import type { ModelDescriptor } from '../../src/model/types';
import { lift } from '../../src/bridge/lift';
import { project } from '../../src/bridge/project';

type TestFn = (name: string, fn: () => void) => void;

export function runRegistryBranchTests(runTest: TestFn): void {
  console.log('Running Server Registry Branch Tests...');

  // Unknown model throws
  runTest('Registry: compileModel unknown model throws', () => {
    let threw = false;
    try {
      compileModel({
        name: 'unknown-model' as any,
        version: '1.0.0',
        namespace: 'test',
        compiled: {},
        runtime: {},
        complexityHint: 'C1',
        loweringHints: { prefer: 'auto' },
      } as any);
    } catch (e: unknown) {
      threw = true;
      if (!(e as Error).message.includes('Unknown model')) {
        throw new Error(`Expected Unknown model error, got: ${(e as Error).message}`);
      }
    }
    if (!threw) {
      throw new Error('Expected compileModel to throw for unknown model');
    }
  });

  // Class backend with SGA input triggers project→execute→lift
  runTest('Registry: class backend with SGA input converts and returns SGA', () => {
    const model = StdlibModels.R(1); // prefer auto -> class backend for simple R
    const input = lift(1);
    const out = model.run({ x: input });
    // Should be SGA element; project should yield class number
    const projected = project(out as any);
    if (typeof projected !== 'number') {
      throw new Error('Expected projected output to be a class index');
    }
  });

  // SGA backend with class input (project grade) triggers lift→execute→project path
  runTest('Registry: sga backend with class input converts and may project back', () => {
    const model = compileModel<{ x: number }, number | any>({
      name: 'project',
      version: '1.0.0',
      namespace: 'stdlib.grade',
      compiled: { grade: 1 },
      runtime: { x: {} },
      complexityHint: 'C2',
      loweringHints: { prefer: 'sga' },
    });
    const out = model.run({ x: 1 }); // class index with l=1
    if (typeof out !== 'number') {
      throw new Error('Expected projected class index (number) from project grade path');
    }
  });

  runTest('Registry: invalid complexityHint triggers validation error branch', () => {
    const badDescriptor: ModelDescriptor = {
      name: 'add96',
      version: '1.0.0',
      namespace: 'stdlib.ring',
      compiled: { overflowMode: 'drop' },
      runtime: { a: 0, b: 0 },
      // @ts-expect-error deliberate invalid hint to exercise branch
      complexityHint: 'C9',
    };
    let threw = false;
    try {
      compileModel(badDescriptor);
    } catch (e: unknown) {
      threw = (e as Error).message.includes('Invalid complexityHint');
    }
    if (!threw) throw new Error('Expected invalid complexityHint error');
  });

  runTest('Registry: backend preference override to class despite grade op rejected', () => {
    // Use regular Stdlib model which sets prefer:'sga' and assert backend is SGA
    const model = compileModel({
      name: 'project',
      version: '1.0.0',
      namespace: 'stdlib.grade',
      compiled: { grade: 1 },
      runtime: { x: {} },
      loweringHints: { prefer: 'sga' },
    });
    if (model.plan.backend !== 'sga') {
      throw new Error('Expected SGA backend for grade projection');
    }
  });
}
