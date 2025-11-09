// Extra branch coverage tests for rewrites
// We cannot import runTest directly (not exported); replicate minimal helper.
import * as IR from '../../src/compiler/ir';
import { normalize, extractTransforms } from '../../src/compiler/rewrites';

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error: any) {
    console.error(`✗ ${name}`);
    console.error(error.message);
    throw error;
  }
}

export function runRewritesExtraBranchTests(): void {
  console.log('Running Compiler Rewrites Extra Branch Tests...');

  runTest('Rewrites Extra: extractTransforms over par and seq', () => {
    // Build: R(T(lift)) || D(lift) using IR helpers
    const left = IR.R(IR.T(IR.lift(10), 3), 1);
    const right = IR.D(IR.lift(20), 2);
    const tree = IR.par(left, right);
    const norm = normalize(tree);
    const leaves = extractTransforms(norm);
    // Expect two leaves; current normalization collapses stacked different-type transforms to outer only
    if (leaves.length !== 2) throw new Error('Expected 2 leaves');
    const types = leaves.map((l) => (l.transforms[0] ? l.transforms[0].type : 'none')).sort();
    if (types[0] !== 'D' || types[1] !== 'R') {
      throw new Error(`Unexpected transform chain heads: ${types.join(',')}`);
    }
  });

  runTest('Rewrites Extra: foldTransforms M with zero-power inner yields M', () => {
    // Simulate prior folding giving inner power 0; normalize should keep outer M
    const inner = IR.R(IR.lift(1), 0); // returns child directly
    const outer = IR.M(inner);
    const norm = normalize(outer);
    // Expect a transform node with M (child is lift)
    if (norm.kind !== 'transform' || norm.transform.type !== 'M') {
      throw new Error('Expected outer M to remain when inner power is 0');
    }
  });

  runTest('Rewrites Extra: projectClass atom equality path exercised', () => {
    const pcA = IR.projectClass(IR.param('x'));
    const pcB = IR.projectClass(IR.param('y'));
    const combined = IR.par(pcA, pcB);
    const norm = normalize(combined);
    const leaves = extractTransforms(norm);
    if (leaves.length !== 2) throw new Error('Expected two leaves');
    const names = leaves.map((l) => (l.atom.kind === 'atom' ? (l.atom as any).op.type : 'none'));
    if (!names.every((n) => n === 'projectClass')) throw new Error('Expected projectClass atoms');
  });

  console.log('');
}
