/**
 * Compiler Rewrites Branch Tests
 */
import * as IR from '../../src/compiler/ir';
import { normalize } from '../../src/compiler/rewrites';

import type { IRNode, TransformOp } from '../../src/model/types';

type TestFn = (name: string, fn: () => void) => void;

export function runRewritesBranchTests(runTest: TestFn): void {
  console.log('Running Compiler Rewrites Branch Tests...');

  runTest('Rewrites Branch: M∘D^1 folds to D^2', () => {
    const node: IRNode = {
      kind: 'transform',
      transform: { type: 'M' } as TransformOp,
      child: {
        kind: 'transform',
        transform: { type: 'D', k: 1 } as TransformOp,
        child: IR.classLiteral(0),
      },
    };
    const normalized = normalize(node);
    if (normalized.kind !== 'transform' || normalized.transform.type !== 'D') {
      throw new Error('Expected single D transform after folding');
    }
    if ((normalized.transform as any).k !== 2) {
      throw new Error(`Expected D^2, got D^${(normalized.transform as any).k}`);
    }
  });

  runTest('Rewrites Branch: M∘T^3 folds to T^5', () => {
    const node: IRNode = {
      kind: 'transform',
      transform: { type: 'M' } as TransformOp,
      child: {
        kind: 'transform',
        transform: { type: 'T', k: 3 } as TransformOp,
        child: IR.classLiteral(0),
      },
    };
    const normalized = normalize(node);
    if (normalized.kind !== 'transform' || normalized.transform.type !== 'T') {
      throw new Error('Expected single T transform after folding');
    }
    if ((normalized.transform as any).k !== 5) {
      throw new Error(`Expected T^5, got T^${(normalized.transform as any).k}`);
    }
  });

  runTest('Rewrites Branch: M∘T^0 stays M', () => {
    const node: IRNode = {
      kind: 'transform',
      transform: { type: 'M' } as TransformOp,
      child: {
        kind: 'transform',
        transform: { type: 'T', k: 0 } as TransformOp,
        child: IR.classLiteral(0),
      },
    };
    const normalized = normalize(node);
    if (normalized.kind !== 'transform' || normalized.transform.type !== 'M') {
      throw new Error('Expected M transform to remain');
    }
  });
}
