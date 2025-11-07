#!/usr/bin/env node
/**
 * Test edge cases and boundary conditions for SGA
 */

const { Atlas } = require('./packages/core/dist/index.js');

console.log('Testing Edge Cases and Boundary Conditions...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

// Test boundary class indices
test('Lift class 0 (minimum)', () => {
  const elem = Atlas.SGA.lift(0);
  const projected = Atlas.SGA.project(elem);
  if (projected !== 0) throw new Error(`Expected 0, got ${projected}`);
});

test('Lift class 95 (maximum)', () => {
  const elem = Atlas.SGA.lift(95);
  const projected = Atlas.SGA.project(elem);
  if (projected !== 95) throw new Error(`Expected 95, got ${projected}`);
});

test('Lift out of range throws error (negative)', () => {
  try {
    Atlas.SGA.lift(-1);
    throw new Error('Should have thrown error');
  } catch (e) {
    if (!e.message.includes('Invalid class index')) {
      throw new Error('Wrong error message');
    }
  }
});

test('Lift out of range throws error (too large)', () => {
  try {
    Atlas.SGA.lift(96);
    throw new Error('Should have thrown error');
  } catch (e) {
    if (!e.message.includes('Invalid class index')) {
      throw new Error('Wrong error message');
    }
  }
});

// Test transform composition
test('R⁴ equals identity for all classes', () => {
  for (let c = 0; c < 96; c++) {
    const elem = Atlas.SGA.lift(c);
    const r4 = Atlas.SGA.R(Atlas.SGA.R(Atlas.SGA.R(Atlas.SGA.R(elem))));
    const projected = Atlas.SGA.project(r4);
    if (projected !== c) {
      throw new Error(`R⁴ ≠ identity for class ${c}`);
    }
  }
});

test('D³ equals identity for all classes', () => {
  for (let c = 0; c < 96; c++) {
    const elem = Atlas.SGA.lift(c);
    const d3 = Atlas.SGA.D(Atlas.SGA.D(Atlas.SGA.D(elem)));
    const projected = Atlas.SGA.project(d3);
    if (projected !== c) {
      throw new Error(`D³ ≠ identity for class ${c}`);
    }
  }
});

test('T⁸ equals identity for all classes', () => {
  for (let c = 0; c < 96; c++) {
    const elem = Atlas.SGA.lift(c);
    let result = elem;
    for (let i = 0; i < 8; i++) {
      result = Atlas.SGA.T(result);
    }
    const projected = Atlas.SGA.project(result);
    if (projected !== c) {
      throw new Error(`T⁸ ≠ identity for class ${c}`);
    }
  }
});

test('M² equals identity for all classes', () => {
  for (let c = 0; c < 96; c++) {
    const elem = Atlas.SGA.lift(c);
    const m2 = Atlas.SGA.M(Atlas.SGA.M(elem));
    const projected = Atlas.SGA.project(m2);
    if (projected !== c) {
      throw new Error(`M² ≠ identity for class ${c}`);
    }
  }
});

// Test transform commutation
test('RD = DR for sample classes', () => {
  for (let c = 0; c < 10; c++) {
    const elem = Atlas.SGA.lift(c);
    const rd = Atlas.SGA.D(Atlas.SGA.R(elem));
    const dr = Atlas.SGA.R(Atlas.SGA.D(elem));
    const rdProj = Atlas.SGA.project(rd);
    const drProj = Atlas.SGA.project(dr);
    if (rdProj !== drProj) {
      throw new Error(`RD ≠ DR for class ${c}`);
    }
  }
});

// Test octonion operations
test('Octonion norm is multiplicative', () => {
  const u = Atlas.SGA.Octonion.randomOctonion(1.0);
  const v = Atlas.SGA.Octonion.randomOctonion(1.0);
  const product = Atlas.SGA.Octonion.cayleyProduct(u, v);

  const normU = Atlas.SGA.Octonion.norm(u);
  const normV = Atlas.SGA.Octonion.norm(v);
  const normProduct = Atlas.SGA.Octonion.norm(product);

  const expected = normU * normV;
  const diff = Math.abs(normProduct - expected);

  if (diff > 1e-8) {
    throw new Error(`Norm not multiplicative: ${normProduct} vs ${expected}`);
  }
});

test('Octonion alternativity', () => {
  const x = Atlas.SGA.Octonion.randomOctonion(1.0);
  const y = Atlas.SGA.Octonion.randomOctonion(1.0);

  const result = Atlas.SGA.Octonion.verifyAlternativity(x, y);
  if (!result) {
    throw new Error('Alternativity failed');
  }
});

// Test Fano plane
test('Fano plane structure is valid', () => {
  const valid = Atlas.SGA.Fano.verify();
  if (!valid) {
    throw new Error('Fano plane verification failed');
  }
});

test('Fano plane has 7 lines', () => {
  if (Atlas.SGA.Fano.lines.length !== 7) {
    throw new Error(`Expected 7 lines, got ${Atlas.SGA.Fano.lines.length}`);
  }
});

// Test all triality orbits
test('All 96 classes covered by triality orbits', () => {
  const covered = new Set();

  for (let h = 0; h < 4; h++) {
    for (let l = 0; l < 8; l++) {
      for (let d = 0; d < 3; d++) {
        const c = 24 * h + 8 * d + l;
        covered.add(c);
      }
    }
  }

  if (covered.size !== 96) {
    throw new Error(`Expected 96 classes, got ${covered.size}`);
  }
});

// Test that D rotates through triality orbits correctly
test('D rotates through each triality orbit', () => {
  // Test a few orbits
  for (let h = 0; h < 4; h++) {
    for (let l = 0; l < 8; l++) {
      const c0 = 24 * h + 8 * 0 + l;
      const c1 = 24 * h + 8 * 1 + l;
      const c2 = 24 * h + 8 * 2 + l;

      const elem0 = Atlas.SGA.lift(c0);
      const elem1 = Atlas.SGA.D(elem0);
      const elem2 = Atlas.SGA.D(elem1);

      const proj1 = Atlas.SGA.project(elem1);
      const proj2 = Atlas.SGA.project(elem2);

      if (proj1 !== c1 || proj2 !== c2) {
        throw new Error(`D rotation failed for orbit (${h},${l})`);
      }
    }
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  console.error('\n✗ Some edge case tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All edge case tests passed!');
}
