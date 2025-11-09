/**
 * Server Registry Branch Tests
 */
import { compileModel, StdlibModels } from '../../src/server/registry';
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
    } catch (e: any) {
      threw = true;
      if (!e.message.includes('Unknown model')) {
        throw new Error(`Expected Unknown model error, got: ${e.message}`);
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
}
