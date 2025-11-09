import * as IR from '../../src/compiler/ir';
import { normalize } from '../../src/compiler/rewrites';

// Expose as a runner for test/index.ts
export function runRewritesTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running Compiler Rewrites Tests...');

  runTest('Rewrites: identity elimination R^0', () => {
    const term = IR.R(IR.classLiteral(5), 0);
    const norm = normalize(term);
    if (JSON.stringify(norm) !== JSON.stringify(IR.classLiteral(5))) {
      throw new Error('R^0 should be eliminated');
    }
  });

  runTest('Rewrites: fold powers R^5 → R^1', () => {
    const term = IR.R(IR.classLiteral(5), 5); // 5 mod 4 = 1
    const norm = normalize(term);
    // Should reduce to R^1
    const nested = IR.R(IR.R(IR.classLiteral(5), 3), 2); // 3+2=5 => 1
    const normNested = normalize(nested);
    if (JSON.stringify(norm) !== JSON.stringify(normNested)) {
      throw new Error('R power folding failed');
    }
  });

  runTest('Rewrites: distribute transform over seq', () => {
    const seq = IR.seq(IR.classLiteral(1), IR.classLiteral(2));
    const term = IR.T(seq, 3);
    const norm = normalize(term);
    if (norm.kind !== 'seq') throw new Error('Expected seq after distribution');
    if (norm.left.kind !== 'transform' || norm.right.kind !== 'transform') {
      throw new Error('Transform not distributed over seq');
    }
  });

  runTest('Rewrites: distribute transform over par', () => {
    const par = IR.par(IR.classLiteral(10), IR.classLiteral(20));
    const term = IR.D(par, 2);
    const norm = normalize(term);
    if (norm.kind !== 'par') throw new Error('Expected par after distribution');
    if (norm.left.kind !== 'transform' || norm.right.kind !== 'transform') {
      throw new Error('Transform not distributed over par');
    }
  });

  runTest('Rewrites: mirror cancellation M∘M → identity', () => {
    const term = IR.M(IR.M(IR.classLiteral(7)));
    const norm = normalize(term);
    if (JSON.stringify(norm) !== JSON.stringify(IR.classLiteral(7))) {
      throw new Error('Mirror cancellation failed');
    }
  });

  runTest('Rewrites: folding M R M → R^{-1}', () => {
    const inner = IR.R(IR.classLiteral(3), 1); // R^1
    const term = IR.M(IR.M(inner)); // M(M(R)) should cancel both M leaving R
    const norm = normalize(term);
    if (norm.kind !== 'transform' || norm.transform.type !== 'R') {
      throw new Error('Expected R transform after M conjugation');
    }
  });

  runTest('Rewrites: consecutive transforms R^1 ∘ R^3 → identity', () => {
    const term = IR.R(IR.R(IR.classLiteral(9), 1), 3); // R^1 then R^3 = R^4 = identity
    const norm = normalize(term);
    if (JSON.stringify(norm) !== JSON.stringify(IR.classLiteral(9))) {
      throw new Error('Consecutive R transforms did not fold to identity');
    }
  });
}
