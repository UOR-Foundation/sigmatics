/**
 * SGA Element Utility Tests
 *
 * Tests for SGA element helper functions to improve function coverage.
 */

import {
  sgaZero,
  sgaIdentity,
  createRank1BasisFromCoords,
  sgaGradeInvolution,
  sgaReversion,
  sgaCliffordConjugation,
  sgaPower,
  sgaIsZero,
  sgaIsIdentity,
  sgaToString,
  sgaEqual,
} from '../../src/sga/sga-element';

type TestFn = (name: string, fn: () => void) => void;

export function runSgaElementUtilityTests(runTest: TestFn): void {
  console.log('Running SGA Element Utility Tests...');

  // sgaZero
  runTest('SGA Element: sgaZero creates zero element', () => {
    const zero = sgaZero();
    if (!sgaIsZero(zero)) {
      throw new Error('Expected sgaZero to create zero element');
    }
  });

  // sgaIdentity
  runTest('SGA Element: sgaIdentity creates identity element', () => {
    const identity = sgaIdentity();
    if (!sgaIsIdentity(identity)) {
      throw new Error('Expected sgaIdentity to create identity element');
    }
  });

  // createRank1BasisFromCoords
  runTest('SGA Element: createRank1BasisFromCoords creates basis element', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 0 });
    if (!basis) {
      throw new Error('Expected createRank1BasisFromCoords to create element');
    }
    // Scalar element (l=0) should be identity-like in Clifford part
    if (!sgaIsIdentity(basis)) {
      throw new Error('Expected scalar basis (0,0,0) to be identity');
    }
  });

  runTest('SGA Element: createRank1BasisFromCoords with l=1', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    if (!basis) {
      throw new Error('Expected createRank1BasisFromCoords to create element');
    }
    // Should not be identity (has e1 basis vector)
    if (sgaIsIdentity(basis)) {
      throw new Error('Expected e1 basis to not be identity');
    }
  });

  // sgaGradeInvolution
  runTest('SGA Element: sgaGradeInvolution on identity', () => {
    const identity = sgaIdentity();
    const involution = sgaGradeInvolution(identity);
    if (!sgaEqual(involution, identity)) {
      throw new Error('Expected grade involution of identity to be identity');
    }
  });

  runTest('SGA Element: sgaGradeInvolution applied twice is identity', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    const involution = sgaGradeInvolution(basis);
    const doubleInvolution = sgaGradeInvolution(involution);
    if (!sgaEqual(doubleInvolution, basis)) {
      throw new Error('Expected grade involution applied twice to be identity operation');
    }
  });

  // sgaReversion
  runTest('SGA Element: sgaReversion on identity', () => {
    const identity = sgaIdentity();
    const reversion = sgaReversion(identity);
    if (!sgaEqual(reversion, identity)) {
      throw new Error('Expected reversion of identity to be identity');
    }
  });

  runTest('SGA Element: sgaReversion applied twice is identity', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    const reversion = sgaReversion(basis);
    const doubleReversion = sgaReversion(reversion);
    if (!sgaEqual(doubleReversion, basis)) {
      throw new Error('Expected reversion applied twice to be identity operation');
    }
  });

  // sgaCliffordConjugation
  runTest('SGA Element: sgaCliffordConjugation on identity', () => {
    const identity = sgaIdentity();
    const conjugation = sgaCliffordConjugation(identity);
    if (!sgaEqual(conjugation, identity)) {
      throw new Error('Expected Clifford conjugation of identity to be identity');
    }
  });

  runTest('SGA Element: sgaCliffordConjugation applied twice is identity', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    const conjugation = sgaCliffordConjugation(basis);
    const doubleConjugation = sgaCliffordConjugation(conjugation);
    if (!sgaEqual(doubleConjugation, basis)) {
      throw new Error('Expected Clifford conjugation applied twice to be identity operation');
    }
  });

  // sgaPower
  runTest('SGA Element: sgaPower(x, 0) returns identity', () => {
    const basis = createRank1BasisFromCoords({ h: 1, d: 1, l: 2 });
    const power0 = sgaPower(basis, 0);
    if (!sgaIsIdentity(power0)) {
      throw new Error('Expected x^0 to be identity');
    }
  });

  runTest('SGA Element: sgaPower(x, 1) returns x', () => {
    const basis = createRank1BasisFromCoords({ h: 1, d: 1, l: 2 });
    const power1 = sgaPower(basis, 1);
    if (!sgaEqual(power1, basis)) {
      throw new Error('Expected x^1 to equal x');
    }
  });

  runTest('SGA Element: sgaPower(identity, n) returns identity', () => {
    const identity = sgaIdentity();
    const power5 = sgaPower(identity, 5);
    if (!sgaIsIdentity(power5)) {
      throw new Error('Expected identity^5 to be identity');
    }
  });

  runTest('SGA Element: sgaPower throws on negative exponent', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    let threw = false;
    try {
      sgaPower(basis, -1);
    } catch (e: unknown) {
      threw = true;
      if (!(e as Error).message.includes('Negative powers')) {
        throw new Error(`Expected error about negative powers, got: ${(e as Error).message}`);
      }
    }

    if (!threw) {
      throw new Error('Expected sgaPower to throw on negative exponent');
    }
  });

  // sgaIsZero
  runTest('SGA Element: sgaIsZero(sgaZero) returns true', () => {
    const zero = sgaZero();
    if (!sgaIsZero(zero)) {
      throw new Error('Expected sgaIsZero to return true for zero element');
    }
  });

  runTest('SGA Element: sgaIsZero(identity) returns false', () => {
    const identity = sgaIdentity();
    if (sgaIsZero(identity)) {
      throw new Error('Expected sgaIsZero to return false for identity');
    }
  });

  // sgaIsIdentity
  runTest('SGA Element: sgaIsIdentity(sgaIdentity) returns true', () => {
    const identity = sgaIdentity();
    if (!sgaIsIdentity(identity)) {
      throw new Error('Expected sgaIsIdentity to return true for identity element');
    }
  });

  runTest('SGA Element: sgaIsIdentity(basis) returns false', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    if (sgaIsIdentity(basis)) {
      throw new Error('Expected sgaIsIdentity to return false for non-identity basis');
    }
  });

  // sgaToString
  runTest('SGA Element: sgaToString formats element', () => {
    const identity = sgaIdentity();
    const str = sgaToString(identity);
    if (typeof str !== 'string') {
      throw new Error('Expected sgaToString to return a string');
    }
    if (str.length === 0) {
      throw new Error('Expected sgaToString to return non-empty string');
    }
  });

  runTest('SGA Element: sgaToString formats basis element', () => {
    const basis = createRank1BasisFromCoords({ h: 0, d: 0, l: 1 });
    const str = sgaToString(basis);
    if (typeof str !== 'string') {
      throw new Error('Expected sgaToString to return a string');
    }
    // Should contain some representation of the basis
    if (str.length === 0) {
      throw new Error('Expected sgaToString to return non-empty string');
    }
  });
}
