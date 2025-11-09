import * as IR from '../../src/compiler/ir';
import { analyzeComplexity, selectBackend } from '../../src/compiler/fuser';

export function runFuserTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running Compiler Fuser Tests...');

  runTest('Fuser: classify C0 simple literal', () => {
    const lit = IR.classLiteral(7);
    const c = analyzeComplexity(lit, { compiled: true });
    if (c !== 'C0') throw new Error('Expected C0 for single class literal');
  });

  runTest('Fuser: classify C1 simple transform', () => {
    const term = IR.R(IR.classLiteral(3), 1);
    const c = analyzeComplexity(term, {});
    if (c !== 'C1') throw new Error('Expected C1 for single transform');
  });

  runTest('Fuser: classify C2 sequence', () => {
    // Include a grade projection so it's not class-pure (skips C1) but bounded (→ C2)
    const seq = IR.seq(IR.projectGrade(2), IR.classLiteral(2));
    const c = analyzeComplexity(seq, {});
    if (c !== 'C2') throw new Error(`Expected C2 for bounded grade ops, got ${c}`);
  });

  runTest('Fuser: classify C3 nested transforms + seq', () => {
    // Deep right-leaning sequence to exceed C2 depth threshold (seqDepth > 5)
    const deep = IR.seq(
      IR.classLiteral(1),
      IR.seq(
        IR.classLiteral(2),
        IR.seq(
          IR.classLiteral(3),
          IR.seq(IR.classLiteral(4), IR.seq(IR.classLiteral(5), IR.seq(IR.classLiteral(6), IR.classLiteral(7)))),
        ),
      ),
    );
    const c = analyzeComplexity(deep, {});
    if (c !== 'C3') throw new Error(`Expected C3 for deep composition, got ${c}`);
  });

  runTest('Fuser: select backend respects preference and complexity', () => {
    const simple = IR.classLiteral(0);
    const c0 = analyzeComplexity(simple, { compiled: true });
    const autoBackend = selectBackend(c0, 'auto');
    if (autoBackend !== 'class') throw new Error('Auto backend should choose class for C0/C1');

    // Use grade projection to force non-class-pure complexity ≥ C2
    const complex = IR.seq(IR.projectGrade(1), IR.classLiteral(2));
    const cComplex = analyzeComplexity(complex, {});
    const autoBackend2 = selectBackend(cComplex, 'auto');
    if (autoBackend2 !== 'sga') throw new Error(`Auto backend should choose sga for C2/C3, got ${autoBackend2}`);

    if (selectBackend(cComplex, 'class') !== 'class') throw new Error('Preference class should force class');
    if (selectBackend(c0, 'sga') !== 'sga') throw new Error('Preference sga should force sga');
  });
}
