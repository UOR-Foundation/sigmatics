import * as IR from '../../src/compiler/ir';

export function runIRTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running IR Construction Tests...');

  runTest('IR: classLiteral valid range', () => {
    const c0 = IR.classLiteral(0);
    const c95 = IR.classLiteral(95);
    if (c0.kind !== 'atom' || c0.op.type !== 'classLiteral' || c0.op.value !== 0) {
      throw new Error('classLiteral(0) failed');
    }
    if (c95.kind !== 'atom' || c95.op.type !== 'classLiteral' || c95.op.value !== 95) {
      throw new Error('classLiteral(95) failed');
    }
  });

  runTest('IR: classLiteral rejects out-of-range', () => {
    try {
      IR.classLiteral(-1);
      throw new Error('Expected error for classLiteral(-1)');
    } catch (e: unknown) {
      if (!(e as Error).message.includes('Invalid class index')) {
        throw new Error('Wrong error message for negative index');
      }
    }

    try {
      IR.classLiteral(96);
      throw new Error('Expected error for classLiteral(96)');
    } catch (e: unknown) {
      if (!(e as Error).message.includes('Invalid class index')) {
        throw new Error('Wrong error message for index=96');
      }
    }
  });

  runTest('IR: lift valid range', () => {
    const l0 = IR.lift(0);
    const l95 = IR.lift(95);
    if (l0.kind !== 'atom' || l0.op.type !== 'lift') throw new Error('lift(0) failed');
    if (l95.kind !== 'atom' || l95.op.type !== 'lift') throw new Error('lift(95) failed');
  });

  runTest('IR: lift rejects out-of-range', () => {
    try {
      IR.lift(-1);
      throw new Error('Expected error for lift(-1)');
    } catch (e: unknown) {
      if (!(e as Error).message.includes('Invalid class index'))
        throw new Error('Wrong error for lift');
    }
  });

  runTest('IR: projectGrade valid range', () => {
    const p0 = IR.projectGrade(0);
    const p7 = IR.projectGrade(7);
    if (p0.kind !== 'atom' || p0.op.type !== 'project' || p0.op.grade !== 0) {
      throw new Error('projectGrade(0) failed');
    }
    if (p7.kind !== 'atom' || p7.op.type !== 'project' || p7.op.grade !== 7) {
      throw new Error('projectGrade(7) failed');
    }
  });

  runTest('IR: projectGrade rejects invalid grade', () => {
    try {
      IR.projectGrade(-1);
      throw new Error('Expected error for projectGrade(-1)');
    } catch (e: unknown) {
      if (!(e as Error).message.includes('Invalid grade'))
        throw new Error('Wrong error for negative grade');
    }

    try {
      IR.projectGrade(8);
      throw new Error('Expected error for projectGrade(8)');
    } catch (e: unknown) {
      if (!(e as Error).message.includes('Invalid grade'))
        throw new Error('Wrong error for grade=8');
    }
  });

  runTest('IR: param creates runtime reference', () => {
    const p = IR.param('x');
    if (p.kind !== 'atom' || p.op.type !== 'param' || p.op.name !== 'x') {
      throw new Error('param(x) failed');
    }
  });

  runTest('IR: seq creates sequential composition', () => {
    const s = IR.seq(IR.classLiteral(1), IR.classLiteral(2));
    if (s.kind !== 'seq') throw new Error('Expected seq node');
    if (s.left.kind !== 'atom' || s.right.kind !== 'atom') {
      throw new Error('Seq children should be atoms');
    }
  });

  runTest('IR: par creates parallel composition', () => {
    const p = IR.par(IR.classLiteral(1), IR.classLiteral(2));
    if (p.kind !== 'par') throw new Error('Expected par node');
  });

  runTest('IR: R transform identity elimination', () => {
    const r0 = IR.R(IR.classLiteral(5), 0);
    if (r0.kind !== 'atom') throw new Error('R^0 should return child directly');
  });

  runTest('IR: D transform identity elimination', () => {
    const d0 = IR.D(IR.classLiteral(5), 0);
    if (d0.kind !== 'atom') throw new Error('D^0 should return child directly');
  });

  runTest('IR: T transform identity elimination', () => {
    const t0 = IR.T(IR.classLiteral(5), 0);
    if (t0.kind !== 'atom') throw new Error('T^0 should return child directly');
  });

  runTest('IR: R/D/T wrap correctly for non-zero powers', () => {
    const r1 = IR.R(IR.classLiteral(5), 1);
    if (r1.kind !== 'transform' || r1.transform.type !== 'R' || r1.transform.k !== 1) {
      throw new Error('R^1 failed');
    }

    const d2 = IR.D(IR.classLiteral(5), 2);
    if (d2.kind !== 'transform' || d2.transform.type !== 'D' || d2.transform.k !== 2) {
      throw new Error('D^2 failed');
    }

    const t5 = IR.T(IR.classLiteral(5), 5);
    if (t5.kind !== 'transform' || t5.transform.type !== 'T' || t5.transform.k !== 5) {
      throw new Error('T^5 failed');
    }
  });

  runTest('IR: M transform wraps', () => {
    const m = IR.M(IR.classLiteral(5));
    if (m.kind !== 'transform' || m.transform.type !== 'M') {
      throw new Error('M transform failed');
    }
  });
}
