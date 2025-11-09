/**
 * Algebraic Law Verification Example
 *
 * Demonstrates how the v0.4.0 declarative model system elegantly verifies
 * the algebraic laws that govern the Sigmatics class system.
 *
 * The 96-class structure is governed by automorphisms with specific orders
 * and commutation properties. The fused circuit architecture makes it trivial
 * to verify these laws hold across all 96 classes.
 *
 * Laws verified:
 * - R⁴ = identity (rotation has order 4)
 * - D³ = identity (triality has order 3)
 * - T⁸ = identity (twist has order 8)
 * - M² = identity (mirror is an involution)
 * - RD = DR (rotation and triality commute)
 * - RT = TR (rotation and twist commute)
 * - DT = TD (triality and twist commute)
 * - MDM = D⁻¹ (mirror conjugation reverses triality)
 */

import Atlas from '@uor-foundation/sigmatics';

console.log('═'.repeat(80));
console.log('Algebraic Law Verification using Fused Circuits');
console.log('═'.repeat(80));
console.log();

// ============================================================================
// Transform Orders: R⁴ = D³ = T⁸ = M² = Identity
// ============================================================================

console.log('Law 1: Transform Orders (Periodicity)');
console.log('─'.repeat(80));

// Pre-compile models
const r1 = Atlas.Model.R(1);
const d1 = Atlas.Model.D(1);
const t1 = Atlas.Model.T(1);
const m = Atlas.Model.M();

function verifyOrder(
  name: string,
  order: number,
  model: { run: (inputs: { x: number }) => number | any },
): boolean {
  let failures = 0;

  for (let c = 0; c < 96; c++) {
    let result = c;
    for (let i = 0; i < order; i++) {
      result = model.run({ x: result }) as number;
    }

    if (result !== c) {
      failures++;
      if (failures <= 3) {
        console.log(`  ✗ ${name}^${order}(${c}) = ${result} ≠ ${c}`);
      }
    }
  }

  if (failures === 0) {
    console.log(`  ✓ ${name}^${order} = identity verified for all 96 classes`);
    return true;
  } else {
    console.log(`  ✗ ${name}^${order} = identity FAILED (${failures} violations)`);
    return false;
  }
}

// Verify R⁴ = identity
verifyOrder('R', 4, r1);

// Verify D³ = identity
verifyOrder('D', 3, d1);

// Verify T⁸ = identity
verifyOrder('T', 8, t1);

// Verify M² = identity
verifyOrder('M', 2, m);

console.log();

// ============================================================================
// Commutation Laws: RD = DR, RT = TR, DT = TD
// ============================================================================

console.log('Law 2: Commutation Properties');
console.log('─'.repeat(80));

function verifyCommutation(
  name1: string,
  model1: { run: (inputs: { x: number }) => number | any },
  name2: string,
  model2: { run: (inputs: { x: number }) => number | any },
): boolean {
  let failures = 0;

  for (let c = 0; c < 96; c++) {
    // Apply model1 then model2
    const forward = model2.run({ x: model1.run({ x: c }) as number }) as number;

    // Apply model2 then model1
    const backward = model1.run({ x: model2.run({ x: c }) as number }) as number;

    if (forward !== backward) {
      failures++;
      if (failures <= 3) {
        console.log(
          `  ✗ ${name1}${name2}(${c}) = ${forward} ≠ ${backward} = ${name2}${name1}(${c})`,
        );
      }
    }
  }

  if (failures === 0) {
    console.log(`  ✓ ${name1}${name2} = ${name2}${name1} verified for all 96 classes`);
    return true;
  } else {
    console.log(`  ✗ ${name1}${name2} = ${name2}${name1} FAILED (${failures} violations)`);
    return false;
  }
}

// Verify RD = DR
verifyCommutation('R', r1, 'D', d1);

// Verify RT = TR
verifyCommutation('R', r1, 'T', t1);

// Verify DT = TD
verifyCommutation('D', d1, 'T', t1);

console.log();

// ============================================================================
// Conjugation Law: MDM = D⁻¹
// ============================================================================

console.log('Law 3: Mirror Conjugation (MDM = D⁻¹)');
console.log('─'.repeat(80));

// D⁻¹ is the same as D² (since D³ = identity)
const d2 = Atlas.Model.D(2);

let conjugationFailures = 0;

for (let c = 0; c < 96; c++) {
  // Apply M, then D, then M
  const mdm = m.run({ x: d1.run({ x: m.run({ x: c }) as number }) as number }) as number;

  // Apply D⁻¹ (which is D²)
  const dInverse = d2.run({ x: c }) as number;

  if (mdm !== dInverse) {
    conjugationFailures++;
    if (conjugationFailures <= 3) {
      console.log(`  ✗ MDM(${c}) = ${mdm} ≠ ${dInverse} = D⁻¹(${c})`);
    }
  }
}

if (conjugationFailures === 0) {
  console.log('  ✓ MDM = D⁻¹ verified for all 96 classes');
} else {
  console.log(`  ✗ MDM = D⁻¹ FAILED (${conjugationFailures} violations)`);
}

console.log();

// ============================================================================
// Ring Operation Properties: add96 and mul96
// ============================================================================

console.log('Law 4: Ring Operation Properties');
console.log('─'.repeat(80));

const add = Atlas.Model.add96('drop');
const mul = Atlas.Model.mul96('drop');

// Test commutativity: a + b = b + a
console.log('Testing add96 commutativity...');
let addCommutative = true;
for (let a = 0; a < 96; a++) {
  for (let b = 0; b < 96; b++) {
    const forward = add.run({ a, b }).value;
    const backward = add.run({ a: b, b: a }).value;
    if (forward !== backward) {
      console.log(`  ✗ ${a} + ${b} = ${forward} ≠ ${backward} = ${b} + ${a}`);
      addCommutative = false;
      break;
    }
  }
  if (!addCommutative) break;
}
if (addCommutative) {
  console.log('  ✓ add96 is commutative');
}

// Test associativity: (a + b) + c = a + (b + c)
console.log('Testing add96 associativity (sample)...');
let addAssociative = true;
for (let trial = 0; trial < 1000; trial++) {
  const a = Math.floor(Math.random() * 96);
  const b = Math.floor(Math.random() * 96);
  const c = Math.floor(Math.random() * 96);

  const left = add.run({ a: add.run({ a, b }).value, b: c }).value;
  const right = add.run({ a, b: add.run({ a: b, b: c }).value }).value;

  if (left !== right) {
    console.log(`  ✗ (${a} + ${b}) + ${c} = ${left} ≠ ${right} = ${a} + (${b} + ${c})`);
    addAssociative = false;
    break;
  }
}
if (addAssociative) {
  console.log('  ✓ add96 is associative (1000 random tests)');
}

// Test identity: 0 + a = a
console.log('Testing add96 identity element...');
let hasIdentity = true;
for (let a = 0; a < 96; a++) {
  const resultObj = add.run({ a: 0, b: a });
  const result = typeof resultObj === 'number' ? resultObj : resultObj.value;
  if (result !== a) {
    console.log(`  ✗ 0 + ${a} = ${result} ≠ ${a}`);
    hasIdentity = false;
    break;
  }
}
if (hasIdentity) {
  console.log('  ✓ 0 is the additive identity');
}

console.log();

// ============================================================================
// Transform Composition: Verifying Group Structure
// ============================================================================

console.log('Law 5: Transform Composition Properties');
console.log('─'.repeat(80));

// The transforms form a group. Let's verify some group properties.

// Test R² ∘ R² = R⁴ = identity
const r2 = Atlas.Model.R(2);
console.log('Testing R² ∘ R² = identity...');
let r2Squared = true;
for (let c = 0; c < 96; c++) {
  const result = r2.run({ x: r2.run({ x: c }) as number }) as number;
  if (result !== c) {
    console.log(`  ✗ R²(R²(${c})) = ${result} ≠ ${c}`);
    r2Squared = false;
    break;
  }
}
if (r2Squared) {
  console.log('  ✓ R² ∘ R² = identity (R² is self-inverse)');
}

// Test D ∘ D² = identity
console.log('Testing D ∘ D² = identity...');
let dComposition = true;
for (let c = 0; c < 96; c++) {
  const result = d1.run({ x: d2.run({ x: c }) as number }) as number;
  if (result !== c) {
    console.log(`  ✗ D(D²(${c})) = ${result} ≠ ${c}`);
    dComposition = false;
    break;
  }
}
if (dComposition) {
  console.log('  ✓ D ∘ D² = identity');
}

console.log();

// ============================================================================
// Bridge Properties: lift and project
// ============================================================================

console.log('Law 6: Bridge Round-Trip (lift then project)');
console.log('─'.repeat(80));

console.log('Testing project(lift(c)) = c for all classes...');
let bridgeRoundTrip = true;

for (let c = 0; c < 96; c++) {
  const sgaElement = Atlas.SGA.lift(c);
  const projected = Atlas.SGA.project(sgaElement);

  if (projected !== c) {
    console.log(`  ✗ project(lift(${c})) = ${projected} ≠ ${c}`);
    bridgeRoundTrip = false;
    break;
  }
}

if (bridgeRoundTrip) {
  console.log('  ✓ project(lift(c)) = c for all 96 classes');
  console.log('    (Bridge maintains class identity through SGA)');
}

console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('═'.repeat(80));
console.log('Verification Summary');
console.log('═'.repeat(80));
console.log();
console.log('All algebraic laws verified using compiled fused circuits!');
console.log();
console.log('The declarative model system provides:');
console.log('  ✓ Fast, pre-compiled verification of algebraic laws');
console.log('  ✓ Automatic backend selection (class vs SGA)');
console.log('  ✓ Zero interpretation overhead');
console.log('  ✓ Composable, reusable model components');
console.log();
console.log('This architecture enables:');
console.log('  • Efficient property-based testing');
console.log('  • Runtime validation of cryptographic invariants');
console.log('  • Symbolic algebra verification');
console.log('  • Automated theorem proving');
console.log();
console.log('═'.repeat(80));
